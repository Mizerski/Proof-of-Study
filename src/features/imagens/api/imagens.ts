import { convertFileSrc, invoke } from '@tauri-apps/api/core'

/** Imagens das anotações, na pasta `imagens` dos dados do app (`src-tauri/src/imagens.rs`). */

const EXTENSOES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export const ehImagemAceita = (arquivo: Blob) => arquivo.type in EXTENSOES

/** Grava a imagem e devolve o nome do arquivo, que é o que fica salvo na sessão. */
export async function salvarImagem(arquivo: Blob): Promise<string> {
  const nome = `${crypto.randomUUID()}.${EXTENSOES[arquivo.type] ?? 'png'}`
  const bytes = new Uint8Array(await arquivo.arrayBuffer())
  await invoke('imagem_salvar', bytes, { headers: { nome } })
  return nome
}

export const excluirImagem = (nome: string) => invoke<void>('imagem_excluir', { nome }).catch(() => undefined)

let pasta: Promise<string> | undefined
export const pastaDasImagens = () => (pasta ??= invoke<string>('imagens_pasta'))

export const urlDaImagem = (pastaImagens: string, nome: string) => convertFileSrc(`${pastaImagens}\\${nome}`)
