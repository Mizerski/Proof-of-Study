import { useEffect, useRef, useState } from 'react'
import { FaixaPrimarias } from '@/shared/components/FaixaPrimarias'
import { formatarDuracao, formatarRelogio } from '@/shared/lib/datas'
import { BOTAO, ROTULO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { useDados } from '@/store/context/dados-context'
import { useJanela } from '@/app/janela/janela-context'
import { useSessao } from '../context/sessao-context'
import { useResumoDaSessao } from '../hooks/useResumoDaSessao'
import { BarraFaixas } from './partes'
import { DetalheCaptura, useStatusCaptura } from './PopoverCaptura'

const BOTAO_PEQUENO = cn(BOTAO, 'h-8 px-2.5 text-[0.6875rem]')

/**
 * A janela encolhida num cartão sempre por cima: relógio, linha do tempo, aviso de distração e os controles.
 * A faixa de cima arrasta o widget; ↗ volta para a janela inteira.
 */
export function Widget() {
  const { dados } = useDados()
  const { etapa, retrato, iniciar, pausar, retomar, encerrar } = useSessao()
  const { restaurar, ajustarAltura } = useJanela()
  const { resumo, materia, meta, atual, foraHaMs } = useResumoDaSessao()
  const { rotulo, cor } = useStatusCaptura()
  const [detalhe, setDetalhe] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = raiz.current
    if (!el) return
    const observador = new ResizeObserver(() => ajustarAltura(el.getBoundingClientRect().height))
    observador.observe(el)
    return () => observador.disconnect()
  }, [ajustarAltura])

  const totalMs = retrato?.duracaoMs || dados.preferencias.duracaoMin * 60_000
  const restante = etapa === 'pronto' ? totalMs : totalMs - (retrato?.decorridoMs ?? 0)
  const ultima = [...dados.sessoes].sort((a, b) => b.inicio - a.inicio)[0]?.materiaId ?? dados.materias.find((m) => !m.arquivada)?.id

  return (
    <div ref={raiz} className="border-2 border-contorno bg-card text-foreground">
      <div data-tauri-drag-region>
        <FaixaPrimarias className="pointer-events-none" />
      </div>
      <div className="flex flex-col gap-2.5 px-3.5 py-3">
        <div data-tauri-drag-region className="flex items-center justify-between gap-2">
          <span className={cn(ROTULO, 'pointer-events-none truncate text-muted-foreground')}>
            {materia ? `${materia.nome}${meta?.descricao ? ` · ${meta.descricao}` : ''}` : 'Proof of Study'}
          </span>
          <button
            type="button"
            onClick={() => void restaurar()}
            aria-label="Abrir janela"
            title="Abrir janela"
            className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-contorno text-[0.8125rem] hover:bg-amarelo hover:text-tinta"
          >
            ↗
          </button>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-heading text-[3.125rem] leading-[0.9] font-extrabold tabular-nums">{formatarRelogio(restante)}</span>
          <span className="text-xs font-semibold text-foco">{formatarDuracao(resumo.focoMs)} foco</span>
        </div>
        <BarraFaixas faixas={etapa === 'pronto' ? [] : resumo.faixas} totalMs={Math.max(totalMs, resumo.totalMs)} className="h-2.5" />
        {etapa === 'rodando' && foraHaMs > 0 && dados.preferencias.avisoDistracao && atual && (
          <div className="border-2 border-l-[6px] border-contorno border-l-vermelho bg-fora-suave px-2 py-1.5 text-xs">
            <b>Fora há {formatarRelogio(foraHaMs)}</b> · {atual.rotulo}
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDetalhe((d) => !d)}
            aria-expanded={detalhe}
            className="flex flex-1 items-center gap-[7px] py-1 text-left text-[0.6875rem] font-semibold tracking-[0.06em] uppercase"
          >
            <span aria-hidden className={cn('size-2.5 border-[1.5px] border-contorno', cor)} />
            {rotulo} {detalhe ? '▴' : '▾'}
          </button>
          {etapa === 'rodando' && (
            <Button variant="outline" className={BOTAO_PEQUENO} onClick={pausar}>
              Pausar
            </Button>
          )}
          {etapa === 'pausado' && (
            <Button className={BOTAO_PEQUENO} onClick={retomar}>
              Continuar
            </Button>
          )}
          {etapa === 'pronto' && ultima && (
            <Button className={BOTAO_PEQUENO} onClick={() => void iniciar(ultima, dados.preferencias.duracaoMin)}>
              Iniciar
            </Button>
          )}
          {(etapa === 'rodando' || etapa === 'pausado') && (
            <Button variant="outline" className={BOTAO_PEQUENO} onClick={encerrar}>
              Encerrar
            </Button>
          )}
        </div>
        {detalhe && (
          <div className="border-t-2 border-contorno">
            <DetalheCaptura compacto />
          </div>
        )}
      </div>
    </div>
  )
}
