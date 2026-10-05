import type { CorForma, TipoForma } from '@/shared/lib/formas'
import { cn } from '@/shared/lib/utils'
import { Forma } from './Forma'

interface Celula {
  /** Fundo do bloco. */
  fundo?: string
  forma?: TipoForma
  cor?: CorForma
  /** Giro da forma, para variar a composição. */
  giro?: string
}

/** Grade 4×4 de cartaz: blocos de cor e formas primárias, como nos cartazes da Bauhaus. */
const CELULAS: Celula[] = [
  { fundo: 'bg-vermelho' },
  { forma: 'circulo', cor: 'azul' },
  { forma: 'quarto', cor: 'amarelo' },
  { fundo: 'bg-tinta text-background', forma: 'circulo', cor: 'tinta', giro: 'scale-50' },
  { forma: 'triangulo', cor: 'tinta' },
  { fundo: 'bg-amarelo' },
  { forma: 'semicirculo', cor: 'vermelho' },
  {},
  {},
  { forma: 'quarto', cor: 'azul', giro: 'rotate-90' },
  { fundo: 'bg-azul', forma: 'circulo', cor: 'amarelo', giro: 'scale-75' },
  { forma: 'quadrado', cor: 'vermelho', giro: 'scale-50' },
  { forma: 'semicirculo', cor: 'tinta', giro: 'rotate-180' },
  {},
  { forma: 'circulo', cor: 'vermelho' },
  { fundo: 'bg-tinta' },
]

/** Decorativa. No celular mostra só a primeira faixa; a grade inteira aparece a partir de `lg`. */
export function Composicao({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('grid grid-cols-4 gap-0.5 bg-contorno p-0.5', className)}>
      {CELULAS.map((c, i) => (
        <div
          key={i}
          className={cn('relative aspect-square overflow-hidden bg-card', c.fundo, i >= 4 && 'hidden lg:block')}
        >
          {c.forma && c.cor && <Forma forma={c.forma} cor={c.cor} className={cn('absolute inset-0 size-full', c.giro)} />}
        </div>
      ))}
    </div>
  )
}
