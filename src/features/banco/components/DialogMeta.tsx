import { useState, type FormEvent } from 'react'
import { formatarDuracao, rotuloSemana, type DataISO } from '@/shared/lib/datas'
import { BOTAO, CAMADA, CAMPO, ROTULO, RODAPE_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Trash2 } from '@/shared/ui/icones'
import { useDados } from '@/store/context/dados-context'
import type { Materia } from '@/store/model/dados'
import { minutosPlanejados } from '@/features/rotina/utils/rotina'
import { metaDaSemana, ultimaMeta } from '../utils/banco'

interface DialogMetaProps {
  alvo: { materia: Materia; semana: DataISO } | null
  onClose: () => void
}

/** Meta da semana de uma matéria: o foco ("Verbos irregulares") e as horas focadas esperadas. */
export function DialogMeta({ alvo, onClose }: DialogMetaProps) {
  return (
    <Dialog open={alvo !== null} onOpenChange={(aberto) => !aberto && onClose()}>
      <DialogContent className={cn(CAMADA, 'sm:max-w-md')}>
        {alvo && <Formulario key={`${alvo.materia.id}-${alvo.semana}`} {...alvo} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function Formulario({ materia, semana, onClose }: { materia: Materia; semana: DataISO; onClose: () => void }) {
  const { dados, dispatch } = useDados()
  const atual = metaDaSemana(dados.metas, materia.id, semana)
  const sugestao = atual ?? ultimaMeta(dados.metas, materia.id, semana)
  const [descricao, setDescricao] = useState(atual?.descricao ?? '')
  const [horas, setHoras] = useState(String((sugestao?.minutos ?? 300) / 60).replace('.', ','))
  const minutos = Math.round(Number(horas.replace(',', '.')) * 60)
  const valido = Number.isFinite(minutos) && minutos > 0
  const planejado = minutosPlanejados(dados.blocos, materia.id)

  function salvar(e: FormEvent) {
    e.preventDefault()
    if (!valido) return
    dispatch({
      tipo: 'meta/salvar',
      meta: { id: atual?.id ?? crypto.randomUUID(), materiaId: materia.id, semana, minutos, descricao: descricao.trim() },
    })
    onClose()
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Meta de {materia.nome}</DialogTitle>
        <DialogDescription>Semana de {rotuloSemana(semana)}</DialogDescription>
      </DialogHeader>
      <label className="flex flex-col gap-2">
        <span className={ROTULO}>O que estudar nesta semana</span>
        <Input
          className={CAMPO}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex.: verbos irregulares"
          autoFocus
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className={ROTULO}>Horas focadas na semana</span>
        <div className="flex items-center gap-2">
          <Input
            className={cn(CAMPO, 'w-28 tabular-nums')}
            inputMode="decimal"
            value={horas}
            onChange={(e) => setHoras(e.target.value)}
            aria-invalid={!valido}
          />
          <span className="text-sm text-muted-foreground">{valido ? formatarDuracao(minutos * 60_000) : 'horas'}</span>
        </div>
      </label>
      <p className="text-xs text-muted-foreground">
        {planejado > 0
          ? `A rotina tem ${formatarDuracao(planejado * 60_000)} de estudo de ${materia.nome} por semana.`
          : `Nenhum bloco de estudo de ${materia.nome} na rotina ainda.`}
      </p>
      <DialogFooter className={cn(RODAPE_DIALOG, 'border-t-2 border-contorno pt-3')}>
        {atual && (
          <Button
            type="button"
            variant="ghost"
            className={cn(BOTAO, 'mr-auto text-destructive')}
            onClick={() => {
              dispatch({ tipo: 'meta/excluir', id: atual.id })
              onClose()
            }}
          >
            <Trash2 />
            Tirar meta
          </Button>
        )}
        <Button type="button" variant="outline" className={BOTAO} onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className={BOTAO} disabled={!valido}>
          Salvar
        </Button>
      </DialogFooter>
    </form>
  )
}
