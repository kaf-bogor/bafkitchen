'use client'

import React, { useEffect, useMemo, useState } from 'react'

import {
  Box,
  Button,
  Circle,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
  Text,
  VStack,
  useToast
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useSearchParams } from 'next/navigation'

import {
  useGetVendor,
  useUpdateVendor
} from '@/app/admin/(panel)/vendors/actions'
import { useAuth } from '@/app/UserProvider'
import { Layout } from '@/components'
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  StatusBadge
} from '@/components/ui'
import {
  mapOrderStatusToColor,
  mapOrderStatusToMessage
} from '@/constants/order'
import { VENDOR_TYPE_OPTIONS, VendorType } from '@/constants/vendor'
import { IOrder } from '@/interfaces'

import { useVendorOrders } from './actions'

export default function VendorSettingsPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const toast = useToast()

  const isAdmin = user?.role === 'admin'
  const vendorId = isAdmin
    ? searchParams.get('vendorId') || ''
    : user?.vendorId || ''

  const {
    data: vendor,
    loading: isFetching,
    error,
    refetch
  } = useGetVendor(vendorId)
  const { updateVendor, loading: isSaving } = useUpdateVendor()
  const { data: orders } = useVendorOrders(vendorId)

  const [name, setName] = useState('')
  const [type, setType] = useState<VendorType>('bazaf')

  useEffect(() => {
    if (vendor) {
      setName(vendor.name || '')
      setType((vendor.type as VendorType) || 'bazaf')
    }
  }, [vendor])

  const handleSave = async () => {
    if (!vendor) return
    try {
      await updateVendor({
        id: vendor.id,
        name: name.trim(),
        userId: vendor.userId || '',
        type
      })
      toast({
        title: 'Berhasil',
        description: 'Profil vendor diperbarui',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      refetch()
    } catch (err) {
      toast({
        title: 'Gagal',
        description: (err as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const activities = useMemo(() => {
    const list: {
      key: string
      orderNumber: string
      activity: IOrder.IOrderActivity
    }[] = []

    ;(orders || []).forEach((order) => {
      ;(order.activities || []).forEach((activity, index) => {
        list.push({
          key: `${order.id}-${index}`,
          orderNumber: order.orderNumber || order.id,
          activity
        })
      })
    })

    return list
      .sort(
        (a, b) =>
          new Date(b.activity.timestamp).getTime() -
          new Date(a.activity.timestamp).getTime()
      )
      .slice(0, 20)
  }, [orders])

  return (
    <Layout isFetching={isFetching} error={error as Error}>
      <PageHeader
        title="Pengaturan vendor"
        subtitle="Kelola profil vendor dan lihat aktivitas terbaru"
        breadcrumbs={[
          { label: 'Dashboard vendor', path: '/dashboard' },
          { label: 'Pengaturan' }
        ]}
      />

      {!vendorId ? (
        <EmptyState
          title={isAdmin ? 'Pilih vendor' : 'Akun belum tertaut ke vendor'}
          description={
            isAdmin
              ? 'Buka dashboard vendor lewat tombol Impersonate di menu Pengguna.'
              : 'Hubungi admin untuk menautkan akun Anda dengan vendor.'
          }
        />
      ) : (
        <Flex direction={{ base: 'column', lg: 'row' }} gap={6} align="start">
          <Box flex="1" w="full" minW={0}>
            <Card>
              <CardHeader title="Profil vendor" />
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <FormControl>
                    <FormLabel>Nama</FormLabel>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama vendor"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Jenis vendor</FormLabel>
                    <Select
                      value={type}
                      onChange={(e) => setType(e.target.value as VendorType)}
                    >
                      {VENDOR_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Email</FormLabel>
                    <Input value={vendor?.email || ''} isReadOnly bg="gray.50" />
                  </FormControl>

                  <Button
                    colorScheme="brand"
                    onClick={handleSave}
                    isLoading={isSaving}
                    isDisabled={!name.trim()}
                  >
                    Simpan
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          </Box>

          <Box flex="2" w="full" minW={0}>
            <Card>
              <CardHeader
                title="Aktivitas terbaru"
                description={`${activities.length} aktivitas`}
              />
              <CardBody>
                {activities.length === 0 ? (
                  <Text
                    fontSize="sm"
                    color="text-muted"
                    textAlign="center"
                    py={6}
                  >
                    Belum ada aktivitas.
                  </Text>
                ) : (
                  <VStack align="stretch" spacing={4}>
                    {activities.map(({ key, orderNumber, activity }) => (
                      <HStack key={key} align="start" spacing={4}>
                        <Circle
                          size="8px"
                          mt={1.5}
                          bg={activity.toStatus ? 'brand.500' : 'gray.400'}
                        />
                        <VStack align="start" spacing={1.5} flex={1} minW={0}>
                          <Text
                            fontSize="sm"
                            fontWeight="500"
                            color="text-strong"
                          >
                            {orderNumber} ·{' '}
                            {activity.fromStatus && activity.toStatus
                              ? 'Status pesanan'
                              : activity.action}
                          </Text>
                          {activity.toStatus && (
                            <HStack
                              spacing={1.5}
                              flexWrap="nowrap"
                              overflowX="auto"
                              className="no-scrollbar"
                            >
                              {activity.fromStatus && (
                                <>
                                  <StatusBadge
                                    color={
                                      mapOrderStatusToColor[activity.fromStatus]
                                    }
                                    px={2}
                                    py={0.5}
                                    fontSize="2xs"
                                  >
                                    {mapOrderStatusToMessage[
                                      activity.fromStatus
                                    ] || activity.fromStatus}
                                  </StatusBadge>
                                  <Text fontSize="2xs" color="text-subtle">
                                    →
                                  </Text>
                                </>
                              )}
                              <StatusBadge
                                color={mapOrderStatusToColor[activity.toStatus]}
                                px={2}
                                py={0.5}
                                fontSize="2xs"
                              >
                                {mapOrderStatusToMessage[activity.toStatus] ||
                                  activity.toStatus}
                              </StatusBadge>
                            </HStack>
                          )}
                          <Text fontSize="xs" color="text-subtle">
                            {activity.userName} •{' '}
                            {format(
                              new Date(activity.timestamp),
                              'dd MMM yyyy, HH:mm',
                              { locale: id }
                            )}
                          </Text>
                        </VStack>
                      </HStack>
                    ))}
                  </VStack>
                )}
              </CardBody>
            </Card>
          </Box>
        </Flex>
      )}
    </Layout>
  )
}
