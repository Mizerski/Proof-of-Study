import type { Categoria } from '@/store/model/dados'

export interface InfoCategoria {
  nome: string
  /** Fundo do bloco na grade e na legenda. Estudo é o azul do tema (azul é estudo focado). */
  fundo: string
  /** Texto sobre o bloco. */
  texto: string
  /** Sono fica tracejado e transparente, para não pesar na grade. */
  tracejado?: boolean
}

/** Categorias da rotina, na ordem da tela. Cores do layout: tons claros com texto preto, estudo em azul. */
export const CATEGORIAS: Record<Categoria, InfoCategoria> = {
  estudo: { nome: 'Estudo', fundo: 'var(--azul)', texto: 'text-sobre-bloco' },
  trabalho: { nome: 'Trabalho', fundo: '#d9d0c1', texto: 'text-tinta' },
  jogo: { nome: 'Jogo', fundo: '#9cc3a5', texto: 'text-tinta' },
  treino: { nome: 'Treino', fundo: '#eba66b', texto: 'text-tinta' },
  terapia: { nome: 'Terapia', fundo: '#c2b2e0', texto: 'text-tinta' },
  sono: { nome: 'Sono', fundo: 'transparent', texto: 'text-muted-foreground', tracejado: true },
}

export const LISTA_CATEGORIAS = Object.keys(CATEGORIAS) as Categoria[]
