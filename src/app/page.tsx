'use client'

import React, { useCallback, useEffect, useState, useMemo } from 'react'

import {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  SimpleGrid
} from '@chakra-ui/react'
import { startOfWeek, endOfWeek, addDays, isSameDay, format } from 'date-fns'
import { id } from 'date-fns/locale'

import { useGetProducts } from '@/app/admin/products/actions'
import { getSchedules } from '@/app/admin/schedules/actions'
import { useStore } from '@/app/s/[storeName]/useStore'
import { CardProduct, Layout } from '@/components/homepage'
import TabContent from '@/components/homepage/TabContent'
import { IProduct, ISchedule } from '@/interfaces'
import { cartStore } from '@/stores/useCart'

export default function Home() {
  const [query, setQuery] = useState<string>('')
  const [, setSelectedDate] = useState(new Date())

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })

  const {
    data: schedules,
    loading: isFetching,
    error
  } = getSchedules(weekStart, weekEnd, true) // Always enabled on homepage

  // Debug: Log schedule data
  useEffect(() => {
    if (schedules && process.env.NODE_ENV === 'development') {
      console.log('Homepage schedules data:', {
        total: schedules.length,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        schedules: schedules.map(s => ({
          id: s.id,
          date: s.date,
          productCount: s.productSchedules?.length || 0,
          productIds: s.productSchedules?.map(ps => ps.productId) || []
        }))
      });
    }
  }, [schedules, weekStart, weekEnd]);

  const cart = useStore(cartStore, (state) => state, 'bafkitchen')

  const handleAddQty = useCallback(
    (product: IProduct.IProductResponse) => {
      cart.addProduct(IProduct.IProduct.fromData(product))
    },
    [cart]
  )

  const handleRemoveQty = useCallback(
    (productId: string) => {
      cart.reduceQuantity(productId)
    },
    [cart]
  )

  const handleUpdateQty = useCallback(
    (productId: string, qty: number) => {
      cart.updateProductQuantity(productId, qty)
    },
    [cart]
  )

  const sortProducts = (a: any, b: any) =>
    new Date(a.createdAt) > new Date(b.createdAt) ? 1 : -1

  const { data: products, refetch: refetchProducts } = useGetProducts({
    q: query
  })

  const weekDates = useMemo(() => {
    return Array(7)
      .fill(0)
      .map((_, i) => addDays(weekStart, i))
  }, [weekStart])

  useEffect(() => {
    refetchProducts()
  }, [query, refetchProducts])

  const handleTabChange = (index: number) => {
    setSelectedDate(weekDates[index])
  }

  const getDefaultIndex = () => {
    const today = new Date()
    return weekDates.findIndex((date) => isSameDay(date, today))
  }

  const isDateScheduled = (date: Date, schedules: ISchedule.ISchedule[]) => {
    const hasSchedule = schedules.some((schedule) => isSameDay(new Date(schedule.date), date))
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('isDateScheduled check:', {
        checkingDate: date.toDateString(),
        hasSchedule,
        matchingSchedules: schedules.filter(s => isSameDay(new Date(s.date), date)).map(s => ({
          scheduleId: s.id,
          scheduleDate: s.date,
          productCount: s.productSchedules?.length || 0
        }))
      });
    }
    
    return hasSchedule
  }

  return (
    <Layout isFetching={isFetching} error={error as Error} onSearch={setQuery}>
      {query ? (
        <SimpleGrid columns={[1, 4]} gap={6}>
          {!!products?.length &&
            products
              .sort(sortProducts)
              .map((product) => (
                <CardProduct
                  qty={
                    cart.getTotalQuantity
                      ? cart.getTotalQuantity(product.id)
                      : 0
                  }
                  onUpdateQty={(qty) => handleUpdateQty(product.id, qty)}
                  onAddQty={() => handleAddQty(product)}
                  onRemoveQty={() => handleRemoveQty(product.id)}
                  product={product}
                  key={product.id}
                />
              ))}
        </SimpleGrid>
      ) : (
        <Tabs
          isFitted
          onChange={handleTabChange}
          defaultIndex={getDefaultIndex()}
          flex={1}
          variant="soft-rounded"
        >
          <TabList flexWrap="wrap">
            {schedules &&
              weekDates.map((date) => (
                <Tab
                  key={date.toISOString()}
                  color={
                    isDateScheduled(date, schedules) ? 'green.700' : 'gray.400'
                  }
                  _selected={{
                    bg: isDateScheduled(date, schedules)
                      ? 'green.600'
                      : 'gray.500',
                    color: 'white'
                  }}
                >
                  {format(date, 'EEEE', { locale: id }).replace(
                    /minggu/i,
                    'Ahad'
                  )}
                </Tab>
              ))}
          </TabList>
          <TabPanels>
            {weekDates.map((date) => (
              <TabPanel key={date.toISOString()}>
                {!!schedules?.length && (
                  <TabContent
                    cart={cart}
                    query={query}
                    day={date}
                    schedules={schedules}
                    onUpdateQty={(productId, qty) =>
                      handleUpdateQty(productId, qty)
                    }
                    onAddQty={(product) => handleAddQty(product)}
                    onRemoveQty={(productId) => handleRemoveQty(productId)}
                  />
                )}
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      )}
    </Layout>
  )
}
