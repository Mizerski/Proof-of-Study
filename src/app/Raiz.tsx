import { RouterProvider } from '@tanstack/react-router'
import { SessaoProvider } from '@/features/sessao/context/SessaoProvider'
import { useLembretesRotina } from '@/features/rotina/hooks/useLembretesRotina'
import { DadosProvider } from '@/store/context/DadosProvider'
import { JanelaProvider } from './janela/JanelaProvider'
import { router } from './router'

/** Dados num arquivo local, o pomodoro (que roda no Rust), o modo widget e os lembretes valem para o app inteiro. */
export function Raiz() {
  return (
    <DadosProvider>
      <SessaoProvider>
        <JanelaProvider>
          <Lembretes />
          <RouterProvider router={router} />
        </JanelaProvider>
      </SessaoProvider>
    </DadosProvider>
  )
}

function Lembretes() {
  useLembretesRotina()
  return null
}
