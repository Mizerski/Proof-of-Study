import { cn } from '@/shared/lib/utils'
import type { Tipo } from '@/store/model/dados'
import { ROTULO_TIPO } from '@/features/sessao/utils/classificacao'

const COR_ATIVA: Record<Tipo, string> = {
  estudo: 'bg-azul text-sobre-bloco',
  fora: 'bg-vermelho text-sobre-bloco',
  ignorar: 'bg-foreground text-background',
}

/** Estudo / Fora do estudo / Ignorar, em blocos colados; a opção ativa ganha a cor do tipo. */
export function SeletorTipo({ valor, onChange, rotulo }: { valor?: Tipo; onChange: (tipo: Tipo) => void; rotulo: string }) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="flex shrink-0 border-2 border-contorno">
      {(['estudo', 'fora', 'ignorar'] as const).map((tipo) => {
        const ativo = tipo === valor
        return (
          <button
            key={tipo}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => onChange(tipo)}
            className={cn(
              'flex h-8 items-center px-3 text-[0.6875rem] font-semibold tracking-[0.06em] uppercase outline-none not-first:border-l-2 not-first:border-contorno focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
              ativo ? COR_ATIVA[tipo] : 'hover:bg-amarelo hover:text-tinta',
            )}
          >
            {ROTULO_TIPO[tipo]}
          </button>
        )
      })}
    </div>
  )
}
