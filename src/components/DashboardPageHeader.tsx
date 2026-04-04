import { ReactNode } from "react";

interface DashboardPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function DashboardPageHeader({ title, subtitle, actions }: DashboardPageHeaderProps) {
  return (
    <div className="mb-6 flex justify-between items-start">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
}
