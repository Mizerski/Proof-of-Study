import { useState, type FormEvent } from 'react'
import { PontoCor } from '@/shared/components/PontoCor'
import { DIAS_SEMANA, formatarHorario, lerHorario } from '@/shared/lib/datas'
import { BOTAO, CAMADA, CAMPO, CAMPO_SELECT, ROTULO, RODAPE_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Trash2 } from '@/shared/ui/icones'
import { useDados } from '@/store/context/dados-context'
import type { BlocoRotina, Categoria } from '@/store/model/dados'
import { CATEGORIAS, LISTA_CATEGORIAS } from '../constants/categorias'
import { duracaoBloco } from '../utils/rotina'

const SEM_MATERIA = 'nenhuma'
const DIAS_UTEIS = [1, 2, 3, 4, 5]

interface DialogBlocoProps {
  /** Bloco a editar, ou o rascunho de um novo (sem id). */
  bloco: Partial<BlocoRotina> | null
  onClose: () => void
}

export function DialogBloco({ bloco, onClose }: DialogBlocoProps) {
  return (
    <Dialog open={bloco !== null} onOpenChange={(aberto) => !aberto && onClose()}>
      <DialogContent className={cn(CAMADA, 'sm:max-w-lg')}>
        {bloco && <FormularioBloco key={bloco.id ?? 'novo'} inicial={bloco} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function FormularioBloco({ inicial, onClose }: { inicial: Partial<BlocoRotina>; onClose: () => void }) {
  const { dados, dispatch } = useDados()
  const materias = dados.materias.filter((m) => !m.arquivada || m.id === inicial.materiaId)
  const [titulo, setTitulo] = useState(inicial.titulo ?? '')
  const [categoria, setCategoria] = useState<Categoria>(inicial.categoria ?? 'estudo')
  const [materiaId, setMateriaId] = useState(inicial.materiaId ?? (inicial.id ? SEM_MATERIA : (materias[0]?.id ?? SEM_MATERIA)))
  const [dias, setDias] = useState<number[]>(inicial.dias ?? DIAS_UTEIS)
  const [inicio, setInicio] = useState(formatarHorario(inicial.inicio ?? 19 * 60))
  const [fim, setFim] = useState(formatarHorario(inicial.fim ?? 20 * 60))
  const [avisar, setAvisar] = useState(inicial.avisar ?? true)
  const [erro, setErro] = useState<string | null>(null)

  const estudo = categoria === 'estudo'
  const materia = estudo ? materias.find((m) => m.id === materiaId) : undefined
  const minInicio = lerHorario(inicio)
  const minFim = lerHorario(fim)
  const duracao = minInicio !== null && minFim !== null && minInicio !== minFim ? duracaoBloco({ inicio: minInicio, fim: minFim }) : 0

  function alternarDia(dia: number) {
    setDias((atuais) => (atuais.includes(dia) ? atuais.filter((d) => d !== dia) : [...atuais, dia]))
  }

  function salvar(e: FormEvent) {
    e.preventDefault()
    if (minInicio === null || minFim === null || minInicio === minFim) return setErro('Confira o horário de início e de fim.')
    if (dias.length === 0) return setErro('Escolha pelo menos um dia.')
    const nome = titulo.trim() || materia?.nome || CATEGORIAS[categoria].nome
    dispatch({
      tipo: 'bloco/salvar',
      bloco: {
        id: inicial.id ?? crypto.randomUUID(),
        titulo: nome,
        categoria,
        dias: [...dias].sort(),
        inicio: minInicio,
        fim: minFim,
        materiaId: materia?.id,
        avisar: estudo && avisar,
      },
    })
    onClose()
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{inicial.id ? 'Editar bloco' : 'Novo bloco'}</DialogTitle>
        <DialogDescription>Um horário que se repete toda semana.</DialogDescription>
      </DialogHeader>

      <fieldset className="flex flex-col gap-2">
        <legend className={cn(ROTULO, 'mb-2')}>Categoria</legend>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Categoria">
          {LISTA_CATEGORIAS.map((c) => {
            const ativa = c === categoria
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={ativa}
                onClick={() => setCategoria(c)}
                className={cn(
                  'flex h-10 items-center gap-2 border-2 border-contorno px-3 text-xs font-semibold tracking-[0.06em] uppercase transition-[color,background-color,box-shadow,translate] duration-100 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  ativa
                    ? 'bg-foreground text-background motion-safe:translate-x-[2px] motion-safe:translate-y-[2px]'
                    : 'bg-card shadow-bloco-sm hover:bg-amarelo hover:text-tinta',
                )}
              >
                <PontoCor cor={CATEGORIAS[c].fundo} />
                {CATEGORIAS[c].nome}
              </button>
            )
          })}
        </div>
      </fieldset>

      {estudo && (
        <label className="flex flex-col gap-2">
          <span className={ROTULO}>Matéria</span>
          <Select value={materiaId} onValueChange={setMateriaId}>
            <SelectTrigger className={CAMPO_SELECT}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {materias.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  <PontoCor cor={m.cor} />
                  {m.nome}
                </SelectItem>
              ))}
              <SelectItem value={SEM_MATERIA}>Sem matéria</SelectItem>
            </SelectContent>
          </Select>
        </label>
      )}

      <label className="flex flex-col gap-2">
        <span className={ROTULO}>Nome</span>
        <Input
          className={CAMPO}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder={materia?.nome ?? CATEGORIAS[categoria].nome}
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className={cn(ROTULO, 'mb-2 flex w-full items-center justify-between')}>
          Dias
          <span className="flex gap-3 normal-case">
            <button type="button" className="underline underline-offset-2 hover:text-foreground" onClick={() => setDias(DIAS_UTEIS)}>
              Dias úteis
            </button>
            <button type="button" className="underline underline-offset-2 hover:text-foreground" onClick={() => setDias([0, 1, 2, 3, 4, 5, 6])}>
              Todos
            </button>
          </span>
        </legend>
        <div className="flex border-2 border-contorno">
          {DIAS_SEMANA.map(({ dia, curto, nome }) => {
            const ativo = dias.includes(dia)
            return (
              <button
                key={dia}
                type="button"
                aria-pressed={ativo}
                aria-label={nome}
                onClick={() => alternarDia(dia)}
                className={cn(
                  'h-9 flex-1 border-l-2 border-contorno text-xs font-semibold tracking-[0.06em] uppercase first:border-l-0 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  ativo ? 'bg-foreground text-background' : 'bg-card hover:bg-amarelo hover:text-tinta',
                )}
              >
                {curto}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-2">
          <span className={ROTULO}>Começa</span>
          <Input type="time" className={CAMPO} value={inicio} onChange={(e) => setInicio(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-2">
          <span className={ROTULO}>Termina</span>
          <Input type="time" className={CAMPO} value={fim} onChange={(e) => setFim(e.target.value)} required />
        </label>
      </div>
      {duracao > 0 && (
        <p className="-mt-2 text-xs text-muted-foreground">
          {formatarHorario(duracao).replace(':', 'h')} por dia
          {minFim !== null && minInicio !== null && minFim < minInicio && ', passando da meia-noite'}
        </p>
      )}

      {estudo && (
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={avisar} onCheckedChange={(v) => setAvisar(v === true)} />
          Avisar quando o bloco começar
        </label>
      )}

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <DialogFooter className={cn(RODAPE_DIALOG, 'border-t-2 border-contorno pt-3')}>
        {inicial.id && (
          <Button
            type="button"
            variant="ghost"
            className={cn(BOTAO, 'mr-auto text-destructive')}
            onClick={() => {
              dispatch({ tipo: 'bloco/excluir', id: inicial.id! })
              onClose()
            }}
          >
            <Trash2 />
            Excluir
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
