import type { ReactNode } from 'react'
import type { FormaDaPagina } from '@/shared/lib/formas'
import { ROTULO, TITULO_PAGINA } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Forma } from './Forma'

interface CabecalhoPaginaProps {
  /** Título em caixa alta; a parte em `<span>` sai em peso leve ("Rotina <span>5–11 out</span>"). */
  titulo: ReactNode
  /** Forma da tela, a mesma do menu. */
  forma: FormaDaPagina
  /** Trilha em cima do título ("Inglês › Etapa 4 · 5 a 11 out"). */
  trilha?: ReactNode
  /** Botão "?" ao lado do título (`Ajuda`). */
  ajuda?: ReactNode
  acoes?: ReactNode
}

/** Trilha pequena, forma com contorno e título de cartaz; ações à direita e régua preta fechando o bloco. */
export function CabecalhoPagina({ titulo, forma, trilha, ajuda, acoes }: CabecalhoPaginaProps) {
  return (
    <div className="flex items-end justify-between gap-3 border-b-2 border-contorno pb-3">
      <div className="flex min-w-0 flex-col gap-1.5">
        {trilha && <span className={cn(ROTULO, 'truncate text-muted-foreground')}>{trilha}</span>}
        <div className="flex items-center gap-3">
          <Forma {...forma} contorno className="size-[1.375rem]" />
          <h1 className={cn(TITULO_PAGINA, '[&>span]:font-light')}>{titulo}</h1>
          {ajuda}
        </div>
      </div>
      {acoes && <div className="flex shrink-0 items-center gap-3">{acoes}</div>}
    </div>
  )
}
