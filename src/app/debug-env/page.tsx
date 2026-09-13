'use client'

import React from 'react'

export default function DebugEnv() {
  const config = {
    appDomain: process.env.NEXT_PUBLIC_APP_DOMAIN
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Environment Variables Debug</h1>
      <pre>{JSON.stringify(config, null, 2)}</pre>
      <p>
        <strong>Note:</strong> Remove this page after debugging!
      </p>
    </div>
  )
}