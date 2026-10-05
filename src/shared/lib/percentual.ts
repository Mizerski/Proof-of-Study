/** Parte de um total, de 0 a 1; total zero dá 0. */
export const fracao = (parte: number, total: number) => (total > 0 ? parte / total : 0)

export const formatarPercentual = (valor: number) => `${Math.round(valor * 100)}%`
