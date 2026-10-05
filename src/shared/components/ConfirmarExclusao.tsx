import type { ReactNode } from 'react'
import { BOTAO, CAMADA, RODAPE_DIALOG } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'

interface ConfirmarExclusaoProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  titulo: string
  descricao: ReactNode
  onConfirmar: () => void
  /** Saída mais branda que excluir (ex.: encerrar e manter o histórico), mostrada como ação principal. */
  alternativa?: { rotulo: string; onClick: () => void }
}

export function ConfirmarExclusao({
  aberto,
  onOpenChange,
  titulo,
  descricao,
  onConfirmar,
  alternativa,
}: ConfirmarExclusaoProps) {
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className={cn(CAMADA, alternativa ? 'sm:max-w-md' : 'sm:max-w-sm')}>
        <DialogHeader>
          <DialogTitle className="font-medium">{titulo}</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>
        <DialogFooter className={RODAPE_DIALOG}>
          <DialogClose asChild>
            <Button variant="outline" className={BOTAO}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            className={BOTAO}
            onClick={() => {
              onConfirmar()
              onOpenChange(false)
            }}
          >
            {alternativa ? 'Excluir de vez' : 'Excluir'}
          </Button>
          {alternativa && (
            <Button
              className={BOTAO}
              onClick={() => {
                alternativa.onClick()
                onOpenChange(false)
              }}
            >
              {alternativa.rotulo}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
