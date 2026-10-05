import { useRef, useState, type DragEvent } from 'react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { X } from '@/shared/ui/icones'
import { ehImagemAceita, excluirImagem, urlDaImagem } from '../api/imagens'
import { imagensDoEvento, useAcrescentarImagens } from '../hooks/useAcrescentarImagens'
import { usePastaImagens } from '../hooks/usePastaImagens'

interface CampoImagensProps {
  imagens: string[]
  onChange: (imagens: string[]) => void
}

/**
 * Área listrada para soltar imagens (ou clicar e escolher). O texto da anotação ao lado aceita colar um print
 * (Win+Shift+S, depois Ctrl+V). Cada imagem é gravada na hora na pasta do app; tirar da lista apaga o arquivo.
 */
export function CampoImagens({ imagens, onChange }: CampoImagensProps) {
  const entrada = useRef<HTMLInputElement>(null)
  const [arrastando, setArrastando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const { acrescentar } = useAcrescentarImagens(imagens, onChange, setErro)

  async function aoSoltar(e: DragEvent) {
    e.preventDefault()
    setArrastando(false)
    await acrescentar(imagensDoEvento(e))
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => entrada.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setArrastando(true)
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={aoSoltar}
        className={cn(
          'flex h-[120px] flex-col items-center justify-center border-2 border-dashed font-mono text-xs leading-relaxed text-muted-foreground outline-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring',
          arrastando ? 'border-ring bg-selecao' : 'listrado border-muted-foreground',
        )}
      >
        <span>arraste imagens ou clique para escolher</span>
        <span>foto do caderno, print de exercício (Ctrl+V no texto)</span>
      </button>
      {imagens.length > 0 && (
        <Miniaturas
          imagens={imagens}
          onRemover={(nome) => {
            void excluirImagem(nome)
            onChange(imagens.filter((i) => i !== nome))
          }}
        />
      )}
      {erro && <p className="text-xs text-destructive">{erro}</p>}
      <input
        ref={entrada}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        hidden
        onChange={async (e) => {
          await acrescentar([...(e.target.files ?? [])].filter(ehImagemAceita))
          e.target.value = ''
        }}
      />
    </div>
  )
}

/** Grade de miniaturas; com `onRemover`, cada uma ganha o ×. Clicar abre a imagem inteira. */
export function Miniaturas({ imagens, onRemover }: { imagens: string[]; onRemover?: (nome: string) => void }) {
  const pasta = usePastaImagens()
  const [aberta, setAberta] = useState<string | null>(null)
  if (!pasta) return null
  return (
    <>
      <ul className="flex flex-wrap gap-3">
        {imagens.map((nome) => (
          <li key={nome} className="relative">
            <button
              type="button"
              onClick={() => setAberta(nome)}
              className="block border-2 border-contorno bg-muted shadow-bloco-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              aria-label="Ver imagem inteira"
            >
              <img src={urlDaImagem(pasta, nome)} alt="" className="h-20 w-28 object-cover" />
            </button>
            {onRemover && (
              <Button
                type="button"
                variant="destructive"
                size="icon-xs"
                className="absolute -top-2 -right-2 rounded-full"
                aria-label="Tirar imagem"
                onClick={() => onRemover(nome)}
              >
                <X className="size-3" />
              </Button>
            )}
          </li>
        ))}
      </ul>
      {aberta && (
        <button
          type="button"
          className="fixed inset-0 z-50 flex items-center justify-center bg-veu p-8"
          onClick={() => setAberta(null)}
          aria-label="Fechar imagem"
        >
          <img src={urlDaImagem(pasta, aberta)} alt="" className="max-h-full max-w-full border-2 border-contorno bg-card shadow-bloco-lg" />
        </button>
      )}
    </>
  )
}
