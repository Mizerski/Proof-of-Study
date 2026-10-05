mod imagens;
mod janela;
mod lembretes;
mod rastreador;

use std::time::Duration;

use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, WindowEvent};
use tauri_plugin_notification::NotificationExt;

pub(crate) fn mostrar_janela(app: &AppHandle) {
    if let Some(janela) = app.get_webview_window("main") {
        let _ = janela.show();
        let _ = janela.unminimize();
        let _ = janela.set_focus();
    }
}

pub(crate) fn notificar(app: &AppHandle, titulo: &str, corpo: &str) {
    if let Err(erro) = app.notification().builder().title(titulo).body(corpo).show() {
        log::warn!("notificação não enviada: {erro}");
    }
}

fn criar_bandeja(app: &AppHandle) -> tauri::Result<()> {
    let abrir = MenuItem::with_id(app, "abrir", "Abrir", true, None::<&str>)?;
    let sair = MenuItem::with_id(app, "sair", "Sair", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&abrir, &sair])?;

    let mut bandeja = TrayIconBuilder::with_id("principal")
        .tooltip("Proof of Study")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, evento| match evento.id.as_ref() {
            "abrir" => mostrar_janela(app),
            "sair" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|icone, evento| {
            if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = evento {
                mostrar_janela(icone.app_handle());
            }
        });
    if let Some(icone) = app.default_window_icon() {
        bandeja = bandeja.icon(icone.clone());
    }
    bandeja.build(app)?;
    Ok(())
}

/// Um segundo por volta: lê a janela ativa (se houver sessão) e confere os lembretes.
fn iniciar_relogio(app: AppHandle) {
    std::thread::spawn(move || {
        loop {
            std::thread::sleep(Duration::from_secs(1));
            rastreador::tick(&app);
            lembretes::tick(&app);
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Uma instância só: abrir o app de novo traz a janela que está na bandeja. Precisa ser o primeiro plugin.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| mostrar_janela(app)))
        .plugin(tauri_plugin_notification::init())
        // Dados do app num arquivo JSON na pasta de dados do usuário.
        .plugin(tauri_plugin_store::Builder::new().build())
        .manage(rastreador::Rastreador::new())
        .manage(lembretes::Lembretes::default())
        .invoke_handler(tauri::generate_handler![
            rastreador::rastreio_iniciar,
            rastreador::rastreio_pausar,
            rastreador::rastreio_retomar,
            rastreador::rastreio_captura,
            rastreador::rastreio_estender,
            rastreador::rastreio_parar,
            rastreador::rastreio_estado,
            lembretes::lembretes_definir,
            lembretes::aviso_agendar,
            lembretes::aviso_cancelar,
            imagens::imagens_pasta,
            imagens::imagem_salvar,
            imagens::imagem_excluir,
        ])
        // Fechar a janela só a esconde na bandeja: o pomodoro e os lembretes continuam.
        .on_window_event(|janela, evento| {
            if let WindowEvent::CloseRequested { api, .. } = evento {
                api.prevent_close();
                let _ = janela.hide();
            }
        })
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(tauri_plugin_log::Builder::default().level(log::LevelFilter::Info).build())?;
            }
            criar_bandeja(app.handle())?;
            iniciar_relogio(app.handle().clone());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
