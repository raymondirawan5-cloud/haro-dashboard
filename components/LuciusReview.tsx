"use client";

import * as React from "react";

type PrincipleStatus = "completed" | "applied" | "pending";

interface Principle {
  id: string;
  name: string;
  description: string;
  status: PrincipleStatus;
  category: "motion" | "architecture" | "feedback" | "accessibility";
}

const PRINCIPLES: Principle[] = [
  {
    id: "consistent-spacing",
    name: "8px Grid Spacing",
    description: "Consistent spacing scale (4-8-12-16-20-24-32-40px) for visual rhythm",
    status: "completed",
    category: "architecture",
  },
  {
    id: "smooth-transitions",
    name: "Cubic-Bezier Easing",
    description: "Smooth transitions with custom easing curves (enter/exit/bounce)",
    status: "completed",
    category: "motion",
  },
  {
    id: "toast-notifications",
    name: "Toast Notification System",
    description: "Linear-style non-blocking feedback instead of inline text",
    status: "completed",
    category: "feedback",
  },
  {
    id: "loading-states",
    name: "Skeleton Loading",
    description: "Stripe-style shimmer loading states for perceived performance",
    status: "completed",
    category: "feedback",
  },
  {
    id: "empty-states",
    name: "Actionable Empty States",
    description: "Vercel-style empty states with clear next actions",
    status: "completed",
    category: "architecture",
  },
  {
    id: "card-hover",
    name: "Card Hover States",
    description: "Subtle lift + border glow on hover (Notion-style interaction)",
    status: "completed",
    category: "motion",
  },
  {
    id: "keyboard-shortcuts",
    name: "Keyboard Accessibility",
    description: "Shortcuts indicator styling for power users",
    status: "completed",
    category: "accessibility",
  },
  {
    id: "reduced-motion",
    name: "Reduced Motion Support",
    description: "Respects prefers-reduced-motion media query",
    status: "completed",
    category: "accessibility",
  },
  {
    id: "scrollbar-styling",
    name: "Arc-style Scrollbars",
    description: "Subtle, minimal scrollbar styling",
    status: "completed",
    category: "architecture",
  },
  {
    id: "focus-states",
    name: "Enhanced Focus Ring",
    description: "Clear focus indicators with subtle glow expansion",
    status: "completed",
    category: "accessibility",
  },
];

const CATEGORIES: Record<Principle["category"], { label: string; icon: string }> = {
  architecture: { label: "Architecture", icon: "◈" },
  motion: { label: "Motion", icon: "⟳" },
  feedback: { label: "Feedback", icon: "✓" },
  accessibility: { label: "Accessibility", icon: "◎" },
};

export default function LuciusReview() {
  const [isOpen, setIsOpen] = React.useState(false);
  const completedCount = PRINCIPLES.filter((p) => p.status === "completed").length;

  return (
    <>
      <button
        className="lucius-badge"
        onClick={() => setIsOpen(!isOpen)}
        title="Lucius Review - UX Principles Applied"
        aria-expanded={isOpen}
        aria-controls="lucius-panel"
      >
        Lucius Review <span style={{ opacity: 0.7 }}>|</span> {completedCount}/{PRINCIPLES.length}
      </button>

      {isOpen && (
        <div
          id="lucius-panel"
          className="lucius-panel"
          role="dialog"
          aria-labelledby="lucius-title"
        >
          <div className="lucius-panel-header">
            <div className="lucius-panel-title" id="lucius-title">
              <span>✦</span>
              Lucius UX Review
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: "6px",
                fontSize: 18,
                lineHeight: 1,
                transition: "all 120ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-elev)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
              aria-label="Close Lucius Review"
            >
              ×
            </button>
          </div>

          <div className="lucius-panel-content">
            <p className="small muted" style={{ marginBottom: 16, lineHeight: 1.5 }}>
              World-class UX principles distilled from Linear, Vercel, Stripe,
              Notion, Arc, and Apple HIG.
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
              marginBottom: 20,
            }}>
              {Object.entries(CATEGORIES).map(([key, { label, icon }]) => {
                const count = PRINCIPLES.filter((p) => p.category === key).length;
                const completed = PRINCIPLES.filter(
                  (p) => p.category === key && p.status === "completed"
                ).length;
                return (
                  <div
                    key={key}
                    style={{
                      textAlign: "center",
                      padding: "8px 4px",
                      background: "var(--bg-elev)",
                      borderRadius: 8,
                      border: "1px solid var(--line-subtle)",
                    }}
                  >
                    <div style={{ fontSize: 16, marginBottom: 2 }}>{icon}</div>
                    <div className="small" style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      {completed}/{count}
                    </div>
                    <div className="small muted" style={{ fontSize: 10 }}>{label}</div>
                  </div>
                );
              })}
            </div>

            <h4 className="small" style={{ marginBottom: 8, fontWeight: 600 }}>
              Principles Applied
            </h4>
            <ul className="lucius-checklist">
              {PRINCIPLES.map((principle) => (
                <li key={principle.id}>
                  <span className={`lucius-check ${principle.status === "completed" ? "" : "pending"}`}>
                    {principle.status === "completed" ? "✓" : "○"}
                  </span>
                  <div>
                    <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                      {principle.name}
                    </div>
                    <div className="small muted" style={{ marginTop: 2 }}>
                      {principle.description}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div style={{
              marginTop: 16,
              paddingTop: 12,
              borderTop: "1px solid var(--line-subtle)",
              fontSize: 11,
              color: "var(--text-dim)",
              textAlign: "center",
            }}>
              Seamless UX Wave · 2025-02-28
            </div>
          </div>
        </div>
      )}
    </>
  );
}
