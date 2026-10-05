import { useState } from 'react'
import { CabecalhoCard } from '@/shared/components/CabecalhoCard'
import { formatarDuracao } from '@/shared/lib/datas'
import { cn } from '@/shared/lib/utils'
import type { Sessao } from '@/store/model/dados'
import { rotuloDaSessao } from '@/features/sessao/utils/rotulos'
import { temAnotacao } from '@/features/sessao/utils/resumo'
import { CARTAO } from '@/shared/lib/estilos'
import { DialogSessao } from './DialogSessao'

/** As sessões da semana com a evidência de cada uma (anotação e imagens) e a barra de foco e fora. */
export function CardSessoes({ sessoes }: { sessoes: Sessao[] }) {
  const [aberta, setAberta] = useState<Sessao | null>(null)

  return (
    <div className={CARTAO}>
      <CabecalhoCard titulo="Sessões e evidências" faixa="bg-azul" forma={{ forma: 'circulo', cor: 'papel' }} contagem={sessoes.length} />
      {sessoes.length === 0 && <p className="px-4 py-3 text-sm text-muted-foreground">Nenhuma sessão nesta semana ainda.</p>}
      {sessoes.map((s) => {
        const [dia, horario] = rotuloDaSessao(s.inicio, s.fim).split(' · ')
        const total = s.focoMs + s.foraMs
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => setAberta(s)}
            className="grid w-full grid-cols-[120px_minmax(0,1fr)_180px] items-start gap-[18px] border-t border-border px-4 py-3 text-left outline-none hover:bg-foreground/5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
          >
            <span className="flex flex-col gap-0.5">
              <span className="text-[0.8125rem] font-semibold">{dia}</span>
              <span className="text-xs text-muted-foreground">{horario}</span>
            </span>
            <span className="text-[0.8125rem] leading-normal text-pretty">
              {temAnotacao(s) ? (
                s.anotacao || <span className="text-muted-foreground">Só imagens.</span>
              ) : (
                <span className="font-semibold text-fora">Sem anotação: fora do banco. Clique para anotar.</span>
              )}
              {s.imagens.length > 0 && (
                <span className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span aria-hidden className="h-2.5 w-3 border-[1.5px] border-contorno" />
                  {s.imagens.length === 1 ? '1 imagem' : `${s.imagens.length} imagens`}
                </span>
              )}
            </span>
            <span className="flex flex-col gap-1.5">
              <span aria-hidden className="flex h-3 gap-0.5 border-2 border-contorno bg-contorno">
                <span className="bg-azul" style={{ width: `${total ? (s.focoMs / total) * 100 : 0}%` }} />
                <span className={cn('flex-1', s.foraMs > 0 ? 'bg-vermelho' : 'bg-muted')} />
              </span>
              <span className="flex justify-between text-xs font-medium">
                <span className="text-foco">{formatarDuracao(s.focoMs)}</span>
                <span className="text-fora">{formatarDuracao(s.foraMs)} fora</span>
              </span>
            </span>
          </button>
        )
      })}
      <DialogSessao sessao={aberta} onClose={() => setAberta(null)} />
    </div>
  )
}
