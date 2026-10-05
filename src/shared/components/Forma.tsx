import type { CorForma, TipoForma } from '@/shared/lib/formas'
import { cn } from '@/shared/lib/utils'

const COR: Record<CorForma, string> = {
  vermelho: 'bg-vermelho',
  azul: 'bg-azul',
  amarelo: 'bg-amarelo',
  papel: 'bg-sobre-bloco',
  tinta: 'bg-current',
}

const FORMATO: Record<TipoForma, string> = {
  quadrado: '',
  circulo: 'rounded-full',
  triangulo: '[clip-path:polygon(50%_0,100%_100%,0_100%)]',
  semicirculo: 'rounded-t-full !h-auto aspect-[2/1]',
  quarto: 'rounded-tl-full',
}

interface FormaProps {
  forma: TipoForma
  cor: CorForma
  /** Contorno preto de 2px (formas de título de página). O triângulo não leva contorno. */
  contorno?: boolean
  /** Tamanho (`size-*`) e posição. A meia-lua usa a largura e fica com metade da altura. */
  className?: string
}

/** Forma geométrica da Bauhaus: identifica cada tela no menu e no título, e compõe a marca. Decorativa. */
export function Forma({ forma, cor, contorno, className }: FormaProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block size-3 shrink-0',
        COR[cor],
        FORMATO[forma],
        contorno && forma !== 'triangulo' && 'border-2 border-contorno',
        contorno && forma === 'semicirculo' && 'border-b-0',
        className,
      )}
    />
  )
}
