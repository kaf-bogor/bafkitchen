import React, { ReactNode } from 'react'

import DashboardShell from '@/components/DashboardShell'

export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  return <DashboardShell isAdmin>{children}</DashboardShell>
}
