import type { ClipboardEvent, DragEvent } from 'react'
import { ehImagemAceita, salvarImagem } from '../api/imagens'

/** Imagens do arquivo colado (Ctrl+V), solto ou escolhido. */
export function imagensDoEvento(e: ClipboardEvent | DragEvent): File[] {
  const dados = 'clipboardData' in e ? e.clipboardData : e.dataTransfer
  return [...(dados?.files ?? [])].filter(ehImagemAceita)
}

/** Grava as imagens na pasta do app e acrescenta os nomes à lista. */
export function useAcrescentarImagens(imagens: string[], onChange: (imagens: string[]) => void, onErro?: (erro: string | null) => void) {
  async function acrescentar(arquivos: File[]) {
    if (arquivos.length === 0) return
    try {
      const nomes = await Promise.all(arquivos.map(salvarImagem))
      onErro?.(null)
      onChange([...imagens, ...nomes])
    } catch (e) {
      onErro?.(`Não foi possível guardar a imagem: ${String(e)}`)
    }
  }
  return { acrescentar }
}
