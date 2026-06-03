import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center font-normal whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[#0066cc] text-white hover:bg-[#0077dd] rounded-full px-[22px] py-[11px]",
        outline:
          "border border-[#0066cc] text-[#0066cc] bg-transparent hover:bg-[#0066cc]/10 rounded-full px-[22px] py-[11px]",
        secondary:
          "bg-[#1c1c1e] text-white hover:bg-[#2c2c2e] rounded-lg px-4 py-2 text-sm",
        ghost:
          "text-[#7a7a7a] hover:text-white hover:bg-[rgba(255,255,255,0.06)] rounded-lg",
        destructive:
          "bg-[#ff453a]/10 text-[#ff453a] hover:bg-[#ff453a]/20 rounded-full px-[22px] py-[11px]",
        link: "text-[#2997ff] underline-offset-4 hover:underline",
      },
      size: {
        default: "text-[17px] leading-none",
        xs: "text-xs px-2 py-1 rounded-lg",
        sm: "text-sm px-3 py-1.5 rounded-full",
        lg: "text-[17px] px-[28px] py-[14px] rounded-full",
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
