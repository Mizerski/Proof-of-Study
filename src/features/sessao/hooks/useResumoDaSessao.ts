import { useMemo } from 'react'
import { inicioDaSemana } from '@/shared/lib/datas'
import { useDados } from '@/store/context/dados-context'
import { metaDaSemana } from '@/features/banco/utils/banco'
import { useSessao } from '../context/sessao-context'
import { classificar, nomeDoPrograma, ROTULO_TIPO } from '../utils/classificacao'
import { resumir } from '../utils/resumo'

/** O que as telas da sessão mostram: o resumo até agora, a matéria, a meta e como a janela ativa está contando. */
export function useResumoDaSessao() {
  const { dados } = useDados()
  const { trechos, sessao, retrato, etapa } = useSessao()
  const resumo = useMemo(() => resumir(trechos, dados.regras, sessao?.ajustes), [trechos, dados.regras, sessao?.ajustes])
  const materia = dados.materias.find((m) => m.id === sessao?.materiaId)
  const meta = materia ? metaDaSemana(dados.metas, materia.id, inicioDaSemana(new Date(sessao?.inicio ?? Date.now()))) : undefined

  const capturando = etapa === 'rodando' && !!retrato?.captura
  const janela = retrato?.atual
  const lida = capturando && janela && (janela.titulo || janela.processo) ? janela : null
  const ausente = (retrato?.msSemUso ?? 0) >= dados.preferencias.limiteAusenciaMin * 60_000
  const classe = lida ? classificar({ ...lida, ausente, semCaptura: false }, dados.regras) : null
  const tipoAtual = classe ? (sessao?.ajustes?.[classe.chave] ?? classe.tipo) : null
  const ultima = resumo.faixas.at(-1)
  const foraHaMs = tipoAtual === 'fora' && ultima?.tipo === 'fora' ? ultima.ms : 0

  return {
    resumo,
    materia,
    meta,
    capturando,
    atual: lida
      ? {
          titulo: lida.titulo || '(janela sem título)',
          detalhe: `${nomeDoPrograma(lida.processo)} · ${ROTULO_TIPO[tipoAtual ?? 'fora'].toLowerCase()}`,
          rotulo: classe?.rotulo ?? '',
          tipo: tipoAtual,
        }
      : null,
    foraHaMs,
  }
}
