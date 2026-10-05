import type { ReactNode } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { Forma } from '@/shared/components/Forma'
import { cn } from '@/shared/lib/utils'
import { useTema } from '@/features/tema/hooks/useTema'
import { useJanela } from '../janela/janela-context'

/**
 * Barra de título do app (a do sistema fica escondida): a marca, que também arrasta a janela, e os botões
 * em blocos. O primeiro vira widget; fechar esconde na bandeja, e o pomodoro continua.
 */
export function BarraTitulo() {
  const { virarWidget } = useJanela()
  const { tema, escolherTema } = useTema()
  const janela = () => getCurrentWindow()
  const escuro = tema === 'escuro'

  return (
    <div data-tauri-drag-region className="flex h-[38px] shrink-0 items-center justify-between border-b-2 border-contorno bg-card">
      <div data-tauri-drag-region className="flex items-center gap-2.5 pl-3">
        <span aria-hidden className="pointer-events-none flex items-center gap-[3px]">
          <Forma forma="quadrado" cor="vermelho" className="size-[11px]" />
          <Forma forma="circulo" cor="azul" className="size-[11px]" />
          <Forma forma="triangulo" cor="amarelo" className="h-[11px] w-3" />
        </span>
        <span className="pointer-events-none font-heading text-[0.8125rem] font-extrabold tracking-[0.04em] uppercase">
          Proof of Study
        </span>
      </div>
      <div className="flex h-full">
        <BotaoJanela rotulo={escuro ? 'Usar tema claro' : 'Usar tema escuro'} onClick={() => escolherTema(escuro ? 'claro' : 'escuro')}>
          <span
            aria-hidden
            className={cn('size-3 rounded-full border-2 border-current', escuro ? 'bg-transparent' : 'bg-current')}
          />
        </BotaoJanela>
        <BotaoJanela rotulo="Virar widget" onClick={() => void virarWidget()}>
          <span aria-hidden className="h-0.5 w-3 bg-current" />
        </BotaoJanela>
        <BotaoJanela rotulo="Maximizar" onClick={() => void janela().toggleMaximize()}>
          <span aria-hidden className="size-[11px] border-2 border-current" />
        </BotaoJanela>
        <BotaoJanela rotulo="Fechar (continua na bandeja)" onClick={() => void janela().close()} perigo>
          <span aria-hidden className="text-sm leading-none">✕</span>
        </BotaoJanela>
      </div>
    </div>
  )
}

function BotaoJanela({ rotulo, onClick, perigo, children }: { rotulo: string; onClick: () => void; perigo?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      title={rotulo}
      aria-label={rotulo}
      onClick={onClick}
      className={cn(
        'flex w-[46px] items-center justify-center border-l-2 border-contorno outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
        perigo ? 'hover:bg-vermelho hover:text-sobre-bloco' : 'hover:bg-amarelo hover:text-tinta',
      )}
    >
      {children}
    </button>
  )
}
