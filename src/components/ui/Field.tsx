import { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

interface FieldShellProps {
  label?: string;
  hint?: string;
  children: ReactNode;
}

const FieldShell = ({ label, hint, children }: FieldShellProps) => (
  <label className="block space-y-2">
    {label && <span className="block text-sm font-semibold text-slate-700">{label}</span>}
    {children}
    {hint && <span className="block text-xs text-slate-500">{hint}</span>}
  </label>
);

export const TextInput = ({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={`h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50 ${className}`}
    {...props}
  />
);

export const TextArea = ({
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50 ${className}`}
    {...props}
  />
);

export default FieldShell;
