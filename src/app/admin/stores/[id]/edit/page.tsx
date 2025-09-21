'use client'

import React, { useEffect, useState } from 'react'

import { useToast } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'

import { getStore, updateStores } from '@/app/admin/stores/actions'
import { Layout } from '@/components'
import Form from '@/components/admin/stores/Form'
import { IStore } from '@/interfaces'

export default function EditStore({ params }: Props) {
  const toast = useToast()
  const router = useRouter()
  const { updateStore } = updateStores()
  const { data: store, loading: isFetching, error } = getStore(params.id)

  const [input, setInput] = useState<IStore.IUpdateStoreRequest>({
    id: params.id,
    name: '',
    userId: ''
  })

  useEffect(() => {
    if (store) {
      setInput((prev) => ({
        ...prev,
        name: store.name,
        userId: store.userId || ''
      }))
    }
  }, [store])

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    setInput({
      ...input,
      [e.target.name]: e.target.value
    })
  }

  const onSubmit = async (input: IStore.IUpdateStoreRequest): Promise<void> => {
    try {
      await updateStore(input)
      toast({
        title: 'Successfully updated store',
        status: 'success',
        duration: 5000,
        isClosable: true
      })
      router.push('/admin/stores')
    } catch (error) {
      toast({
        title: 'Failed to update store',
        description: (error as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const breadcrumbs = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Stores', path: '/admin/stores' },
    { label: 'Edit', path: `/admin/stores/${params.id}/edit` }
  ]

  return (
    <Layout
      breadcrumbs={breadcrumbs}
      isFetching={isFetching}
      error={error as Error}
    >
      {store && (
        <Form
          onChange={onChange}
          store={input}
          onSubmit={() => onSubmit(input)}
        />
      )}
    </Layout>
  )
}

type Props = { params: { id: string } }
