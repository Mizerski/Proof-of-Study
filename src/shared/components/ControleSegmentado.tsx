import type { KeyboardEvent, ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export interface OpcaoSegmentada<T extends string> {
  valor: T
  rotulo: ReactNode
  /** Fundo da opção quando ativa, no lugar do preto (ex.: `bg-azul text-sobre-bloco` para entradas). */
  corAtiva?: string
}

interface ControleSegmentadoProps<T extends string> {
  /** Nome acessível do grupo. */
  rotulo: string
  valor: T
  opcoes: OpcaoSegmentada<T>[]
  onChange: (valor: T) => void
  id?: string
  desabilitado?: boolean
  className?: string
}

/** Grupo de opções exclusivas: faixa com contorno preto, divisórias entre as opções e a ativa em bloco preto. */
export function ControleSegmentado<T extends string>({
  rotulo,
  valor,
  opcoes,
  onChange,
  id,
  desabilitado,
  className,
}: ControleSegmentadoProps<T>) {
  function aoTeclar(e: KeyboardEvent<HTMLDivElement>) {
    const passo = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!passo) return
    e.preventDefault()
    const atual = opcoes.findIndex((o) => o.valor === valor)
    const proximo = (atual + passo + opcoes.length) % opcoes.length
    onChange(opcoes[proximo].valor)
    e.currentTarget.querySelectorAll<HTMLButtonElement>('[role=radio]')[proximo]?.focus()
  }

  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={rotulo}
      onKeyDown={aoTeclar}
      className={cn('flex border-2 border-contorno bg-card', className)}
    >
      {opcoes.map((o) => {
        const ativo = o.valor === valor
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            tabIndex={ativo ? 0 : -1}
            disabled={desabilitado}
            onClick={() => onChange(o.valor)}
            className={cn(
              'flex min-h-9 flex-1 items-center justify-center gap-1.5 border-l-2 border-contorno px-3 py-1.5 text-xs font-semibold tracking-[0.06em] whitespace-nowrap uppercase transition-colors outline-none first:border-l-0 hover:bg-amarelo hover:text-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50',
              ativo && (o.corAtiva ?? 'bg-foreground text-background hover:bg-foreground hover:text-background'),
            )}
          >
            {o.rotulo}
          </button>
        )
      })}
    </div>
  )
}
