/**
 * Tema claro ou escuro; sem escolha salva, segue o sistema. A escolha fica só neste aparelho.
 * `public/tema-inicial.js` usa a mesma chave e os mesmos valores.
 */
export type Tema = 'claro' | 'escuro'

const CHAVE = 'tema'
const CONSULTA_ESCURO = '(prefers-color-scheme: dark)'

const ouvintes = new Set<() => void>()

function temaSalvo(): Tema | null {
  try {
    const valor = localStorage.getItem(CHAVE)
    return valor === 'claro' || valor === 'escuro' ? valor : null
  } catch {
    return null
  }
}

function temaDoSistema(): Tema {
  return window.matchMedia(CONSULTA_ESCURO).matches ? 'escuro' : 'claro'
}

export function temaAtual(): Tema {
  return temaSalvo() ?? temaDoSistema()
}

function aplicar() {
  document.documentElement.classList.toggle('dark', temaAtual() === 'escuro')
  ouvintes.forEach((ouvinte) => ouvinte())
}

/** Escolher o tema do sistema apaga a escolha; sem armazenamento, vale só até fechar. */
export function escolherTema(tema: Tema) {
  try {
    if (tema === temaDoSistema()) localStorage.removeItem(CHAVE)
    else localStorage.setItem(CHAVE, tema)
  } catch {
    document.documentElement.classList.toggle('dark', tema === 'escuro')
    ouvintes.forEach((ouvinte) => ouvinte())
    return
  }
  aplicar()
}

export function assinarTema(ouvinte: () => void) {
  ouvintes.add(ouvinte)
  const mql = window.matchMedia(CONSULTA_ESCURO)
  mql.addEventListener('change', aplicar)
  return () => {
    ouvintes.delete(ouvinte)
    mql.removeEventListener('change', aplicar)
  }
}
