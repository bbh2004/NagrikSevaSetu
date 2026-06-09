/**
 * toast.js — Re-exports react-hot-toast with project-default options.
 *
 * WHY this wrapper?
 *   If we ever switch from react-hot-toast to another library, we only
 *   change this single file, not every component that shows a toast.
 *
 * Usage:
 *   import { toast } from '../utils/toast'
 *   toast.success('Status updated!')
 *   toast.error('Something went wrong.')
 */
import { toast as _toast } from 'react-hot-toast'

const defaultStyle = {
  borderRadius: '8px',
  fontSize: '14px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
}

export const toast = {
  success: (msg) => _toast.success(msg, {
    duration: 3500,
    style: { ...defaultStyle, background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' },
    iconTheme: { primary: '#16a34a', secondary: '#fff' },
  }),
  error: (msg) => _toast.error(msg, {
    duration: 5000,
    style: { ...defaultStyle, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' },
    iconTheme: { primary: '#dc2626', secondary: '#fff' },
  }),
  loading: (msg) => _toast.loading(msg, {
    style: { ...defaultStyle, background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' },
  }),
  dismiss: _toast.dismiss,
  promise: _toast.promise,
}

export default toast
