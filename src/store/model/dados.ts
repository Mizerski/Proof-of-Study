import type { DataISO } from '@/shared/lib/datas'

/** Versão do formato salvo em `dados.json`. Ao mudar o formato, suba a versão e converta em `atualizarDados`. */
export const VERSAO_DADOS = 2

export type Categoria = 'estudo' | 'trabalho' | 'jogo' | 'treino' | 'terapia' | 'sono'

/** Estudo soma no banco; fora do estudo é distração (ou ausência); ignorar fica registrado, mas não conta. */
export type Tipo = 'estudo' | 'fora' | 'ignorar'

export interface Materia {
  id: string
  nome: string
  /** Hex da paleta (dado do usuário). */
  cor: string
  /** Some das escolhas, mas continua no histórico. */
  arquivada?: boolean
}

/** Meta de uma matéria numa semana: o que estudar (a etapa) e quantas horas focadas. */
export interface Meta {
  id: string
  materiaId: string
  /** Segunda-feira da semana. */
  semana: DataISO
  minutos: number
  /** A etapa da semana ("Verbos irregulares"). */
  descricao: string
}

/** Bloco recorrente da rotina. Se `fim <= inicio`, passa da meia-noite (ex.: sono das 23:00 às 07:00). */
export interface BlocoRotina {
  id: string
  titulo: string
  categoria: Categoria
  /** Dias em que começa, de 0 (domingo) a 6 (sábado). */
  dias: number[]
  /** Minutos do dia (0 a 1439). */
  inicio: number
  fim: number
  /** Matéria do bloco de estudo. */
  materiaId?: string
  /** Notificar quando o bloco começa (só estudo). */
  avisar: boolean
}

/** Intervalo contínuo na mesma janela, registrado pelo Rust (`src-tauri/src/rastreador.rs`). */
export interface Trecho {
  /** Milissegundos desde 1970. */
  inicio: number
  fim: number
  titulo: string
  processo: string
  proprio: boolean
  ausente: boolean
  /** Captura pausada: o relógio andou, mas a janela não foi lida. */
  semCaptura?: boolean
}

export interface Sessao {
  id: string
  materiaId: string
  inicio: number
  fim: number
  duracaoPlanejadaMin: number
  trechos: Trecho[]
  /** Grupos que a pessoa reclassificou no fim da sessão (ex.: YouTube que era aula). */
  ajustes: Record<string, Tipo>
  focoMs: number
  foraMs: number
  /** O que foi estudado. Sem anotação nem imagem, o tempo não entra no banco de horas. */
  anotacao: string
  /** Nomes dos arquivos na pasta de imagens do app. */
  imagens: string[]
}

/** Regra que classifica janelas: o nome do app ou uma palavra no título. As de título valem antes. */
export interface Regra {
  id: string
  rotulo: string
  campo: 'app' | 'titulo'
  termos: string[]
  tipo: Tipo
}

export interface Preferencias {
  duracaoMin: number
  /** Sem mexer no teclado e no mouse por esse tempo, a sessão conta como ausência. */
  limiteAusenciaMin: number
  avisoDistracao: boolean
  avisoDistracaoSeg: number
}

/** Pomodoro em andamento (ou encerrado e ainda sem anotação). Os trechos são uma cópia de segurança. */
export interface SessaoAtual {
  id: string
  materiaId: string
  inicio: number
  duracaoMin: number
  trechos: Trecho[]
  /** Imagens já coladas na anotação, para apagar se a sessão for descartada. */
  imagens: string[]
  anotacao: string
  /** Depois de encerrar: o resumo ou a anotação. */
  passo?: 'resumo' | 'nota'
  /** Reclassificações feitas no resumo. */
  ajustes?: Record<string, Tipo>
}

export interface Dados {
  materias: Materia[]
  metas: Meta[]
  blocos: BlocoRotina[]
  sessoes: Sessao[]
  regras: Regra[]
  preferencias: Preferencias
  sessaoAtual: SessaoAtual | null
}

export const PREFERENCIAS_PADRAO: Preferencias = {
  duracaoMin: 25,
  limiteAusenciaMin: 5,
  avisoDistracao: true,
  avisoDistracaoSeg: 60,
}

const app = (rotulo: string, termos: string[], tipo: Tipo): Regra => ({ id: crypto.randomUUID(), rotulo, campo: 'app', termos, tipo })
const titulo = (rotulo: string, termos: string[], tipo: Tipo): Regra => ({
  id: crypto.randomUUID(),
  rotulo,
  campo: 'titulo',
  termos,
  tipo,
})

/**
 * Regras de partida. Janela sem regra conta como fora do estudo, então os apps de estudo comuns já vêm marcados.
 * O título da aba do navegador vem no título da janela, então sites casam pelo título.
 */
export function regrasPadrao(): Regra[] {
  return [
    app('VS Code', ['code', 'cursor'], 'estudo'),
    app('IntelliJ', ['idea64', 'pycharm64', 'webstorm64', 'jetbrains'], 'estudo'),
    app(
      'Terminal',
      ['windowsterminal', 'powershell', 'cmd', 'gnome-terminal', 'ptyxis', 'konsole', 'kitty', 'alacritty', 'wezterm', 'xterm', 'tilix'],
      'estudo',
    ),
    app('Anki', ['anki'], 'estudo'),
    app('Notion', ['notion'], 'estudo'),
    app('Obsidian', ['obsidian'], 'estudo'),
    app('Leitor de PDF', ['acrobat', 'acrord32', 'sumatrapdf', 'evince', 'okular', 'zathura', 'papers'], 'estudo'),
    titulo('Documentação e dicionários', ['mdn', 'stack overflow', 'cambridge', 'duolingo', 'github', 'docs'], 'estudo'),
    titulo('ChatGPT e Claude', ['chatgpt', 'claude'], 'estudo'),
    titulo('YouTube', ['youtube'], 'fora'),
    app('Discord', ['discord'], 'fora'),
    titulo('WhatsApp', ['whatsapp'], 'fora'),
    titulo('Redes sociais', ['instagram', 'tiktok', 'twitter', ' / x', 'reddit', 'facebook'], 'fora'),
    titulo('Streaming', ['netflix', 'twitch', 'prime video', 'disney+', 'hbo max', 'globoplay', 'crunchyroll'], 'fora'),
    app('Steam', ['steam', 'epicgameslauncher'], 'fora'),
    titulo('Jogos', ['league of legends', 'valorant', 'minecraft', 'roblox', 'fortnite', 'counter-strike'], 'fora'),
    app('Spotify', ['spotify'], 'ignorar'),
    app('Explorador de arquivos', ['explorer', 'nautilus', 'dolphin', 'thunar', 'nemo'], 'ignorar'),
  ]
}

export function dadosIniciais(): Dados {
  return {
    materias: [
      { id: crypto.randomUUID(), nome: 'Programação', cor: '#1f45c4' },
      { id: crypto.randomUUID(), nome: 'Inglês', cor: '#d7322a' },
    ],
    metas: [],
    blocos: [],
    sessoes: [],
    regras: regrasPadrao(),
    preferencias: PREFERENCIAS_PADRAO,
    sessaoAtual: null,
  }
}

/** Formato da versão 1: tipo foco/fora e regras sem campo. */
type TipoV1 = 'foco' | Tipo
const deV1 = (tipo: TipoV1): Tipo => (tipo === 'foco' ? 'estudo' : tipo)

/** Converte o que foi salvo por versões anteriores e completa campos que faltarem. */
export function atualizarDados(salvo: Partial<Dados> | undefined, versao = VERSAO_DADOS): Dados {
  if (!salvo) return dadosIniciais()
  const v1 = versao < 2
  const ajustesV1 = (a: Record<string, TipoV1>) => Object.fromEntries(Object.entries(a).map(([k, t]) => [k, deV1(t)]))
  return {
    materias: salvo.materias ?? [],
    metas: salvo.metas ?? [],
    blocos: salvo.blocos ?? [],
    sessoes: (salvo.sessoes ?? []).map((s) => (v1 ? { ...s, ajustes: ajustesV1(s.ajustes) } : s)),
    // As regras da v1 eram só de distração por título; as novas trazem também os apps de estudo.
    regras: v1 || !salvo.regras ? regrasPadrao() : salvo.regras,
    preferencias: { ...PREFERENCIAS_PADRAO, ...salvo.preferencias },
    sessaoAtual: salvo.sessaoAtual ?? null,
  }
}
