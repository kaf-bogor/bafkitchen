import { useState, useEffect, useCallback } from 'react'

import { IUser } from '@/interfaces'
import { apiFetch } from '@/utils/api'

type RawUser = {
  id: string
  name: string
  email: string
  role: string
  phoneNumber?: string | null
  createdAt: string
  updatedAt: string
  lastSignInAt?: string | null
  vendorId?: string | null
  vendorName?: string | null
}

const transformUser = (u: RawUser): IUser.IUser => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  phoneNumber: u.phoneNumber ?? null,
  createdAt: u.createdAt ? new Date(u.createdAt) : new Date(0),
  updatedAt: u.updatedAt ? new Date(u.updatedAt) : new Date(0),
  lastSignInAt: u.lastSignInAt ? new Date(u.lastSignInAt) : null,
  vendorId: u.vendorId ?? null,
  vendorName: u.vendorName ?? null
})

export const useGetUsers = () => {
  const [data, setData] = useState<IUser.IUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{ users: RawUser[] }>('/api/users')
      setData(res.users.map(transformUser))
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return { data, loading, error, refetch: fetchUsers }
}

export const useGetUser = (userId: string) => {
  const [data, setData] = useState<IUser.IUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchUser = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{ user: RawUser }>(`/api/users/${userId}`)
      setData(transformUser(res.user))
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return { data, loading, error, refetch: fetchUser }
}

export const useCreateUser = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createUser = async (request: IUser.ICreateUserRequest) => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{ user: IUser.IUser }>('/api/users', {
        method: 'POST',
        body: JSON.stringify(request)
      })
      return res.user
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { createUser, loading, error }
}

export const useUpdateUser = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateUser = async (request: IUser.IUpdateUserRequest) => {
    setLoading(true)
    setError(null)

    try {
      const res = await apiFetch<{ user: IUser.IUser }>(
        `/api/users/${request.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(request)
        }
      )
      return res.user
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { updateUser, loading, error }
}

export const useDeleteUser = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const deleteUser = async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      await apiFetch(`/api/users/${id}`, { method: 'DELETE' })
      return { id }
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { deleteUser, loading, error }
}
