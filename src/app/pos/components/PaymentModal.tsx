'use client'

import React, { useEffect, useMemo, useState } from 'react'

import {
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  SimpleGrid,
  Text,
  VStack
} from '@chakra-ui/react'
import { NumericFormat } from 'react-number-format'

import { IPaymentInfo } from '@/interfaces/order'
import { currency } from '@/utils'

const QUICK_DENOMINATIONS = [10000, 20000, 50000, 100000]

export default function PaymentModal({
  isOpen,
  onClose,
  total,
  loading,
  onConfirm
}: Props) {
  const [method, setMethod] = useState('Tunai')
  const [tendered, setTendered] = useState<number>(0)
  const [customerName, setCustomerName] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (isOpen) {
      setMethod('Tunai')
      setTendered(0)
      setCustomerName('')
      setNotes('')
    }
  }, [isOpen])

  const effectiveTendered = method === 'Tunai' ? tendered : total
  const change = useMemo(
    () => Math.max(effectiveTendered - total, 0),
    [effectiveTendered, total]
  )
  const isInsufficient = method === 'Tunai' && tendered < total

  const handleConfirm = () => {
    onConfirm({
      payment: {
        method,
        tendered: effectiveTendered,
        change
      },
      customerName: customerName.trim() || undefined,
      notes: notes.trim() || undefined
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Pembayaran</ModalHeader>
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Flex
              justify="space-between"
              align="center"
              bg="green.50"
              p={3}
              rounded="md"
            >
              <Text fontWeight="medium">Total Tagihan</Text>
              <Text fontSize="xl" fontWeight="bold" color="green.700">
                {currency.toIDRFormat(total)}
              </Text>
            </Flex>

            <FormControl>
              <FormLabel>Metode Pembayaran</FormLabel>
              <RadioGroup value={method} onChange={setMethod}>
                <HStack spacing={4}>
                  <Radio value="Tunai">Tunai</Radio>
                  <Radio value="QRIS">QRIS</Radio>
                  <Radio value="Transfer">Transfer</Radio>
                </HStack>
              </RadioGroup>
            </FormControl>

            {method === 'Tunai' && (
              <>
                <FormControl>
                  <FormLabel>Uang Diterima</FormLabel>
                  <NumericFormat
                    customInput={Input}
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix="Rp "
                    placeholder="Rp 0"
                    value={tendered || ''}
                    onValueChange={(values) =>
                      setTendered(values.floatValue || 0)
                    }
                    autoFocus
                  />
                </FormControl>
                <SimpleGrid columns={3} gap={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setTendered(total)}
                  >
                    Uang Pas
                  </Button>
                  {QUICK_DENOMINATIONS.map((amount) => (
                    <Button
                      key={amount}
                      size="sm"
                      variant="outline"
                      onClick={() => setTendered(amount)}
                    >
                      {currency.toIDRFormat(amount)}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setTendered(Math.ceil(total / 50000) * 50000)
                    }
                  >
                    {currency.toIDRFormat(Math.ceil(total / 50000) * 50000)}
                  </Button>
                </SimpleGrid>
                <Flex
                  justify="space-between"
                  align="center"
                  p={3}
                  rounded="md"
                  bg={isInsufficient ? 'red.50' : 'blue.50'}
                >
                  <Text fontWeight="medium">Kembalian</Text>
                  <Text
                    fontSize="lg"
                    fontWeight="bold"
                    color={isInsufficient ? 'red.600' : 'blue.700'}
                  >
                    {isInsufficient
                      ? `Kurang ${currency.toIDRFormat(total - tendered)}`
                      : currency.toIDRFormat(change)}
                  </Text>
                </Flex>
              </>
            )}

            <Divider />

            <FormControl>
              <FormLabel>Nama Pelanggan (opsional)</FormLabel>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in Customer"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Catatan (opsional)</FormLabel>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan pesanan"
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Batal
          </Button>
          <Button
            colorScheme="green"
            onClick={handleConfirm}
            isDisabled={isInsufficient || total <= 0}
            isLoading={loading}
            loadingText="Memproses..."
          >
            {method === 'Tunai'
              ? 'Terima Pembayaran'
              : `Konfirmasi ${method}`}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

type Props = {
  isOpen: boolean
  onClose: () => void
  total: number
  loading: boolean
  // eslint-disable-next-line no-unused-vars
  onConfirm: (payload: {
    payment: IPaymentInfo
    customerName?: string
    notes?: string
  }) => void
}
