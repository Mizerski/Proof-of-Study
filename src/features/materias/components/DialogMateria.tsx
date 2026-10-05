import { useState, type FormEvent } from 'react'
import { BOTAO, CAMADA, CAMPO, ROTULO, RODAPE_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Archive, ArchiveRestore, Check, Trash2 } from '@/shared/ui/icones'
import { Input } from '@/shared/ui/input'
import { useDados } from '@/store/context/dados-context'
import type { Materia } from '@/store/model/dados'
import { CORES_MATERIA, proximaCorLivre } from '../constants/cores'

interface DialogMateriaProps {
  /** Matéria a editar, `'nova'` para criar, `null` fechado. */
  materia: Materia | 'nova' | null
  onClose: () => void
}

export function DialogMateria({ materia, onClose }: DialogMateriaProps) {
  return (
    <Dialog open={materia !== null} onOpenChange={(aberto) => !aberto && onClose()}>
      <DialogContent className={cn(CAMADA, 'sm:max-w-md')}>
        {materia && <Formulario key={materia === 'nova' ? 'nova' : materia.id} materia={materia} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function Formulario({ materia, onClose }: { materia: Materia | 'nova'; onClose: () => void }) {
  const { dados, dispatch } = useDados()
  const existente = materia === 'nova' ? null : materia
  const [nome, setNome] = useState(existente?.nome ?? '')
  const [cor, setCor] = useState(existente?.cor ?? proximaCorLivre(dados.materias.map((m) => m.cor)))
  const temHistorico = existente ? dados.sessoes.some((s) => s.materiaId === existente.id) : false

  function salvar(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    dispatch({ tipo: 'materia/salvar', materia: { ...existente, id: existente?.id ?? crypto.randomUUID(), nome: nome.trim(), cor } })
    onClose()
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{existente ? 'Editar matéria' : 'Nova matéria'}</DialogTitle>
        <DialogDescription>O que você estuda: Inglês, Programação, Matemática…</DialogDescription>
      </DialogHeader>
      <label className="flex flex-col gap-2">
        <span className={ROTULO}>Nome</span>
        <Input className={CAMPO} value={nome} onChange={(e) => setNome(e.target.value)} autoFocus required />
      </label>
      <fieldset className="flex flex-col gap-2">
        <legend className={cn(ROTULO, 'mb-2')}>Cor</legend>
        <div className="flex flex-wrap gap-2">
          {CORES_MATERIA.map((c) => {
            const escolhida = c.hex === cor
            return (
              <button
                key={c.hex}
                type="button"
                aria-label={c.nome}
                aria-pressed={escolhida}
                onClick={() => setCor(c.hex)}
                className={cn(
                  'flex size-8 items-center justify-center border-2 border-contorno transition-[box-shadow,translate] duration-100 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  escolhida ? 'translate-x-[2px] translate-y-[2px]' : 'shadow-bloco-sm',
                  'clara' in c ? 'text-tinta' : 'text-papel',
                )}
                style={{ backgroundColor: c.hex }}
              >
                {escolhida && <Check className="size-6" />}
              </button>
            )
          })}
        </div>
      </fieldset>
      <DialogFooter className={cn(RODAPE_DIALOG, 'border-t-2 border-contorno pt-3')}>
        {existente && (
          <Button
            type="button"
            variant="ghost"
            className={cn(BOTAO, 'mr-auto', !temHistorico && 'text-destructive')}
            onClick={() => {
              if (temHistorico) dispatch({ tipo: 'materia/salvar', materia: { ...existente, arquivada: !existente.arquivada } })
              else dispatch({ tipo: 'materia/excluir', id: existente.id })
              onClose()
            }}
            title={temHistorico ? 'Some das escolhas, mas o histórico continua' : undefined}
          >
            {temHistorico ? existente.arquivada ? <ArchiveRestore /> : <Archive /> : <Trash2 />}
            {temHistorico ? (existente.arquivada ? 'Desarquivar' : 'Arquivar') : 'Excluir'}
          </Button>
        )}
        <Button type="button" variant="outline" className={BOTAO} onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className={BOTAO}>
          Salvar
        </Button>
      </DialogFooter>
    </form>
  )
}
