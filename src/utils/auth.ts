import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'

import { apiFetch } from '@/utils/api'
import { auth } from '@/utils/firebase'

export interface AuthUser {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
  phoneNumber: string | null
  role: string
}

export const fetchCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const res = await apiFetch<{ user: AuthUser | null }>('/api/auth/me')
    return res.user
  } catch {
    return null
  }
}

export const handleLogout = async ({
  onLogout
}: {
  onLogout: () => void
}) => {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' })
  } catch (error) {
    console.error('Error logging out:', error)
  } finally {
    onLogout()
  }
}

export const handleGoogleLogin = async ({
  onError,
  onSuccess
}: {
  onError: (error: string | null) => void
  onSuccess: (user: AuthUser) => void
}) => {
  try {
    const result = await signInWithPopup(auth, new GoogleAuthProvider())
    const credential = GoogleAuthProvider.credentialFromResult(result)
    const googleToken = credential?.idToken
    if (!googleToken) throw new Error('No Google credential returned')

    const apiResult = await apiFetch<{ user: AuthUser }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ googleToken })
    })
    onSuccess(apiResult.user)
  } catch (error) {
    onError((error as Error).message)
  }
}

export const handleEmailPasswordAuth = async ({
  isSignUp,
  email,
  password,
  role
}: {
  isSignUp: boolean
  email: string
  password: string
  role?: string
}) => {
  try {
    const result = await apiFetch<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, isSignUp, role })
    })
    return result.user
  } catch (error) {
    return error as Error
  }
}

// Kept as a compatibility shim — user documents are now created server-side
// during authentication, so there is nothing left to persist on the client.
export const saveUserToFirestore = async (
  _role: 'customer' | 'admin',
  user: AuthUser,
  options?: {
    onError?: (error: Error | string) => void
    onSuccess?: (user: AuthUser) => void
  }
) => {
  try {
    options?.onSuccess?.(user)
  } catch (error) {
    options?.onError?.(error as Error)
  }
}

export interface IFirebaseUploadResponse {
  downloadURL: string
  fullPath: string
}

export const uploadToFirebase = async (image: File): Promise<IFirebaseUploadResponse> => {
  const form = new FormData()
  form.append('file', image)
  const result = await apiFetch<{ url: string; key: string }>('/api/media/upload', {
    method: 'POST',
    body: form
  })
  return {
    downloadURL: result.url,
    fullPath: result.key
  }
}

export const removeImageFromFirebase = async (_imageUrl: string) => {
  // Object deletion is handled server-side when a product is replaced or deleted.
}