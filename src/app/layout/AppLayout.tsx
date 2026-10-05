import { useEffect, useRef } from 'react'
import { Outlet, useNavigate } from '@tanstack/react-router'
import { AvisoHoraDeEstudo } from '@/features/rotina/components/AvisoHoraDeEstudo'
import { useSessao, type Etapa } from '@/features/sessao/context/sessao-context'
import { Widget } from '@/features/sessao/components/Widget'
import { useJanela } from '../janela/janela-context'
import { BarraLateral } from './BarraLateral'
import { BarraTitulo } from './BarraTitulo'

/** Layout 1a: barra de título, barra lateral com as telas e a meta, e a tela aberta à direita. */
export function AppLayout() {
  const { widget, restaurar } = useJanela()
  const { etapa } = useSessao()
  const navigate = useNavigate()
  const etapaAnterior = useRef<Etapa | null>(null)

  // Quando o pomodoro acaba (pelo tempo ou no widget), a janela volta e abre o resumo.
  useEffect(() => {
    const antes = etapaAnterior.current
    etapaAnterior.current = etapa
    if (etapa === 'resumo' && (antes === 'rodando' || antes === 'pausado')) {
      if (widget) void restaurar()
      void navigate({ to: '/sessao' })
    }
  }, [etapa, widget, restaurar, navigate])

  if (widget) return <Widget />

  return (
    <div className="flex h-svh flex-col overflow-hidden border-2 border-contorno bg-background text-foreground tabular-nums">
      <BarraTitulo />
      <div className="flex min-h-0 flex-1">
        <BarraLateral />
        <main className="relative min-w-0 flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
      <AvisoHoraDeEstudo />
    </div>
  )
}
