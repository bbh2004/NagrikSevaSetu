/**
 * ui.jsx — Unified Design System Components for NagrikSevaSetu Portal
 *
 * Design Principles:
 *  - Consistent with admin portal aesthetic (clean white cards, navy accents)
 *  - Accessible: focus rings, aria labels, semantic HTML
 *  - RBAC-friendly: visual hierarchy for different roles
 */
import { cva } from "class-variance-authority";
import { twMerge } from "tailwind-merge";
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from "lucide-react";

/** Utilities */
// eslint-disable-next-line react-refresh/only-export-components
export function cn(...inputs) {
  return twMerge(inputs);
}

// ── Card ────────────────────────────────────────────────────────
export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "bg-white border border-gray-100 rounded-2xl card-shadow flex flex-col",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div
      className={cn("px-5 py-4 border-b border-gray-100 flex-shrink-0", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn("text-title-lg text-gray-900 font-semibold", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn("p-5 flex-1", className)} {...props}>
      {children}
    </div>
  );
}

// ── Button ───────────────────────────────────────────────────────
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-200 focus-visible-ring disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white hover:bg-primary-container shadow-sm hover:shadow-md active:scale-95",
        secondary:
          "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95",
        outline:
          "border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 active:scale-95",
        ghost:
          "text-gray-600 hover:bg-gray-100 active:scale-95",
        danger:
          "bg-red-600 text-white hover:bg-red-700 shadow-sm active:scale-95",
        "danger-outline":
          "border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 active:scale-95",
        success:
          "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm active:scale-95",
        indigo:
          "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm active:scale-95",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm:      "h-8  px-3 py-1 text-xs rounded-lg",
        lg:      "h-12 px-7 py-3 text-base rounded-xl",
        icon:    "h-9  w-9  p-2  rounded-lg",
        "icon-sm":"h-7 w-7  p-1.5 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size:    "default",
    },
  }
);

export function Button({ className, variant, size, ...props }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

// ── Badge ────────────────────────────────────────────────────────
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-semibold text-xs px-2.5 py-1 select-none",
  {
    variants: {
      variant: {
        default:  "bg-gray-100 text-gray-600",
        success:  "bg-emerald-100 text-emerald-700",
        warning:  "bg-amber-100 text-amber-700",
        danger:   "bg-red-100 text-red-700",
        info:     "bg-blue-100 text-blue-700",
        indigo:   "bg-indigo-100 text-indigo-700",
        // Legacy aliases
        approved: "bg-emerald-100 text-emerald-700",
        pending:  "bg-amber-100 text-amber-700",
        urgent:   "bg-red-100 text-red-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function Badge({ className, variant, dot, children, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props}>
      {dot !== false && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full flex-shrink-0",
            variant === "success" || variant === "approved" ? "bg-emerald-500" :
            variant === "warning" || variant === "pending"  ? "bg-amber-400"   :
            variant === "danger"  || variant === "urgent"   ? "bg-red-500"     :
            variant === "info"                              ? "bg-blue-500"    :
            variant === "indigo"                            ? "bg-indigo-500"  :
            "bg-gray-400"
          )}
        />
      )}
      {children}
    </span>
  );
}

// ── Input ────────────────────────────────────────────────────────
export function Input({ className, error, ...props }) {
  return (
    <input
      className={cn(
        "h-10 w-full border rounded-xl px-3.5 py-2 bg-white text-sm text-gray-900",
        "placeholder:text-gray-400 transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
        error
          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
          : "border-gray-200 hover:border-gray-300",
        className
      )}
      {...props}
    />
  );
}

// ── Textarea ─────────────────────────────────────────────────────
export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 bg-white text-sm text-gray-900",
        "placeholder:text-gray-400 transition-all duration-200 resize-none",
        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-gray-300",
        className
      )}
      {...props}
    />
  );
}

// ── Label ────────────────────────────────────────────────────────
export function Label({ className, children, htmlFor, required, ...props }) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("text-sm font-medium text-gray-700 block mb-1.5", className)}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

// ── Table ────────────────────────────────────────────────────────
export function Table({ className, children, ...props }) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn("w-full text-left border-collapse", className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function THead({ className, children, ...props }) {
  return (
    <thead
      className={cn("bg-gray-50/80 border-b border-gray-100", className)}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TBody({ className, children, ...props }) {
  return (
    <tbody
      className={cn("divide-y divide-gray-50", className)}
      {...props}
    >
      {children}
    </tbody>
  );
}

export function TR({ className, children, clickable, ...props }) {
  return (
    <tr
      className={cn(
        "transition-colors duration-150",
        clickable ? "cursor-pointer hover:bg-blue-50/40" : "hover:bg-gray-50/60",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TH({ className, children, ...props }) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap",
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TD({ className, children, ...props }) {
  return (
    <td
      className={cn("px-4 py-3.5 text-sm text-gray-700", className)}
      {...props}
    >
      {children}
    </td>
  );
}

// ── Modal ─────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, actions, size = "md" }) {
  if (!open) return null;
  const maxW = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }[size] || "max-w-lg";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          "relative w-full bg-white rounded-2xl card-shadow-lg z-10 flex flex-col",
          "max-h-[90vh] overflow-hidden animate-fade-in-up",
          maxW
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <h3 className="text-title-lg text-gray-900 font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {children}
        </div>
        {/* Footer */}
        {actions && (
          <div className="border-t border-gray-100 px-6 py-4 flex justify-end gap-3 flex-shrink-0 bg-gray-50/50 rounded-b-2xl">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Alert ─────────────────────────────────────────────────────────
const ALERT_VARIANTS = {
  error: {
    container: "bg-red-50 border-red-200 text-red-800",
    icon:      <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />,
  },
  warning: {
    container: "bg-amber-50 border-amber-200 text-amber-800",
    icon:      <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />,
  },
  success: {
    container: "bg-emerald-50 border-emerald-200 text-emerald-800",
    icon:      <CheckCircle size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />,
  },
  info: {
    container: "bg-blue-50 border-blue-200 text-blue-800",
    icon:      <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />,
  },
};

export function Alert({ variant = "info", title, children, onClose, action, className }) {
  const v = ALERT_VARIANTS[variant] || ALERT_VARIANTS.info;
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 animate-fade-in",
        v.container,
        className
      )}
    >
      {v.icon}
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold text-sm mb-0.5">{title}</p>}
        <p className="text-sm leading-relaxed">{children}</p>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────
export function Spinner({ size = 20, className }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ── SkeletonBlock ─────────────────────────────────────────────────
export function SkeletonBlock({ className }) {
  return <div className={cn("skeleton", className)} />;
}

// ── Avatar / UserChip ─────────────────────────────────────────────
export function Avatar({ name, role, size = "md", className }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const sizeCls = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-11 h-11 text-base",
  }[size];

  // Color based on role
  const bg = role === 'admin' || role === 'main_officer'
    ? 'bg-indigo-600'
    : role === 'department_staff'
    ? 'bg-primary'
    : 'bg-gray-500';

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 select-none",
        bg, sizeCls, className
      )}
      title={name}
      aria-label={`Avatar for ${name}`}
    >
      {initials}
    </div>
  );
}

// ── StatCard (compact KPI) ────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, accent = "text-indigo-600", sub, loading, className }) {
  const bgAccent =
    accent.includes("red")     ? "bg-red-50"     :
    accent.includes("amber")   ? "bg-amber-50"   :
    accent.includes("emerald") ? "bg-emerald-50" :
    accent.includes("indigo")  ? "bg-indigo-50"  :
    "bg-gray-50";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-white border border-gray-100 card-shadow p-5",
        "transition-shadow duration-200 hover:card-shadow-md",
        className
      )}
    >
      <div className="flex justify-between items-start">
        <div className="min-w-0">
          <p className="text-caption text-gray-400 mb-1">{label}</p>
          {loading ? (
            <div className="skeleton h-9 w-20 rounded-lg mt-1" />
          ) : (
            <p className={cn("text-4xl font-bold mt-1 leading-none", accent)}>
              {value ?? 0}
            </p>
          )}
          {sub && !loading && (
            <p className="text-xs text-gray-400 mt-1.5">{sub}</p>
          )}
        </div>
        {Icon && (
          <div className={cn("p-2.5 rounded-xl flex-shrink-0", bgAccent)}>
            <Icon size={20} className={accent} />
          </div>
        )}
      </div>
      {/* Bottom accent strip */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-0.5",
          accent.includes("red")     ? "bg-red-400"     :
          accent.includes("amber")   ? "bg-amber-400"   :
          accent.includes("emerald") ? "bg-emerald-400" :
          accent.includes("indigo")  ? "bg-indigo-400"  :
          "bg-gray-300"
        )}
      />
    </div>
  );
}

// ── Section Divider ───────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 mb-4", className)}>
      <div>
        <h2 className="text-title-lg text-gray-900 font-semibold">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, message, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-center",
        className
      )}
    >
      {Icon && <Icon size={40} className="text-gray-200 mb-2" />}
      <p className="text-sm font-semibold text-gray-400">{title}</p>
      {message && <p className="text-xs text-gray-300 max-w-xs">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ── Page Header ───────────────────────────────────────────────────
export function PageHeader({ title, subtitle, icon: Icon, action, back, className }) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {back && <div className="flex-shrink-0">{back}</div>}
        {Icon && <Icon size={22} className="text-indigo-500 flex-shrink-0" />}
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// ── Select (styled) ───────────────────────────────────────────────
export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        "h-9 border border-gray-200 rounded-lg text-sm px-3 py-1.5 bg-white",
        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
        "text-gray-700 font-medium cursor-pointer hover:border-gray-300 transition-colors",
        "appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")] bg-no-repeat bg-[right_10px_center] pr-8",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

// ── Divider ───────────────────────────────────────────────────────
export function Divider({ className, label }) {
  if (label) {
    return (
      <div className={cn("flex items-center gap-3 my-4", className)}>
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-400 font-medium">{label}</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>
    );
  }
  return <hr className={cn("border-gray-100 my-4", className)} />;
}
