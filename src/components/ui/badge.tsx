import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-fit w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full px-3.5 py-1 text-sm font-normal whitespace-nowrap transition-all",
  {
    variants: {
      variant: {
        default: "bg-[#0066cc]/20 text-[#0066cc]",
        secondary: "bg-[#1c1c1e] text-[#7a7a7a] ring-1 ring-border",
        destructive: "bg-[#ff453a]/10 text-[#ff453a]",
        outline: "ring-1 ring-border text-foreground",
        success: "bg-[#30d158]/15 text-[#30d158]",
        warning: "bg-[#ff9f0a]/15 text-[#ff9f0a]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      { className: cn(badgeVariants({ variant }), className) },
      props
    ),
    render,
    state: { slot: "badge", variant },
  })
}

export { Badge, badgeVariants }
