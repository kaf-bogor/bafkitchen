'use client'
import React from 'react'

import {
  Button,
  ButtonGroup,
  Grid,
  GridItem,
  Table,
  TableContainer,
  Tbody,
  Th,
  Thead,
  Tr
} from '@chakra-ui/react'
import Link from 'next/link'

import { useGetCategories } from '@/app/admin/categories/actions'
import { Layout } from '@/components'
import { ICategory } from '@/interfaces/category'

export default function Categories() {
  const {
    data: categories,
    loading: isFetchingCategories,
    error: errorCategories
  } = useGetCategories()

  const sortCategories = (a: ICategory, b: ICategory) =>
    new Date(a.createdAt) > new Date(b.createdAt) ? 1 : -1

  const breadcrumbs = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Kategori', path: '/admin/categories' }
  ]

  return (
    <Layout
      breadcrumbs={breadcrumbs}
      isFetching={isFetchingCategories}
      error={errorCategories as Error}
      rightHeaderComponent={
        <Link href="/admin/categories/new">
          <Button colorScheme="blue" size="sm" onClick={() => {}}>
            Create Category
          </Button>
        </Link>
      }
    >
      <Grid>
        <GridItem
          justifySelf="end"
          colEnd={13}
          paddingTop={3}
          paddingRight={3}
        ></GridItem>
      </Grid>
      <TableContainer>
        <Table variant={'simple'}>
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>ID</Th>
              <Th>Vendor</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {categories &&
              categories.sort(sortCategories).map((category: ICategory) => {
                return (
                  <Tr key={category.id}>
                    <Th>{category.name}</Th>
                    <Th>{category.id}</Th>
                    <Th>{category.vendor?.name}</Th>
                    <Th>
                      <ButtonGroup gap={2}>
                        <Link href={`/admin/categories/${category.id}/edit`}>
                          <Button colorScheme="blue" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Button colorScheme="red" size="sm">
                          Delete
                        </Button>
                      </ButtonGroup>
                    </Th>
                  </Tr>
                )
              })}
          </Tbody>
        </Table>
      </TableContainer>
    </Layout>
  )
}
