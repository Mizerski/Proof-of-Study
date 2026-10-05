import { addDays, format } from 'date-fns'
import { Ajuda } from '@/shared/components/Ajuda'
import { CabecalhoCard } from '@/shared/components/CabecalhoCard'
import { DIAS_SEMANA, deISO, formatarDuracao, formatarHM, formatarMeta, paraISO, type DataISO } from '@/shared/lib/datas'
import { CARTAO, ROTULO, VALOR_DESTAQUE } from '@/shared/lib/estilos'
import { formatarPercentual } from '@/shared/lib/percentual'
import { cn } from '@/shared/lib/utils'
import type { BlocoRotina, Sessao } from '@/store/model/dados'
import { estudoNoDia } from '@/features/rotina/utils/rotina'
import { focoNoBanco } from '@/features/sessao/utils/resumo'
import type { SaldoMateria } from '../utils/banco'


/** O número do banco, a barra com o marco da metade e faltam / sessões / em foco. */
export function CardHorasFocadas({ saldo, taxa }: { saldo: SaldoMateria; taxa: number | null }) {
  const metaMs = (saldo.meta?.minutos ?? 0) * 60_000
  const marcoMs = metaMs / 2
  return (
    <div className={CARTAO}>
      <CabecalhoCard
        titulo="Horas focadas"
        faixa="bg-amarelo"
        forma={{ forma: 'semicirculo', cor: 'tinta' }}
        acoes={
          <Ajuda titulo="O que entra no banco">
            <p>
              Só entra no banco o tempo em janelas marcadas como <b>estudo</b>, e só de sessões com anotação do que foi
              estudado.
            </p>
            <p>Tempo fora do estudo e janelas ignoradas ficam registrados na sessão, mas não somam.</p>
          </Ajuda>
        }
      />
      <div className="flex flex-col gap-4 p-4">
        <span className={cn(VALOR_DESTAQUE, 'text-[2.75rem]')}>
          {formatarHM(saldo.noBancoMs)}{' '}
          {metaMs > 0 && <span className="text-[1.375rem] font-light">de {formatarMeta(metaMs)}</span>}
        </span>
        {metaMs > 0 && (
          <div className="relative pt-5">
            <div className="h-[18px] border-2 border-contorno bg-muted">
              <div
                className="h-full border-r-2 border-contorno bg-amarelo"
                style={{ width: `${Math.min(100, saldo.progresso * 100)}%` }}
              />
            </div>
            <div aria-hidden className="absolute top-0 -bottom-1 left-1/2 w-0.5 bg-contorno" />
            <div className={cn(ROTULO, 'absolute top-0 left-1/2 pl-1.5 tracking-[0.06em]')}>
              Marco {formatarMeta(marcoMs)} · {saldo.noBancoMs >= marcoMs ? 'atingido' : `faltam ${formatarHM(marcoMs - saldo.noBancoMs)}`}
            </div>
          </div>
        )}
        <div className="flex gap-6">
          {metaMs > 0 && <Numero rotulo="Faltam" valor={formatarHM(Math.max(0, metaMs - saldo.noBancoMs))} />}
          <Numero rotulo="Sessões" valor={String(saldo.sessoes)} />
          <Numero rotulo="Em foco" valor={taxa === null ? '—' : formatarPercentual(taxa)} cor="text-foco" />
        </div>
        {saldo.pendenteMs > 0 && (
          <p className="text-xs text-muted-foreground">
            <b className="text-foreground">{formatarDuracao(saldo.pendenteMs)}</b> focados em sessões sem anotação ainda não
            entraram.
          </p>
        )}
      </div>
    </div>
  )
}

function Numero({ rotulo, valor, cor }: { rotulo: string; valor: string; cor?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={cn(ROTULO, 'text-muted-foreground')}>{rotulo}</span>
      <span className={cn('text-lg font-semibold tabular-nums', cor)}>{valor}</span>
    </div>
  )
}

/** Uma coluna por dia: o fundo é o bloco de estudo da rotina, o azul é o tempo focado. */
export function CardDiasDeEstudo({
  semana,
  materiaId,
  blocos,
  sessoes,
}: {
  semana: DataISO
  materiaId: string
  blocos: BlocoRotina[]
  sessoes: Sessao[]
}) {
  const segunda = deISO(semana)
  const dias = DIAS_SEMANA.map(({ dia, curto }, i) => {
    const data = paraISO(addDays(segunda, i))
    const planejado = estudoNoDia(blocos, materiaId, dia)
    const focado = sessoes.filter((s) => paraISO(new Date(s.inicio)) === data).reduce((soma, s) => soma + focoNoBanco(s), 0) / 60_000
    return { curto, data, planejado, focado }
  })
  const escala = Math.max(60, ...dias.map((d) => Math.max(d.planejado, d.focado)))

  return (
    <div className={CARTAO}>
      <CabecalhoCard titulo="Dias de estudo" faixa="bg-azul" forma={{ forma: 'quarto', cor: 'amarelo' }} />
      <div className="flex flex-col gap-2.5 p-4">
        <div className="flex items-end gap-2">
          {dias.map((d) => (
            <div key={d.data} className="flex flex-1 flex-col items-center gap-[5px]" title={format(deISO(d.data), 'dd/MM')}>
              <div
                className={cn(
                  'flex h-24 w-full items-end',
                  d.planejado > 0 ? 'border-2 border-contorno bg-foco-suave' : 'border-2 border-dashed border-border',
                )}
              >
                <div
                  className={cn('w-full bg-azul', d.focado > 0 && 'border-t-2 border-contorno')}
                  style={{ height: `${Math.min(100, (d.focado / escala) * 100)}%` }}
                />
              </div>
              <span className={ROTULO}>{d.curto}</span>
              <span className="text-[0.6875rem] text-muted-foreground">
                {d.focado > 0 ? formatarHM(d.focado * 60_000) : d.planejado > 0 ? `plan. ${formatarMeta(d.planejado * 60_000)}` : '—'}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-3.5 text-[0.6875rem] text-muted-foreground">
          <span className="flex items-center gap-[5px]">
            <span className="size-2.5 border-[1.5px] border-contorno bg-azul" />
            focado
          </span>
          <span className="flex items-center gap-[5px]">
            <span className="size-2.5 border-[1.5px] border-contorno bg-foco-suave" />
            bloco de estudo na rotina
          </span>
        </div>
      </div>
    </div>
  )
}
