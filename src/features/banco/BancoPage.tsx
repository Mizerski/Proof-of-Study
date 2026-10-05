import { useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { CabecalhoPagina } from '@/shared/components/CabecalhoPagina'
import { CaixaDestaque } from '@/shared/components/CaixaDestaque'
import { EstadoVazio } from '@/shared/components/EstadoVazio'
import { PontoCor } from '@/shared/components/PontoCor'
import { formatarHM, inicioDaSemana, rotuloSemana } from '@/shared/lib/datas'
import { BOTAO } from '@/shared/lib/estilos'
import { FORMA_PAGINA } from '@/shared/lib/formas'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Pencil } from '@/shared/ui/icones'
import { useDados } from '@/store/context/dados-context'
import type { Materia } from '@/store/model/dados'
import { DialogMateria } from '@/features/materias/components/DialogMateria'
import { estudoRestanteNaSemana } from '@/features/rotina/utils/rotina'
import { taxaDeFoco } from '@/features/sessao/utils/resumo'
import { CardDiasDeEstudo, CardHorasFocadas } from './components/CardsBanco'
import { CardSessoes } from './components/CardSessoes'
import { DialogMeta } from './components/DialogMeta'
import { metaDaSemana, numeroDaEtapa, saldoDaMateria, sessoesDaSemana } from './utils/banco'

/** Banco da semana de uma matéria: a meta, se ela cabe na rotina, as horas focadas, os dias e as sessões. */
export function BancoPage() {
  const { dados } = useDados()
  const busca = useSearch({ from: '/banco' })
  const navigate = useNavigate({ from: '/banco' })
  const agora = new Date()
  const semana = inicioDaSemana(agora)
  const [editandoMateria, setEditandoMateria] = useState<Materia | 'nova' | null>(null)
  const [editandoMeta, setEditandoMeta] = useState(false)

  const ativas = dados.materias.filter((m) => !m.arquivada)
  const materia =
    ativas.find((m) => m.id === busca.materia) ??
    ativas.find((m) => metaDaSemana(dados.metas, m.id, semana)) ??
    ativas[0]

  if (!materia) {
    return (
      <>
        <EstadoVazio
          titulo="Nenhuma matéria"
          descricao="Crie o que você estuda (Inglês, Programação…) para definir a meta da semana."
          acao={
            <Button className={BOTAO} onClick={() => setEditandoMateria('nova')}>
              + Nova matéria
            </Button>
          }
        />
        <DialogMateria materia={editandoMateria} onClose={() => setEditandoMateria(null)} />
      </>
    )
  }

  const saldo = saldoDaMateria(dados, materia, semana)
  const meta = saldo.meta
  const sessoes = sessoesDaSemana(dados.sessoes, semana).filter((s) => s.materiaId === materia.id)
  const foco = sessoes.reduce((s, x) => s + x.focoMs, 0)
  const fora = sessoes.reduce((s, x) => s + x.foraMs, 0)
  const faltam = meta ? Math.max(0, meta.minutos * 60_000 - saldo.noBancoMs) : 0
  const disponivel = estudoRestanteNaSemana(dados.blocos, materia.id, agora) * 60_000

  return (
    <div className="flex flex-col gap-4">
      <CabecalhoPagina
        forma={FORMA_PAGINA.banco}
        trilha={`${materia.nome} › ${meta ? `Etapa ${numeroDaEtapa(dados.metas, materia.id, semana)} · ` : ''}${rotuloSemana(semana)}`}
        titulo={
          <>
            Banco de horas <span>{meta?.descricao || materia.nome}</span>
          </>
        }
        acoes={
          <Button variant="outline" className={BOTAO} onClick={() => setEditandoMeta(true)}>
            {meta ? 'Editar meta' : 'Definir meta'}
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2.5">
        {ativas.map((m) => {
          const ativa = m.id === materia.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => void navigate({ search: { materia: m.id } })}
              className={cn(
                'flex h-9 items-center gap-2 border-2 border-contorno px-3 text-xs font-semibold tracking-[0.06em] uppercase transition-[color,background-color,box-shadow,translate] duration-100',
                ativa
                  ? 'translate-x-[2px] translate-y-[2px] bg-foreground text-background'
                  : 'bg-card shadow-bloco-sm hover:bg-amarelo hover:text-tinta',
              )}
            >
              <PontoCor cor={m.cor} />
              {m.nome}
            </button>
          )
        })}
        <Button variant="ghost" size="icon" className="rounded-full" aria-label={`Editar ${materia.nome}`} onClick={() => setEditandoMateria(materia)}>
          <Pencil />
        </Button>
        <button
          type="button"
          onClick={() => setEditandoMateria('nova')}
          className="text-xs font-semibold tracking-[0.06em] uppercase underline underline-offset-4 hover:text-vermelho"
        >
          + Matéria
        </button>
      </div>

      {meta ? (
        <CaixaDestaque fundo="bg-banco-suave" faixa="border-l-amarelo" className="text-sm leading-normal">
          {faltam === 0 ? (
            <p>
              <b>Meta cumprida.</b> {formatarHM(saldo.noBancoMs)} no banco nesta semana.
            </p>
          ) : (
            <p>
              <b>{faltam <= disponivel ? 'Cabe na rotina.' : 'Vai faltar tempo.'}</b> Faltam {formatarHM(faltam)} para a meta e a
              rotina tem {formatarHM(disponivel)} de estudo de {materia.nome} até domingo.
            </p>
          )}
        </CaixaDestaque>
      ) : (
        <CaixaDestaque fundo="bg-banco-suave" faixa="border-l-amarelo" className="text-sm">
          <p>
            <b>Sem meta nesta semana.</b> Defina o que estudar e quantas horas focadas espera ter.
          </p>
        </CaixaDestaque>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
        <CardHorasFocadas saldo={saldo} taxa={sessoes.length ? taxaDeFoco(foco, fora) : null} />
        <CardDiasDeEstudo semana={semana} materiaId={materia.id} blocos={dados.blocos} sessoes={sessoes} />
      </div>

      <CardSessoes sessoes={sessoes} />

      <DialogMateria materia={editandoMateria} onClose={() => setEditandoMateria(null)} />
      <DialogMeta alvo={editandoMeta ? { materia, semana } : null} onClose={() => setEditandoMeta(false)} />
    </div>
  )
}
