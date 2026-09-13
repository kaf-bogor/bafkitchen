'use client'

import React from 'react'

import {
  Badge,
  Box,
  Card,
  CardBody,
  Divider,
  Flex,
  Heading,
  Stack,
  Text,
  VStack
} from '@chakra-ui/react'
import { formatDate } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

import { Layout } from '@/components/homepage'
import ProductImage from '@/components/ProductImage'
import {
  mapOrderStatusToColor,
  mapOrderStatusToMessage
} from '@/constants/order'
import { currency } from '@/utils'

import { useGetOrderDetail } from './actions'

export default function OrderDetailPage({
  params
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = React.use(params)
  const { data: order, loading: isFetching, error } = useGetOrderDetail(orderId)

  return (
    <Layout
      title="Detail Pesanan"
      isFetching={isFetching}
      error={error as Error}
    >
      {order ? (
        <Box maxW="2xl" mx="auto">
          <Card>
            <CardBody>
              <VStack spacing={5} align="stretch">
                <Flex
                  justify="space-between"
                  align={{ base: 'stretch', sm: 'center' }}
                  direction={{ base: 'column', sm: 'row' }}
                  gap={3}
                >
                  <Box>
                    <Text fontSize="sm" color="gray.500">
                      {formatDate(order?.createdAt, 'dd MMMM yyyy', {
                        locale: idLocale
                      })}
                    </Text>
                    <Heading
                      as="h3"
                      size="sm"
                      fontWeight="700"
                      color="gray.800"
                      mt={1}
                    >
                      {order.customer?.name || 'Pelanggan'}
                    </Heading>
                  </Box>
                  <Badge
                    alignSelf="flex-start"
                    colorScheme={mapOrderStatusToColor[order.status]}
                    variant="subtle"
                    borderRadius="full"
                    px={3}
                    py={1.5}
                    fontWeight="600"
                  >
                    {mapOrderStatusToMessage[order.status] || order.status}
                  </Badge>
                </Flex>

                {order.customer?.phoneNumber && (
                  <>
                    <Divider />
                    <Text fontSize="sm" color="gray.600">
                      Telepon:{' '}
                      <Text as="span" fontWeight="600" color="gray.800">
                        {order.customer.phoneNumber}
                      </Text>
                    </Text>
                  </>
                )}
              </VStack>
            </CardBody>
          </Card>

          {order?.productOrders && order.productOrders.length > 0 && (
            <Card mt={5}>
              <CardBody p={0}>
                <Stack spacing={0} divider={<Divider />}>
                  {order.productOrders.map(({ id, quantity, product, notes }) => (
                    <Flex
                      key={id}
                      gap={4}
                      align="center"
                      p={{ base: 4, sm: 5 }}
                    >
                      <Box
                        boxSize={{ base: 14, sm: 16 }}
                        overflow="hidden"
                        borderRadius="lg"
                        flexShrink={0}
                      >
                        <ProductImage
                          src={product.imageUrl}
                          alt={product.name}
                          objectFit="cover"
                          boxSize="100%"
                        />
                      </Box>
                      <VStack align="start" flex={1} minW={0} spacing={1}>
                        <Text
                          fontWeight="600"
                          color="gray.800"
                          lineHeight="1.35"
                          noOfLines={2}
                        >
                          {product.name}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          {quantity} × {currency.toIDRFormat(product.price)}
                        </Text>
                        {notes && (
                          <Text fontSize="xs" color="gray.500">
                            Catatan: {notes}
                          </Text>
                        )}
                      </VStack>
                      <Text
                        fontWeight="700"
                        color="gray.800"
                        whiteSpace="nowrap"
                      >
                        {currency.toIDRFormat(product.price * quantity)}
                      </Text>
                    </Flex>
                  ))}
                </Stack>
              </CardBody>
            </Card>
          )}

          <Card mt={5}>
            <CardBody>
              <Flex justify="space-between" align="center">
                <Text fontWeight="600" color="gray.700">
                  Total
                </Text>
                <Text
                  fontWeight="700"
                  fontSize="lg"
                  color="brand.700"
                  letterSpacing="-0.01em"
                >
                  {currency.toIDRFormat(order.total)}
                </Text>
              </Flex>
            </CardBody>
          </Card>
        </Box>
      ) : (
        <Text color="gray.500">Order tidak ditemukan</Text>
      )}
    </Layout>
  )
}
