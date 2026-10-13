import { forwardRef, type SelectHTMLAttributes } from "react";

export type SelectOption = { value: string; label: string };

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
};

const Select = forwardRef<HTMLSelectElement, Props>(
  ({ label, options, placeholder, error, id, ...props }, ref) => (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
      </label>

      <select
        {...props}
        id={id}
        ref={ref}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm
          text-slate-900 shadow-sm outline-none
          focus:border-primary-500 focus:ring-4 focus:ring-primary-100
          ${error ? "border-red-500" : "border-slate-300"}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
);

Select.displayName = "Select";
export default Select;
