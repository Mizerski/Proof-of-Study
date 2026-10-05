import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

interface CaixaDestaqueProps {
  /** Fundo suave (`bg-economia-suave`, `bg-risco-3-suave`…). */
  fundo?: string
  /** Cor da faixa grossa à esquerda (`border-l-amarelo`, `border-l-risco-3`…). */
  faixa?: string
  className?: string
  children: ReactNode
}

/**
 * A mensagem principal de um card: bloco com contorno preto, fundo suave e faixa de cor à esquerda.
 * O texto fica em preto (não no cinza secundário), com os números e as conclusões em negrito.
 */
export function CaixaDestaque({ fundo = 'bg-muted/60', faixa = 'border-l-contorno', className, children }: CaixaDestaqueProps) {
  return (
    <div className={cn('flex flex-col gap-2 border-2 border-l-8 border-contorno px-3 py-2.5 text-sm text-foreground', fundo, faixa, className)}>
      {children}
    </div>
  )
}
