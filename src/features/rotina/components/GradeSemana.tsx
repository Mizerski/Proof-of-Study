import type { MouseEvent } from 'react'
import { addDays, format } from 'date-fns'
import { useAgora } from '@/shared/hooks/useAgora'
import { DIAS_SEMANA, deISO, formatarHoraCurta, inicioDaSemana } from '@/shared/lib/datas'
import { ROTULO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import type { BlocoRotina } from '@/store/model/dados'
import { CATEGORIAS } from '../constants/categorias'
import { MINUTOS_DIA, segmentosDoDia } from '../utils/rotina'

/** Altura de uma hora na grade, em px. */
const HORA = 28

interface GradeSemanaProps {
  blocos: BlocoRotina[]
  /** Hora em que a grade começa (8h, ou antes se houver bloco mais cedo). */
  horaInicial: number
  nomeMateria: (id?: string) => string | undefined
  onEditar: (bloco: BlocoRotina) => void
  /** Clique num horário vazio, ou no "Adicionar" do dia sem rotina: novo bloco nesse dia e hora. */
  onNovo: (dia: number, minuto: number) => void
}

/** A semana de segunda a domingo, das 8h à meia-noite, com o dia de hoje marcado e a linha da hora atual. */
export function GradeSemana({ blocos, horaInicial, nomeMateria, onEditar, onNovo }: GradeSemanaProps) {
  const agora = useAgora()
  const segunda = deISO(inicioDaSemana(agora))
  const diaHoje = agora.getDay()
  const minutoAgora = agora.getHours() * 60 + agora.getMinutes()
  const inicioMin = horaInicial * 60
  const horas = Array.from({ length: 24 - horaInicial }, (_, i) => horaInicial + i)
  const altura = horas.length * HORA
  const topo = (minuto: number) => ((Math.max(minuto, inicioMin) - inicioMin) / 60) * HORA

  function aoClicar(e: MouseEvent<HTMLDivElement>, dia: number) {
    if (e.target !== e.currentTarget) return
    const y = e.nativeEvent.offsetY
    const minuto = inicioMin + Math.floor(y / HORA) * 60 + (y % HORA >= HORA / 2 ? 30 : 0)
    onNovo(dia, Math.min(MINUTOS_DIA - 60, minuto))
  }

  return (
    <div className="flex flex-col">
      <div className="flex pl-10">
        {DIAS_SEMANA.map(({ dia, curto }, i) => {
          const hoje = dia === diaHoje
          return (
            <div key={dia} className={cn(ROTULO, 'flex flex-1 items-center gap-1.5 pb-1.5 pl-1.5')}>
              <span>{curto}</span>
              <span
                className={cn(
                  'flex h-5 min-w-[22px] items-center justify-center border-2 px-[3px]',
                  hoje ? 'border-contorno bg-vermelho text-sobre-bloco' : 'border-transparent',
                )}
              >
                {format(addDays(segunda, i), 'dd')}
              </span>
            </div>
          )
        })}
      </div>
      <div className="flex border-t-2 border-contorno">
        <div className="relative w-10 shrink-0" style={{ height: altura }}>
          {horas.map((h, i) => (
            <span key={h} className="absolute left-0 -translate-y-1.5 text-[0.625rem] text-muted-foreground" style={{ top: i * HORA }}>
              {String(h).padStart(2, '0')}h
            </span>
          ))}
        </div>
        {DIAS_SEMANA.map(({ dia, nome }) => {
          const segmentos = segmentosDoDia(blocos, dia).filter((s) => s.fim > inicioMin)
          const vazio = segmentos.length === 0
          return (
            <div
              key={dia}
              className={cn('relative min-w-0 flex-1 cursor-pointer border-l border-border', dia === diaHoje && 'bg-selecao')}
              style={{ height: altura }}
              onClick={(e) => aoClicar(e, dia)}
              title={`Clique para criar um bloco na ${nome.toLowerCase()}`}
            >
              {segmentos.map((s) => {
                const info = CATEGORIAS[s.bloco.categoria]
                const materia = nomeMateria(s.bloco.materiaId)
                const rotulo = s.bloco.categoria === 'estudo' && materia ? `Estudo · ${materia}` : s.bloco.titulo
                const alturaBloco = topo(s.fim) - topo(s.inicio)
                return (
                  <button
                    key={`${s.bloco.id}-${s.continuacao}`}
                    type="button"
                    onClick={() => onEditar(s.bloco)}
                    className={cn(
                      'absolute inset-x-[3px] flex flex-col overflow-hidden border-2 px-1.5 py-[3px] text-left text-[0.6875rem] leading-tight outline-none hover:brightness-105 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-ring',
                      info.tracejado ? 'border-dashed border-muted-foreground' : 'border-contorno',
                      s.bloco.categoria === 'estudo' && 'shadow-bloco-sm',
                      info.texto,
                    )}
                    style={{ top: topo(s.inicio) + 2, height: Math.max(alturaBloco - 4, 14), backgroundColor: info.fundo }}
                    title={`${rotulo} · ${formatarHoraCurta(s.bloco.inicio)}–${formatarHoraCurta(s.bloco.fim)}`}
                  >
                    <span className="truncate font-semibold">{rotulo}</span>
                    {alturaBloco >= 30 && (
                      <span className="truncate text-[0.625rem]">
                        {formatarHoraCurta(s.bloco.inicio)}–{formatarHoraCurta(s.bloco.fim)}
                      </span>
                    )}
                  </button>
                )
              })}
              {vazio && (
                <div className="absolute inset-x-[5px] top-2 flex flex-col items-center gap-2 border-2 border-dashed border-muted-foreground bg-card px-1.5 py-2.5 text-center text-[0.6875rem] leading-snug">
                  <span aria-hidden className="flex gap-[3px]">
                    <span className="size-[9px] bg-vermelho" />
                    <span className="size-[9px] rounded-full bg-azul" />
                    <span className="h-[9px] w-2.5 bg-amarelo [clip-path:polygon(50%_0,100%_100%,0_100%)]" />
                  </span>
                  Sem rotina registrada
                  <button
                    type="button"
                    onClick={() => onNovo(dia, 19 * 60)}
                    className="text-[0.625rem] font-semibold tracking-[0.06em] uppercase underline hover:text-vermelho"
                  >
                    Adicionar
                  </button>
                </div>
              )}
              {dia === diaHoje && minutoAgora >= inicioMin && (
                <div aria-hidden className="pointer-events-none absolute inset-x-0 z-[2] h-0.5 bg-vermelho" style={{ top: topo(minutoAgora) }}>
                  <span className="absolute -top-1 -left-1 size-2.5 border-[1.5px] border-contorno bg-vermelho" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
