import type { Regra, Tipo, Trecho } from '@/store/model/dados'

/** As regras de título valem antes das de app, para servirem de exceção (YouTube dentro do Chrome). */
export function ordenarRegras(regras: Regra[]): Regra[] {
  return [...regras.filter((r) => r.campo === 'titulo'), ...regras.filter((r) => r.campo === 'app')]
}

function casa(regra: Regra, titulo: string, processo: string): boolean {
  const alvo = (regra.campo === 'app' ? processo : titulo).toLowerCase()
  return regra.termos.some((t) => {
    const termo = t.trim().toLowerCase()
    return termo !== '' && alvo.includes(termo)
  })
}

/** Primeira regra que casa com a janela. Mesma lógica de `regra_que_casa` no Rust. */
export function regraQueCasa(regras: Regra[], titulo: string, processo: string): Regra | undefined {
  return ordenarRegras(regras).find((r) => casa(r, titulo, processo))
}

/** Nomes do Windows (executável) e do Linux (classe da janela, ex.: `Google-chrome`). */
const NAVEGADORES = new Set([
  'chrome',
  'msedge',
  'firefox',
  'brave',
  'opera',
  'vivaldi',
  'arc',
  'zen',
  'google-chrome',
  'chromium',
  'chromium-browser',
  'brave-browser',
  'microsoft-edge',
  'firefox-esr',
  'librewolf',
])

const NOMES_PROGRAMAS: Record<string, string> = {
  chrome: 'Chrome',
  msedge: 'Edge',
  firefox: 'Firefox',
  brave: 'Brave',
  opera: 'Opera',
  code: 'VS Code',
  cursor: 'Cursor',
  idea64: 'IntelliJ',
  explorer: 'Explorador de Arquivos',
  windowsterminal: 'Terminal',
  cmd: 'Prompt de Comando',
  powershell: 'PowerShell',
  notepad: 'Bloco de Notas',
  winword: 'Word',
  excel: 'Excel',
  powerpnt: 'PowerPoint',
  acrobat: 'Acrobat',
  acrord32: 'Acrobat Reader',
  obsidian: 'Obsidian',
  notion: 'Notion',
  anki: 'Anki',
  discord: 'Discord',
  spotify: 'Spotify',
  whatsapp: 'WhatsApp',
  'ms-teams': 'Teams',
  slack: 'Slack',
  steam: 'Steam',
  lockapp: 'Tela de bloqueio',
  // Linux: classe da janela.
  'google-chrome': 'Chrome',
  chromium: 'Chromium',
  'chromium-browser': 'Chromium',
  'brave-browser': 'Brave',
  'microsoft-edge': 'Edge',
  'jetbrains-idea': 'IntelliJ',
  'gnome-terminal-server': 'Terminal',
  'org.gnome.ptyxis': 'Terminal',
  konsole: 'Konsole',
  'org.gnome.nautilus': 'Arquivos',
  dolphin: 'Dolphin',
  'org.gnome.evince': 'Visualizador de documentos',
  okular: 'Okular',
}

export function nomeDoPrograma(processo: string): string {
  if (!processo) return 'Sem programa'
  return NOMES_PROGRAMAS[processo.toLowerCase()] ?? processo
}

export const ehNavegador = (processo: string) => NAVEGADORES.has(processo.toLowerCase())

/** " - Google Chrome", " — Mozilla Firefox", " - Microsoft Edge" (o Edge põe um espaço invisível antes de Edge). */
const SUFIXO_NAVEGADOR = /\s[-—–]\s(?:google chrome|mozilla firefox|microsoft​?\s?edge|chromium|brave|opera|vivaldi)$/i

/** O site, pelo título da aba: o último pedaço depois de " - " ("Caixa de entrada - Gmail" → "Gmail"). */
export function siteDoTitulo(titulo: string): string {
  const semNavegador = titulo.replace(SUFIXO_NAVEGADOR, '').trim()
  const partes = semNavegador
    .split(/\s[-—–|]\s/)
    .map((p) => p.trim())
    .filter(Boolean)
  return partes.at(-1) ?? semNavegador
}

export interface Classe {
  /** Identifica o grupo no resumo e nos ajustes da sessão. */
  chave: string
  rotulo: string
  tipo: Tipo
  /** Nenhuma regra casou: conta como fora do estudo, e aparece como sugestão em Apps e sites. */
  semRegra?: boolean
  /** Para criar uma regra a partir do grupo. */
  sugestao?: { campo: 'app' | 'titulo'; termo: string }
  /** Captura pausada, ausência e o próprio app não mudam de tipo no resumo. */
  fixo?: boolean
}

export const ROTULO_TIPO: Record<Tipo, string> = { estudo: 'Estudo', fora: 'Fora do estudo', ignorar: 'Ignorar' }

type JanelaLida = Pick<Trecho, 'titulo' | 'processo' | 'proprio' | 'ausente' | 'semCaptura'>

/** Em que grupo o trecho entra e como conta por padrão. Sem regra, é fora do estudo. */
export function classificar(trecho: JanelaLida, regras: Regra[]): Classe {
  if (trecho.semCaptura) return { chave: 'sem-captura', rotulo: 'Captura pausada', tipo: 'ignorar', fixo: true }
  if (trecho.ausente) return { chave: 'ausente', rotulo: 'Ausente do PC', tipo: 'fora' }
  if (trecho.proprio) return { chave: 'proprio', rotulo: 'Proof of Study', tipo: 'ignorar', fixo: true }
  const regra = regraQueCasa(regras, trecho.titulo, trecho.processo)
  if (regra) return { chave: `regra:${regra.id}`, rotulo: regra.rotulo, tipo: regra.tipo }
  if (ehNavegador(trecho.processo) && trecho.titulo) {
    const site = siteDoTitulo(trecho.titulo)
    return { chave: `site:${site.toLowerCase()}`, rotulo: site, tipo: 'fora', semRegra: true, sugestao: { campo: 'titulo', termo: site } }
  }
  const programa = nomeDoPrograma(trecho.processo)
  return {
    chave: `app:${trecho.processo.toLowerCase()}`,
    rotulo: programa,
    tipo: 'fora',
    semRegra: true,
    sugestao: trecho.processo ? { campo: 'app', termo: trecho.processo.toLowerCase() } : undefined,
  }
}
