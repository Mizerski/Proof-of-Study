import type { BlocoRotina, Dados, Materia, Meta, Preferencias, Regra, Sessao, SessaoAtual } from '../model/dados'
import { regrasPadrao } from '../model/dados'

export type Acao =
  | { tipo: 'dados/carregar'; dados: Dados }
  | { tipo: 'materia/salvar'; materia: Materia }
  | { tipo: 'materia/excluir'; id: string }
  | { tipo: 'meta/salvar'; meta: Meta }
  | { tipo: 'meta/excluir'; id: string }
  | { tipo: 'bloco/salvar'; bloco: BlocoRotina }
  | { tipo: 'bloco/excluir'; id: string }
  | { tipo: 'sessao/salvar'; sessao: Sessao }
  | { tipo: 'sessao/excluir'; id: string }
  | { tipo: 'regra/salvar'; regra: Regra }
  | { tipo: 'regra/excluir'; id: string }
  | { tipo: 'regras/restaurar' }
  | { tipo: 'preferencias/salvar'; preferencias: Preferencias }
  | { tipo: 'sessaoAtual/definir'; sessao: SessaoAtual | null }
  | { tipo: 'sessaoAtual/atualizar'; mudancas: Partial<SessaoAtual> }

/** Troca o item de mesmo id, ou acrescenta no fim. */
function salvarItem<T extends { id: string }>(lista: T[], item: T): T[] {
  return lista.some((i) => i.id === item.id) ? lista.map((i) => (i.id === item.id ? item : i)) : [...lista, item]
}

export function dadosReducer(estado: Dados, acao: Acao): Dados {
  switch (acao.tipo) {
    case 'dados/carregar':
      return acao.dados
    case 'materia/salvar':
      return { ...estado, materias: salvarItem(estado.materias, acao.materia) }
    case 'materia/excluir':
      return {
        ...estado,
        materias: estado.materias.filter((m) => m.id !== acao.id),
        metas: estado.metas.filter((m) => m.materiaId !== acao.id),
        blocos: estado.blocos.map((b) => (b.materiaId === acao.id ? { ...b, materiaId: undefined } : b)),
      }
    case 'meta/salvar': {
      // Uma meta por matéria e semana.
      const outras = estado.metas.filter(
        (m) => m.id !== acao.meta.id && !(m.materiaId === acao.meta.materiaId && m.semana === acao.meta.semana),
      )
      return { ...estado, metas: [...outras, acao.meta] }
    }
    case 'meta/excluir':
      return { ...estado, metas: estado.metas.filter((m) => m.id !== acao.id) }
    case 'bloco/salvar':
      return { ...estado, blocos: salvarItem(estado.blocos, acao.bloco) }
    case 'bloco/excluir':
      return { ...estado, blocos: estado.blocos.filter((b) => b.id !== acao.id) }
    case 'sessao/salvar':
      return { ...estado, sessoes: salvarItem(estado.sessoes, acao.sessao) }
    case 'sessao/excluir':
      return { ...estado, sessoes: estado.sessoes.filter((s) => s.id !== acao.id) }
    case 'regra/salvar':
      return { ...estado, regras: salvarItem(estado.regras, acao.regra) }
    case 'regra/excluir':
      return { ...estado, regras: estado.regras.filter((r) => r.id !== acao.id) }
    case 'regras/restaurar':
      return { ...estado, regras: regrasPadrao() }
    case 'preferencias/salvar':
      return { ...estado, preferencias: acao.preferencias }
    case 'sessaoAtual/definir':
      return { ...estado, sessaoAtual: acao.sessao }
    case 'sessaoAtual/atualizar':
      return estado.sessaoAtual ? { ...estado, sessaoAtual: { ...estado.sessaoAtual, ...acao.mudancas } } : estado
  }
}
