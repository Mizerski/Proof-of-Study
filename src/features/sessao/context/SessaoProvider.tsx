import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useDados } from '@/store/context/dados-context'
import type { Sessao, Tipo } from '@/store/model/dados'
import { excluirImagem } from '@/features/imagens/api/imagens'
import {
  definirCaptura,
  estenderRastreio,
  iniciarRastreio,
  lerRastreio,
  pararRastreio,
  pausarRastreio,
  retomarRastreio,
  type Retrato,
} from '../api/rastreio'
import { ordenarRegras } from '../utils/classificacao'
import { ajustesMudados, resumir } from '../utils/resumo'
import { SessaoContext, type ContextoSessao, type Etapa } from './sessao-context'

/** De quanto em quanto tempo os trechos vão para o arquivo, para não perder a sessão se o app fechar. */
const COPIA_A_CADA_MS = 30_000

/**
 * O pomodoro roda no Rust; aqui a tela lê o estado a cada segundo e guarda a sessão em `dados.sessaoAtual`.
 * Fica na raiz do app para o widget, a barra lateral e o aviso funcionarem em qualquer tela.
 */
export function SessaoProvider({ children }: { children: ReactNode }) {
  const { dados, dispatch } = useDados()
  const [retrato, setRetrato] = useState<Retrato | null>(null)
  const sessao = dados.sessaoAtual
  const ultimaCopia = useRef(0)

  const ler = useCallback(async () => {
    const lido = await lerRastreio()
    setRetrato(lido)
    return lido
  }, [])

  useEffect(() => {
    void ler()
    const intervalo = window.setInterval(() => void ler(), 1000)
    const aoVoltar = () => document.visibilityState === 'visible' && void ler()
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      window.clearInterval(intervalo)
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [ler])

  // Ao abrir: o Rust registrando sem sessão salva (ex.: dados apagados) para, para não registrar à toa.
  const conferido = useRef(false)
  useEffect(() => {
    if (!retrato || conferido.current) return
    conferido.current = true
    if (!sessao && retrato.fase !== 'parado') void pararRastreio().then(ler)
  }, [retrato, sessao, ler])

  // Cópia de segurança dos trechos.
  useEffect(() => {
    if (!retrato || !sessao || retrato.fase === 'parado') return
    const agora = Date.now()
    const acabou = retrato.fase === 'concluido' && sessao.trechos.length !== retrato.trechos.length
    if (acabou || agora - ultimaCopia.current >= COPIA_A_CADA_MS) {
      ultimaCopia.current = agora
      dispatch({ tipo: 'sessaoAtual/atualizar', mudancas: { trechos: retrato.trechos } })
    }
  }, [retrato, sessao, dispatch])

  const etapa: Etapa | null = !retrato
    ? null
    : !sessao
      ? 'pronto'
      : retrato.fase === 'rodando'
        ? 'rodando'
        : retrato.fase === 'pausado'
          ? 'pausado'
          : (sessao.passo ?? 'resumo')
  const trechos = useMemo(
    () => (sessao && retrato && retrato.fase !== 'parado' ? retrato.trechos : (sessao?.trechos ?? [])),
    [sessao, retrato],
  )

  const iniciar = useCallback(
    async (materiaId: string, duracaoMin: number) => {
      const materia = dados.materias.find((m) => m.id === materiaId)
      const p = dados.preferencias
      await iniciarRastreio({
        duracaoMs: duracaoMin * 60_000,
        limiteAusenciaSeg: p.limiteAusenciaMin * 60,
        avisoDistracaoSeg: p.avisoDistracao ? p.avisoDistracaoSeg : null,
        regras: ordenarRegras(dados.regras).map(({ rotulo, termos, campo, tipo }) => ({ rotulo, termos, campo, tipo })),
        materia: materia?.nome ?? 'estudo',
      })
      // Lê antes de guardar a sessão, para a tela não passar pelo resumo com o retrato antigo.
      const lido = await lerRastreio()
      ultimaCopia.current = Date.now()
      setRetrato(lido)
      dispatch({
        tipo: 'sessaoAtual/definir',
        sessao: { id: crypto.randomUUID(), materiaId, inicio: Date.now(), duracaoMin, trechos: [], imagens: [], anotacao: '' },
      })
    },
    [dados.materias, dados.preferencias, dados.regras, dispatch],
  )

  const encerrar = useCallback(async () => {
    const final = await pararRastreio()
    dispatch({ tipo: 'sessaoAtual/atualizar', mudancas: { trechos: final, passo: 'resumo' } })
    await ler()
  }, [dispatch, ler])

  const ajustar = useCallback(
    (chave: string, tipo: Tipo) =>
      dispatch({ tipo: 'sessaoAtual/atualizar', mudancas: { ajustes: { ...sessao?.ajustes, [chave]: tipo } } }),
    [sessao?.ajustes, dispatch],
  )

  const salvar = useCallback(async () => {
    if (!sessao) return null
    const final = retrato && retrato.fase !== 'parado' ? await pararRastreio() : sessao.trechos
    const resumo = resumir(final, dados.regras, sessao.ajustes)
    const salva: Sessao = {
      id: sessao.id,
      materiaId: sessao.materiaId,
      inicio: sessao.inicio,
      fim: final.at(-1)?.fim ?? Date.now(),
      duracaoPlanejadaMin: sessao.duracaoMin,
      trechos: final,
      ajustes: ajustesMudados(resumo.grupos, sessao.ajustes ?? {}),
      focoMs: resumo.focoMs,
      foraMs: resumo.foraMs,
      anotacao: sessao.anotacao.trim(),
      imagens: sessao.imagens,
    }
    dispatch({ tipo: 'sessao/salvar', sessao: salva })
    dispatch({ tipo: 'sessaoAtual/definir', sessao: null })
    await ler()
    return salva
  }, [sessao, retrato, dados.regras, dispatch, ler])

  const descartar = useCallback(async () => {
    if (retrato && retrato.fase !== 'parado') await pararRastreio()
    sessao?.imagens.forEach((nome) => void excluirImagem(nome))
    dispatch({ tipo: 'sessaoAtual/definir', sessao: null })
    await ler()
  }, [retrato, sessao, dispatch, ler])

  const valor = useMemo<ContextoSessao>(
    () => ({
      etapa,
      retrato,
      sessao,
      trechos,
      podeEstender: retrato?.fase === 'concluido',
      iniciar,
      pausar: async () => {
        await pausarRastreio()
        await ler()
      },
      retomar: async () => {
        await retomarRastreio()
        await ler()
      },
      alternarCaptura: async () => {
        await definirCaptura(!retrato?.captura)
        await ler()
      },
      estender: async (minutos) => {
        await estenderRastreio(minutos * 60_000)
        await ler()
      },
      encerrar,
      ajustar,
      irParaNota: () => dispatch({ tipo: 'sessaoAtual/atualizar', mudancas: { passo: 'nota' } }),
      voltarAoResumo: () => dispatch({ tipo: 'sessaoAtual/atualizar', mudancas: { passo: 'resumo' } }),
      salvar,
      descartar,
    }),
    [etapa, retrato, sessao, trechos, iniciar, encerrar, ajustar, salvar, descartar, ler, dispatch],
  )

  return <SessaoContext.Provider value={valor}>{children}</SessaoContext.Provider>
}
