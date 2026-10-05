import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  currentMonitor,
  getCurrentWindow,
  LogicalSize,
  PhysicalPosition,
  type PhysicalSize,
} from '@tauri-apps/api/window'
import { JanelaContext, type ContextoJanela } from './janela-context'

export const LARGURA_WIDGET = 320
const MARGEM = 24
const MINIMO_NORMAL = new LogicalSize(900, 600)

interface Guardado {
  tamanho: PhysicalSize
  posicao: PhysicalPosition
  maximizada: boolean
}

/** Erros da API de janela (no navegador, fora do Tauri) não podem derrubar a tela. */
async function tentar(acao: () => Promise<unknown>) {
  try {
    await acao()
  } catch (e) {
    console.warn('janela:', e)
  }
}

/**
 * "Virar widget": a mesma janela encolhe para um cartão de 320px no canto da tela, sempre por cima das outras,
 * com o relógio do pomodoro. Restaurar volta ao tamanho e ao lugar de antes.
 */
export function JanelaProvider({ children }: { children: ReactNode }) {
  const [widget, setWidget] = useState(false)
  const guardado = useRef<Guardado | null>(null)
  const altura = useRef(220)

  const virarWidget = useCallback(async () => {
    const janela = getCurrentWindow()
    await tentar(async () => {
      guardado.current = {
        tamanho: await janela.innerSize(),
        posicao: await janela.outerPosition(),
        maximizada: await janela.isMaximized(),
      }
      if (guardado.current.maximizada) await janela.unmaximize()
      await janela.setMinSize(null)
      await janela.setResizable(false)
      await janela.setSize(new LogicalSize(LARGURA_WIDGET, altura.current))
      const monitor = await currentMonitor()
      if (monitor) {
        const escala = monitor.scaleFactor
        const x = monitor.position.x + monitor.size.width - (LARGURA_WIDGET + MARGEM) * escala
        await janela.setPosition(new PhysicalPosition(Math.round(x), Math.round(monitor.position.y + MARGEM * 2 * escala)))
      }
      await janela.setAlwaysOnTop(true)
    })
    setWidget(true)
  }, [])

  const restaurar = useCallback(async () => {
    const janela = getCurrentWindow()
    setWidget(false)
    await tentar(async () => {
      await janela.setAlwaysOnTop(false)
      await janela.setResizable(true)
      await janela.setMinSize(MINIMO_NORMAL)
      const antes = guardado.current
      if (antes) {
        await janela.setSize(antes.tamanho)
        await janela.setPosition(antes.posicao)
        if (antes.maximizada) await janela.toggleMaximize()
      } else {
        await janela.setSize(new LogicalSize(1320, 860))
      }
      await janela.setFocus()
    })
  }, [])

  const ajustarAltura = useCallback(
    (nova: number) => {
      const arredondada = Math.ceil(nova)
      if (arredondada === altura.current) return
      altura.current = arredondada
      if (widget) void tentar(() => getCurrentWindow().setSize(new LogicalSize(LARGURA_WIDGET, arredondada)))
    },
    [widget],
  )

  const valor = useMemo<ContextoJanela>(
    () => ({ widget, virarWidget, restaurar, ajustarAltura }),
    [widget, virarWidget, restaurar, ajustarAltura],
  )
  return <JanelaContext.Provider value={valor}>{children}</JanelaContext.Provider>
}
