import type { ReactNode } from 'react'
import { formatarDuracao } from '@/shared/lib/datas'
import { cn } from '@/shared/lib/utils'
import type { Tipo } from '@/store/model/dados'
import type { Faixa, Grupo } from '../utils/resumo'

/** Cor de cada tipo: quadradinho e barra, e texto. */
export const COR_TIPO: Record<Tipo, { bloco: string; texto: string }> = {
  estudo: { bloco: 'bg-azul', texto: 'text-foco' },
  fora: { bloco: 'bg-vermelho', texto: 'text-fora' },
  ignorar: { bloco: 'bg-muted', texto: 'text-muted-foreground' },
}

export function PontoTipo({ tipo, className }: { tipo: Tipo; className?: string }) {
  return <span aria-hidden className={cn('size-2.5 shrink-0 border-[1.5px] border-contorno', COR_TIPO[tipo].bloco, className)} />
}

/**
 * Linha do tempo em blocos (estudo azul, fora vermelho, ignorado cinza), separados por réguas pretas.
 * Com `totalMs`, a largura é relativa ao pomodoro inteiro e o resto fica vazio; sem ele, ocupa tudo.
 */
export function BarraFaixas({ faixas, totalMs, className }: { faixas: Faixa[]; totalMs?: number; className?: string }) {
  const base = totalMs ?? faixas.reduce((s, f) => s + f.ms, 0)
  return (
    <div aria-hidden className={cn('flex gap-0.5 border-2 border-contorno bg-contorno', className)}>
      {base > 0 &&
        faixas.map((f, i) => (
          <span key={i} className={cn('shrink-0', COR_TIPO[f.tipo].bloco)} style={{ width: `calc(${(f.ms / base) * 100}% - 2px)` }} />
        ))}
      {totalMs !== undefined && <span className="flex-1 bg-muted" />}
    </div>
  )
}

/** O título de janela mais usado do grupo, com quantas outras janelas ele junta. */
export function tituloDoGrupo(grupo: Grupo): string {
  const principal = grupo.titulos[0]?.titulo ?? grupo.rotulo
  const outras = grupo.titulos.length - 1
  return outras > 0 ? `${principal} (+${outras} ${outras === 1 ? 'janela' : 'janelas'})` : principal
}

/** Linha de "para onde foi o tempo": quadradinho, título da janela e o tempo na cor do tipo. */
export function LinhaGrupo({ grupo, compacto, children }: { grupo: Grupo; compacto?: boolean; children?: ReactNode }) {
  return (
    <div className={cn('flex items-center gap-2.5 border-b border-border', compacto ? 'py-1.5' : 'px-3.5 py-2 hover:bg-foreground/5')}>
      <PontoTipo tipo={grupo.tipo} />
      <span className={cn('min-w-0 flex-1 truncate', compacto ? 'text-xs' : 'text-[0.8125rem]')} title={grupo.titulos.map((t) => t.titulo).join('\n')}>
        {tituloDoGrupo(grupo)}
      </span>
      {children}
      <span className={cn('text-right font-semibold tabular-nums', compacto ? 'text-xs' : 'w-16 text-[0.8125rem]', COR_TIPO[grupo.tipo].texto)}>
        {formatarDuracao(grupo.ms)}
      </span>
    </div>
  )
}
