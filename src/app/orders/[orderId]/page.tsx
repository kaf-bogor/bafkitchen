'use client'

import React from 'react'

import {
  Box,
  Card,
  Flex,
  Heading,
  HStack,
  Image,
  Divider,
  CardBody,
  Stack,
  StackDivider,
  Text,
  VStack
} from '@chakra-ui/react'
import { formatDate } from 'date-fns'

import { Layout } from '@/components/homepage'
import {
  mapOrderStatusToColor,
  mapOrderStatusToMessage
} from '@/constants/order'
import { currency } from '@/utils'

import { useGetOrderDetail } from './actions'

export default function OrderDetailPage({
  params
}: {
  params: { orderId: string }
}) {
  const { data: order, loading: isFetching, error } = useGetOrderDetail(params.orderId)

  return (
    <Layout isFetching={isFetching} error={error as Error}>
      {order ? (
        <>
          <Card>
            <CardBody>
              <HStack justify="space-between">
                <VStack align="start">
                  <Text>
                    Tanggal order:{' '}
                    {formatDate(order?.createdAt, 'dd MMMM, yyyy MM:HH')}
                  </Text>

                  <Text>Customer: {order?.customer.name}</Text>
                  <Text>Telepon: {order?.customer.phoneNumber}</Text>
                  <Text>Status: {mapOrderStatusToMessage[order.status]}</Text>
                </VStack>
                <Box
                  p={3}
                  bgColor={mapOrderStatusToColor[order.status]}
                  borderRadius="lg"
                  color="white"
                >
                  <Text>{order.status}</Text>
                </Box>
              </HStack>
            </CardBody>
          </Card>
          <Divider color="gray.300" />
          {order?.productOrders && (
            <Card>
              <CardBody>
                <Stack divider={<StackDivider />} spacing="4">
                  {order?.productOrders.map(({ id, quantity, product }) => (
                    <Flex
                      key={id}
                      flex={1}
                      w="full"
                      justifyContent="space-between"
                      direction={['column', 'row']}
                      align="center"
                    >
                      <Flex alignSelf={['start']}>
                        <Box boxSize={20} marginRight={5}>
                          <Image
                            src={product.imageUrl}
                            alt={product.description}
                            sizes="sm"
                          />
                        </Box>
                        <Box>
                          <Heading size="md">{product.name}</Heading>
                          <Text>
                            Price: {currency.toIDRFormat(product.price)}
                          </Text>
                          <Text>Quantity: {quantity}</Text>
                        </Box>
                      </Flex>

                      <Box alignSelf={['end', 'center']}>
                        <Text fontSize="large">{quantity} pcs</Text>
                      </Box>
                    </Flex>
                  ))}
                </Stack>
              </CardBody>
            </Card>
          )}
          <Divider color="gray.300" />
          <Card>
            <CardBody>
              <HStack align="start" justify="space-between">
                <Text fontSize="x-large">Total:</Text>
                <Text fontSize="x-large">
                  {currency.toIDRFormat(order.total)}
                </Text>
              </HStack>
            </CardBody>
          </Card>
        </>
      ) : (
        <Text>Order tidak ditemukan</Text>
      )}
    </Layout>
  )
}
