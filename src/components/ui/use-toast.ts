// Minimal version of use-toast for this project
import { useState, useEffect } from "react"

export type ToastProps = {
    title?: string
    description?: string
    variant?: "default" | "destructive"
}

let listeners: Array<(toast: ToastProps) => void> = []

function emit(toast: ToastProps) {
    listeners.forEach((listener) => listener(toast))
}

export function useToast() {
    const [toasts, setToasts] = useState<ToastProps[]>([])

    useEffect(() => {
        const listener = (toast: ToastProps) => {
            setToasts((prev) => [...prev, toast])
            // Auto dismiss after 3s
            setTimeout(() => {
                setToasts((prev) => prev.slice(1))
            }, 3000)
        }
        listeners.push(listener)
        return () => {
            listeners = listeners.filter((l) => l !== listener)
        }
    }, [])

    return {
        toasts,
        toast: (props: ToastProps) => emit(props),
        dismiss: () => setToasts([]),
    }
}
