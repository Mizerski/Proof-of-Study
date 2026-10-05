import { createRootRoute, createRoute, createRouter, Link } from '@tanstack/react-router'
import { AppsPage } from '@/features/apps/AppsPage'
import { BancoPage } from '@/features/banco/BancoPage'
import { HistoricoPage } from '@/features/historico/HistoricoPage'
import { RotinaPage } from '@/features/rotina/RotinaPage'
import { SessaoPage } from '@/features/sessao/SessaoPage'
import { AppLayout } from './layout/AppLayout'

const rootRoute = createRootRoute({
  component: AppLayout,
  notFoundComponent: () => (
    <p className="text-muted-foreground">
      Página não encontrada.{' '}
      <Link to="/" className="underline">
        Voltar para a rotina
      </Link>
    </p>
  ),
})

const rotinaRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: RotinaPage })

/** `?materia=`: matéria do banco aberta (sem ela, a primeira com meta). */
const bancoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/banco',
  validateSearch: (search: Record<string, unknown>): { materia?: string } =>
    typeof search.materia === 'string' ? { materia: search.materia } : {},
  component: BancoPage,
})

/** `?materia=`: matéria já escolhida ao abrir pelo aviso ou pelo banco. */
const sessaoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sessao',
  validateSearch: (search: Record<string, unknown>): { materia?: string } =>
    typeof search.materia === 'string' ? { materia: search.materia } : {},
  component: SessaoPage,
})

const historicoRoute = createRoute({ getParentRoute: () => rootRoute, path: '/historico', component: HistoricoPage })
const appsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/apps', component: AppsPage })

const routeTree = rootRoute.addChildren([rotinaRoute, bancoRoute, sessaoRoute, historicoRoute, appsRoute])

export const router = createRouter({ routeTree, defaultPreload: 'intent' })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
