import { useSearch } from '@tanstack/react-router'
import { TelaAnotacao } from './components/TelaAnotacao'
import { TelaRelogio } from './components/TelaRelogio'
import { TelaResumo } from './components/TelaResumo'
import { useSessao } from './context/sessao-context'

/** Sessão → Resumo → Anotação. Depois de salvar, o tempo aparece no Banco de horas. */
export function SessaoPage() {
  const { materia } = useSearch({ from: '/sessao' })
  const { etapa } = useSessao()
  if (etapa === 'resumo') return <TelaResumo />
  if (etapa === 'nota') return <TelaAnotacao />
  return <TelaRelogio materiaInicial={materia} />
}
