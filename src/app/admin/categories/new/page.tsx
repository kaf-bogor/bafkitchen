'use client'

import React, { useState } from 'react'

import { Button, useToast } from '@chakra-ui/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { createCategories } from '@/app/admin/categories/actions'
import { useGetVendors } from '@/app/admin/vendors/actions'
import { Layout } from '@/components'
import Form from '@/components/admin/categories/Form'
import { ICreateCategoryRequest } from '@/interfaces/category'

export default function Create() {
  const toast = useToast()
  const router = useRouter()
  const {
    data: vendors,
    isFetching: isFetchingVendors,
    error: errorVendors
  } = useGetVendors()
  const { isPending, mutate } = createCategories()

  const [input, setInput] = useState<ICreateCategoryRequest>({
    name: '',
    vendorId: ''
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    setInput({
      ...input,
      [e.target.name]: e.target.value
    })
  }

  const breadcrumbs = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Kategori', path: '/admin/categories' }
  ]

  const onSubmit = (input: ICreateCategoryRequest): void => {
    mutate(input, {
      onSuccess() {
        toast({
          title: 'Berhasil memperbaharui kategori',
          status: 'success',
          duration: 5000,
          isClosable: true
        })
        router.push('/admin/categories')
      },
      onError(error) {
        toast({
          title: 'Gagal memperbaharui kategori',
          description: (error as Error).message,
          status: 'error',
          duration: 5000,
          isClosable: true
        })
      }
    })
  }

  return (
    <Layout
      breadcrumbs={breadcrumbs}
      isFetching={isFetchingVendors}
      error={errorVendors as Error}
      rightHeaderComponent={
        <Link href="/admin/categories/new">
          <Button colorScheme="blue" size="sm" onClick={() => {}}>
            Create Category
          </Button>
        </Link>
      }
    >
      {!!vendors?.length && (
        <Form
          onChange={handleChange}
          category={input}
          isLoading={isPending}
          vendors={vendors}
          onSubmit={() => onSubmit(input)}
        />
      )}
    </Layout>
  )
}
