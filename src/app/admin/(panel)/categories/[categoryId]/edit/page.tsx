'use client'

import React, { useEffect, useState } from 'react'

import { useToast } from '@chakra-ui/react'
import { useParams, useRouter } from 'next/navigation'

import { useGetCategory, useUpdateCategories } from '@/app/admin/(panel)/categories/actions'
import { useGetVendors } from '@/app/admin/(panel)/vendors/actions'
import { Layout } from '@/components'
import Form from '@/components/admin/categories/Form'
import { IUpdateCategoryRequest } from '@/interfaces/category'

export default function Edit() {
  const { categoryId } = useParams()
  const toast = useToast()
  const router = useRouter()

  const [input, setInput] = useState<IUpdateCategoryRequest>({
    id: categoryId as string,
    name: '',
    vendorId: ''
  })

  const { updateCategory } = useUpdateCategories()

  const {
    data: category,
    loading: isFetchingCategory,
    error: errorCategory
  } = useGetCategory(categoryId as string)

  useEffect(() => {
    if (category) {
      setInput((prev) => ({
        ...prev,
        name: category?.name,
        vendorId: category.vendorId
      }))
    }
  }, [category])

  const {
    data: vendors,
    loading: isFetchingVendors,
    error: errorVendors
  } = useGetVendors()

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    setInput({
      ...input,
      [e.target.name]: e.target.value
    })
  }

  const onSubmit = async (input: IUpdateCategoryRequest): Promise<void> => {
    try {
      await updateCategory(input)
      toast({
        title: 'Berhasil memperbaharui kategori',
        status: 'success',
        duration: 5000,
        isClosable: true
      })
      router.push('/admin/categories')
    } catch (error) {
      console.log(error)
      toast({
        title: 'Gagal memperbaharui kategori',
        description: (error as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const breadcrumbs = [
    { label: 'Dasbor', path: '/admin' },
    { label: 'Kategori', path: '/admin/categories' },
    { label: 'Ubah kategori' }
  ]

  return (
    <Layout
      breadcrumbs={breadcrumbs}
      isFetching={isFetchingVendors || isFetchingCategory}
      error={(errorVendors || errorCategory) as Error}
    >
      {!!vendors?.length && !!category && (
        <Form
          onChange={onChange}
          category={input}
          vendors={vendors}
          onSubmit={() => onSubmit(input)}
        />
      )}
    </Layout>
  )
}
