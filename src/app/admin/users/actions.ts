import { useState, useEffect, useCallback } from 'react'

import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp } from 'firebase/firestore'

import { IUser } from '@/interfaces'
import { db } from '@/utils/firebase'

export const useGetUsers = () => {
  const [data, setData] = useState<IUser.IUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const qsnap = await getDocs(collection(db, 'users'))
      const users = qsnap.docs.map((d) => {
        const u = d.data() as any
        return {
          id: d.id,
          name: u.name,
          email: u.email,
          role: u.role,
          phoneNumber: u.phoneNumber ?? null,
          createdAt: u.createdAt?.toDate?.() ?? new Date(0),
          updatedAt: u.updatedAt?.toDate?.() ?? new Date(0),
          lastSignInAt: u.lastSignInAt?.toDate?.() ?? null
        } as IUser.IUser
      })
      setData(users)
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
      const uref = doc(db, 'users', userId)
      const snap = await getDoc(uref)
      if (!snap.exists()) throw new Error('User not found')
      const u = snap.data() as any
      const user = {
        id: snap.id,
        name: u.name,
        email: u.email,
        role: u.role,
        phoneNumber: u.phoneNumber ?? null,
        createdAt: u.createdAt?.toDate?.() ?? new Date(0),
        updatedAt: u.updatedAt?.toDate?.() ?? new Date(0),
        lastSignInAt: u.lastSignInAt?.toDate?.() ?? null
      } as IUser.IUser
      setData(user)
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
      const payload = {
        name: request.name,
        email: request.email,
        role: request.role ?? 'user',
        phoneNumber: request.phoneNumber ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      const res = await addDoc(collection(db, 'users'), payload)
      const snap = await getDoc(res)
      return { id: res.id, ...(snap.data() as any) } as IUser.IUser
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { createUser, loading, error }
}

