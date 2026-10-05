import { useState } from 'react'
import { ConfirmarExclusao } from '@/shared/components/ConfirmarExclusao'
import { BOTAO, CAMADA, ROTULO, RODAPE_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { useDados } from '@/store/context/dados-context'
import type { Sessao } from '@/store/model/dados'
import { excluirImagem } from '@/features/imagens/api/imagens'
import { CampoImagens } from '@/features/imagens/components/CampoImagens'
import { imagensDoEvento, useAcrescentarImagens } from '@/features/imagens/hooks/useAcrescentarImagens'
import { BarraFaixas, LinhaGrupo } from '@/features/sessao/components/partes'
import { rotuloDaSessao } from '@/features/sessao/utils/rotulos'
import { resumir } from '@/features/sessao/utils/resumo'

/** Abre uma sessão salva: a evidência (editável) e para onde foi o tempo. */
export function DialogSessao({ sessao, onClose }: { sessao: Sessao | null; onClose: () => void }) {
  return (
    <Dialog open={sessao !== null} onOpenChange={(aberto) => !aberto && onClose()}>
      <DialogContent className={cn(CAMADA, 'max-h-[calc(100svh-4rem)] overflow-y-auto pt-6 sm:max-w-2xl')}>
        {sessao && <Conteudo key={sessao.id} sessao={sessao} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function Conteudo({ sessao, onClose }: { sessao: Sessao; onClose: () => void }) {
  const { dados, dispatch } = useDados()
  const [anotacao, setAnotacao] = useState(sessao.anotacao)
  const [imagens, setImagens] = useState(sessao.imagens)
  const [excluindo, setExcluindo] = useState(false)
  const { acrescentar } = useAcrescentarImagens(imagens, setImagens)
  const resumo = resumir(sessao.trechos, dados.regras, sessao.ajustes)

  function salvar() {
    sessao.imagens.filter((i) => !imagens.includes(i)).forEach((i) => void excluirImagem(i))
    dispatch({ tipo: 'sessao/salvar', sessao: { ...sessao, anotacao: anotacao.trim(), imagens } })
    onClose()
  }

  function cancelar() {
    imagens.filter((i) => !sessao.imagens.includes(i)).forEach((i) => void excluirImagem(i))
    onClose()
  }

  return (
    <div className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Sessão</DialogTitle>
        <DialogDescription>{rotuloDaSessao(sessao.inicio, sessao.fim)}</DialogDescription>
      </DialogHeader>
      <BarraFaixas faixas={resumo.faixas} className="h-4" />
      <label className="flex flex-col gap-1.5">
        <span className={ROTULO}>Anotação</span>
        <textarea
          value={anotacao}
          onChange={(e) => setAnotacao(e.target.value)}
          onPaste={(e) => {
            const coladas = imagensDoEvento(e)
            if (coladas.length) {
              e.preventDefault()
              void acrescentar(coladas)
            }
          }}
          rows={4}
          placeholder="O que você estudou nesta sessão?"
          className="resize-y border-2 border-input bg-card p-3 text-sm outline-none focus-visible:shadow-[3px_3px_0_0_var(--ring)]"
        />
      </label>
      <div className="flex flex-col gap-1.5">
        <span className={ROTULO}>Imagens</span>
        <CampoImagens imagens={imagens} onChange={setImagens} />
      </div>
      {resumo.grupos.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className={ROTULO}>Para onde foi o tempo</span>
          <div className="border-2 border-contorno">
            {resumo.grupos.map((g) => (
              <LinhaGrupo key={g.chave} grupo={g} />
            ))}
          </div>
        </div>
      )}
      <DialogFooter className={cn(RODAPE_DIALOG, 'border-t-2 border-contorno pt-3')}>
        <Button variant="ghost" className={cn(BOTAO, 'mr-auto text-destructive')} onClick={() => setExcluindo(true)}>
          Excluir sessão
        </Button>
        <Button variant="outline" className={BOTAO} onClick={cancelar}>
          Cancelar
        </Button>
        <Button className={BOTAO} onClick={salvar}>
          Salvar
        </Button>
      </DialogFooter>
      <ConfirmarExclusao
        aberto={excluindo}
        onOpenChange={setExcluindo}
        titulo="Excluir a sessão?"
        descricao="O registro, a anotação e as imagens desta sessão são apagados, e o tempo sai do banco de horas."
        onConfirmar={() => {
          sessao.imagens.forEach((i) => void excluirImagem(i))
          dispatch({ tipo: 'sessao/excluir', id: sessao.id })
          onClose()
        }}
      />
    </div>
  )
}
