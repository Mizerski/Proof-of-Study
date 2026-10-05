import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { CabecalhoPagina } from '@/shared/components/CabecalhoPagina'
import { CaixaDestaque } from '@/shared/components/CaixaDestaque'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { useAgora } from '@/shared/hooks/useAgora'
import { formatarDuracao, formatarHM, formatarHoraCurta, formatarRelogio, inicioDaSemana, paraISO } from '@/shared/lib/datas'
import { BOTAO, ROTULO } from '@/shared/lib/estilos'
import { FORMA_PAGINA } from '@/shared/lib/formas'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { useDados } from '@/store/context/dados-context'
import { useJanela } from '@/app/janela/janela-context'
import { saldoDaMateria } from '@/features/banco/utils/banco'
import { estudoDeHoje } from '@/features/rotina/utils/rotina'
import { useSessao } from '../context/sessao-context'
import { useResumoDaSessao } from '../hooks/useResumoDaSessao'
import { BarraFaixas } from './partes'
import { PopoverCaptura } from './PopoverCaptura'

const FASE = { pronto: 'Pronto', rodando: 'Em andamento', pausado: 'Pausado' } as const
const DURACOES = [25, 50]

/** O pomodoro: relógio grande no meio, botões embaixo e a linha do tempo da sessão no rodapé. */
export function TelaRelogio({ materiaInicial }: { materiaInicial?: string }) {
  const { dados } = useDados()
  const { etapa, retrato, sessao, iniciar, pausar, retomar, encerrar } = useSessao()
  const { virarWidget } = useJanela()
  const { resumo, materia, meta, atual, foraHaMs } = useResumoDaSessao()
  const agora = useAgora()

  const ativas = dados.materias.filter((m) => !m.arquivada)
  const { atual: blocoAgora, proximo } = estudoDeHoje(dados.blocos, agora)
  const bloco = blocoAgora ?? proximo
  const ultima = [...dados.sessoes].sort((a, b) => b.inicio - a.inicio)[0]?.materiaId
  const padrao = [materiaInicial, blocoAgora?.bloco.materiaId, ultima, ativas[0]?.id].find((id) => ativas.some((m) => m.id === id))
  const [escolhida, setEscolhida] = useState(padrao)
  const [duracao, setDuracao] = useState(dados.preferencias.duracaoMin)
  const [comecando, setComecando] = useState(false)

  const pronto = etapa === 'pronto'
  const fase = etapa === 'rodando' || etapa === 'pausado' ? etapa : 'pronto'
  const materiaVista = pronto ? ativas.find((m) => m.id === escolhida) : materia
  const saldo = materiaVista ? saldoDaMateria(dados, materiaVista, inicioDaSemana(agora)) : null
  const metaVista = pronto ? saldo?.meta : meta
  const totalMs = pronto ? duracao * 60_000 : (retrato?.duracaoMs ?? 0)
  const restante = pronto ? totalMs : totalMs - (retrato?.decorridoMs ?? 0)
  const numero = dados.sessoes.filter((s) => paraISO(new Date(s.inicio)) === paraISO(agora)).length + 1
  const duracoes = DURACOES.includes(duracao) ? DURACOES : [...DURACOES, duracao].sort((a, b) => a - b)

  async function comecar() {
    if (!escolhida) return
    setComecando(true)
    try {
      await iniciar(escolhida, duracao)
    } finally {
      setComecando(false)
    }
  }

  return (
    <div className="flex h-full min-h-[34rem] flex-col gap-3.5">
      <CabecalhoPagina
        forma={FORMA_PAGINA.sessao}
        trilha={materiaVista ? `${materiaVista.nome} › ${metaVista?.descricao || 'sem etapa definida'}` : 'Escolha a matéria'}
        titulo={
          <>
            Sessão <span>pomodoro {numero}</span>
          </>
        }
        acoes={<PopoverCaptura />}
      />

      {etapa === 'rodando' && foraHaMs > 0 && dados.preferencias.avisoDistracao && atual && (
        <CaixaDestaque fundo="bg-fora-suave" faixa="border-l-vermelho" className="text-sm">
          <p>
            <b>Fora do estudo há {formatarRelogio(foraHaMs)}</b> em {atual.rotulo}. O tempo continua sendo registrado.
          </p>
        </CaixaDestaque>
      )}

      <div className="flex flex-1 flex-col items-center justify-center gap-[18px]">
        <span className={cn(ROTULO, 'bg-foreground px-2.5 py-1 tracking-[0.1em] text-background')}>{FASE[fase]}</span>
        <div className="font-heading text-[8.25rem] leading-[0.9] font-extrabold tracking-[-0.02em] tabular-nums" role="timer">
          {formatarRelogio(restante)}
        </div>

        {pronto && (
          <>
            {bloco ? (
              <p className="text-sm text-muted-foreground">
                Bloco de hoje{' '}
                <b className="text-foreground">
                  {formatarHoraCurta(bloco.bloco.inicio)}–{formatarHoraCurta(bloco.bloco.fim)}
                </b>
                {saldo?.meta && (
                  <>
                    {' '}
                    · faltam <b className="text-foreground">{formatarHM(Math.max(0, saldo.meta.minutos * 60_000 - saldo.noBancoMs))}</b> na
                    meta da semana
                  </>
                )}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum bloco de estudo na rotina de hoje.</p>
            )}
            {ativas.length > 0 ? (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <ControleSegmentado
                  rotulo="Matéria"
                  valor={escolhida ?? ''}
                  onChange={setEscolhida}
                  opcoes={ativas.map((m) => ({ valor: m.id, rotulo: m.nome }))}
                />
                <ControleSegmentado
                  rotulo="Duração"
                  valor={String(duracao)}
                  onChange={(v) => setDuracao(Number(v))}
                  opcoes={duracoes.map((d) => ({ valor: String(d), rotulo: `${d} min` }))}
                />
              </div>
            ) : (
              <p className="text-sm">
                Nenhuma matéria.{' '}
                <Link to="/banco" className="font-semibold underline decoration-2 underline-offset-4">
                  Crie uma no Banco de horas
                </Link>
              </p>
            )}
          </>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          {pronto && (
            <Button className={cn(BOTAO, 'h-11 px-5 text-[0.8125rem]')} disabled={!escolhida || comecando} onClick={comecar}>
              Iniciar pomodoro
            </Button>
          )}
          {etapa === 'pausado' && (
            <Button className={cn(BOTAO, 'h-11 px-5 text-[0.8125rem]')} onClick={retomar}>
              Continuar
            </Button>
          )}
          {etapa === 'rodando' && (
            <Button variant="outline" className={cn(BOTAO, 'h-11 px-[18px] text-[0.8125rem]')} onClick={pausar}>
              Pausar
            </Button>
          )}
          {!pronto && (
            <>
              <Button variant="outline" className={cn(BOTAO, 'h-11 px-[18px] text-[0.8125rem]')} onClick={() => void virarWidget()}>
                Virar widget
              </Button>
              <Button variant="outline" className={cn(BOTAO, 'h-11 px-[18px] text-[0.8125rem]')} onClick={encerrar}>
                Encerrar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className={cn(ROTULO, 'flex justify-between')}>
          <span className="text-muted-foreground">Pomodoro de {Math.round(totalMs / 60_000)} min</span>
          <span>
            <span className="text-foco">{formatarDuracao(resumo.focoMs)} foco</span> ·{' '}
            <span className="text-fora">{formatarDuracao(resumo.foraMs)} fora</span>
          </span>
        </div>
        <BarraFaixas faixas={sessao ? resumo.faixas : []} totalMs={Math.max(totalMs, resumo.totalMs)} className="h-[26px]" />
      </div>
    </div>
  )
}
