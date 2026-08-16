'use client'

import React, { useEffect, useState } from 'react'

import { Flex } from '@chakra-ui/react'

import { useAuth } from '@/app/UserProvider'
import { Layout } from '@/components'

export default function HomeDashboard() {
  const { user } = useAuth()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    setEmail(user?.email ?? null)
  }, [user])

  const breadcrumbs = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Setting', path: '/dashboard/settings' }
  ]

  return (
    <Layout breadcrumbs={breadcrumbs}>
      <Flex
        style={{
          display: 'flex',
          flex: 11,
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div>
          <div>Ini halaman setting</div>
          {email ? (
            <div style={{ marginTop: 8 }}>Signed in as: {email}</div>
          ) : (
            <div style={{ marginTop: 8 }}>Not signed in</div>
          )}
        </div>
      </Flex>
    </Layout>
  )
}