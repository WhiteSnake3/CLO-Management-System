"use client";

export default function StatsCard({
  title,
  value,
  subtitle,
  bgColor = "bg-blue-50",
  textColor = "text-blue-600",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  bgColor?: string;
  textColor?: string;
}) {
  return (
    <div className={`${bgColor} p-6 rounded-lg border border-slate-200`}>
      <p className="text-sm text-slate-600 mb-2">{title}</p>
      <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}
