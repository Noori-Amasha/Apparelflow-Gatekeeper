import {
  forwardRef,
  type InputHTMLAttributes,
} from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, hint, id, className = "", ...props }, ref) => (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        {...props}
        ref={ref}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm
          text-slate-900 shadow-sm outline-none transition
          placeholder:text-slate-400 focus:border-primary-500
          focus:ring-4 focus:ring-primary-100
          disabled:bg-slate-100 disabled:text-slate-500
          ${error ? "border-red-500" : "border-slate-300"} ${className}`}
      />

      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}

      {!error && hint && (
        <p id={`${id}-hint`} className="text-xs text-slate-500">{hint}</p>
      )}
    </div>
  )
);

Input.displayName = "Input";
export default Input;
