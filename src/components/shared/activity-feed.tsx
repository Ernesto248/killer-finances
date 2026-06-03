import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, RefreshCw, FileText, DollarSign } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "cuadre" | "pago" | "wire" | "reventa" | "gasto";
  title: string;
  subtitle: string;
  date: string;
  amount?: string;
  positive?: boolean;
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  const icons = {
    cuadre: FileText,
    pago: DollarSign,
    wire: ArrowUpRight,
    reventa: RefreshCw,
    gasto: ArrowDownRight,
  };

  return (
    <div className="space-y-0.5">
      {items.map((item) => {
        const Icon = icons[item.type];
        return (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f9fafb] transition-colors"
          >
            <div
              className={cn(
                "size-8 rounded-lg flex items-center justify-center shrink-0",
                item.positive === false ? "bg-[#fef2f2]" : "bg-[#eff6ff]"
              )}
            >
              <Icon
                className={cn(
                  "size-4",
                  item.positive === false ? "text-[#dc2626]" : "text-[#2563eb]"
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.title}</p>
              <p className="text-xs text-[#6b7280]">
                {item.subtitle} · {item.date}
              </p>
            </div>
            {item.amount && (
              <span
                className={cn(
                  "text-sm font-semibold shrink-0",
                  item.positive
                    ? "text-[#059669]"
                    : item.positive === false
                      ? "text-[#dc2626]"
                      : "text-[#1a1a1a]"
                )}
              >
                {item.amount}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
