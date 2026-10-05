import type { ReactNode } from 'react'
import { TITULO_DIALOG } from '@/shared/lib/estilos'
import { Forma } from './Forma'

/** Mensagem centralizada para listas sem itens, com as três formas primárias fora de ordem. */
export function EstadoVazio({ titulo, descricao, acao }: { titulo: string; descricao?: ReactNode; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-12 text-center">
      <span aria-hidden className="flex items-end gap-1 opacity-90">
        <Forma forma="circulo" cor="azul" className="size-6" />
        <Forma forma="triangulo" cor="amarelo" className="size-8" />
        <Forma forma="quadrado" cor="vermelho" className="size-5" />
      </span>
      <div className="flex flex-col gap-1.5">
        <p className={TITULO_DIALOG}>{titulo}</p>
        {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {acao}
    </div>
  )
}
