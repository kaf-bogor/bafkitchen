'use client'

import React from 'react'

import {
  Badge,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { FaReceipt } from 'react-icons/fa'

import { IOrder } from '@/interfaces'
import { currency } from '@/utils'

export default function OrderHistoryModal({
  isOpen,
  onClose,
  orders,
  loading,
  onReprint
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Riwayat Penjualan Hari Ini</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6} overflowX="auto">
          {!loading && orders.length === 0 && (
            <Text color="gray.400" textAlign="center" py={6}>
              Belum ada penjualan POS hari ini
            </Text>
          )}
          {orders.length > 0 && (
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th>No. Order</Th>
                  <Th>Waktu</Th>
                  <Th>Pelanggan</Th>
                  <Th isNumeric>Item</Th>
                  <Th>Metode</Th>
                  <Th isNumeric>Total</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {orders.map((order) => (
                  <Tr key={order.id}>
                    <Td fontWeight="medium">{order.orderNumber || '-'}</Td>
                    <Td>
                      {format(new Date(order.createdAt), 'HH:mm', {
                        locale: id
                      })}
                    </Td>
                    <Td>{order.customer?.name || 'Walk-in'}</Td>
                    <Td isNumeric>
                      {order.productOrders?.reduce(
                        (acc, po) => acc + (po.quantity || 0),
                        0
                      )}
                    </Td>
                    <Td>
                      <Badge colorScheme="blue">
                        {order.payment?.method || '-'}
                      </Badge>
                    </Td>
                    <Td isNumeric fontWeight="semibold">
                      {currency.toIDRFormat(order.total)}
                    </Td>
                    <Td>
                      <Button
                        size="xs"
                        variant="outline"
                        leftIcon={<FaReceipt />}
                        onClick={() => onReprint(order)}
                      >
                        Struk
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

type Props = {
  isOpen: boolean
  onClose: () => void
  orders: IOrder.IOrder[]
  loading: boolean
  // eslint-disable-next-line no-unused-vars
  onReprint: (order: IOrder.IOrder) => void
}
