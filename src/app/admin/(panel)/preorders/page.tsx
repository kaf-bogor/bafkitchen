'use client'

import React, { useMemo, useState } from 'react'

import { ViewIcon } from '@chakra-ui/icons'
import {
  Button,
  ButtonGroup,
  Flex,
  IconButton,
  SimpleGrid,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Link from 'next/link'

import { useAuth } from '@/app/UserProvider'
import { Layout } from '@/components'
import {
  Card,
  CardBody,
  EmptyState,
  PageHeader,
  ResponsiveTable,
  StatCard,
  StatusBadge,
  type ResponsiveColumn
} from '@/components/ui'
import { mapOrderStatusToColor, mapOrderStatusToMessage } from '@/constants/order'
import { IOrder } from '@/interfaces'
import { currency } from '@/utils'

import { useGetOrders } from '../orders/actions'

const PREORDER_TABS = ['Semua', 'Menunggu pembayaran', 'Diproses', 'Siap', 'Diambil', 'Selesai', 'Dibatalkan']

export default function PreOrdersPage() {
  const { user } = useAuth()
  const { data: orders, loading: isFetching, error } = useGetOrders(!!user)

  const preOrders = useMemo(
    () =>
      (orders || []).filter(
        (o) => o.channel === 'preorder' || o.fulfillmentDate
      ),
    [orders]
  )

  const totalQty = useMemo(
    () =>
      preOrders.reduce(
        (acc, o) =>
          acc +
          (o.productOrders || []).reduce((s, po) => s + (po.quantity || 0), 0),
        0
      ),
    [preOrders]
  )

  const revenue = useMemo(
    () => preOrders.reduce((acc, o) => acc + (o.total || 0), 0),
    [preOrders]
  )

  const [activeTab, setActiveTab] = useState(0)

  const filtered = useMemo(() => {
    const tab = PREORDER_TABS[activeTab]
    if (tab === 'Semua') return preOrders
    if (tab === 'Siap') {
      return preOrders.filter((o) => o.status === 'Payment Confirmed' || o.status === 'Order Processing')
    }
    if (tab === 'Diambil') {
      return preOrders.filter((o) => o.status === 'Order Picked Up')
    }
    if (tab === 'Selesai') {
      return preOrders.filter(
        (o) => o.status === 'Invoice Issued' || o.status === 'Invoice Settled'
      )
    }
    if (tab === 'Dibatalkan') {
      return preOrders.filter((o) => o.status === 'Cancelled')
    }
    if (tab === 'Diproses') {
      return preOrders.filter(
        (o) => o.status === 'Payment Confirmed' || o.status === 'Order Processing'
      )
    }
    if (tab === 'Menunggu pembayaran') {
      return preOrders.filter((o) => o.status === 'Payment Pending')
    }
    return preOrders
  }, [preOrders, activeTab])

  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 50
  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  const columns: ResponsiveColumn<IOrder.IOrder>[] = [
    {
      key: 'order',
      header: 'No. Order',
      render: (order) => <Text fontWeight="600">{order.orderNumber}</Text>
    },
    {
      key: 'customer',
      header: 'Pelanggan',
      render: (order) => order.customer?.name || '-'
    },
    {
      key: 'fulfillment',
      header: 'Tanggal pemenuhan',
      mobileLabel: 'Pemenuhan',
      render: (order) =>
        order.fulfillmentDate
          ? format(new Date(order.fulfillmentDate), 'dd MMM yyyy', { locale: id })
          : '-'
    },
    {
      key: 'qty',
      header: 'Jumlah',
      render: (order) =>
        (order.productOrders || []).reduce((s, po) => s + (po.quantity || 0), 0)
    },
    {
      key: 'total',
      header: 'Total',
      isNumeric: true,
      render: (order) => (
        <Text fontWeight="600">{currency.toIDRFormat(order.total)}</Text>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (order) => (
        <StatusBadge color={mapOrderStatusToColor[order.status]}>
          {mapOrderStatusToMessage[order.status] || order.status}
        </StatusBadge>
      )
    }
  ]

  const renderActions = (order: IOrder.IOrder) => (
    <Link href={`/admin/orders/${order.id}`} passHref>
      <IconButton
        aria-label="Lihat detail"
        icon={<ViewIcon />}
        size="sm"
        colorScheme="brand"
        variant="outline"
      />
    </Link>
  )

  return (
    <Layout isFetching={isFetching} error={error as Error}>
      <PageHeader
        title="Pre-order"
        subtitle="Kelola pesanan pre-order dan catering"
        breadcrumbs={[
          { label: 'Dasbor', path: '/admin' },
          { label: 'Pre-order' }
        ]}
      />

      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={5} mb={6}>
        <StatCard label="Total pre-order" value={preOrders.length} icon={undefined} tone="blue" />
        <StatCard label="Total paket" value={totalQty} icon={undefined} tone="brand" />
        <StatCard label="Pendapatan" value={currency.toIDRFormat(revenue)} icon={undefined} tone="green" />
        <StatCard
          label="Menunggu pembayaran"
          value={preOrders.filter((o) => o.status === 'Payment Pending').length}
          icon={undefined}
          tone="orange"
        />
      </SimpleGrid>

      <Card>
        <Tabs
          variant="soft-rounded"
          onChange={(i) => {
            setActiveTab(i)
            setCurrentPage(1)
          }}
        >
          <TabList flexWrap="wrap" px={5} pt={4} gap={2}>
            {PREORDER_TABS.map((tab) => (
              <Tab key={tab} fontSize="sm">
                {tab}
              </Tab>
            ))}
          </TabList>
          <TabPanels>
            <TabPanel px={0} pb={0}>
              <CardBody p={0}>
                {filtered.length === 0 ? (
                  <EmptyState
                    title="Belum ada pre-order"
                    description="Pesanan pre-order yang masuk akan tampil di sini."
                  />
                ) : (
                  <>
                    <ResponsiveTable
                      columns={columns}
                      rows={paginated}
                      getRowKey={(order) => order.id}
                      mobileTitleKey="order"
                      mobileSubtitleKey="customer"
                      actions={renderActions}
                    />

                    {totalPages > 1 && (
                      <Flex justify="center" mt={6} mb={4}>
                        <ButtonGroup size="sm" isAttached variant="outline">
                          <Button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            isDisabled={currentPage === 1}
                          >
                            Sebelumnya
                          </Button>
                          <Text px={4} alignSelf="center" fontSize="sm" color="gray.500">
                            Halaman {currentPage} dari {totalPages}
                          </Text>
                          <Button
                            onClick={() =>
                              setCurrentPage((p) => Math.min(totalPages, p + 1))
                            }
                            isDisabled={currentPage === totalPages}
                          >
                            Berikutnya
                          </Button>
                        </ButtonGroup>
                      </Flex>
                    )}
                  </>
                )}
              </CardBody>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Card>
    </Layout>
  )
}
