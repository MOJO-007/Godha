import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const duration = props.duration || 5000;
        return (
          <Toast 
            key={id} 
            {...props}
            style={{ ...props.style, "--toast-duration": `${duration}ms` } as React.CSSProperties}
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
            <div className="absolute bottom-0 left-0 h-1 bg-primary animate-shrink origin-left" />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
