import { useQuery, useMutation, MutateOptions, UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp } from 'firebase/firestore'

import { IUser } from '@/interfaces'
import { db } from '@/utils/firebase'

export const useGetUsers = (): UseQueryResult<IUser.IUser[], Error> =>
  useQuery<IUser.IUser[], Error>({
    queryKey: ['users'],
    queryFn: async () => {
      const qsnap = await getDocs(collection(db, 'users'))
      return qsnap.docs.map((d) => {
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
    }
  })


export const useGetUser = (
  userId: string
): UseQueryResult<IUser.IUser, Error> => {
  return useQuery<IUser.IUser, Error>({
    queryKey: ['user', userId],
    queryFn: async () => {
      const uref = doc(db, 'users', userId)
      const snap = await getDoc(uref)
      if (!snap.exists()) throw new Error('User not found')
      const u = snap.data() as any
      return {
        id: snap.id,
        name: u.name,
        email: u.email,
        role: u.role,
        phoneNumber: u.phoneNumber ?? null,
        createdAt: u.createdAt?.toDate?.() ?? new Date(0),
        updatedAt: u.updatedAt?.toDate?.() ?? new Date(0),
        lastSignInAt: u.lastSignInAt?.toDate?.() ?? null
      } as IUser.IUser
    },
    enabled: !!userId // Only run the query if userId is provided
  })
}

export const useCreateUser = (options: MutateOptions<
  IUser.IUser,
  Error,
  IUser.ICreateUserRequest
>): UseMutationResult<
  IUser.IUser,
  Error,
  IUser.ICreateUserRequest
> =>
  useMutation<IUser.IUser, Error, IUser.ICreateUserRequest>({
    mutationKey: ['api', 'users', 'create'],
    mutationFn: async (request: IUser.ICreateUserRequest) => {
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
      return { id: res.id, ...(snap.data() as any) } as any
    },
    ...options
  })

