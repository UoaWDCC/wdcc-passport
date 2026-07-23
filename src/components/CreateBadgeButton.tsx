// components/test-badge-button.tsx
"use client";
import { createBadgeAction } from "@/server/badges/create-badge/create-badge.action";

export function CreateBadgeButton() {
  return <button onClick={() => createBadgeAction()}>Test Create Badge</button>;
}
