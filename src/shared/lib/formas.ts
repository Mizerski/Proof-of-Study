export type TipoForma = 'quadrado' | 'circulo' | 'triangulo' | 'semicirculo' | 'quarto'

/** `papel` é a cor de `--sobre-bloco`, para formas sobre blocos de cor e o item ativo (papel no claro, tinta no escuro). `tinta` usa a cor do texto em volta: fica preta no papel e vira papel no item ativo (preto). */
export type CorForma = 'vermelho' | 'azul' | 'amarelo' | 'papel' | 'tinta'

export interface FormaDaPagina {
  forma: TipoForma
  cor: CorForma
}

/** Forma de cada tela: no menu ela substitui o ícone, e se repete ao lado do título. */
export const FORMA_PAGINA = {
  rotina: { forma: 'quadrado', cor: 'vermelho' },
  banco: { forma: 'semicirculo', cor: 'amarelo' },
  sessao: { forma: 'circulo', cor: 'azul' },
  historico: { forma: 'quarto', cor: 'azul' },
  apps: { forma: 'triangulo', cor: 'tinta' },
} as const satisfies Record<string, FormaDaPagina>
