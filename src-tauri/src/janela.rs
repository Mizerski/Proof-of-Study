//! Leitura da janela ativa no Windows: o título (que no navegador já traz o título da aba) e o nome do programa.
//! Nada além disso é lido: nem o conteúdo da janela, nem a URL, nem o que é digitado.

use serde::Serialize;

#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Janela {
    pub titulo: String,
    /// Nome do executável sem a extensão (ex.: `chrome`, `Code`, `Discord`).
    pub processo: String,
    /// A janela é do próprio Proof of Study.
    pub proprio: bool,
}

#[cfg(windows)]
mod windows {
    use std::path::Path;

    use windows_sys::Win32::Foundation::CloseHandle;
    use windows_sys::Win32::System::SystemInformation::GetTickCount;
    use windows_sys::Win32::System::Threading::{
        OpenProcess, PROCESS_NAME_WIN32, PROCESS_QUERY_LIMITED_INFORMATION, QueryFullProcessImageNameW,
    };
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::{GetLastInputInfo, LASTINPUTINFO};
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        GetForegroundWindow, GetWindowTextLengthW, GetWindowTextW, GetWindowThreadProcessId,
    };

    pub fn titulo_e_pid() -> Option<(String, u32)> {
        unsafe {
            let hwnd = GetForegroundWindow();
            if hwnd.is_null() {
                return None;
            }
            let tamanho = GetWindowTextLengthW(hwnd).max(0) as usize;
            let mut buffer = vec![0u16; tamanho + 1];
            let lidos = GetWindowTextW(hwnd, buffer.as_mut_ptr(), buffer.len() as i32).max(0) as usize;
            let titulo = String::from_utf16_lossy(&buffer[..lidos]);
            let mut pid = 0u32;
            GetWindowThreadProcessId(hwnd, &mut pid);
            Some((titulo, pid))
        }
    }

    pub fn caminho_do_processo(pid: u32) -> Option<String> {
        unsafe {
            let processo = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
            if processo.is_null() {
                return None;
            }
            let mut buffer = vec![0u16; 1024];
            let mut tamanho = buffer.len() as u32;
            let ok = QueryFullProcessImageNameW(processo, PROCESS_NAME_WIN32, buffer.as_mut_ptr(), &mut tamanho);
            CloseHandle(processo);
            if ok == 0 {
                return None;
            }
            Some(String::from_utf16_lossy(&buffer[..tamanho as usize]))
        }
    }

    pub fn nome_do_executavel(caminho: &str) -> String {
        Path::new(caminho)
            .file_stem()
            .map(|n| n.to_string_lossy().into_owned())
            .unwrap_or_default()
    }

    /// Milissegundos desde o último toque no teclado ou no mouse.
    pub fn ms_sem_uso() -> i64 {
        unsafe {
            let mut info = LASTINPUTINFO { cbSize: size_of::<LASTINPUTINFO>() as u32, dwTime: 0 };
            if GetLastInputInfo(&mut info) == 0 {
                return 0;
            }
            GetTickCount().wrapping_sub(info.dwTime) as i64
        }
    }
}

/// Nome do executável do próprio app, para reconhecer as janelas dele.
fn executavel_proprio() -> &'static str {
    use std::sync::OnceLock;
    static NOME: OnceLock<String> = OnceLock::new();
    NOME.get_or_init(|| {
        std::env::current_exe()
            .ok()
            .and_then(|c| c.file_stem().map(|n| n.to_string_lossy().into_owned()))
            .unwrap_or_default()
    })
}

#[cfg(windows)]
pub fn janela_ativa() -> Janela {
    let Some((titulo, pid)) = windows::titulo_e_pid() else {
        return Janela::default();
    };
    let processo = windows::caminho_do_processo(pid)
        .map(|c| windows::nome_do_executavel(&c))
        .unwrap_or_default();
    let proprio = pid == std::process::id() || (!processo.is_empty() && processo == executavel_proprio());
    Janela { titulo, processo, proprio }
}

#[cfg(windows)]
pub fn ms_sem_uso() -> i64 {
    windows::ms_sem_uso()
}

#[cfg(not(windows))]
pub fn janela_ativa() -> Janela {
    let _ = executavel_proprio();
    Janela::default()
}

#[cfg(not(windows))]
pub fn ms_sem_uso() -> i64 {
    0
}

#[cfg(all(test, windows))]
mod testes {
    #[test]
    fn le_a_janela_ativa_do_windows() {
        let janela = super::janela_ativa();
        // Com alguma janela em primeiro plano, o programa dela é reconhecido.
        assert!(janela.titulo.is_empty() || !janela.processo.is_empty());
        assert!(super::ms_sem_uso() >= 0);
    }
}
