import { FORMA_PAGINA, type FormaDaPagina } from '@/shared/lib/formas'

export type RotaMenu = '/' | '/banco' | '/sessao' | '/historico' | '/apps'

/** Abas da barra lateral. A forma é a mesma do título de cada tela. */
export const ITENS_MENU: { to: RotaMenu; rotulo: string; forma: FormaDaPagina }[] = [
  { to: '/', rotulo: 'Rotina', forma: FORMA_PAGINA.rotina },
  { to: '/banco', rotulo: 'Banco de horas', forma: FORMA_PAGINA.banco },
  { to: '/sessao', rotulo: 'Sessão', forma: FORMA_PAGINA.sessao },
  { to: '/historico', rotulo: 'Histórico', forma: FORMA_PAGINA.historico },
  { to: '/apps', rotulo: 'Apps e sites', forma: FORMA_PAGINA.apps },
]
