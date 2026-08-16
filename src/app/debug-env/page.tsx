'use client'

import React from 'react'

export default function DebugEnv() {
  const config = {
    appDomain: process.env.NEXT_PUBLIC_APP_DOMAIN,
    firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    firebaseAuthDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Environment Variables Debug</h1>
      <pre>{JSON.stringify(config, null, 2)}</pre>
      <p>
        <strong>Note:</strong> Remove this page after debugging!
        Firebase config values are public by design for client-side auth.
      </p>
    </div>
  )
}