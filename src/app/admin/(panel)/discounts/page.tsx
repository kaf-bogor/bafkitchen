'use client'

import React from 'react'

import {
  Button,
  HStack,
  IconButton,
  Switch,
  Text,
  useToast
} from '@chakra-ui/react'
import { FiTrash2 } from 'react-icons/fi'

import {
  useDeleteDiscount,
  useGetDiscounts,
  useUpdateDiscount
} from '@/app/admin/(panel)/discounts/actions'
import { Layout } from '@/components'
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  ResponsiveTable,
  type ResponsiveColumn
} from '@/components/ui'
import { IDiscountWithProduct } from '@/interfaces/discount'
import { currency, date } from '@/utils'

const formatPeriod = (discount: IDiscountWithProduct) => {
  if (!discount.startDate && !discount.endDate) return 'Selalu aktif'
  if (discount.startDate && discount.endDate) {
    return date.formatDateRange(discount.startDate, discount.endDate)
  }
  if (discount.startDate) return `Mulai ${date.formatShortDate(discount.startDate)}`
  return `Sampai ${date.formatShortDate(discount.endDate as string)}`
}

export default function Discounts() {
  const toast = useToast()
  const { data: discounts, loading, error, refetch } = useGetDiscounts()
  const { updateDiscount } = useUpdateDiscount()
  const { deleteDiscount } = useDeleteDiscount()

  const handleToggle = async (discount: IDiscountWithProduct, isActive: boolean) => {
    try {
      await updateDiscount(discount.id, { isActive })
      await refetch()
    } catch (err) {
      toast({
        title: 'Gagal memperbarui diskon',
        description: (err as Error).message,
        status: 'error',
        isClosable: true
      })
    }
  }

  const handleDelete = async (discount: IDiscountWithProduct) => {
    try {
      await deleteDiscount(discount.id)
      toast({ title: 'Diskon dihapus', status: 'success', isClosable: true })
      await refetch()
    } catch (err) {
      toast({
        title: 'Gagal menghapus diskon',
        description: (err as Error).message,
        status: 'error',
        isClosable: true
      })
    }
  }

  const columns: ResponsiveColumn<IDiscountWithProduct>[] = [
    {
      key: 'product',
      header: 'Produk',
      render: (discount) => (
        <Text fontWeight="600">{discount.product?.name || '-'}</Text>
      )
    },
    {
      key: 'value',
      header: 'Diskon',
      render: (discount) => (
        <Text>
          {discount.type === 'percentage'
            ? `${discount.value}%`
            : currency.toIDRFormat(discount.value)}
          {discount.name ? ` · ${discount.name}` : ''}
        </Text>
      )
    },
    {
      key: 'minQuantity',
      header: 'Min. qty',
      render: (discount) => <Text>≥ {discount.minQuantity} pcs</Text>
    },
    {
      key: 'period',
      header: 'Periode',
      render: (discount) => (
        <Text color="text-muted" fontSize="sm">
          {formatPeriod(discount)}
        </Text>
      )
    },
    {
      key: 'status',
      header: 'Aktif',
      render: (discount) => (
        <Switch
          colorScheme="brand"
          isChecked={discount.isActive}
          onChange={(e) => handleToggle(discount, e.target.checked)}
        />
      )
    }
  ]

  const renderActions = (discount: IDiscountWithProduct) => (
    <HStack justify="flex-end" spacing={2}>
      <Button
        as="a"
        href={`/admin/products/${discount.productId}/edit`}
        size="xs"
        variant="outline"
      >
        Ubah
      </Button>
      <IconButton
        aria-label="Hapus diskon"
        icon={<FiTrash2 />}
        size="xs"
        variant="ghost"
        colorScheme="red"
        onClick={() => handleDelete(discount)}
      />
    </HStack>
  )

  return (
    <Layout isFetching={loading} error={error as Error}>
      <PageHeader
        title="Diskon"
        subtitle="Kelola diskon produk berbasis waktu dan quantity"
        breadcrumbs={[
          { label: 'Dasbor', path: '/admin' },
          { label: 'Diskon' }
        ]}
      />

      <Card>
        <CardHeader
          title="Daftar diskon"
          description={`${discounts?.length || 0} diskon terdaftar`}
        />
        <CardBody p={0}>
          <ResponsiveTable
            columns={columns}
            rows={discounts || []}
            getRowKey={(discount) => discount.id}
            mobileTitleKey="product"
            mobileSubtitleKey="value"
            actions={renderActions}
            emptyState={
              <EmptyState
                title="Belum ada diskon"
                description="Tambahkan diskon dari halaman tambah/ubah produk."
              />
            }
          />
        </CardBody>
      </Card>
    </Layout>
  )
}
