//! Notificações agendadas: o início dos blocos de estudo da rotina (recorrentes) e avisos avulsos, como o fim da
//! pausa. Ficam no Rust pelo mesmo motivo do pomodoro: com a janela escondida, os timers do WebView param.

use std::collections::HashSet;
use std::sync::Mutex;

use chrono::{Datelike, Local, Timelike};
use serde::Deserialize;
use tauri::{AppHandle, Manager, State};

use crate::notificar;
use crate::rastreador::Rastreador;

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Lembrete {
    pub id: String,
    /// Dias da semana, de 0 (domingo) a 6 (sábado), como o `getDay()` do JavaScript.
    pub dias: Vec<u32>,
    /// Minuto do dia em que avisa (0 a 1439).
    pub minuto: u32,
    pub titulo: String,
    pub corpo: String,
}

struct Aviso {
    id: String,
    em: i64,
    titulo: String,
    corpo: String,
}

#[derive(Default)]
struct Estado {
    lembretes: Vec<Lembrete>,
    /// `id@data` dos lembretes já mostrados hoje.
    disparados: HashSet<String>,
    avisos: Vec<Aviso>,
}

#[derive(Default)]
pub struct Lembretes(Mutex<Estado>);

pub fn tick(app: &AppHandle) {
    let estudando = app.state::<Rastreador>().rodando();
    let agora = Local::now();
    let hoje = agora.date_naive().to_string();
    let dia = agora.weekday().num_days_from_sunday();
    let minuto = agora.hour() * 60 + agora.minute();
    let agora_ms = agora.timestamp_millis();

    let mut mostrar = Vec::new();
    {
        let lembretes = app.state::<Lembretes>();
        let Ok(mut e) = lembretes.0.lock() else { return };
        let devidos: Vec<(String, String, String)> = e
            .lembretes
            .iter()
            .filter(|l| l.minuto == minuto && l.dias.contains(&dia))
            .map(|l| (format!("{}@{hoje}", l.id), l.titulo.clone(), l.corpo.clone()))
            .collect();
        for (chave, titulo, corpo) in devidos {
            // Quem já está num pomodoro não precisa ser lembrado de começar.
            if e.disparados.insert(chave) && !estudando {
                mostrar.push((titulo, corpo));
            }
        }
        let (vencidos, futuros): (Vec<Aviso>, Vec<Aviso>) = std::mem::take(&mut e.avisos).into_iter().partition(|a| a.em <= agora_ms);
        e.avisos = futuros;
        mostrar.extend(vencidos.into_iter().map(|a| (a.titulo, a.corpo)));
    }
    for (titulo, corpo) in mostrar {
        notificar(app, &titulo, &corpo);
    }
}

/// Troca a lista de lembretes recorrentes (o front manda a rotina inteira a cada mudança).
#[tauri::command]
pub fn lembretes_definir(lembretes: State<Lembretes>, lista: Vec<Lembrete>) {
    if let Ok(mut e) = lembretes.0.lock() {
        e.lembretes = lista;
    }
}

/// Aviso único em `em` (milissegundos desde 1970). Um aviso com o mesmo id substitui o anterior.
#[tauri::command]
pub fn aviso_agendar(lembretes: State<Lembretes>, id: String, em: i64, titulo: String, corpo: String) {
    if let Ok(mut e) = lembretes.0.lock() {
        e.avisos.retain(|a| a.id != id);
        e.avisos.push(Aviso { id, em, titulo, corpo });
    }
}

#[tauri::command]
pub fn aviso_cancelar(lembretes: State<Lembretes>, id: String) {
    if let Ok(mut e) = lembretes.0.lock() {
        e.avisos.retain(|a| a.id != id);
    }
}
