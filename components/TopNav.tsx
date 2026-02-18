"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { withPrefix } from "@/lib/path-prefix";

type NavItem = { label: string; href: string };

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
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
        const fullHref = withPrefix(item.href);
        const isActive = pathname === fullHref;

        return (
          <Link key={item.href} href={fullHref} className={`nav-link${isActive ? " active" : ""}`} aria-current={isActive ? "page" : undefined}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
