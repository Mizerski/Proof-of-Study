import { load, type Store } from '@tauri-apps/plugin-store'
import { atualizarDados, VERSAO_DADOS, type Dados } from '../model/dados'

/** Tudo num JSON na pasta de dados do app (`%APPDATA%\io.github.mizerski.proofofstudy` no Windows, `~/.local/share/...` no Linux). Imagens ficam à parte. */
export const ARQUIVO_DADOS = 'dados.json'

let arquivo: Promise<Store> | undefined
const abrir = () => (arquivo ??= load(ARQUIVO_DADOS, { autoSave: false, defaults: {} }))

export async function carregarDados(): Promise<Dados> {
  const store = await abrir()
  return atualizarDados(await store.get<Partial<Dados>>('dados'), (await store.get<number>('versao')) ?? VERSAO_DADOS)
}

export async function gravarDados(dados: Dados): Promise<void> {
  const store = await abrir()
  await store.set('versao', VERSAO_DADOS)
  await store.set('dados', dados)
  await store.save()
}
