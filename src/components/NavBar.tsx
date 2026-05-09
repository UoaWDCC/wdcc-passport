"use client";

import Link from "next/link";
import { useState } from "react";

import type { UserAccess } from "@/lib/access";

type MenuItem = {
  name: string;
  href: string;
};

export default function NavBar({
  access,
}: {
  access: Extract<UserAccess, { status: "admin" | "user" }>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const isAdmin = access.status === "admin";
  const isUser = access.status === "user";
  let menuItems: MenuItem[] = [];
  let homeHref = "/";

  if (isAdmin) {
    homeHref = "/admin";
    menuItems = [{ name: "Dashboard", href: "/admin" }];
  }

  if (isUser) {
    homeHref = "/user/calendar";
    menuItems = [
      { name: "Calendar", href: "/user/calendar" },
      { name: "Passport", href: "/user/calendar" },
      { name: "Collection", href: "/user/collection" },
      { name: "Profile", href: "/user/calendar" },
      { name: "Scan", href: "/user/calendar" },
    ];
  }

  return (
    <header className="sticky top-0 z-50 bg-gray-900 text-white shadow-sm md:fixed md:inset-x-0">
      <div className="mx-auto flex min-h-20 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-label={isOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={isOpen}
            className="rounded-full px-4 py-2 text-sm font-medium text-gray-200 transition hover:bg-gray-800 md:hidden"
          >
            {isOpen ? "Close" : "Menu"}
          </button>
          <Link
            href={homeHref}
            onClick={() => setIsOpen(false)}
            className="truncate text-base font-semibold"
          >
            Passport
          </Link>
        </div>

        <nav className="hidden items-center gap-2 md:flex">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              item={item}
              onNavigate={() => setIsOpen(false)}
            />
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <div className="text-right text-sm">
            <p className="font-medium text-white">{access.email}</p>
            <p className="text-xs text-gray-400">
              {isAdmin ? "Club Admin" : "User"}
            </p>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-gray-800 bg-gray-900 px-4 pb-5 pt-3 md:hidden">
          <div className="mb-4 rounded-2xl bg-gray-800 px-4 py-3">
            <p className="truncate text-sm font-medium text-white">
              {access.email}
            </p>
            <p className="text-xs text-gray-400">
              {isAdmin ? "Club Admin" : "User"}
            </p>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.name}
                item={item}
                onNavigate={() => setIsOpen(false)}
              />
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

function NavLink({
  item,
  onNavigate,
}: {
  item: MenuItem;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className="flex items-center px-4 py-3 text-sm font-medium text-white transition hover:text-gray-300 md:py-2"
    >
      {item.name}
    </Link>
  );
}
