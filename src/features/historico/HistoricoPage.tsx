import { getISOWeek } from 'date-fns'
import { CabecalhoPagina } from '@/shared/components/CabecalhoPagina'
import { EstadoVazio } from '@/shared/components/EstadoVazio'
import { deISO, formatarHM, inicioDaSemana, rotuloSemana } from '@/shared/lib/datas'
import { CARTAO, ROTULO } from '@/shared/lib/estilos'
import { FORMA_PAGINA } from '@/shared/lib/formas'
import { formatarPercentual } from '@/shared/lib/percentual'
import { cn } from '@/shared/lib/utils'
import { useDados } from '@/store/context/dados-context'
import { evolucao, type LinhaEvolucao } from '@/features/banco/utils/banco'


const COLUNAS = 'grid grid-cols-[110px_minmax(0,1.1fr)_170px_70px_minmax(0,1.6fr)]'

/** Semana a semana: % em foco contra a primeira semana, metas cumpridas e o resultado de cada uma. */
export function HistoricoPage() {
  const { dados } = useDados()
  const semanaAtual = inicioDaSemana(new Date())
  const linhas = evolucao(dados, semanaAtual)
  const comSessao = linhas.filter((l) => l.sessoes > 0)
  const base = comSessao[0]
  const ultima = comSessao.at(-1)
  const delta = base && ultima && base !== ultima ? Math.round((ultima.percentualFoco - base.percentualFoco) * 100) : null
  const passadasComMeta = linhas.filter((l) => l.semana !== semanaAtual && l.metas > 0)
  const cumpridas = passadasComMeta.filter((l) => l.metasCumpridas === l.metas).length

  return (
    <div className="flex flex-col gap-4">
      <CabecalhoPagina
        forma={FORMA_PAGINA.historico}
        trilha={dados.materias.filter((m) => !m.arquivada).map((m) => m.nome).join(' · ') || 'Todas as matérias'}
        titulo={
          <>
            Histórico <span>de semanas</span>
          </>
        }
      />

      {linhas.length === 0 ? (
        <EstadoVazio titulo="Ainda sem histórico" descricao="As semanas aparecem aqui depois da primeira sessão ou meta." />
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            <div className={cn(CARTAO, 'flex flex-col gap-1 p-3.5')}>
              <span className={cn(ROTULO, 'text-muted-foreground')}>Foco vs. primeira semana</span>
              <span className="font-heading text-[2rem] leading-tight font-extrabold text-foco">
                {delta === null ? '—' : `${delta >= 0 ? '+' : ''}${delta} pp`}
              </span>
              <span className="text-xs text-muted-foreground">
                Objetivo: <b className="text-foreground">+20 pp</b>
              </span>
            </div>
            <div className={cn(CARTAO, 'flex flex-col gap-1 p-3.5')}>
              <span className={cn(ROTULO, 'text-muted-foreground')}>Metas cumpridas</span>
              <span className="font-heading text-[2rem] leading-tight font-extrabold text-banco">
                {cumpridas} <span className="font-light">de {passadasComMeta.length}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                Objetivo: <b className="text-foreground">3 de 4 semanas</b>
              </span>
            </div>
            <div className={cn(CARTAO, 'flex flex-col gap-2 p-3.5')}>
              <span className={cn(ROTULO, 'text-muted-foreground')}>% em foco por semana</span>
              <div className="flex h-14 items-end gap-1.5 border-b-2 border-contorno">
                {linhas.map((l) => (
                  <div
                    key={l.semana}
                    title={`${rotuloSemana(l.semana)}: ${formatarPercentual(l.percentualFoco)}`}
                    className={cn('flex-1 border-2 border-b-0 border-contorno', l.semana === semanaAtual ? 'bg-azul' : 'bg-foco-suave')}
                    style={{ height: `${l.percentualFoco * 100}%` }}
                  />
                ))}
              </div>
              <div className="flex gap-1.5">
                {linhas.map((l) => (
                  <span key={l.semana} className="flex-1 text-center text-[0.625rem] font-semibold text-muted-foreground">
                    S{getISOWeek(deISO(l.semana))}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className={CARTAO}>
            <div className={cn(COLUNAS, ROTULO, 'border-b-2 border-contorno text-muted-foreground')}>
              <span className="px-3 py-2">Semana</span>
              <span className="px-3 py-2">Etapa</span>
              <span className="px-3 py-2 text-right">Horas focadas</span>
              <span className="px-3 py-2 text-right">Foco</span>
              <span className="px-3 py-2">Resultado</span>
            </div>
            {linhas.map((l) => (
              <Linha key={l.semana} linha={l} atual={l.semana === semanaAtual} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Linha({ linha: l, atual }: { linha: LinhaEvolucao; atual: boolean }) {
  const cumprida = l.metas > 0 && l.metasCumpridas === l.metas
  const status = atual ? 'Semana atual' : l.metas === 0 ? 'Sem meta' : cumprida ? 'Meta cumprida' : 'Não cumprida'
  const resultado =
    l.sessoes === 0
      ? 'Nenhuma sessão.'
      : `${l.sessoes} ${l.sessoes === 1 ? 'sessão' : 'sessões'} em ${l.dias} ${l.dias === 1 ? 'dia' : 'dias'}${l.metas > 1 ? ` · ${l.metasCumpridas} de ${l.metas} metas` : ''}.`

  return (
    <div
      className={cn(
        COLUNAS,
        'items-start border-b border-border text-[0.8125rem] hover:bg-foreground/5',
        atual && 'font-semibold shadow-[inset_0_2px_0_var(--contorno),inset_0_-2px_0_var(--contorno)]',
      )}
    >
      <span className="flex flex-col px-3 py-2.5">
        <span>S{getISOWeek(deISO(l.semana))}</span>
        <span className="text-[0.6875rem] font-normal text-muted-foreground">{rotuloSemana(l.semana)}</span>
      </span>
      <span className="px-3 py-2.5">{l.etapas.join(', ') || '—'}</span>
      <span className="flex flex-col items-end gap-[5px] px-3 py-2.5">
        <span>
          {formatarHM(l.noBancoMs)}
          {l.metaMs > 0 && ` / ${formatarHM(l.metaMs)}`}
        </span>
        <span className="h-2 w-full border-[1.5px] border-contorno bg-muted">
          <span className="block h-full bg-amarelo" style={{ width: `${l.metaMs ? Math.min(100, (l.noBancoMs / l.metaMs) * 100) : 0}%` }} />
        </span>
      </span>
      <span className="px-3 py-2.5 text-right text-foco">{l.sessoes ? formatarPercentual(l.percentualFoco) : '—'}</span>
      <span className="flex flex-col items-start gap-[5px] px-3 py-2.5">
        <span
          className={cn(
            'border-[1.5px] border-contorno px-1.5 py-0.5 text-[0.625rem] font-semibold tracking-[0.06em] uppercase',
            atual ? 'bg-foreground text-background' : cumprida ? 'bg-amarelo text-tinta' : 'bg-transparent',
          )}
        >
          {status}
        </span>
        <span className="text-xs font-normal text-pretty text-muted-foreground">{resultado}</span>
      </span>
    </div>
  )
}
