import { useEffect, useState } from 'react'
import { pastaDasImagens } from '../api/imagens'

/** Caminho da pasta de imagens (lido uma vez); `null` enquanto carrega. */
export function usePastaImagens(): string | null {
  const [pasta, setPasta] = useState<string | null>(null)
  useEffect(() => {
    let ativo = true
    pastaDasImagens().then((p) => ativo && setPasta(p))
    return () => {
      ativo = false
    }
  }, [])
  return pasta
}
