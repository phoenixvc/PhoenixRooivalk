import type { ReactNode } from "react";

interface QuickAction {
  icon: ReactNode;
  label: string;
  action: () => void | Promise<void>;
}

interface QuickActionsWidgetProps {
  actions: QuickAction[];
}

export function QuickActionsWidget({ actions }: QuickActionsWidgetProps) {
  return (
    <nav
      className="fixed bottom-6 right-6 z-50"
      aria-label="Quick actions"
    >
      <div className="bg-[var(--darker,#020617)] border border-[var(--primary,#f97316)] rounded-lg p-3 shadow-2xl max-w-xs">
        <div className="text-[var(--primary,#f97316)] font-bold mb-2 text-sm">
          Quick Actions
        </div>
        <div className="space-y-1">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              type="button"
              className="w-full text-left text-xs text-white hover:text-[var(--primary,#f97316)] hover:-translate-y-0.5 transform transition py-1 flex items-center gap-2 rounded focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--pr-brand-orange,#f97316)]"
            >
              <span aria-hidden="true">{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
