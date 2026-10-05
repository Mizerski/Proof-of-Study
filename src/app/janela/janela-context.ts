import { createContext, useContext } from 'react'

export interface ContextoJanela {
  /** A janela virou o widget pequeno, sempre por cima. */
  widget: boolean
  virarWidget: () => Promise<void>
  restaurar: () => Promise<void>
  /** Ajusta a altura do widget ao conteúdo. */
  ajustarAltura: (altura: number) => void
}

export const JanelaContext = createContext<ContextoJanela | null>(null)

export function useJanela(): ContextoJanela {
  const contexto = useContext(JanelaContext)
  if (!contexto) throw new Error('useJanela precisa estar dentro do JanelaProvider')
  return contexto
}
