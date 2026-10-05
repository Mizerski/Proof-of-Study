import { format } from 'date-fns'
import { DIAS_SEMANA, formatarHora } from '@/shared/lib/datas'

/** "Qua 07/10 · 17:00–17:25" */
export function rotuloDaSessao(inicio: number, fim: number) {
  const dia = DIAS_SEMANA.find((d) => d.dia === new Date(inicio).getDay())?.curto
  return `${dia} ${format(inicio, 'dd/MM')} · ${formatarHora(inicio)}–${formatarHora(fim)}`
}
