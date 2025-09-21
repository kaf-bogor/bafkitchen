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

import { getStores } from '@/app/admin/stores/actions'
import { Layout } from '@/components'

export default function Store() {
  const { data: stores, loading: isFetching, error } = getStores()

  const sortByCreatedAt = (a: any, b: any) =>
    new Date(a.createdAt) > new Date(b.createdAt) ? 1 : -1

  const breadcrumbs = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Vendor', path: '/admin/stores' }
  ]

  return (
    <Layout
      breadcrumbs={breadcrumbs}
      isFetching={isFetching}
      error={error as Error}
      rightHeaderComponent={
        <Link href="/admin/stores/add">
          <Button colorScheme="blue" size="sm">
            Tambah vendor
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
              <Th>Email</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {!!stores?.length &&
              stores.sort(sortByCreatedAt).map((store) => {
                return (
                  <Tr key={store.id}>
                    <Th>{store.name}</Th>
                    <Th>{store.user.email}</Th>
                    <Th>
                      <ButtonGroup gap={2}>
                        <Link href={`/admin/stores/${store.id}/edit`}>
                          <Button
                            colorScheme="blue"
                            size="sm"
                            onClick={() => {}}
                          >
                            Edit
                          </Button>
                        </Link>
                        <Button colorScheme="red" size="sm" onClick={() => {}}>
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
