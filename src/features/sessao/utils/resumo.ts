import type { Regra, Sessao, Tipo, Trecho } from '@/store/model/dados'
import { classificar, type Classe } from './classificacao'

export interface TituloNoGrupo {
  titulo: string
  ms: number
}

export interface Grupo extends Classe {
  /** Como a regra classificou (o `tipo` já tem o ajuste da sessão). */
  tipoPadrao: Tipo
  ms: number
  /** Do mais usado para o menos usado. */
  titulos: TituloNoGrupo[]
}

/** Pedaço da linha do tempo: trechos seguidos do mesmo tipo viram um só. */
export interface Faixa {
  tipo: Tipo
  ms: number
}

export interface Resumo {
  focoMs: number
  foraMs: number
  ignoradoMs: number
  totalMs: number
  /** Grupos do maior para o menor tempo. */
  grupos: Grupo[]
  faixas: Faixa[]
  /** Quantas vezes saiu para fora do estudo. */
  saidas: number
  /** Maior trecho seguido de estudo. */
  maiorTrechoMs: number
}

export function resumir(trechos: Trecho[], regras: Regra[], ajustes: Record<string, Tipo> = {}): Resumo {
  const grupos = new Map<string, Grupo & { porTitulo: Map<string, number> }>()
  const faixas: Faixa[] = []

  for (const t of trechos) {
    const ms = Math.max(0, t.fim - t.inicio)
    const classe = classificar(t, regras)
    const tipo = (!classe.fixo && ajustes[classe.chave]) || classe.tipo
    let grupo = grupos.get(classe.chave)
    if (!grupo) {
      grupo = { ...classe, tipo, tipoPadrao: classe.tipo, ms: 0, titulos: [], porTitulo: new Map() }
      grupos.set(classe.chave, grupo)
    }
    grupo.ms += ms
    if (!t.semCaptura) {
      const titulo = t.titulo || '(sem título)'
      grupo.porTitulo.set(titulo, (grupo.porTitulo.get(titulo) ?? 0) + ms)
    }
    const ultima = faixas.at(-1)
    if (ultima && ultima.tipo === tipo) ultima.ms += ms
    else faixas.push({ tipo, ms })
  }

  const lista = [...grupos.values()]
    .map(({ porTitulo, ...g }) => ({
      ...g,
      titulos: [...porTitulo].map(([titulo, ms]) => ({ titulo, ms })).sort((a, b) => b.ms - a.ms),
    }))
    .sort((a, b) => b.ms - a.ms)

  const soma = (tipo: Tipo) => lista.filter((g) => g.tipo === tipo).reduce((s, g) => s + g.ms, 0)
  const focoMs = soma('estudo')
  const foraMs = soma('fora')
  const ignoradoMs = soma('ignorar')
  return {
    focoMs,
    foraMs,
    ignoradoMs,
    totalMs: focoMs + foraMs + ignoradoMs,
    grupos: lista,
    faixas,
    saidas: faixas.filter((f) => f.tipo === 'fora').length,
    maiorTrechoMs: Math.max(0, ...faixas.filter((f) => f.tipo === 'estudo').map((f) => f.ms)),
  }
}

/** Uma sessão só entra no banco de horas com o registro do que foi estudado (texto ou imagem). */
export const temAnotacao = (s: Pick<Sessao, 'anotacao' | 'imagens'>) => s.anotacao.trim() !== '' || s.imagens.length > 0

export const focoNoBanco = (s: Sessao) => (temAnotacao(s) ? s.focoMs : 0)

/** % do tempo em estudo, entre estudo e fora (o ignorado não entra na conta). */
export const taxaDeFoco = (focoMs: number, foraMs: number) => (focoMs + foraMs > 0 ? focoMs / (focoMs + foraMs) : 0)

/** Só os grupos que mudaram em relação à regra (é o que fica salvo na sessão). */
export function ajustesMudados(grupos: Grupo[], ajustes: Record<string, Tipo>): Record<string, Tipo> {
  return Object.fromEntries(
    Object.entries(ajustes).filter(([chave, tipo]) => grupos.find((g) => g.chave === chave)?.tipoPadrao !== tipo),
  )
}
