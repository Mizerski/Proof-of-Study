import { Link } from '@tanstack/react-router'
import { Forma } from '@/shared/components/Forma'
import { formatarHM, formatarMeta, inicioDaSemana } from '@/shared/lib/datas'
import { ROTULO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { useDados } from '@/store/context/dados-context'
import { saldoDaMateria } from '@/features/banco/utils/banco'
import { useSessao } from '@/features/sessao/context/sessao-context'
import { ITENS_MENU } from './itens-menu'

/** Layout 1a: abas em bloco, uma por tela, e o cartão da meta da semana no rodapé. */
export function BarraLateral() {
  const { etapa } = useSessao()
  return (
    <nav className="flex w-[220px] shrink-0 flex-col gap-2.5 border-r-2 border-contorno p-4">
      {ITENS_MENU.map(({ to, rotulo, forma }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact: true, includeSearch: false }}
          className="flex h-10 items-center gap-2.5 border-2 border-contorno px-3 text-xs font-semibold tracking-[0.06em] uppercase transition-[color,background-color,box-shadow,translate] duration-100 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          inactiveProps={{
            className:
              'bg-card text-foreground shadow-bloco-sm hover:bg-amarelo hover:text-tinta active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
          }}
          activeProps={{ className: 'bg-foreground text-background translate-x-[2px] translate-y-[2px]' }}
        >
          <Forma
            {...forma}
            className={forma.forma === 'semicirculo' ? 'w-3.5' : 'size-3.5'}
          />
          <span className="flex-1">{rotulo}</span>
          {to === '/sessao' && etapa === 'rodando' && (
            <span aria-label="Sessão em andamento" className="size-2 border-[1.5px] border-contorno bg-vermelho" />
          )}
        </Link>
      ))}
      <div className="flex-1" />
      <MetaDaSemana />
    </nav>
  )
}

/** Soma de todas as metas da semana: o que já entrou no banco e o total esperado. */
function MetaDaSemana() {
  const { dados } = useDados()
  const semana = inicioDaSemana(new Date())
  const saldos = dados.materias.map((m) => saldoDaMateria(dados, m, semana)).filter((s) => s.meta)
  const noBanco = saldos.reduce((s, x) => s + x.noBancoMs, 0)
  const meta = saldos.reduce((s, x) => s + (x.meta?.minutos ?? 0) * 60_000, 0)

  return (
    <Link
      to="/banco"
      className="block border-2 border-contorno bg-card shadow-bloco outline-none hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
    >
      <span className="flex h-7 items-center justify-center border-b-2 border-contorno bg-amarelo">
        <Forma forma="semicirculo" cor="tinta" className="w-4 text-tinta" />
      </span>
      <span className="flex flex-col gap-1 px-3 py-2.5">
        <span className={cn(ROTULO, 'text-muted-foreground')}>Meta da semana</span>
        {meta > 0 ? (
          <>
            <span className="font-heading text-2xl leading-none font-extrabold tabular-nums">
              {formatarHM(noBanco)} <span className="text-base font-light">/ {formatarMeta(meta)}</span>
            </span>
            <span className="mt-1 h-2.5 border-2 border-contorno bg-muted">
              <span className="block h-full bg-amarelo" style={{ width: `${Math.min(100, (noBanco / meta) * 100)}%` }} />
            </span>
          </>
        ) : (
          <span className="text-sm">Sem meta ainda. Defina no Banco de horas.</span>
        )}
      </span>
    </Link>
  )
}
