// context/UserContext.tsx
'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from 'react'

import { usePathname, useRouter } from 'next/navigation'

import { Loading } from '@/components/shared'
import { fetchCurrentUser, AuthUser } from '@/utils/auth'

// Define the shape of the UserContext
interface UserContextType {
  user: AuthUser | null
  loading: boolean
  refetch: () => Promise<void>
}

// Create the UserContext with default values
const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  refetch: async () => {}
})

// Create a custom hook to use the UserContext
export const useAuth = () => useContext(UserContext)

// Create a provider component
export function UserProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = async () => {
    const currentUser = await fetchCurrentUser()
    setUser(currentUser)
    setLoading(false)
  }

  useEffect(() => {
    refetch()
  }, [])

  useEffect(() => {
    if (loading) return

    const isAdminArea = pathname === '/admin' || pathname.startsWith('/admin/')
    const isAdminLogin = pathname === '/admin/login'

    if (!user) {
      if (pathname.includes('/dashboard')) {
        router.replace('/login')
      }
      if (isAdminArea) {
        router.replace('/admin/login')
      }
      return
    }

    if (pathname === '/login') {
      router.replace(user.role === 'admin' ? '/admin' : '/dashboard')
      return
    }

    if (isAdminLogin && user.role === 'admin') {
      router.replace('/admin')
      return
    }

    // Non-admins (vendors/customers) must not access the admin panel.
    if (isAdminArea && !isAdminLogin && user.role !== 'admin') {
      router.replace(user.vendorId ? '/dashboard' : '/')
    }
  }, [user, loading, pathname, router])

  return (
    <UserContext.Provider value={{ user, loading, refetch }}>
      {loading ? <Loading /> : children}
    </UserContext.Provider>
  )
}