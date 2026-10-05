import { useSyncExternalStore } from 'react'
import { assinarTema, escolherTema, type Tema } from '../utils/tema'

const lerTema = (): Tema => (document.documentElement.classList.contains('dark') ? 'escuro' : 'claro')

export function useTema() {
  const tema = useSyncExternalStore(assinarTema, lerTema)
  return { tema, escolherTema }
}
