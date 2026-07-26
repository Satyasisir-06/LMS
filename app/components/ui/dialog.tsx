import { Fragment, type ReactNode } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "~/lib/utils";

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const contentVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 16 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, scale: 0.95, y: 16, transition: { duration: 0.15 } },
};

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  if (!open) return null;

  return (
    <Fragment>
      <motion.div
        className="fixed inset-0 z-50 bg-ink-900/60 backdrop-blur-sm"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={overlayVariants}
        onClick={() => onOpenChange(false)}
      />
      <motion.div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center p-4",
          className
        )}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={contentVariants}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <div className="w-full max-w-md glass-strong border border-gold-400/30 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="dialog-title" className="font-serif text-lg font-bold text-ink-800 dark:text-ivory">
                {title}
              </h2>
              {description && (
                <p id="dialog-description" className="mt-1 text-sm text-mist">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="flex-shrink-0 p-1 rounded-lg text-mist hover:text-ink-600 dark:hover:text-ivory hover:bg-ink-500/10 transition-colors"
              aria-label="Close dialog"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="mt-6">{children}</div>
        </div>
      </motion.div>
    </Fragment>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary" | "success";
  isLoading?: boolean;
  onConfirm: () => Promise<void> | void;
}) {
  const variantStyles = {
    danger: "bg-red-500 hover:bg-red-600 text-white",
    primary: "bg-gold-500 hover:bg-gold-600 text-ink-900",
    success: "bg-emerald-500 hover:bg-emerald-600 text-white",
  };

  const handleConfirm = async () => {
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // Error handled by caller
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
    >
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-ink-600 dark:text-ink-200 rounded-lg border border-gold-400/30 hover:bg-ink-500/10 transition-colors disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          disabled={isLoading}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50",
            variantStyles[variant]
          )}
        >
          {isLoading ? "Processing..." : confirmText}
        </button>
      </div>
    </Dialog>
  );
}