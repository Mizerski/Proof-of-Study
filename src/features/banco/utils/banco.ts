import { inicioDaSemana, somarSemanas, type DataISO } from '@/shared/lib/datas'
import { fracao } from '@/shared/lib/percentual'
import type { Dados, Materia, Meta, Sessao } from '@/store/model/dados'
import { focoNoBanco, taxaDeFoco } from '@/features/sessao/utils/resumo'

export const semanaDaSessao = (s: Pick<Sessao, 'inicio'>) => inicioDaSemana(new Date(s.inicio))

export const sessoesDaSemana = (sessoes: Sessao[], semana: DataISO) =>
  sessoes.filter((s) => semanaDaSessao(s) === semana).sort((a, b) => b.inicio - a.inicio)

export const metaDaSemana = (metas: Meta[], materiaId: string, semana: DataISO) =>
  metas.find((m) => m.materiaId === materiaId && m.semana === semana)

/** Meta mais recente da matéria antes (ou na) semana, para sugerir ao criar a próxima. */
export const ultimaMeta = (metas: Meta[], materiaId: string, semana: DataISO) =>
  metas
    .filter((m) => m.materiaId === materiaId && m.semana <= semana)
    .sort((a, b) => b.semana.localeCompare(a.semana))[0]

export interface SaldoMateria {
  materia: Materia
  meta?: Meta
  /** Foco das sessões com anotação: o que entrou no banco. */
  noBancoMs: number
  /** Foco de sessões sem anotação, que ainda não entrou. */
  pendenteMs: number
  sessoes: number
  progresso: number
}

export function saldoDaMateria(dados: Dados, materia: Materia, semana: DataISO): SaldoMateria {
  const daSemana = sessoesDaSemana(dados.sessoes, semana).filter((s) => s.materiaId === materia.id)
  const meta = metaDaSemana(dados.metas, materia.id, semana)
  const noBancoMs = daSemana.reduce((soma, s) => soma + focoNoBanco(s), 0)
  const pendenteMs = daSemana.reduce((soma, s) => soma + (s.focoMs - focoNoBanco(s)), 0)
  return {
    materia,
    meta,
    noBancoMs,
    pendenteMs,
    sessoes: daSemana.length,
    progresso: meta ? fracao(noBancoMs, meta.minutos * 60_000) : 0,
  }
}

/** Matérias visíveis numa semana: as ativas e as arquivadas que tiveram sessão ou meta nela. */
export function materiasDaSemana(dados: Dados, semana: DataISO): Materia[] {
  return dados.materias.filter(
    (m) =>
      !m.arquivada ||
      sessoesDaSemana(dados.sessoes, semana).some((s) => s.materiaId === m.id) ||
      metaDaSemana(dados.metas, m.id, semana),
  )
}

export interface LinhaEvolucao {
  semana: DataISO
  focoMs: number
  foraMs: number
  noBancoMs: number
  /** Soma das metas da semana. */
  metaMs: number
  /** As etapas (descrições das metas) da semana. */
  etapas: string[]
  percentualFoco: number
  sessoes: number
  /** Dias diferentes com sessão. */
  dias: number
  metas: number
  metasCumpridas: number
}

/** Uma linha por semana, da mais antiga para a atual, desde a primeira sessão ou meta (no máximo `limite`). */
export function evolucao(dados: Dados, semanaAtual: DataISO, limite = 12): LinhaEvolucao[] {
  const semanas = [...dados.sessoes.map(semanaDaSessao), ...dados.metas.map((m) => m.semana)].filter((s) => s <= semanaAtual)
  if (semanas.length === 0) return []
  const primeira = semanas.reduce((menor, s) => (s < menor ? s : menor))
  const linhas: LinhaEvolucao[] = []
  for (let i = 0, semana = semanaAtual; i < limite && semana >= primeira; i++, semana = somarSemanas(semana, -1)) {
    const daSemana = sessoesDaSemana(dados.sessoes, semana)
    const focoMs = daSemana.reduce((s, x) => s + x.focoMs, 0)
    const foraMs = daSemana.reduce((s, x) => s + x.foraMs, 0)
    const metas = dados.metas.filter((m) => m.semana === semana && m.minutos > 0)
    const metasCumpridas = metas.filter((m) => {
      const materia = dados.materias.find((x) => x.id === m.materiaId)
      return materia && saldoDaMateria(dados, materia, semana).progresso >= 1
    }).length
    linhas.push({
      semana,
      focoMs,
      foraMs,
      noBancoMs: daSemana.reduce((s, x) => s + focoNoBanco(x), 0),
      metaMs: metas.reduce((s, m) => s + m.minutos * 60_000, 0),
      etapas: metas.map((m) => m.descricao || dados.materias.find((x) => x.id === m.materiaId)?.nome || '').filter(Boolean),
      percentualFoco: taxaDeFoco(focoMs, foraMs),
      sessoes: daSemana.length,
      dias: new Set(daSemana.map((s) => new Date(s.inicio).toDateString())).size,
      metas: metas.length,
      metasCumpridas,
    })
  }
  return linhas.reverse()
}

/** Número da etapa: quantas semanas com meta a matéria teve até esta (inclusive). */
export const numeroDaEtapa = (metas: Meta[], materiaId: string, semana: DataISO) =>
  new Set(metas.filter((m) => m.materiaId === materiaId && m.semana <= semana).map((m) => m.semana)).size
