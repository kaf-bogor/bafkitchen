'use client'

import React, { useRef } from 'react'

import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Text,
  VStack
} from '@chakra-ui/react'

import ProductImage from '@/components/ProductImage'
import { StatusBadge } from '@/components/ui'
import {
  mapOrderStatusToColor,
  mapOrderStatusToMessage,
  getNextStatusMessage
} from '@/constants/order'

interface StatusUpdateConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  currentStatus: string
  nextStatus: string | null
  actionDescription: string
  orderNumber: string
  isLoading?: boolean
  showProofUpload?: boolean
  proofFile?: File | null
  proofPreviewUrl?: string | null
  // eslint-disable-next-line no-unused-vars
  onProofChange?: (file: File | null) => void
}

export default function StatusUpdateConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  nextStatus,
  actionDescription,
  orderNumber,
  isLoading = false,
  showProofUpload = false,
  proofPreviewUrl,
  onProofChange
}: StatusUpdateConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  if (!nextStatus) return null

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
      isCentered
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="600">
            {actionDescription}
          </AlertDialogHeader>

          <AlertDialogBody>
            <VStack align="stretch" spacing={4}>
              <Text fontSize="sm" color="text-body">
                Apakah Anda yakin ingin melakukan aksi ini untuk pesanan{' '}
                <strong>{orderNumber}</strong>?
              </Text>

              <HStack spacing={2} flexWrap="nowrap">
                <StatusBadge color={mapOrderStatusToColor[currentStatus]}>
                  {mapOrderStatusToMessage[currentStatus] || currentStatus}
                </StatusBadge>
                <Text fontSize="xs" color="text-subtle">
                  →
                </Text>
                <StatusBadge color={mapOrderStatusToColor[nextStatus]}>
                  {getNextStatusMessage(currentStatus)}
                </StatusBadge>
              </HStack>

              {showProofUpload && (
                <FormControl>
                  <FormLabel>Bukti pembayaran</FormLabel>
                  {proofPreviewUrl && (
                    <ProductImage
                      src={proofPreviewUrl}
                      alt="Bukti pembayaran"
                      boxSize="120px"
                      objectFit="cover"
                      borderRadius="lg"
                      mb={2}
                    />
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    p={1}
                    onChange={(e) =>
                      onProofChange?.(e.target.files?.[0] || null)
                    }
                  />
                  <Text fontSize="xs" color="text-subtle" mt={1}>
                    Unggah foto bukti transfer/pembayaran (opsional).
                  </Text>
                </FormControl>
              )}
            </VStack>
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose} isDisabled={isLoading}>
              Batal
            </Button>
            <Button
              colorScheme="brand"
              onClick={onConfirm}
              ml={3}
              isLoading={isLoading}
              loadingText="Memperbarui..."
            >
              Ya, {actionDescription}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  )
}
