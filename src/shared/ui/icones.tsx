import type { ReactElement, SVGProps } from 'react'
import * as Pixel from 'pixelarticons/react'

/**
 * Ícones do app em pixel art (Pixelarticons, MIT), desenhados numa grade de 24×24.
 * Os nomes seguem o lucide, que o app usava antes, para trocar o import sem mexer no JSX.
 * Onde existe, vale a variante `Sharp` (cantos retos). Tamanho nítido: 24px (`size-6`) ou 12px (`size-3`).
 */
type PropsIcone = SVGProps<SVGSVGElement> & { strokeWidth?: number | string }

/** As peças da coleção são funções puras (sem hooks): chamá-las direto evita um componente a mais. */
const pixel =
  (Desenho: (props: SVGProps<SVGSVGElement>) => ReactElement) =>
  ({ strokeWidth: _traco, ...props }: PropsIcone) =>
    Desenho({ shapeRendering: 'crispEdges', 'aria-hidden': props['aria-label'] ? undefined : true, ...props })

/** Quadrado cheio (botão de parar): o `Square` da coleção é só o contorno. */
const quadradoCheio = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M5 5h14v14H5z" />
  </svg>
)

export const Play = pixel(Pixel.Play)
export const Clock = pixel(Pixel.Clock)
export const ImagePlus = pixel(Pixel.Image2PlusSharp)
export const Hourglass = pixel(Pixel.HourglassSharp)
export const Target = pixel(Pixel.Target)
export const Coffee = pixel(Pixel.CoffeeSharp)
export const Monitor = pixel(Pixel.MonitorSharp)
export const Notes = pixel(Pixel.NotesSharp)
export const Trophy = pixel(Pixel.TrophySharp)
export const Zap = pixel(Pixel.Zap)
export const FolderOpen = pixel(Pixel.FolderSharp)
export const Archive = pixel(Pixel.ArchiveSharp)
export const ArchiveRestore = pixel(Pixel.ArrowUpBoxSharp)
export const ArrowDown = pixel(Pixel.ArrowDown)
export const ArrowLeft = pixel(Pixel.ArrowLeft)
export const ArrowLeftRight = pixel(Pixel.ArrowsHorizontal)
export const ArrowRight = pixel(Pixel.ArrowRight)
export const ArrowUp = pixel(Pixel.ArrowUp)
export const Bell = pixel(Pixel.BellSharp)
export const BellOff = pixel(Pixel.BellOffSharp)
export const BellRing = pixel(Pixel.BellRingSharp)
export const Calculator = pixel(Pixel.CalculatorSharp)
export const CalendarCheck = pixel(Pixel.CalendarTextSharp)
export const CalendarDays = pixel(Pixel.CalendarSharp)
export const ChartColumn = pixel(Pixel.ChartSharp)
export const Check = pixel(Pixel.Check)
export const ChevronDown = pixel(Pixel.ChevronDown)
export const ChevronLeft = pixel(Pixel.ChevronLeft)
export const ChevronRight = pixel(Pixel.ChevronRight)
export const ChevronUp = pixel(Pixel.ChevronUp)
export const ChevronsUpDown = pixel(Pixel.ChevronsVertical)
export const CircleHelp = pixel(Pixel.CircleQuestion)
export const DatabaseBackup = pixel(Pixel.SaveSharp)
export const Download = pixel(Pixel.DownloadSharp)
export const Eye = pixel(Pixel.Eye)
export const EyeOff = pixel(Pixel.EyeOff)
export const FolderInput = pixel(Pixel.FolderSharp)
export const Landmark = pixel(Pixel.BuildingSharp)
export const LogOut = pixel(Pixel.LogoutSharp)
export const MessagesSquare = pixel(Pixel.MessageTextSharp)
export const Minus = pixel(Pixel.Minus)
export const Moon = pixel(Pixel.Moon)
export const Pause = pixel(Pixel.Pause)
export const Pencil = pixel(Pixel.Pencil)
export const PiggyBank = pixel(Pixel.Coins)
export const Plus = pixel(Pixel.Plus)
export const RefreshCw = pixel(Pixel.ReloadSharp)
export const Search = pixel(Pixel.Search)
export const Settings2 = pixel(Pixel.Gear)
export const Shapes = pixel(Pixel.Shapes)
export const SlidersHorizontal = pixel(Pixel.SlidersHorizontal)
export const Sparkles = pixel(Pixel.Sparkles)
export const Square = pixel(quadradoCheio)
export const SquarePen = pixel(Pixel.PenSquareSharp)
export const Sun = pixel(Pixel.Sun)
export const Table2 = pixel(Pixel.Grid3x3Sharp)
export const Tag = pixel(Pixel.LabelSharp)
export const Trash2 = pixel(Pixel.TrashSharp)
export const Undo2 = pixel(Pixel.UndoSharp)
export const Upload = pixel(Pixel.UploadSharp)
export const Wallet = pixel(Pixel.WalletSharp)
export const X = pixel(Pixel.Close)
