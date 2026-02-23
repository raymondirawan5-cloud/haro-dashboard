"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { label: string; href: string };

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Kanban", href: "/dashboard/kanban" },
  { label: "Graph", href: "/dashboard/graph" },
  { label: "Brain", href: "/dashboard/brain" },
  { label: "Decisions", href: "/mission-control/decisions" },
  { label: "Today", href: "/mission-control/today" },
  { label: "Memories", href: "/second-brain/memories" },
  { label: "Documents", href: "/second-brain/documents" },
  { label: "Tasks", href: "/second-brain/tasks" },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="nav" aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link key={item.href} href={item.href} className={`nav-link${isActive ? " active" : ""}`} aria-current={isActive ? "page" : undefined}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
