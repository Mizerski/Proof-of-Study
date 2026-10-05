import { Forma } from './Forma'

/** Nome do app com as três formas primárias: header e telas avulsas (login, carregamento). */
export function Marca() {
  return (
    <span className="flex items-center gap-2 whitespace-nowrap sm:gap-2.5">
      <span aria-hidden className="flex items-end gap-0.5">
        <Forma forma="quadrado" cor="vermelho" className="size-3.5 sm:size-[1.125rem]" />
        <Forma forma="circulo" cor="azul" className="size-3.5 sm:size-[1.125rem]" />
        <Forma forma="triangulo" cor="amarelo" className="size-3.5 sm:size-[1.125rem]" />
      </span>
      <span className="flex flex-col font-heading text-xs leading-[0.95] font-extrabold tracking-[-0.01em] uppercase sm:text-sm">
        <span>Proof of</span>
        <span>Study</span>
      </span>
    </span>
  )
}
