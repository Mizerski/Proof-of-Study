import { useEffect } from 'react'
import { formatarHorario } from '@/shared/lib/datas'
import { useDados } from '@/store/context/dados-context'
import { definirLembretes } from '@/features/sessao/api/rastreio'

/** Manda ao Rust os blocos de estudo com aviso; ele notifica no minuto em que cada um começa. */
export function useLembretesRotina() {
  const { dados } = useDados()

  useEffect(() => {
    const lista = dados.blocos
      .filter((b) => b.categoria === 'estudo' && b.avisar && b.dias.length > 0)
      .map((b) => {
        const materia = dados.materias.find((m) => m.id === b.materiaId)
        return {
          id: b.id,
          dias: b.dias,
          minuto: b.inicio,
          titulo: materia ? `Hora de estudar: ${materia.nome}` : `Hora de estudar: ${b.titulo}`,
          corpo: `${b.titulo}, das ${formatarHorario(b.inicio)} às ${formatarHorario(b.fim)}. Abra o app e comece o pomodoro.`,
        }
      })
    void definirLembretes(lista)
  }, [dados.blocos, dados.materias])
}
