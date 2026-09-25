import { apiFetch } from '@/utils/api'

export interface AuthUser {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
  phoneNumber: string | null
  role: string
  vendorId?: string | null
  vendorName?: string | null
}

export const fetchCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const res = await apiFetch<{ user: AuthUser | null }>('/api/auth/me')
    return res.user
  } catch {
    return null
  }
}

export const handleLogout = async ({ onLogout }: { onLogout: () => void }) => {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' })
  } catch (error) {
    console.error('Error logging out:', error)
  } finally {
    onLogout()
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

export interface IUploadResponse {
  downloadURL: string
  fullPath: string
}

export const uploadMedia = async (image: File): Promise<IUploadResponse> => {
  const form = new FormData()
  form.append('file', image)
  const result = await apiFetch<{ url: string; key: string }>(
    '/api/media/upload',
    {
      method: 'POST',
      body: form
    }
  )
  return {
    downloadURL: result.url,
    fullPath: result.key
  }
}
