import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[#2563eb] text-white hover:bg-[#1d4ed8] rounded-xl px-5 py-2.5 shadow-sm",
        outline:
          "border border-[#2563eb]/30 text-[#2563eb] bg-white hover:bg-[#eff6ff] rounded-xl px-5 py-2.5",
        secondary:
          "bg-[#f3f4f6] text-[#1a1a1a] hover:bg-[#e5e7eb] rounded-xl px-4 py-2.5",
        ghost:
          "text-[#6b7280] hover:text-[#1a1a1a] hover:bg-[#f3f4f6] rounded-lg",
        destructive:
          "bg-[#dc2626] text-white hover:bg-[#b91c1c] rounded-xl px-5 py-2.5 shadow-sm",
        link: "text-[#2563eb] underline-offset-4 hover:underline",
      },
      size: {
        default: "text-sm",
        xs: "text-xs px-2 py-1 rounded-lg",
        sm: "text-xs px-3 py-1.5 rounded-lg",
        lg: "text-base px-6 py-3 rounded-xl",
        icon: "size-9 rounded-full p-0",
        "icon-sm": "size-8 rounded-full p-0",
        "icon-lg": "size-11 rounded-full p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
