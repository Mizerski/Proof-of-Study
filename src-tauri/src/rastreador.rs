//! O pomodoro e o registro das janelas. Fica no Rust porque o WebView do Windows suspende os timers
//! quando a janela do app está escondida: o relógio, o fim da sessão e o aviso de distração precisam
//! continuar funcionando com o app na bandeja ou como widget.
//!
//! A cada segundo, com a sessão rodando, a janela ativa é lida e somada ao trecho atual (ou abre um trecho novo).
//! Pausado, parado ou concluído, nada é lido. Com a captura pausada, o relógio anda mas a janela não é lida.

use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, State};

use crate::janela::{Janela, janela_ativa, ms_sem_uso};
use crate::{mostrar_janela, notificar};

/// Um intervalo contínuo na mesma janela.
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Trecho {
    /// Início e fim em milissegundos desde 1970.
    pub inicio: i64,
    pub fim: i64,
    pub titulo: String,
    pub processo: String,
    pub proprio: bool,
    /// Sem mexer no teclado e no mouse por mais tempo que o limite, ou com o computador suspenso.
    pub ausente: bool,
    /// Tempo com a captura pausada: o relógio andou, mas a janela não foi lida.
    #[serde(default)]
    pub sem_captura: bool,
}

/// Regra de classificação. As de título valem antes das de app; dentro de cada grupo, a primeira que casa decide.
/// Mesma lógica de `regraQueCasa` em `src/features/sessao/utils/classificacao.ts`.
#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Regra {
    pub rotulo: String,
    pub termos: Vec<String>,
    /// `app` compara com o nome do programa; `titulo`, com o título da janela.
    pub campo: String,
    /// `estudo`, `fora` ou `ignorar`.
    pub tipo: String,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Configuracao {
    pub duracao_ms: i64,
    pub limite_ausencia_seg: i64,
    /// Segundos seguidos fora do estudo até o aviso; sem valor, não avisa.
    pub aviso_distracao_seg: Option<i64>,
    pub regras: Vec<Regra>,
    /// Nome da matéria, para o texto das notificações.
    pub materia: String,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Fase {
    Parado,
    Rodando,
    Pausado,
    Concluido,
}

/// Um intervalo maior que isso entre duas leituras é o computador suspenso ou travado.
const SALTO_MS: i64 = 10_000;

struct Estado {
    fase: Fase,
    config: Option<Configuracao>,
    captura: bool,
    /// Momento da última leitura, onde começa o próximo pedaço.
    ultimo: i64,
    trechos: Vec<Trecho>,
    fora_desde: Option<i64>,
    avisado: bool,
}

pub struct Rastreador(Mutex<Estado>);

impl Rastreador {
    pub fn new() -> Self {
        Self(Mutex::new(Estado {
            fase: Fase::Parado,
            config: None,
            captura: true,
            ultimo: 0,
            trechos: Vec::new(),
            fora_desde: None,
            avisado: false,
        }))
    }

    pub fn rodando(&self) -> bool {
        self.0.lock().map(|e| e.fase == Fase::Rodando).unwrap_or(false)
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Retrato {
    fase: Fase,
    captura: bool,
    decorrido_ms: i64,
    duracao_ms: i64,
    /// Janela ativa agora, lida na hora (é o que a tela de transparência mostra). Vazia sem captura.
    atual: Janela,
    ms_sem_uso: i64,
    trechos: Vec<Trecho>,
}

fn agora_ms() -> i64 {
    chrono::Utc::now().timestamp_millis()
}

fn decorrido(e: &Estado, agora: i64) -> i64 {
    let registrado: i64 = e.trechos.iter().map(|t| t.fim - t.inicio).sum();
    if e.fase == Fase::Rodando { registrado + (agora - e.ultimo).max(0) } else { registrado }
}

fn acrescentar(trechos: &mut Vec<Trecho>, novo: Trecho) {
    if let Some(ultimo) = trechos.last_mut() {
        if ultimo.fim == novo.inicio
            && ultimo.ausente == novo.ausente
            && ultimo.sem_captura == novo.sem_captura
            && ultimo.titulo == novo.titulo
            && ultimo.processo == novo.processo
        {
            ultimo.fim = novo.fim;
            return;
        }
    }
    trechos.push(novo);
}

/// Ao perceber a ausência, o tempo desde o último uso também era ausência: marca os trechos a partir de `desde`.
fn marcar_ausencia(trechos: &mut Vec<Trecho>, desde: i64) {
    let mut i = trechos.len();
    while i > 0 {
        i -= 1;
        if trechos[i].fim <= desde {
            break;
        }
        if trechos[i].ausente || trechos[i].sem_captura {
            continue;
        }
        if trechos[i].inicio >= desde {
            trechos[i].ausente = true;
        } else {
            let mut depois = trechos[i].clone();
            depois.inicio = desde;
            depois.ausente = true;
            trechos[i].fim = desde;
            trechos.insert(i + 1, depois);
            break;
        }
    }
}

/// Soma o tempo desde a última leitura à janela ativa agora (ou ao tempo sem captura).
fn registrar(e: &mut Estado, agora: i64) {
    let inicio = e.ultimo;
    e.ultimo = agora;
    if agora <= inicio {
        return;
    }
    if !e.captura {
        let trecho = Trecho {
            inicio,
            fim: agora,
            titulo: String::new(),
            processo: String::new(),
            proprio: false,
            ausente: false,
            sem_captura: true,
        };
        return acrescentar(&mut e.trechos, trecho);
    }
    let janela = janela_ativa();
    let sem_uso = ms_sem_uso();
    if agora - inicio > SALTO_MS {
        let suspenso = Trecho {
            inicio,
            fim: agora - 1000,
            titulo: "Computador suspenso ou travado".into(),
            processo: String::new(),
            proprio: false,
            ausente: true,
            sem_captura: false,
        };
        acrescentar(&mut e.trechos, suspenso);
        return registrar_pedaco(e, agora - 1000, agora, &janela, sem_uso);
    }
    registrar_pedaco(e, inicio, agora, &janela, sem_uso);
}

fn registrar_pedaco(e: &mut Estado, inicio: i64, fim: i64, janela: &Janela, sem_uso: i64) {
    let limite = e.config.as_ref().map_or(i64::MAX, |c| c.limite_ausencia_seg * 1000);
    let ausente = sem_uso >= limite;
    if ausente {
        marcar_ausencia(&mut e.trechos, fim - sem_uso);
    }
    let trecho = Trecho {
        inicio,
        fim,
        titulo: janela.titulo.clone(),
        processo: janela.processo.clone(),
        proprio: janela.proprio,
        ausente,
        sem_captura: false,
    };
    acrescentar(&mut e.trechos, trecho);
}

fn casa(regra: &Regra, janela: &Janela) -> bool {
    let alvo = if regra.campo == "app" { &janela.processo } else { &janela.titulo }.to_lowercase();
    regra
        .termos
        .iter()
        .map(|t| t.trim().to_lowercase())
        .any(|t| !t.is_empty() && alvo.contains(&t))
}

fn regra_que_casa<'a>(regras: &'a [Regra], janela: &Janela) -> Option<&'a Regra> {
    let por_titulo = regras.iter().filter(|r| r.campo != "app");
    let por_app = regras.iter().filter(|r| r.campo == "app");
    por_titulo.chain(por_app).find(|r| casa(r, janela))
}

/// Rótulo da distração quando a janela conta como fora do estudo. Sem regra, também é fora.
fn distracao(config: &Configuracao, janela: &Janela) -> Option<String> {
    if janela.proprio || (janela.titulo.is_empty() && janela.processo.is_empty()) {
        return None;
    }
    match regra_que_casa(&config.regras, janela) {
        Some(regra) => (regra.tipo == "fora").then(|| regra.rotulo.clone()),
        None => Some(if janela.titulo.is_empty() { janela.processo.clone() } else { janela.titulo.chars().take(48).collect() }),
    }
}

fn formatar_minutos(ms: i64) -> String {
    let minutos = (ms as f64 / 60_000.0).round() as i64;
    if minutos <= 1 { "1 minuto".into() } else { format!("{minutos} minutos") }
}

/// Uma leitura por segundo (chamada pelo relógio em `lib.rs`).
pub fn tick(app: &AppHandle) {
    let rastreador = app.state::<Rastreador>();
    let mut avisos: Vec<(String, String)> = Vec::new();
    let mut concluiu = false;
    {
        let Ok(mut e) = rastreador.0.lock() else { return };
        if e.fase != Fase::Rodando {
            return;
        }
        let agora = agora_ms();
        registrar(&mut e, agora);

        let Some(config) = e.config.clone() else { return };
        let distraido = if e.captura && ms_sem_uso() < config.limite_ausencia_seg * 1000 {
            distracao(&config, &janela_ativa())
        } else {
            None
        };

        match (config.aviso_distracao_seg, distraido) {
            (Some(limite), Some(rotulo)) => {
                let desde = *e.fora_desde.get_or_insert(agora);
                if !e.avisado && agora - desde >= limite * 1000 {
                    e.avisado = true;
                    avisos.push((
                        "Fora do estudo".into(),
                        format!(
                            "Há {} em {rotulo}, longe de {}. O tempo continua sendo registrado.",
                            formatar_minutos(agora - desde),
                            config.materia
                        ),
                    ));
                }
            }
            _ => {
                e.fora_desde = None;
                e.avisado = false;
            }
        }

        if decorrido(&e, agora) >= config.duracao_ms {
            e.fase = Fase::Concluido;
            concluiu = true;
            avisos.push((
                "Pomodoro concluído".into(),
                format!("Fim da sessão de {}. Registre o que estudou para o tempo entrar no banco de horas.", config.materia),
            ));
        }
    }
    for (titulo, corpo) in avisos {
        notificar(app, &titulo, &corpo);
    }
    if concluiu {
        mostrar_janela(app);
    }
}

#[tauri::command]
pub fn rastreio_iniciar(rastreador: State<Rastreador>, config: Configuracao) {
    if let Ok(mut e) = rastreador.0.lock() {
        e.fase = Fase::Rodando;
        e.config = Some(config);
        e.captura = true;
        e.ultimo = agora_ms();
        e.trechos.clear();
        e.fora_desde = None;
        e.avisado = false;
    }
}

#[tauri::command]
pub fn rastreio_pausar(rastreador: State<Rastreador>) {
    if let Ok(mut e) = rastreador.0.lock() {
        if e.fase == Fase::Rodando {
            registrar(&mut e, agora_ms());
            e.fase = Fase::Pausado;
            e.fora_desde = None;
            e.avisado = false;
        }
    }
}

#[tauri::command]
pub fn rastreio_retomar(rastreador: State<Rastreador>) {
    if let Ok(mut e) = rastreador.0.lock() {
        if e.fase == Fase::Pausado {
            e.fase = Fase::Rodando;
            e.ultimo = agora_ms();
        }
    }
}

/// Liga ou desliga a leitura da janela sem parar o relógio.
#[tauri::command]
pub fn rastreio_captura(rastreador: State<Rastreador>, ligada: bool) {
    if let Ok(mut e) = rastreador.0.lock() {
        if e.fase == Fase::Rodando {
            registrar(&mut e, agora_ms());
        }
        e.captura = ligada;
        e.fora_desde = None;
        e.avisado = false;
    }
}

/// Mais tempo depois de concluir (ou durante a sessão).
#[tauri::command]
pub fn rastreio_estender(rastreador: State<Rastreador>, ms: i64) {
    if let Ok(mut e) = rastreador.0.lock() {
        let agora = agora_ms();
        let decorrido = decorrido(&e, agora);
        if let Some(config) = e.config.as_mut() {
            config.duracao_ms = config.duracao_ms.max(decorrido) + ms;
        }
        if e.fase == Fase::Concluido {
            e.fase = Fase::Rodando;
            e.ultimo = agora;
        }
    }
}

/// Encerra a sessão e devolve tudo o que foi registrado.
#[tauri::command]
pub fn rastreio_parar(rastreador: State<Rastreador>) -> Vec<Trecho> {
    let Ok(mut e) = rastreador.0.lock() else { return Vec::new() };
    if e.fase == Fase::Rodando {
        registrar(&mut e, agora_ms());
    }
    e.fase = Fase::Parado;
    e.config = None;
    e.captura = true;
    std::mem::take(&mut e.trechos)
}

#[tauri::command]
pub fn rastreio_estado(rastreador: State<Rastreador>) -> Retrato {
    let Ok(e) = rastreador.0.lock() else {
        return Retrato {
            fase: Fase::Parado,
            captura: true,
            decorrido_ms: 0,
            duracao_ms: 0,
            atual: Janela::default(),
            ms_sem_uso: 0,
            trechos: Vec::new(),
        };
    };
    // Fora do pomodoro rodando, ou com a captura pausada, nada é lido: nem para mostrar na tela.
    let lendo = e.fase == Fase::Rodando && e.captura;
    let (atual, sem_uso) = if lendo { (janela_ativa(), ms_sem_uso()) } else { (Janela::default(), 0) };
    Retrato {
        fase: e.fase,
        captura: e.captura,
        decorrido_ms: decorrido(&e, agora_ms()),
        duracao_ms: e.config.as_ref().map_or(0, |c| c.duracao_ms),
        atual,
        ms_sem_uso: sem_uso,
        trechos: e.trechos.clone(),
    }
}

#[cfg(test)]
mod testes {
    use super::*;

    fn trecho(inicio: i64, fim: i64, titulo: &str) -> Trecho {
        Trecho {
            inicio,
            fim,
            titulo: titulo.into(),
            processo: "app".into(),
            proprio: false,
            ausente: false,
            sem_captura: false,
        }
    }

    fn regra(rotulo: &str, termo: &str, campo: &str, tipo: &str) -> Regra {
        Regra { rotulo: rotulo.into(), termos: vec![termo.into()], campo: campo.into(), tipo: tipo.into() }
    }

    fn janela(titulo: &str, processo: &str) -> Janela {
        Janela { titulo: titulo.into(), processo: processo.into(), proprio: false }
    }

    #[test]
    fn junta_leituras_seguidas_da_mesma_janela() {
        let mut trechos = vec![trecho(0, 1000, "A")];
        acrescentar(&mut trechos, trecho(1000, 2000, "A"));
        acrescentar(&mut trechos, trecho(2000, 3000, "B"));
        assert_eq!(trechos.len(), 2);
        assert_eq!(trechos[0].fim, 2000);
    }

    #[test]
    fn ausencia_divide_o_trecho_no_ultimo_uso() {
        let mut trechos = vec![trecho(0, 10_000, "A"), trecho(10_000, 20_000, "B")];
        marcar_ausencia(&mut trechos, 15_000);
        assert_eq!(trechos.len(), 3);
        assert!(!trechos[0].ausente);
        assert_eq!((trechos[1].inicio, trechos[1].fim, trechos[1].ausente), (10_000, 15_000, false));
        assert_eq!((trechos[2].inicio, trechos[2].fim, trechos[2].ausente), (15_000, 20_000, true));
    }

    #[test]
    fn regra_de_titulo_vale_antes_da_de_app() {
        let regras = vec![regra("Chrome", "chrome", "app", "estudo"), regra("YouTube", "youtube", "titulo", "fora")];
        let video = janela("Gameplay - YouTube - Google Chrome", "chrome");
        let docs = janela("MDN - Google Chrome", "chrome");
        assert_eq!(regra_que_casa(&regras, &video).map(|r| r.rotulo.as_str()), Some("YouTube"));
        assert_eq!(regra_que_casa(&regras, &docs).map(|r| r.rotulo.as_str()), Some("Chrome"));
    }

    #[test]
    fn janela_sem_regra_conta_como_fora_e_ignorar_nao() {
        let config = Configuracao {
            duracao_ms: 0,
            limite_ausencia_seg: 300,
            aviso_distracao_seg: Some(60),
            regras: vec![regra("Spotify", "spotify", "app", "ignorar")],
            materia: "Inglês".into(),
        };
        assert!(distracao(&config, &janela("Música", "Spotify")).is_none());
        assert_eq!(distracao(&config, &janela("Jogo qualquer", "jogo")).as_deref(), Some("Jogo qualquer"));
    }
}
