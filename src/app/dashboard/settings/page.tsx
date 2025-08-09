'use client'

import React, { useEffect, useState } from 'react'

import { Flex } from '@chakra-ui/react'

import { Layout } from '@/components'
import { auth } from '@/utils/firebase'

export default function HomeDashboard() {
  const [user, setUser] = useState<any | null>(null)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser)
    })

    return () => unsubscribe()
  }, [])

  const breadcrumbs = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Setting', path: '/dashboard/settings' }
  ]

  return (
    <Layout breadcrumbs={breadcrumbs} isAdmin={false}>
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
          {user ? (
            <div style={{ marginTop: 8 }}>Signed in as: {user.email}</div>
          ) : (
            <div style={{ marginTop: 8 }}>Not signed in</div>
          )}
        </div>
      </Flex>
    </Layout>
  )
}
