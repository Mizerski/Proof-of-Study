/** Cores oferecidas para as matérias: as primárias e famílias da paleta Bauhaus (sempre com contorno preto). */
export const CORES_MATERIA = [
  { hex: '#1f45c4', nome: 'Azul' },
  { hex: '#d7322a', nome: 'Vermelho' },
  { hex: '#f5c518', nome: 'Amarelo', clara: true },
  { hex: '#1d1c1a', nome: 'Preto' },
  { hex: '#ee7a1a', nome: 'Laranja', clara: true },
  { hex: '#2e8b4e', nome: 'Verde' },
  { hex: '#157a86', nome: 'Petróleo' },
  { hex: '#6c3fb5', nome: 'Violeta' },
  { hex: '#c2378f', nome: 'Magenta' },
  { hex: '#5b9be0', nome: 'Celeste', clara: true },
  { hex: '#7a4a26', nome: 'Marrom' },
  { hex: '#6b6e78', nome: 'Grafite' },
] as const

export function proximaCorLivre(emUso: string[]): string {
  return CORES_MATERIA.find((c) => !emUso.includes(c.hex))?.hex ?? CORES_MATERIA[0].hex
}
