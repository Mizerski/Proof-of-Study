import { cn } from '@/shared/lib/utils'

/** Faixa de 8px com as três primárias, separadas por contorno: topo de avisos, popovers e do widget. */
export function FaixaPrimarias({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('flex h-2 shrink-0 border-b-2 border-contorno', className)}>
      <span className="flex-1 bg-vermelho" />
      <span className="flex-1 border-l-2 border-contorno bg-azul" />
      <span className="flex-1 border-l-2 border-contorno bg-amarelo" />
    </div>
  )
}
