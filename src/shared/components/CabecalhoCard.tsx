import type { ReactNode } from 'react'
import { TITULO_CARD } from '@/shared/lib/estilos'
import type { FormaDaPagina } from '@/shared/lib/formas'
import { cn } from '@/shared/lib/utils'
import { Forma } from './Forma'

interface CabecalhoCardProps {
  titulo: ReactNode
  /** Cor do bloco de 44px à esquerda (`bg-amarelo`, `bg-azul`, `bg-foreground`…). */
  faixa: string
  /** Forma no meio do bloco (ex.: meia-lua preta sobre o amarelo). */
  forma: FormaDaPagina
  /** Quantidade de itens, num bloco preto à direita. */
  contagem?: number
  /** Botão "?" (`Ajuda`) ou outras ações à direita. */
  acoes?: ReactNode
}

/** Cabeçalho de card: bloco de cor com a forma, título em caixa alta e régua preta embaixo. */
export function CabecalhoCard({ titulo, faixa, forma, contagem, acoes }: CabecalhoCardProps) {
  return (
    <header className="flex items-stretch border-b-2 border-contorno">
      <span aria-hidden className={cn('flex w-11 shrink-0 items-center justify-center border-r-2 border-contorno', faixa)}>
        <Forma {...forma} className={forma.forma === 'semicirculo' ? 'w-[1.125rem]' : 'size-4'} />
      </span>
      <h2 className={cn(TITULO_CARD, 'flex-1 px-3.5 py-2.5')}>{titulo}</h2>
      {contagem !== undefined && (
        <span className="mx-3 my-2 flex h-7 min-w-7 items-center justify-center self-center bg-foreground px-1.5 text-xs font-semibold text-background tabular-nums">
          {contagem}
        </span>
      )}
      {acoes && <div className="flex items-center gap-1 pr-2.5">{acoes}</div>}
    </header>
  )
}
