import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatInputNumber(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;
  if (isNaN(num)) return "";
  return new Intl.NumberFormat("en-US").format(num);
}

export function formatCurrency(amount: number, currency: "USD" | "CUP"): string {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + " USD";
  }
  return new Intl.NumberFormat("es-CU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " CUP";
}
