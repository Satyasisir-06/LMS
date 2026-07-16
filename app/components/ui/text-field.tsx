import { forwardRef, useId, useState } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { cn } from "~/lib/utils";

export interface TextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  icon?: LucideIcon;
  error?: string;
  hint?: string;
  /** Renders a show/hide toggle (forces type=password). */
  reveal?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, icon: Icon, error, hint, reveal, className, type, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const [visible, setVisible] = useState(false);
    const inputType = reveal ? (visible ? "text" : "password") : type;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium uppercase tracking-[0.12em] text-mist"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <Icon
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mist"
              aria-hidden
            />
          )}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={cn(
              "h-11 w-full rounded-xl border bg-ink-950/5 px-3.5 text-sm text-ink-800 transition-all duration-200 placeholder:text-mist/60",
              "dark:bg-ink-950/40 dark:text-ink-100",
              "border-gold-400/15 focus:border-gold-400/50 focus:ring-2 focus:ring-gold-400/25 focus:outline-none",
              Icon && "pl-10",
              reveal && "pr-11",
              error && "border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20",
              className,
            )}
            aria-invalid={!!error}
            {...props}
          />
          {reveal && (
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-mist transition-colors hover:text-gold-400"
              tabIndex={-1}
              aria-label={visible ? "Hide password" : "Show password"}
            >
              {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          )}
        </div>
        {error ? (
          <p className="text-xs text-red-500">{error}</p>
        ) : hint ? (
          <p className="text-xs text-mist">{hint}</p>
        ) : null}
      </div>
    );
  },
);
TextField.displayName = "TextField";
