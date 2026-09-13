'use client'

import React, { useEffect, useState } from 'react'

import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Text
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Link from 'next/link'
import { FaHistory, FaPause, FaChartLine, FaArrowLeft } from 'react-icons/fa'

import { useAuth } from '@/app/UserProvider'
import { Brand } from '@/components/ui'
import { usePosCart } from '@/hooks/usePosCart'

export default function TopBar({
  onOpenHistory,
  onOpenSummary,
  onOpenHeldOrders
}: Props) {
  const { user } = useAuth()
  const { heldOrders } = usePosCart()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Flex
      as="header"
      h="60px"
      px={4}
      bg="white"
      borderBottomWidth="1px"
      borderColor="gray.200"
      align="center"
      justify="space-between"
      flexShrink={0}
    >
      <HStack spacing={4}>
        <HStack spacing={2}>
          <Brand href="/admin" />
          <Badge colorScheme="green" fontSize="sm" px={2} py={1} rounded="md">
            KASIR
          </Badge>
        </HStack>
        <Box display={{ base: 'none', md: 'block' }}>
          <Text fontSize="sm" fontWeight="medium" color="gray.700">
            {format(now, 'EEEE, dd MMMM yyyy', { locale: id }).replace(
              /minggu/i,
              'Ahad'
            )}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {format(now, 'HH:mm:ss')} — Kasir:{' '}
            {user?.displayName || user?.email || '-'}
          </Text>
        </Box>
      </HStack>

      <HStack spacing={2}>
        <Button
          size="sm"
          variant="outline"
          leftIcon={<FaPause />}
          onClick={onOpenHeldOrders}
        >
          Ditahan
          {heldOrders.length > 0 && (
            <Badge ml={2} colorScheme="orange" rounded="full" px={2}>
              {heldOrders.length}
            </Badge>
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          leftIcon={<FaHistory />}
          onClick={onOpenHistory}
        >
          Riwayat
        </Button>
        <Button
          size="sm"
          variant="outline"
          leftIcon={<FaChartLine />}
          onClick={onOpenSummary}
        >
          Ringkasan
        </Button>
        <Link href="/admin">
          <Button size="sm" variant="ghost" leftIcon={<FaArrowLeft />}>
            Admin
          </Button>
        </Link>
      </HStack>
    </Flex>
  )
}

type Props = {
  onOpenHistory: () => void
  onOpenSummary: () => void
  onOpenHeldOrders: () => void
}
