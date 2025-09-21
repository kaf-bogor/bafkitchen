'use client'

import React, { useState } from 'react'

import { Button, useToast } from '@chakra-ui/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { useCreateCategories } from '@/app/admin/categories/actions'
import { useGetVendors } from '@/app/admin/vendors/actions'
import { Layout } from '@/components'
import Form from '@/components/admin/categories/Form'
import { ICreateCategoryRequest } from '@/interfaces/category'

export default function Create() {
  const toast = useToast()
  const router = useRouter()
  const {
    data: vendors,
    loading: isFetchingVendors,
    error: errorVendors
  } = useGetVendors()
  const { createCategory, loading: isPending } = useCreateCategories()

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

  const onSubmit = async (input: ICreateCategoryRequest): Promise<void> => {
    try {
      await createCategory(input)
      toast({
        title: 'Berhasil membuat kategori',
        status: 'success',
        duration: 5000,
        isClosable: true
      })
      router.push('/admin/categories')
    } catch (error) {
      toast({
        title: 'Gagal membuat kategori',
        description: (error as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
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
