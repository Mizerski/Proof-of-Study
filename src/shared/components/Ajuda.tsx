import type { ReactNode } from 'react'
import { CAMADA } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from '@/shared/ui/popover'

interface AjudaProps {
  /** Assunto da explicação: título do popover e nome acessível do botão. */
  titulo: string
  /** Popover mais largo, para legendas e listas. */
  largo?: boolean
  className?: string
  children: ReactNode
}

/**
 * Explicação que só aparece quando a pessoa pede: botão "?" que abre um popover (clique, toque ou teclado).
 * Guarda o "como funciona" e as legendas, para a tela mostrar de cara só a conclusão e os números.
 */
export function Ajuda({ titulo, largo, className, children }: AjudaProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('size-7 rounded-full border-2 border-contorno text-[0.8125rem] font-semibold hover:bg-amarelo hover:text-tinta aria-expanded:bg-amarelo aria-expanded:text-tinta', className)}
          aria-label={`Entenda: ${titulo}`}
        >
          ?
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        collisionPadding={16}
        className={cn(CAMADA, 'max-w-[calc(100vw-2rem)] gap-3', largo ? 'w-[26rem]' : 'w-80')}
      >
        <PopoverHeader>
          <PopoverTitle>{titulo}</PopoverTitle>
        </PopoverHeader>
        <div className="flex flex-col gap-2 text-sm text-foreground">{children}</div>
      </PopoverContent>
    </Popover>
  )
}
