'use client'

import React, { useState } from 'react'

import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons'
import {
  Flex,
  IconButton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs
} from '@chakra-ui/react'
import { addWeeks, differenceInDays, startOfWeek, subWeeks, endOfWeek } from 'date-fns'

import { getSchedules } from '@/app/admin/schedules/actions'
import { useAuth } from '@/app/UserProvider'
import { Layout } from '@/components'
import TabContent from '@/components/admin/schedules/TabContent'
import { date } from '@/utils'

export default function Store() {
  const { user } = useAuth()
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )

  const [selectedDay, setSelectedDay] = useState(new Date())

  // Get schedules for current week and check if user is authenticated
  const weekStart = startOfWeek(currentWeekStart, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })
  const { data: schedules, loading: isFetching, error } = getSchedules(weekStart, weekEnd, !!user)

  const breadcrumbs = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Toko', path: '/admin/stores' }
  ]

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart((prevDate) =>
      direction === 'next' ? addWeeks(prevDate, 1) : subWeeks(prevDate, 1)
    )
  }

  const handleTabChange = (index: number) => {
    setSelectedDay(weekDays[index])
  }

  const weekDays = date.getDaysOfWeek(currentWeekStart)

  return (
    <Layout
      breadcrumbs={breadcrumbs}
      isFetching={isFetching}
      error={error as Error}
    >
      {schedules && (
        <>
          <Flex align="center">
            <IconButton
              alignSelf="start"
              aria-label="Previous week"
              icon={<ChevronLeftIcon />}
              onClick={() => navigateWeek('prev')}
              mr={2}
            />
            <Tabs
              defaultIndex={differenceInDays(new Date(), currentWeekStart)}
              variant="enclosed"
              flex={1}
              onChange={handleTabChange}
            >
              <TabList>
                {weekDays.map((day, index) => (
                  <Tab key={index}>{date.formatDate(day)}</Tab>
                ))}
              </TabList>
              <TabPanels>
                {weekDays.map((day, index) => (
                  <TabPanel key={index}>
                    <TabContent
                      day={day}
                      selectedDay={selectedDay}
                      schedules={schedules}
                    />
                  </TabPanel>
                ))}
              </TabPanels>
            </Tabs>
            <IconButton
              alignSelf="start"
              aria-label="Next week"
              icon={<ChevronRightIcon />}
              onClick={() => navigateWeek('next')}
              ml={2}
            />
          </Flex>
        </>
      )}
    </Layout>
  )
}
