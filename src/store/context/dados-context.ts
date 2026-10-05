import { createContext, useContext, type Dispatch } from 'react'
import type { Dados } from '../model/dados'
import type { Acao } from '../reducer/dados-reducer'

export interface ContextoDados {
  dados: Dados
  dispatch: Dispatch<Acao>
}

export const DadosContext = createContext<ContextoDados | null>(null)

export function useDados(): ContextoDados {
  const contexto = useContext(DadosContext)
  if (!contexto) throw new Error('useDados precisa estar dentro do DadosProvider')
  return contexto
}
