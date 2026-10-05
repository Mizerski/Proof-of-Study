import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import { TelaCentralizada } from '@/shared/components/TelaCentralizada'
import { dadosIniciais, type Dados } from '../model/dados'
import { dadosReducer } from '../reducer/dados-reducer'
import { carregarDados, gravarDados } from '../repositorio/armazenamento'
import { DadosContext } from './dados-context'

/**
 * O estado vive num reducer (cache em memória do que está salvo). Cada mudança entra numa fila de gravação,
 * que roda na ordem; a gravação seguinte sempre leva o estado mais recente.
 */
export function DadosProvider({ children }: { children: ReactNode }) {
  const [dados, dispatch] = useReducer(dadosReducer, undefined, dadosIniciais)
  const [carregado, setCarregado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const fila = useRef(Promise.resolve())
  const ultimoSalvo = useRef<Dados | null>(null)

  useEffect(() => {
    carregarDados()
      .then((lidos) => {
        ultimoSalvo.current = lidos
        dispatch({ tipo: 'dados/carregar', dados: lidos })
        setCarregado(true)
      })
      .catch((e: unknown) => setErro(String(e)))
  }, [])

  // Espera um instante sem mudanças (a anotação muda a cada tecla) e grava o estado mais recente.
  useEffect(() => {
    if (!carregado || dados === ultimoSalvo.current) return
    const espera = window.setTimeout(() => {
      ultimoSalvo.current = dados
      fila.current = fila.current.then(() => gravarDados(dados)).catch((e: unknown) => setErro(String(e)))
    }, 300)
    return () => window.clearTimeout(espera)
  }, [dados, carregado])

  if (erro)
    return <TelaCentralizada titulo="Algo deu errado" descricao={`Não foi possível ler ou salvar os dados: ${erro}`} />
  if (!carregado) return <TelaCentralizada titulo="Abrindo" descricao="Carregando seus dados…" />

  return <DadosContext.Provider value={{ dados, dispatch }}>{children}</DadosContext.Provider>
}
