import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";
import type { RecordStatus } from "@/types/db";

export function AppShell({
  title,
  description,
  actions,
  children
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="rounded-[28px] bg-white p-6 shadow-panel">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-accent">ABLE RUNNING CHALLENGE</p>
            {title ? <h1 className="mt-2 text-3xl font-semibold">{title}</h1> : null}
            {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </header>
      {children}
    </main>
  );
}

export function Panel({
  title,
  description,
  children,
  className
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-[28px] bg-white p-5 shadow-panel", className)}>
      {title ? <h2 className="text-lg font-semibold">{title}</h2> : null}
      {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      <div className={cn(title || description ? "mt-4" : "")}>{children}</div>
    </section>
  );
}

export function MetricCard({
  label,
  value,
  hint
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-3xl bg-sand p-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary"
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold",
        variant === "primary"
          ? "bg-ink text-white hover:bg-slate-800"
          : "border border-slate-200 bg-white text-ink hover:border-slate-400"
      )}
    >
      {children}
    </Link>
  );
}

export function Input({
  label,
  name,
  type = "text",
  inputMode,
  defaultValue,
  placeholder,
  required,
  min,
  max,
  step,
  children
}: {
  label: string;
  name: string;
  type?: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
  defaultValue?: string | number | null;
  placeholder?: string;
  required?: boolean;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  children?: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <input
        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base"
        name={name}
        type={type}
        inputMode={inputMode}
        defaultValue={defaultValue ?? undefined}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
      />
      {children}
    </label>
  );
}

export function Select({
  label,
  name,
  defaultValue,
  required,
  options
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base"
      >
        <option value="">선택해주세요</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Textarea({
  label,
  name,
  defaultValue,
  placeholder
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <textarea
        name={name}
        rows={3}
        defaultValue={defaultValue ?? undefined}
        placeholder={placeholder}
        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base"
      />
    </label>
  );
}

export function SubmitButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="submit"
      className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white hover:brightness-95"
    >
      {children}
    </button>
  );
}

export function StatusBadge({ status }: { status: RecordStatus }) {
  const classes =
    status === "approved"
      ? "bg-mint text-emerald-800"
      : status === "warning"
        ? "bg-amber-100 text-amber-800"
        : "bg-rose-100 text-rose-700";

  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", classes)}>
      {status}
    </span>
  );
}

export function AlertMessage({
  message,
  type = "error"
}: {
  message?: string;
  type?: "error" | "success";
}) {
  if (!message) return null;

  return (
    <div
      className={cn(
        "rounded-2xl px-4 py-3 text-sm",
        type === "error" ? "bg-rose-100 text-rose-700" : "bg-mint text-emerald-800"
      )}
    >
      {message}
    </div>
  );
}

export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
      <p className="text-base font-semibold">{title}</p>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  );
}
