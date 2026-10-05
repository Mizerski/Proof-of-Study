import { useState } from 'react'
import { CabecalhoPagina } from '@/shared/components/CabecalhoPagina'
import { ConfirmarExclusao } from '@/shared/components/ConfirmarExclusao'
import { formatarDuracao } from '@/shared/lib/datas'
import { BOTAO, ROTULO, TITULO_CARD } from '@/shared/lib/estilos'
import { FORMA_PAGINA } from '@/shared/lib/formas'
import { formatarPercentual } from '@/shared/lib/percentual'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import type { Tipo } from '@/store/model/dados'
import { useSessao } from '../context/sessao-context'
import { useResumoDaSessao } from '../hooks/useResumoDaSessao'
import { ROTULO_TIPO } from '../utils/classificacao'
import { taxaDeFoco } from '../utils/resumo'
import { rotuloDaSessao } from '../utils/rotulos'
import { BarraFaixas, LinhaGrupo } from './partes'

/** Ordem da etiqueta: fora vira estudo num clique (o caso mais comum: um vídeo que era aula). */
const PROXIMO: Record<Tipo, Tipo> = { fora: 'estudo', estudo: 'ignorar', ignorar: 'fora' }

/** Depois de encerrar: os números da sessão, a linha do tempo e para onde foi o tempo. */
export function TelaResumo() {
  const { sessao, trechos, podeEstender, estender, ajustar, irParaNota, descartar } = useSessao()
  const { resumo, meta } = useResumoDaSessao()
  const [descartando, setDescartando] = useState(false)
  if (!sessao) return null

  const fim = trechos.at(-1)?.fim ?? sessao.inicio

  return (
    <div className="flex max-w-[820px] flex-col gap-4">
      <CabecalhoPagina
        forma={FORMA_PAGINA.sessao}
        trilha={`${rotuloDaSessao(sessao.inicio, fim)}${meta?.descricao ? ` · ${meta.descricao}` : ''}`}
        titulo={
          <>
            Resumo <span>da sessão</span>
          </>
        }
      />

      <div className="grid grid-cols-5 border-2 border-contorno bg-card shadow-bloco">
        <Numero rotulo="Focado" valor={formatarDuracao(resumo.focoMs)} cor="text-foco" />
        <Numero rotulo="Fora do estudo" valor={formatarDuracao(resumo.foraMs)} cor="text-fora" />
        <Numero rotulo="Em foco" valor={formatarPercentual(taxaDeFoco(resumo.focoMs, resumo.foraMs))} />
        <Numero rotulo="Saídas do foco" valor={String(resumo.saidas)} />
        <Numero rotulo="Maior trecho" valor={formatarDuracao(resumo.maiorTrechoMs)} />
      </div>

      <BarraFaixas faixas={resumo.faixas} className="h-5" />

      <div className="border-2 border-contorno bg-card shadow-bloco">
        <div className={cn(TITULO_CARD, 'border-b-2 border-contorno px-3.5 py-2.5')}>Para onde foi o tempo</div>
        {resumo.grupos.map((g) => (
          <LinhaGrupo key={g.chave} grupo={g}>
            <button
              type="button"
              disabled={g.fixo}
              onClick={() => ajustar(g.chave, PROXIMO[g.tipo])}
              title={g.fixo ? undefined : `Trocar como ${g.rotulo} conta nesta sessão`}
              className="border-[1.5px] border-contorno px-1.5 py-0.5 text-[0.625rem] font-semibold tracking-[0.06em] whitespace-nowrap uppercase enabled:hover:bg-amarelo enabled:hover:text-tinta disabled:opacity-100"
            >
              {g.chave === 'sem-captura' ? 'Não registrado' : ROTULO_TIPO[g.tipo]}
              {g.tipo !== g.tipoPadrao && ' *'}
            </button>
          </LinhaGrupo>
        ))}
        {resumo.grupos.length === 0 && <p className="px-3.5 py-3 text-sm text-muted-foreground">Nada registrado nesta sessão.</p>}
        <p className="px-3.5 py-2.5 text-xs text-muted-foreground">
          Clique na etiqueta para trocar como uma janela conta só nesta sessão (ex.: um vídeo do YouTube que era aula).
        </p>
      </div>

      <div className="flex gap-3">
        <Button className={BOTAO} onClick={irParaNota}>
          Registrar o que estudei
        </Button>
        {podeEstender && (
          <Button variant="outline" className={BOTAO} onClick={() => estender(5)}>
            Mais 5 min
          </Button>
        )}
        <Button variant="outline" className={BOTAO} onClick={() => setDescartando(true)}>
          Descartar sessão
        </Button>
      </div>

      <ConfirmarExclusao
        aberto={descartando}
        onOpenChange={setDescartando}
        titulo="Descartar a sessão?"
        descricao="O registro das janelas, a anotação e as imagens desta sessão são apagados. Nada entra no banco de horas."
        onConfirmar={() => void descartar()}
      />
    </div>
  )
}

function Numero({ rotulo, valor, cor }: { rotulo: string; valor: string; cor?: string }) {
  return (
    <div className="flex flex-col gap-1 border-contorno px-3.5 py-3 not-first:border-l-2">
      <span className={cn(ROTULO, 'text-muted-foreground')}>{rotulo}</span>
      <span className={cn('font-heading text-[1.875rem] leading-tight font-extrabold tabular-nums', cor)}>{valor}</span>
    </div>
  )
}
