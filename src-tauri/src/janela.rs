//! Leitura da janela ativa no Windows e no Linux (X11): o título (que no navegador já traz o título da aba) e o nome do programa.
//! Nada além disso é lido: nem o conteúdo da janela, nem a URL, nem o que é digitado.

use serde::Serialize;

#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Janela {
    pub titulo: String,
    /// Nome do executável sem a extensão (ex.: `chrome`, `Code`, `Discord`). No Linux, a classe da janela.
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

/// Linux com X11 (e os apps do XWayland numa sessão Wayland). O "programa" é a classe da janela (`WM_CLASS`,
/// ex.: `firefox`, `Code`, `Google-chrome`), que vale também para apps em Flatpak e em Java; sem ela, o nome do executável.
#[cfg(target_os = "linux")]
mod linux {
    use std::sync::Mutex;

    use x11rb::connection::Connection;
    use x11rb::protocol::screensaver::ConnectionExt as _;
    use x11rb::protocol::xproto::{Atom, AtomEnum, ConnectionExt as _, Window};
    use x11rb::rust_connection::RustConnection;

    struct X11 {
        conexao: RustConnection,
        raiz: Window,
        janela_ativa: Atom,
        nome: Atom,
        utf8: Atom,
        pid: Atom,
    }

    type Erro = Box<dyn std::error::Error>;

    impl X11 {
        fn conectar() -> Result<Self, Erro> {
            let (conexao, tela) = x11rb::connect(None)?;
            let raiz = conexao.setup().roots[tela].root;
            let atomo = |nome: &[u8]| -> Result<Atom, Erro> { Ok(conexao.intern_atom(false, nome)?.reply()?.atom) };
            let (janela_ativa, nome, utf8, pid) =
                (atomo(b"_NET_ACTIVE_WINDOW")?, atomo(b"_NET_WM_NAME")?, atomo(b"UTF8_STRING")?, atomo(b"_NET_WM_PID")?);
            Ok(Self { conexao, raiz, janela_ativa, nome, utf8, pid })
        }

        fn propriedade(&self, janela: Window, nome: Atom, tipo: impl Into<Atom>) -> Result<Vec<u8>, Erro> {
            Ok(self.conexao.get_property(false, janela, nome, tipo, 0, 4096)?.reply()?.value)
        }

        fn numero(&self, janela: Window, nome: Atom, tipo: AtomEnum) -> Result<Option<u32>, Erro> {
            let resposta = self.conexao.get_property(false, janela, nome, tipo, 0, 1)?.reply()?;
            Ok(resposta.value32().and_then(|mut v| v.next()))
        }

        /// Título, classe e PID da janela em primeiro plano.
        fn ativa(&self) -> Result<Option<(String, String, Option<u32>)>, Erro> {
            let janela = match self.numero(self.raiz, self.janela_ativa, AtomEnum::WINDOW)? {
                Some(j) if j != 0 => j,
                _ => return Ok(None),
            };
            let mut titulo = self.propriedade(janela, self.nome, self.utf8)?;
            if titulo.is_empty() {
                titulo = self.propriedade(janela, AtomEnum::WM_NAME.into(), AtomEnum::ANY)?;
            }
            // WM_CLASS é "instância\0classe\0".
            let classe = self.propriedade(janela, AtomEnum::WM_CLASS.into(), AtomEnum::STRING)?;
            let classe = classe.split(|b| *b == 0).rfind(|p| !p.is_empty()).unwrap_or_default();
            let pid = self.numero(janela, self.pid, AtomEnum::CARDINAL)?;
            Ok(Some((String::from_utf8_lossy(&titulo).into_owned(), String::from_utf8_lossy(classe).into_owned(), pid)))
        }

        fn ms_sem_uso(&self) -> Result<i64, Erro> {
            Ok(self.conexao.screensaver_query_info(self.raiz)?.reply()?.ms_since_user_input as i64)
        }
    }

    /// Uma conexão só, aberta na primeira leitura. Se cair (ex.: o servidor X reiniciou), abre de novo na próxima.
    fn com_x11<T>(ler: impl FnOnce(&X11) -> Result<T, Erro>) -> Option<T> {
        static CONEXAO: Mutex<Option<X11>> = Mutex::new(None);
        let mut conexao = CONEXAO.lock().unwrap_or_else(|e| e.into_inner());
        if conexao.is_none() {
            *conexao = X11::conectar().map_err(|e| log::warn!("sem conexão com o X11: {e}")).ok();
        }
        match ler(conexao.as_ref()?) {
            Ok(valor) => Some(valor),
            Err(e) => {
                log::warn!("leitura do X11 falhou: {e}");
                *conexao = None;
                None
            }
        }
    }

    pub fn titulo_programa_e_pid() -> Option<(String, String, Option<u32>)> {
        com_x11(X11::ativa).flatten()
    }

    pub fn nome_do_executavel(pid: u32) -> Option<String> {
        let caminho = std::fs::read_link(format!("/proc/{pid}/exe")).ok()?;
        Some(caminho.file_name()?.to_string_lossy().into_owned())
    }

    /// Numa sessão Wayland, o X11 só vê o que é digitado nos apps do XWayland, então o tempo sem uso não é medido.
    pub fn ms_sem_uso() -> i64 {
        let wayland = std::env::var_os("WAYLAND_DISPLAY").is_some()
            || std::env::var("XDG_SESSION_TYPE").is_ok_and(|t| t.eq_ignore_ascii_case("wayland"));
        if wayland { 0 } else { com_x11(X11::ms_sem_uso).unwrap_or(0) }
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

#[cfg(target_os = "linux")]
pub fn janela_ativa() -> Janela {
    let Some((titulo, classe, pid)) = linux::titulo_programa_e_pid() else {
        return Janela::default();
    };
    let processo = if classe.is_empty() { pid.and_then(linux::nome_do_executavel).unwrap_or_default() } else { classe };
    let proprio = pid == Some(std::process::id()) || (!processo.is_empty() && processo == executavel_proprio());
    Janela { titulo, processo, proprio }
}

#[cfg(target_os = "linux")]
pub fn ms_sem_uso() -> i64 {
    linux::ms_sem_uso()
}

#[cfg(not(any(windows, target_os = "linux")))]
pub fn janela_ativa() -> Janela {
    let _ = executavel_proprio();
    Janela::default()
}

#[cfg(not(any(windows, target_os = "linux")))]
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
