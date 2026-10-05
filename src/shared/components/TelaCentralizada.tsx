import type { ReactNode } from 'react'
import { Composicao } from '@/shared/components/Composicao'
import { Marca } from '@/shared/components/Marca'
import { TITULO_PAGINA } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'

interface TelaCentralizadaProps {
  titulo: string
  descricao?: ReactNode
  children?: ReactNode
}

/** Tela avulsa, fora do layout do app (login, carregamento, erros): cartaz geométrico ao lado de um bloco só. */
export function TelaCentralizada({ titulo, descricao, children }: TelaCentralizadaProps) {
  return (
    <div className="grid min-h-svh grid-rows-[auto_1fr] bg-background lg:grid-cols-2 lg:grid-rows-1">
      <div className="overflow-hidden border-b-2 border-contorno lg:sticky lg:top-0 lg:flex lg:h-svh lg:items-center lg:border-r-2 lg:border-b-0">
        <Composicao className="w-full" />
      </div>
      <div className="papel-pontilhado flex items-start justify-center p-4 pt-8 lg:items-center lg:pt-4">
        <div className="flex w-full max-w-sm flex-col gap-5 border-2 border-contorno bg-card p-5 shadow-bloco-lg sm:p-6">
          <Marca />
          <div className="flex flex-col gap-2">
            <h1 className={cn(TITULO_PAGINA, 'text-[1.75rem] sm:text-[2rem]')}>{titulo}</h1>
            {descricao && <div className="text-sm text-muted-foreground">{descricao}</div>}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
