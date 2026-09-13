'use client'

import React, { useMemo, useState } from 'react'

import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons'
import { Box, Flex, IconButton, SimpleGrid, Text } from '@chakra-ui/react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek
} from 'date-fns'
import { id } from 'date-fns/locale'
import Link from 'next/link'

import { useAuth } from '@/app/UserProvider'
import { Layout } from '@/components'
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui'
import { currency } from '@/utils'

import { useGetOrders } from '../orders/actions'

export default function CalendarPage() {
  const { user } = useAuth()
  const { data: orders, loading: isFetching, error } = useGetOrders(!!user)
  const [month, setMonth] = useState(() => startOfMonth(new Date()))

  const preOrders = useMemo(
    () => (orders || []).filter((o) => o.fulfillmentDate),
    [orders]
  )

  const dayStats = useMemo(() => {
    const map = new Map<string, { count: number; qty: number; revenue: number }>()
    preOrders.forEach((o) => {
      const day = format(new Date(o.fulfillmentDate!), 'yyyy-MM-dd')
      const stat = map.get(day) || { count: 0, qty: 0, revenue: 0 }
      stat.count += 1
      stat.qty += (o.productOrders || []).reduce((s, po) => s + (po.quantity || 0), 0)
      stat.revenue += o.total || 0
      map.set(day, stat)
    })
    return map
  }, [preOrders])

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [month])

  const weekdayLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

  return (
    <Layout isFetching={isFetching} error={error as Error}>
      <PageHeader
        title="Kalender"
        subtitle="Ringkasan pre-order per tanggal"
        breadcrumbs={[
          { label: 'Dasbor', path: '/admin' },
          { label: 'Kalender' }
        ]}
      />

      <Card>
        <CardHeader
          title={format(month, 'MMMM yyyy', { locale: id })}
          actions={
            <Flex gap={2}>
              <IconButton
                aria-label="Bulan sebelumnya"
                icon={<ChevronLeftIcon />}
                size="sm"
                variant="outline"
                onClick={() => setMonth((m) => addMonths(m, -1))}
              />
              <IconButton
                aria-label="Bulan berikutnya"
                icon={<ChevronRightIcon />}
                size="sm"
                variant="outline"
                onClick={() => setMonth((m) => addMonths(m, 1))}
              />
            </Flex>
          }
        />
        <CardBody>
          <SimpleGrid columns={7} gap={1} mb={2}>
            {weekdayLabels.map((d) => (
              <Text
                key={d}
                fontSize="xs"
                fontWeight="600"
                color="gray.400"
                textAlign="center"
                textTransform="uppercase"
              >
                {d}
              </Text>
            ))}
          </SimpleGrid>
          <SimpleGrid columns={7} gap={1}>
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd')
              const stat = dayStats.get(key)
              const inMonth = isSameMonth(day, month)
              return (
                <Link key={key} href={`/admin/orders?fulfillmentDate=${key}`}>
                  <Box
                    minH="84px"
                    p={2}
                    borderRadius="md"
                    bg={stat ? 'brand.50' : inMonth ? 'gray.50' : 'transparent'}
                    border="1px solid"
                    borderColor={stat ? 'brand.200' : 'gray.100'}
                    _hover={{
                      bg: stat ? 'brand.100' : 'gray.100'
                    }}
                    transition="background 0.15s"
                  >
                    <Text
                      fontSize="sm"
                      fontWeight="600"
                      color={inMonth ? 'gray.700' : 'gray.300'}
                    >
                      {format(day, 'd')}
                    </Text>
                    {stat && (
                      <>
                        <Text fontSize="xs" fontWeight="700" color="brand.700">
                          {stat.qty} paket
                        </Text>
                        <Text fontSize="xs" color="gray.500" noOfLines={1}>
                          {currency.toIDRFormat(stat.revenue)}
                        </Text>
                      </>
                    )}
                  </Box>
                </Link>
              )
            })}
          </SimpleGrid>
        </CardBody>
      </Card>
    </Layout>
  )
}
