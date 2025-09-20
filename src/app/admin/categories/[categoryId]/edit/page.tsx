'use client'

import React, { useEffect, useState } from 'react'

import { useToast } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'

import { getCategory, updateCategories } from '@/app/admin/categories/actions'
import { useGetVendors } from '@/app/admin/vendors/actions'
import { Layout } from '@/components'
import Form from '@/components/admin/categories/Form'
import { IUpdateCategoryRequest } from '@/interfaces/category'

export default function Edit({ params }: Props) {
  const toast = useToast()
  const router = useRouter()

  const [input, setInput] = useState<IUpdateCategoryRequest>({
    id: params.categoryId,
    name: '',
    vendorId: ''
  })

  const { mutate } = updateCategories()

  const {
    data: category,
    isFetching: isFetchingCategory,
    error: errorCategory
  } = getCategory(params.categoryId)

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
    isFetching: isFetchingVendors,
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

  const onSubmit = (input: IUpdateCategoryRequest): void => {
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
        console.log(error)
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

  const breadcrumbs = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Kategori', path: '/admin/categories' },
    { label: 'Edit', path: `/admin/categories/${params.categoryId}/edit` }
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

type Props = { params: { categoryId: string } }
