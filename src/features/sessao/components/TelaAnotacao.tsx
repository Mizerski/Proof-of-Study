import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { CabecalhoPagina } from '@/shared/components/CabecalhoPagina'
import { formatarDuracao, formatarHM, formatarHora, formatarMeta, inicioDaSemana } from '@/shared/lib/datas'
import { BOTAO, ROTULO } from '@/shared/lib/estilos'
import { FORMA_PAGINA } from '@/shared/lib/formas'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { useDados } from '@/store/context/dados-context'
import { saldoDaMateria } from '@/features/banco/utils/banco'
import { CampoImagens } from '@/features/imagens/components/CampoImagens'
import { imagensDoEvento, useAcrescentarImagens } from '@/features/imagens/hooks/useAcrescentarImagens'
import { useSessao } from '../context/sessao-context'
import { useResumoDaSessao } from '../hooks/useResumoDaSessao'
import { temAnotacao } from '../utils/resumo'

/** A evidência da sessão: o que foi estudado, em texto e imagens. Só com ela o tempo focado entra no banco. */
export function TelaAnotacao() {
  const { dados, dispatch } = useDados()
  const { sessao, trechos, salvar, voltarAoResumo } = useSessao()
  const { resumo, materia } = useResumoDaSessao()
  const navigate = useNavigate()
  const [salvando, setSalvando] = useState(false)
  const imagens = sessao?.imagens ?? []
  const mudarImagens = (lista: string[]) => dispatch({ tipo: 'sessaoAtual/atualizar', mudancas: { imagens: lista } })
  const { acrescentar } = useAcrescentarImagens(imagens, mudarImagens)
  if (!sessao) return null

  const anotada = temAnotacao({ anotacao: sessao.anotacao, imagens })
  const saldo = materia ? saldoDaMateria(dados, materia, inicioDaSemana(new Date(sessao.inicio))) : null
  const fim = trechos.at(-1)?.fim ?? sessao.inicio

  async function concluir() {
    setSalvando(true)
    try {
      const salva = await salvar()
      if (salva) void navigate({ to: '/banco', search: { materia: salva.materiaId } })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="flex max-w-[760px] flex-col gap-4">
      <CabecalhoPagina
        forma={FORMA_PAGINA.sessao}
        trilha={`Evidência da sessão · ${formatarHora(sessao.inicio)}–${formatarHora(fim)}`}
        titulo={
          <>
            O que você <span>estudou?</span>
          </>
        }
      />
      <p className="text-sm text-muted-foreground">Só o tempo focado entra no banco. A anotação fica no histórico como prova do estudo.</p>

      <label className="flex flex-col gap-1.5">
        <span className={ROTULO}>Anotação</span>
        <textarea
          value={sessao.anotacao}
          onChange={(e) => dispatch({ tipo: 'sessaoAtual/atualizar', mudancas: { anotacao: e.target.value } })}
          onPaste={(e) => {
            const coladas = imagensDoEvento(e)
            if (coladas.length) {
              e.preventDefault()
              void acrescentar(coladas)
            }
          }}
          placeholder="Ex.: revisei os verbos 41 a 80, fiz o exercício 3 do livro, ainda confundo lay/lie"
          className="min-h-[150px] resize-y border-2 border-input bg-card p-3 text-sm leading-normal outline-none focus-visible:shadow-[3px_3px_0_0_var(--ring)]"
          autoFocus
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className={ROTULO}>Imagens</span>
        <CampoImagens imagens={imagens} onChange={mudarImagens} />
      </div>

      <div className="flex items-center justify-between gap-3 border-t-2 border-contorno pt-3">
        <span className="text-sm">
          {anotada ? (
            <>
              Vai somar <b className="text-foco">{formatarDuracao(resumo.focoMs)}</b> ao banco
              {saldo?.meta && (
                <>
                  {' '}
                  · total <b>{formatarHM(saldo.noBancoMs + resumo.focoMs)}</b> de {formatarMeta(saldo.meta.minutos * 60_000)}
                </>
              )}
            </>
          ) : (
            <>
              Sem anotação, <b className="text-foco">{formatarDuracao(resumo.focoMs)}</b> de foco não entram no banco.
            </>
          )}
        </span>
        <div className="flex gap-3">
          <Button variant="outline" className={BOTAO} onClick={voltarAoResumo}>
            Voltar ao resumo
          </Button>
          <Button className={cn(BOTAO)} onClick={concluir} disabled={salvando}>
            {anotada ? 'Salvar no banco de horas' : 'Salvar sem anotação'}
          </Button>
        </div>
      </div>
    </div>
  )
}
