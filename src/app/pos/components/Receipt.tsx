'use client'

import React from 'react'

import {
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { FaPrint, FaFilePdf } from 'react-icons/fa'

import { currency } from '@/utils'
import { IReceiptData, exportReceiptToPDF } from '@/utils/receipt'

export function ReceiptContent({ receipt }: { receipt: IReceiptData }) {
  return (
    <Box
      id="pos-receipt"
      bg="white"
      color="black"
      fontFamily="mono"
      fontSize="xs"
      w="72mm"
      mx="auto"
      p={2}
    >
      <Text textAlign="center" fontWeight="bold" fontSize="md">
        BAZAF
      </Text>
      <Text textAlign="center" mb={2}>
        Struk Pembelian
      </Text>
      <Text>No: {receipt.orderNumber}</Text>
      <Text>
        Tgl:{' '}
        {format(new Date(receipt.date), 'dd MMM yyyy HH:mm', { locale: id })}
      </Text>
      {receipt.cashier && <Text>Kasir: {receipt.cashier}</Text>}
      {receipt.customerName && <Text>Pelanggan: {receipt.customerName}</Text>}
      <Divider my={2} borderColor="black" borderStyle="dashed" />
      {receipt.items.map((item, idx) => (
        <Box key={idx} mb={1}>
          <Text>{item.name}</Text>
          <Flex justify="space-between">
            <Text>
              {item.quantity} x {currency.toIDRFormat(item.price)}
            </Text>
            <Text>{currency.toIDRFormat(item.price * item.quantity)}</Text>
          </Flex>
        </Box>
      ))}
      <Divider my={2} borderColor="black" borderStyle="dashed" />
      <Flex justify="space-between" fontWeight="bold" fontSize="sm">
        <Text>TOTAL</Text>
        <Text>{currency.toIDRFormat(receipt.total)}</Text>
      </Flex>
      <Flex justify="space-between">
        <Text>Bayar ({receipt.payment.method})</Text>
        <Text>{currency.toIDRFormat(receipt.payment.tendered)}</Text>
      </Flex>
      <Flex justify="space-between">
        <Text>Kembalian</Text>
        <Text>{currency.toIDRFormat(receipt.payment.change)}</Text>
      </Flex>
      <Text textAlign="center" mt={3}>
        Terima kasih!
      </Text>
    </Box>
  )
}

export default function ReceiptModal({ isOpen, onClose, receipt }: Props) {
  if (!receipt) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader textAlign="center">Pembayaran Berhasil</ModalHeader>
        <ModalBody>
          <Box borderWidth="1px" borderColor="gray.200" rounded="md">
            <ReceiptContent receipt={receipt} />
          </Box>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={2} w="full" justify="center">
            <Button
              leftIcon={<FaPrint />}
              variant="outline"
              onClick={() => window.print()}
            >
              Cetak
            </Button>
            <Button
              leftIcon={<FaFilePdf />}
              variant="outline"
              onClick={() => exportReceiptToPDF(receipt)}
            >
              PDF
            </Button>
            <Button colorScheme="green" onClick={onClose}>
              Transaksi Baru
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

type Props = {
  isOpen: boolean
  onClose: () => void
  receipt: IReceiptData | null
}
