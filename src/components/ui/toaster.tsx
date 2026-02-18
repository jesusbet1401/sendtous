'use client';

import { useToast } from "./use-toast"
import { cn } from "@/lib/utils"

export function Toaster() {
    const { toasts } = useToast()

    if (!toasts.length) return null

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
            {toasts.map((t, i) => (
                <div
                    key={i}
                    className={cn(
                        "p-4 rounded-md shadow-lg border bg-white text-sm max-w-[300px] animate-in slide-in-from-right",
                        t.variant === 'destructive' ? "border-red-200 bg-red-50 text-red-900" : "border-slate-200 text-slate-900"
                    )}
                >
                    {t.title && <div className="font-semibold">{t.title}</div>}
                    {t.description && <div className="text-muted-foreground">{t.description}</div>}
                </div>
            ))}
        </div>
    )
}
