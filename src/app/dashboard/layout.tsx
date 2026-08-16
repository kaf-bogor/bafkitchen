import React, { ReactNode } from 'react'

import DashboardShell from '@/components/DashboardShell'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell isAdmin={false}>{children}</DashboardShell>
}
