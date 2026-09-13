'use client'

import React from 'react'

import { useToast } from '@chakra-ui/react'
import { useParams, useRouter } from 'next/navigation'

import { useGetUser, useUpdateUser } from '@/app/admin/(panel)/users/actions'
import { Layout } from '@/components'
import UserForm from '@/components/admin/users/Form'
import { IUpdateUserRequest } from '@/interfaces/user'

export default function Edit() {
  const { userId } = useParams()
  const toast = useToast()
  const router = useRouter()

  const {
    data: user,
    loading: isFetching,
    error
  } = useGetUser(userId as string)

  const { updateUser, loading } = useUpdateUser()

  const onSubmit = async (values: IUpdateUserRequest): Promise<void> => {
    try {
      await updateUser({ ...values, id: userId as string })
      toast({
        title: 'Berhasil',
        description: 'Pengguna berhasil diperbarui',
        status: 'success',
        duration: 5000,
        isClosable: true
      })
      router.push('/admin/users')
    } catch (err) {
      toast({
        title: 'Gagal',
        description: (err as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const breadcrumbs = [
    { label: 'Dasbor', path: '/admin' },
    { label: 'Pengguna', path: '/admin/users' },
    { label: 'Ubah pengguna' }
  ]

  return (
    <Layout breadcrumbs={breadcrumbs} error={error as Error} isFetching={isFetching}>
      {user && (
        <UserForm
          title="Ubah pengguna"
          user={user}
          onUpdate={onSubmit}
          isPending={loading}
        />
      )}
    </Layout>
  )
}
