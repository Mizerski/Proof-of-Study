import * as React from "react"
import { Check, Minus } from "@/shared/ui/icones"
import { cn } from "cn"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

/** Quadrado com contorno preto; marcado (ou parcial), vira bloco preto com o ✓ (ou –) no papel. */
function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer flex size-[1.125rem] shrink-0 items-center justify-center rounded-none border-2 border-contorno bg-card text-background transition-colors duration-100 outline-none hover:bg-amarelo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-foreground data-[state=indeterminate]:bg-foreground",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="flex items-center justify-center">
        {props.checked === "indeterminate" ? (
          <Minus strokeWidth={3.5} className="size-3" />
        ) : (
          <Check strokeWidth={3.5} className="size-3" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
