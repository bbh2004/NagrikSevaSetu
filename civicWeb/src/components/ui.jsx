export function Card({ className = '', children, ...props }) {
  return <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`} {...props}>{children}</div>
}

export function CardHeader({ className = '', children }) {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
}

export function CardTitle({ className = '', children }) {
  return <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
}

export function CardContent({ className = '', children }) {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>
}

export function Button({ className = '', variant = 'default', ...props }) {
  const variants = {
    default: 'bg-primary text-primary-foreground hover:opacity-90',
    outline: 'border bg-transparent hover:bg-accent',
    secondary: 'bg-secondary text-secondary-foreground hover:opacity-90',
  }
  return <button className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition ${variants[variant]} ${className}`} {...props} />
}

export function Badge({ className = '', variant = 'default', children }) {
  const variants = {
    default: 'bg-secondary text-secondary-foreground',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
  }
  return <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs ${variants[variant]} ${className}`}>{children}</span>
}

export function Table({ children }) {
  return <div className="overflow-x-auto"><table className="w-full text-sm">{children}</table></div>
}
export function THead({ children }) { return <thead className="text-left text-xs uppercase text-muted-foreground">{children}</thead> }
export function TBody({ children }) { return <tbody className="divide-y">{children}</tbody> }
export function TR({ children }) { return <tr className="hover:bg-accent/50">{children}</tr> }
export function TH({ children, className='' }) { return <th className={`px-3 py-2 ${className}`}>{children}</th> }
export function TD({ children, className='' }) { return <td className={`px-3 py-2 ${className}`}>{children}</td> }


export function Input({ className = '', ...props }) {
  return <input className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary ${className}`} {...props} />
}

export function Label({ className = '', children, htmlFor }) {
  return <label htmlFor={htmlFor} className={`mb-1 block text-xs font-medium text-muted-foreground ${className}`}>{children}</label>
}

export function Modal({ open, onClose, title, children, actions }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-lg border bg-white p-4 shadow-lg">
        {title && <div className="mb-3 text-base font-semibold">{title}</div>}
        <div className="space-y-3">{children}</div>
        {actions && <div className="mt-4 flex justify-end gap-2">{actions}</div>}
      </div>
    </div>
  )
}



