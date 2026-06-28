// components/test-badge-button.tsx
"use client"
import { createBadgeAction } from "@/server/badges/create-badge/create-badge.action"

export function TestBadgeButton() {
  return <button onClick={() => createBadgeAction()}>Test Create Badge</button>
}