import { cn } from '@/shared/lib/utils'

/**
 * Quadradinho com a cor de uma categoria, tag ou pasta (a cor é dado do usuário, por isso vem inline).
 * O contorno preto deixa as cores claras visíveis no papel, como nas legendas dos gráficos.
 */
export function PontoCor({ cor, className }: { cor: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-block size-2.5 shrink-0 border-[1.5px] border-contorno', className)}
      style={{ backgroundColor: cor }}
    />
  )
}
