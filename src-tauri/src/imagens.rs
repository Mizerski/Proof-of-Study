//! Imagens das anotações: ficam na pasta `imagens` dos dados do app, e o front mostra pelo protocolo `asset`.

use std::path::PathBuf;

use tauri::ipc::{InvokeBody, Request};
use tauri::{AppHandle, Manager};

const EXTENSOES: [&str; 5] = ["png", "jpg", "jpeg", "webp", "gif"];

fn pasta(app: &AppHandle) -> Result<PathBuf, String> {
    let pasta = app.path().app_data_dir().map_err(|e| e.to_string())?.join("imagens");
    std::fs::create_dir_all(&pasta).map_err(|e| e.to_string())?;
    Ok(pasta)
}

/// Só nomes gerados pelo app (`<uuid>.<extensão>`), para nunca sair da pasta.
fn validar(nome: &str) -> Result<(), String> {
    let (base, extensao) = nome.rsplit_once('.').ok_or("Nome de imagem inválido")?;
    let base_ok = !base.is_empty() && base.chars().all(|c| c.is_ascii_alphanumeric() || c == '-');
    if base_ok && EXTENSOES.contains(&extensao) { Ok(()) } else { Err("Nome de imagem inválido".into()) }
}

#[tauri::command]
pub fn imagens_pasta(app: AppHandle) -> Result<String, String> {
    Ok(pasta(&app)?.to_string_lossy().into_owned())
}

/// Recebe os bytes crus da imagem no corpo e o nome no cabeçalho `nome`.
#[tauri::command]
pub fn imagem_salvar(app: AppHandle, request: Request<'_>) -> Result<(), String> {
    let InvokeBody::Raw(bytes) = request.body() else {
        return Err("Imagem inválida".into());
    };
    let nome = request
        .headers()
        .get("nome")
        .and_then(|v| v.to_str().ok())
        .ok_or("Imagem sem nome")?;
    validar(nome)?;
    std::fs::write(pasta(&app)?.join(nome), bytes).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn imagem_excluir(app: AppHandle, nome: String) -> Result<(), String> {
    validar(&nome)?;
    match std::fs::remove_file(pasta(&app)?.join(nome)) {
        Err(e) if e.kind() != std::io::ErrorKind::NotFound => Err(e.to_string()),
        _ => Ok(()),
    }
}
