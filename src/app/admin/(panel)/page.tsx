'use client'

import React, { useMemo, useState } from 'react'

import {
  Box,
  Button,
  Flex,
  Icon,
  SimpleGrid,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack
} from '@chakra-ui/react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { format, startOfDay, endOfDay, subDays } from 'date-fns'
import { id } from 'date-fns/locale'
import Link from 'next/link'
import { Line } from 'react-chartjs-2'
import {
  AiOutlineShopping,
  AiOutlineShoppingCart,
  AiOutlineUser,
  AiOutlineDollarCircle,
  AiOutlinePlus,
  AiOutlineFileText
} from 'react-icons/ai'

import { useAuth } from '@/app/UserProvider'
import { Layout } from '@/components'
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  StatCard,
  StatusBadge
} from '@/components/ui'
import { mapOrderStatusToColor, mapOrderStatusToMessage } from '@/constants/order'
import { toIDRFormat } from '@/utils/currency'
import { generateReports } from '@/utils/order'

import { useOrders } from '../actions'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function HomeDashboard() {
  const { user } = useAuth()
  const [range, setRange] = useState<'today' | '7d' | '30d'>('7d')

  const [dateStart, setDateStart] = useState(
    startOfDay(subDays(new Date(), 7)).toISOString()
  )
  const [dateEnd, setDateEnd] = useState(endOfDay(new Date()).toISOString())

  const { data: orders, loading: isFetching, error } = useOrders(
    dateStart,
    dateEnd,
    !!user
  )

  const changeRange = (r: 'today' | '7d' | '30d') => {
    setRange(r)
    const end = endOfDay(new Date()).toISOString()
    if (r === 'today') setDateStart(startOfDay(new Date()).toISOString())
    else if (r === '7d') setDateStart(startOfDay(subDays(new Date(), 7)).toISOString())
    else setDateStart(startOfDay(subDays(new Date(), 30)).toISOString())
    setDateEnd(end)
  }

  const dataChart = useMemo(() => {
    const sorted = [...(orders || [])].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    return {
      labels: sorted.map((o) => format(new Date(o.createdAt), 'dd MMM', { locale: id })),
      datasets: [
        {
          label: 'Omset',
          data: sorted.map((o: any) =>
            (o.productOrders || []).reduce(
              (t: number, po: any) => t + (po.quantity || 0) * (po.product?.price || 0),
              0
            )
          ),
          borderColor: '#16a34a',
          backgroundColor: 'rgba(34, 197, 94, 0.12)',
          fill: true,
          tension: 0.4,
          pointRadius: 3
        }
      ]
    }
  }, [orders])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => toIDRFormat(Number(ctx.raw || 0))
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 11 } } },
      y: {
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: {
          color: '#9ca3af',
          font: { size: 11 },
          callback: (v: string | number) => {
            const n = Number(v)
            if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`
            if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`
            return n
          }
        }
      }
    }
  }

  const {
    totalOrderValue: omset,
    totalProfit: profit,
    totalProductQuantity,
    uniqueProductsCount,
    uniqueBuyersCount
  } = useMemo(() => generateReports(orders || []), [orders])

  const recentOrders = useMemo(
    () =>
      [...(orders || [])]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 6),
    [orders]
  )

  const pendingOrders = useMemo(
    () =>
      (orders || []).filter((o) => o.status === 'Payment Pending').length,
    [orders]
  )

  const rangeOptions: { key: typeof range; label: string }[] = [
    { key: 'today', label: 'Hari ini' },
    { key: '7d', label: '7 hari' },
    { key: '30d', label: '30 hari' }
  ]

  return (
    <Layout isFetching={isFetching} error={error as Error}>
      <PageHeader
        title="Dasbor"
        subtitle="Ringkasan performa penjualan BAF Kitchen"
        breadcrumbs={[{ label: 'Dasbor' }]}
        actions={
          <Link href="/admin/products/add">
            <Button colorScheme="brand" leftIcon={<AiOutlinePlus />} size="sm">
              Tambah Produk
            </Button>
          </Link>
        }
      />

      {/* KPI cards */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={5} mb={6}>
        <StatCard
          label="Omset"
          value={toIDRFormat(omset)}
          sublabel="Total penjualan"
          icon={AiOutlineDollarCircle}
          tone="brand"
        />
        <StatCard
          label="Laba"
          value={toIDRFormat(profit)}
          sublabel="Estimasi laba kotor"
          icon={AiOutlineShopping}
          tone="green"
        />
        <StatCard
          label="Produk terjual"
          value={`${totalProductQuantity}`}
          sublabel={`${uniqueProductsCount} produk berbeda`}
          icon={AiOutlineShoppingCart}
          tone="blue"
        />
        <StatCard
          label="Pembeli unik"
          value={uniqueBuyersCount}
          sublabel="Jumlah pelanggan"
          icon={AiOutlineUser}
          tone="purple"
        />
      </SimpleGrid>

      {/* Chart + alerts */}
      <SimpleGrid columns={{ base: 1, lg: 3 }} gap={5} mb={6}>
        <Card gridColumn={{ base: 'auto', lg: 'span 2' }}>
        <CardHeader
          title="Tren penjualan"
          description={`Laporan tanggal ${format(new Date(dateStart), 'dd MMM yyyy')} - ${format(new Date(dateEnd), 'dd MMM yyyy')}`}
            actions={
              <Flex gap={1}>
                {rangeOptions.map((r) => (
                  <Button
                    key={r.key}
                    size="sm"
                    variant={range === r.key ? 'solid' : 'ghost'}
                    colorScheme={range === r.key ? 'brand' : undefined}
                    onClick={() => changeRange(r.key)}
                  >
                    {r.label}
                  </Button>
                ))}
              </Flex>
            }
          />
          <CardBody>
            <Box h="320px">
              <Line data={dataChart} options={chartOptions} />
            </Box>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Perlu perhatian"
            description="Aksi yang menunggu"
          />
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <Box>
                <Flex justify="space-between" align="center">
                  <Flex align="center" gap={3}>
                    <Flex
                      bg="orange.50"
                      color="orange.500"
                      p={2}
                      borderRadius="lg"
                    >
                      <Icon as={AiOutlineFileText} boxSize={5} />
                    </Flex>
                    <Box>
                      <Text fontSize="sm" fontWeight="600">
                        Pembayaran menunggu
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Order berstatus Payment Pending
                      </Text>
                    </Box>
                  </Flex>
                  <Text fontSize="lg" fontWeight="700" color="orange.500">
                    {pendingOrders}
                  </Text>
                </Flex>
              </Box>

              <VStack align="stretch" spacing={3}>
                <Text fontSize="xs" fontWeight="600" color="gray.400" textTransform="uppercase">
                  Aksi cepat
                </Text>
                <Link href="/admin/orders">
                  <Button w="full" variant="outline" size="sm" leftIcon={<AiOutlineShoppingCart />}>
                    Kelola Order
                  </Button>
                </Link>
                <Link href="/admin/invoices">
                  <Button w="full" variant="outline" size="sm" leftIcon={<AiOutlineFileText />}>
                    Lihat Invoice
                  </Button>
                </Link>
                <Link href="/pos">
                  <Button w="full" colorScheme="brand" size="sm" leftIcon={<AiOutlineDollarCircle />}>
                    Buka Kasir (POS)
                  </Button>
                </Link>
              </VStack>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Recent orders */}
      <Card>
        <CardHeader
          title="Order terbaru"
          actions={
            <Link href="/admin/orders">
              <Button size="sm" variant="ghost">
                Lihat semua
              </Button>
            </Link>
          }
        />
        <CardBody p={0}>
          {recentOrders.length === 0 ? (
            <EmptyState
              title="Belum ada order"
              description="Order yang masuk akan tampil di sini."
            />
          ) : (
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>No. Order</Th>
                    <Th>Pelanggan</Th>
                    <Th>Tanggal</Th>
                    <Th>Total</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {recentOrders.map((order) => (
                    <Tr key={order.id}>
                      <Td fontWeight="600">{order.orderNumber}</Td>
                      <Td>{order.customer?.name || '-'}</Td>
                      <Td>
                        {format(new Date(order.createdAt), 'dd MMM yyyy HH:mm', {
                          locale: id
                        })}
                      </Td>
                      <Td fontWeight="600">{toIDRFormat(order.total)}</Td>
                      <Td>
                        <StatusBadge color={mapOrderStatusToColor[order.status]}>
                          {mapOrderStatusToMessage[order.status] || order.status}
                        </StatusBadge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </CardBody>
      </Card>
    </Layout>
  )
}
