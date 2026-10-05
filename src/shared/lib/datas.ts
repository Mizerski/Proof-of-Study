import { addDays, format, parseISO, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/** Data sem hora e sem fuso, `yyyy-MM-dd`. */
export type DataISO = string

export const paraISO = (data: Date): DataISO => format(data, 'yyyy-MM-dd')
export const deISO = (data: DataISO) => parseISO(data)

/** Segunda-feira da semana da data (a semana vai de segunda a domingo). */
export const inicioDaSemana = (data: Date): DataISO => paraISO(startOfWeek(data, { weekStartsOn: 1 }))

export const somarSemanas = (semana: DataISO, n: number): DataISO => paraISO(addDays(deISO(semana), n * 7))

/** "5 a 11 de out." ou "29 de set. a 5 de out." */
export function rotuloSemana(semana: DataISO): string {
  const inicio = deISO(semana)
  const fim = addDays(inicio, 6)
  if (inicio.getMonth() === fim.getMonth()) return `${format(inicio, 'd')} a ${format(fim, "d 'de' MMM", { locale: ptBR })}`
  return `${format(inicio, "d 'de' MMM", { locale: ptBR })} a ${format(fim, "d 'de' MMM", { locale: ptBR })}`
}

/** "segunda, 5 de outubro" */
export const rotuloDia = (data: Date) => format(data, "EEEE, d 'de' MMMM", { locale: ptBR })

/** "seg., 05/10 · 19:02" */
export const formatarDataHora = (ms: number) => format(ms, "EEE, dd/MM '·' HH:mm", { locale: ptBR })

export const formatarHora = (ms: number) => format(ms, 'HH:mm')

/** Minutos do dia (0 a 1440) em "HH:mm". */
export function formatarHorario(minutos: number): string {
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** "HH:mm" em minutos do dia; `null` se inválido. */
export function lerHorario(texto: string): number | null {
  const partes = /^(\d{1,2}):(\d{2})$/.exec(texto)
  if (!partes) return null
  const h = Number(partes[1])
  const m = Number(partes[2])
  return h < 24 && m < 60 ? h * 60 + m : null
}

/** Duração para leitura: "45 min", "1h05", "2h", "30 s". */
export function formatarDuracao(ms: number): string {
  if (ms > 0 && ms < 60_000) return `${Math.max(1, Math.round(ms / 1000))} s`
  const total = Math.round(ms / 60_000)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m} min`
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}

/** Relógio do pomodoro: "24:59" ou "1:02:03". */
export function formatarRelogio(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mmss = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return h ? `${h}:${mmss}` : mmss
}

/** Dias da semana na ordem da tela (segunda primeiro); `dia` segue o `getDay()` (0 = domingo). */
export const DIAS_SEMANA = [
  { dia: 1, curto: 'Seg', letra: 'S', nome: 'Segunda' },
  { dia: 2, curto: 'Ter', letra: 'T', nome: 'Terça' },
  { dia: 3, curto: 'Qua', letra: 'Q', nome: 'Quarta' },
  { dia: 4, curto: 'Qui', letra: 'Q', nome: 'Quinta' },
  { dia: 5, curto: 'Sex', letra: 'S', nome: 'Sexta' },
  { dia: 6, curto: 'Sáb', letra: 'S', nome: 'Sábado' },
  { dia: 0, curto: 'Dom', letra: 'D', nome: 'Domingo' },
] as const

/** Horas e minutos no formato do banco: "1h34", "0h00". */
export function formatarHM(ms: number): string {
  const total = Math.round(ms / 60_000)
  return `${Math.floor(total / 60)}h${String(total % 60).padStart(2, '0')}`
}

/** Meta em horas: "6h" quando é hora cheia, "4h30" quando não. */
export function formatarMeta(ms: number): string {
  const total = Math.round(ms / 60_000)
  return total % 60 ? formatarHM(ms) : `${total / 60}h`
}

/** Horário curto do layout: "17h", "17h30". */
export function formatarHoraCurta(minutos: number): string {
  const h = Math.floor(minutos / 60) % 24
  const m = minutos % 60
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}
