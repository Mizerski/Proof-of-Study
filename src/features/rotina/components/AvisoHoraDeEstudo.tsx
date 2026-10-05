import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { FaixaPrimarias } from '@/shared/components/FaixaPrimarias'
import { useAgora } from '@/shared/hooks/useAgora'
import { formatarHM, formatarHoraCurta, inicioDaSemana, paraISO } from '@/shared/lib/datas'
import { BOTAO, ROTULO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { useDados } from '@/store/context/dados-context'
import { saldoDaMateria } from '@/features/banco/utils/banco'
import { useSessao } from '@/features/sessao/context/sessao-context'
import { estudoDeHoje } from '../utils/rotina'

const ADIAR_MS = 10 * 60_000

/**
 * "Hora do estudo": aparece dentro do app enquanto um bloco de estudo da rotina está acontecendo e não há
 * pomodoro. Fecha por hoje no ✕ ou volta em 10 min. (Com o app escondido, quem avisa é a notificação do sistema.)
 */
export function AvisoHoraDeEstudo() {
  const { dados } = useDados()
  const { etapa, iniciar } = useSessao()
  const navigate = useNavigate()
  const agora = useAgora(15_000)
  const [fechados, setFechados] = useState<Record<string, number>>({})
  const { atual } = estudoDeHoje(dados.blocos, agora)
  if (!atual || etapa !== 'pronto') return null

  const chave = `${atual.bloco.id}@${paraISO(agora)}`
  if ((fechados[chave] ?? 0) > agora.getTime()) return null

  const materia = dados.materias.find((m) => m.id === atual.bloco.materiaId)
  const saldo = materia ? saldoDaMateria(dados, materia, inicioDaSemana(agora)) : null
  const faltam = saldo?.meta ? Math.max(0, saldo.meta.minutos * 60_000 - saldo.noBancoMs) : null
  const fechar = (ate: number) => setFechados((f) => ({ ...f, [chave]: ate }))

  async function comecar() {
    const materiaId = materia?.id ?? dados.materias.find((m) => !m.arquivada)?.id
    if (!materiaId) return void navigate({ to: '/banco' })
    await iniciar(materiaId, dados.preferencias.duracaoMin)
    void navigate({ to: '/sessao' })
  }

  return (
    <div role="status" className="absolute right-6 bottom-6 z-40 w-[330px] border-2 border-contorno bg-card shadow-bloco-lg">
      <FaixaPrimarias />
      <div className="flex flex-col gap-2 px-3.5 py-3">
        <div className="flex items-center justify-between">
          <span className={cn(ROTULO, 'text-muted-foreground')}>Proof of Study · agora</span>
          <button
            type="button"
            aria-label="Fechar por hoje"
            onClick={() => fechar(Number.MAX_SAFE_INTEGER)}
            className="text-sm leading-none hover:text-vermelho"
          >
            ✕
          </button>
        </div>
        <p className="font-heading text-xl leading-tight font-extrabold uppercase">
          {formatarHoraCurta(atual.bloco.inicio)} · Hora do estudo
        </p>
        <p className="text-[0.8125rem]">
          {materia?.nome ?? atual.bloco.titulo}
          {saldo?.meta?.descricao && `, ${saldo.meta.descricao.toLowerCase()}`}.
          {faltam !== null && (
            <>
              {' '}
              Faltam <b>{formatarHM(faltam)}</b> na meta da semana.
            </>
          )}
        </p>
        <div className="flex gap-2.5 pt-0.5">
          <Button className={cn(BOTAO, 'h-9 px-3 text-[0.6875rem]')} onClick={() => void comecar()}>
            Iniciar pomodoro
          </Button>
          <Button variant="outline" className={cn(BOTAO, 'h-9 px-3 text-[0.6875rem]')} onClick={() => fechar(Date.now() + ADIAR_MS)}>
            Em 10 min
          </Button>
        </div>
      </div>
    </div>
  )
}
