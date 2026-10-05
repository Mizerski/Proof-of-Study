import { FaixaPrimarias } from '@/shared/components/FaixaPrimarias'
import { ROTULO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { useSessao } from '../context/sessao-context'
import { useResumoDaSessao } from '../hooks/useResumoDaSessao'
import { COR_TIPO, LinhaGrupo } from './partes'

/** Rótulo e cor do quadradinho de status da captura (cabeçalho da sessão, widget). */
export function useStatusCaptura() {
  const { etapa, retrato } = useSessao()
  const { capturando, atual } = useResumoDaSessao()
  const rotulo = capturando ? 'Capturando' : etapa === 'rodando' && retrato && !retrato.captura ? 'Captura pausada' : 'Captura desligada'
  const cor = capturando && atual?.tipo ? COR_TIPO[atual.tipo].bloco : 'bg-muted'
  return { rotulo, cor }
}

/**
 * Transparência: o botão "Capturando ▾" abre o que está sendo lido agora, o que já foi registrado nesta sessão e
 * o que o app registra e não registra. Dá para pausar só a captura, sem parar o relógio.
 */
export function PopoverCaptura() {
  const { rotulo, cor } = useStatusCaptura()
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group flex h-8 items-center gap-2 border-2 border-contorno bg-card px-2.5 text-[0.6875rem] font-semibold tracking-[0.06em] uppercase outline-none hover:bg-amarelo hover:text-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-expanded:bg-amarelo aria-expanded:text-tinta"
        >
          <span aria-hidden className={cn('size-2.5 border-[1.5px] border-contorno', cor)} />
          {rotulo}
          <span aria-hidden className="group-aria-expanded:rotate-180">▾</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[370px] gap-0 rounded-none border-2 border-contorno p-0 shadow-bloco-lg ring-0">
        <FaixaPrimarias />
        <DetalheCaptura />
      </PopoverContent>
    </Popover>
  )
}

export function DetalheCaptura({ compacto }: { compacto?: boolean }) {
  const { etapa, retrato, alternarCaptura } = useSessao()
  const { resumo, atual } = useResumoDaSessao()
  const ativa = etapa === 'rodando' || etapa === 'pausado'

  return (
    <div className={cn('flex flex-col gap-3', compacto ? 'pt-2.5' : 'p-4')}>
      {!compacto && (
        <div className="flex items-center justify-between">
          <span className={cn(ROTULO, 'text-muted-foreground')}>Janela ativa agora</span>
          {ativa && (
            <button
              type="button"
              onClick={() => void alternarCaptura()}
              className="border-2 border-contorno px-2 py-1 text-[0.6875rem] font-semibold tracking-[0.06em] uppercase hover:bg-amarelo hover:text-tinta"
            >
              {retrato?.captura ? 'Pausar captura' : 'Retomar captura'}
            </button>
          )}
        </div>
      )}
      <div className="flex flex-col gap-0.5">
        <span className={cn('leading-snug font-medium [overflow-wrap:anywhere]', compacto ? 'text-xs' : 'text-[0.8125rem]')}>
          {atual?.titulo ?? (etapa === 'pronto' ? 'Aguardando início do pomodoro' : 'Captura pausada')}
        </span>
        <span className={cn('text-muted-foreground', compacto ? 'text-[0.6875rem]' : 'text-xs')}>
          {atual?.detalhe ?? (etapa === 'pronto' ? 'Nenhuma janela registrada' : 'Tempo não registrado')}
        </span>
      </div>
      <div className={cn('flex flex-col', !compacto && 'border-t-2 border-contorno')}>
        {resumo.grupos.slice(0, compacto ? 3 : 8).map((g) => (
          <LinhaGrupo key={g.chave} grupo={g} compacto />
        ))}
        {resumo.grupos.length === 0 && <span className="pt-2 text-xs text-muted-foreground">Nada registrado ainda.</span>}
      </div>
      {compacto ? (
        <span className="text-[0.6875rem] leading-snug text-muted-foreground">
          Registra título da janela e app. Não registra teclas, tela nem URL.
        </span>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 text-xs leading-normal">
          <div>
            <div className={cn(ROTULO, 'mb-0.5')}>Registra</div>
            Título da janela
            <br />
            Nome do app
            <br />
            Tempo em cada uma
          </div>
          <div>
            <div className={cn(ROTULO, 'mb-0.5')}>Não registra</div>
            Teclas digitadas
            <br />
            Imagens da tela
            <br />
            URL das páginas
          </div>
          <div className="col-span-2 text-muted-foreground">Dados ficam só neste PC. A captura só roda com o pomodoro ativo.</div>
        </div>
      )}
    </div>
  )
}
