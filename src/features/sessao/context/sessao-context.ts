import { createContext, useContext } from 'react'
import type { Sessao, SessaoAtual, Tipo, Trecho } from '@/store/model/dados'
import type { Retrato } from '../api/rastreio'

/**
 * Em que ponto o pomodoro está:
 * - `pronto`: nenhuma sessão;
 * - `rodando` / `pausado`: o relógio andando (ou não);
 * - `resumo` → `nota`: acabou (pelo tempo ou pelo botão); primeiro o resumo, depois o que foi estudado.
 */
export type Etapa = 'pronto' | 'rodando' | 'pausado' | 'resumo' | 'nota'

export interface ContextoSessao {
  /** `null` até a primeira leitura do Rust. */
  etapa: Etapa | null
  retrato: Retrato | null
  sessao: SessaoAtual | null
  /** Trechos da sessão em andamento ou encerrada. */
  trechos: Trecho[]
  /** O tempo acabou e o Rust ainda segura a sessão: dá para estender. */
  podeEstender: boolean
  iniciar: (materiaId: string, duracaoMin: number) => Promise<void>
  pausar: () => Promise<void>
  retomar: () => Promise<void>
  alternarCaptura: () => Promise<void>
  estender: (minutos: number) => Promise<void>
  encerrar: () => Promise<void>
  /** Reclassifica um grupo só nesta sessão. */
  ajustar: (chave: string, tipo: Tipo) => void
  irParaNota: () => void
  voltarAoResumo: () => void
  salvar: () => Promise<Sessao | null>
  descartar: () => Promise<void>
}

export const SessaoContext = createContext<ContextoSessao | null>(null)

export function useSessao(): ContextoSessao {
  const contexto = useContext(SessaoContext)
  if (!contexto) throw new Error('useSessao precisa estar dentro do SessaoProvider')
  return contexto
}
