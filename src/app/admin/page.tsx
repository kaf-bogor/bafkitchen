'use client'

import React, { useMemo, useEffect, useState } from 'react'

import { Flex, HStack, SimpleGrid, Text } from '@chakra-ui/react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js'
import { format, startOfDay, endOfDay } from 'date-fns'
import { Line } from 'react-chartjs-2'

import { useAuth } from '@/app/UserProvider'
import { Layout } from '@/components'
import CardStats from '@/components/admin/CardStats'
import { IOrder } from '@/interfaces'
import { toIDRFormat } from '@/utils/currency'
import { generateReports } from '@/utils/order'

import { useOrders } from './actions'

ChartJS.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  CategoryScale
)

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const
    },
    title: {
      display: true,
      text: 'Total Order Chart'
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Time Frame'
      }
    },
    y: {
      title: {
        display: true,
        text: 'Amount (IDR)'
      }
    }
  }
}

export default function HomeDashboard() {
  const { user } = useAuth()
  const [dateStart, setDateStart] = useState(
    startOfDay(new Date()).toISOString()
  )
  const [dateEnd, setDateEnd] = useState(endOfDay(new Date()).toISOString())

  const {
    data: orders,
    isFetching,
    error,
    refetch
  } = useOrders(dateStart, dateEnd, !!user)

  const formatDataForChart = (orders: IOrder.IOrder[]) => {
    return orders
      .filter((order: any) => order.createdAt && order.productOrders) // Filter out invalid orders
      .map((order: any) => {
        try {
          // Safely parse the date
          const date = new Date(order.createdAt);
          if (isNaN(date.getTime())) {
            // If date is invalid, use current date as fallback
            return {
              x: format(new Date(), 'dd MMMM yyyy HH:mm'),
              y: 0
            };
          }
          
          return {
            x: format(date, 'dd MMMM yyyy HH:mm'),
            y: order.productOrders.reduce(
              (total: number, po: any) => total + (po.quantity || 0) * (po.product?.price || 0),
              0
            )
          };
        } catch (error) {
          console.error('Error formatting order for chart:', error, order);
          // Return fallback data for problematic orders
          return {
            x: format(new Date(), 'dd MMMM yyyy HH:mm'),
            y: 0
          };
        }
      });
  }

  useEffect(() => {
    refetch()
  }, [dateStart, dateEnd, refetch])

  const dataChart = useMemo(
    () => ({
      datasets: [
        {
          label: 'Total Order',
          data: formatDataForChart(orders || []),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)'
        }
      ]
    }),
    [orders]
  )
  const {
    totalOrderValue: omset,
    totalProfit: profit,
    totalProductQuantity,
    uniqueProductsCount,
    uniqueBuyersCount
  } = useMemo(() => generateReports(orders || []), [orders])

  return (
    <Layout isFetching={isFetching} error={error as Error}>
      <HStack gap={3}>
        <HStack gap={3}>
          <input
            type="date"
            value={format(new Date(dateStart), 'yyyy-MM-dd')}
            onChange={(e) =>
              setDateStart(startOfDay(new Date(e.target.value)).toISOString())
            }
          />
          <input
            type="date"
            value={format(new Date(dateEnd), 'yyyy-MM-dd')}
            onChange={(e) =>
              setDateEnd(endOfDay(new Date(e.target.value)).toISOString())
            }
          />
        </HStack>
      </HStack>

      <Flex mt={6} direction="column" gap={6}>
        <Text>
          Laporan tanggal <b>{format(new Date(dateStart), 'dd MMM yy')}</b> -{' '}
          <b>{format(new Date(dateEnd), 'dd MMM yy')}</b>
        </Text>
        <SimpleGrid columns={[1, 2, 3, 4]} gap={6}>
          <CardStats label={'Omset'} value={toIDRFormat(omset)} />
          <CardStats label={'Profit'} value={toIDRFormat(profit)} />
          <CardStats
            label={'Jumlah produk terjual'}
            value={`${totalProductQuantity} dari ${uniqueProductsCount} produk`}
          />
          <CardStats label={'Jumlah pembeli'} value={uniqueBuyersCount} />
        </SimpleGrid>

        <Flex justifyContent="center" alignItems="center">
          <Line options={options} data={dataChart} />
        </Flex>
      </Flex>
    </Layout>
  )
}
