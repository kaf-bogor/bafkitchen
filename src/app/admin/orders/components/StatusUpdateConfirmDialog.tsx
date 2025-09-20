import React from 'react'

import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
  Text,
  Badge
} from '@chakra-ui/react'

import { mapOrderStatusToColor, mapOrderStatusToMessage, getNextStatusMessage } from '@/constants/order'

interface StatusUpdateConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  currentStatus: string
  nextStatus: string | null
  actionDescription: string
  orderNumber: string
  isLoading?: boolean
}

export default function StatusUpdateConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  nextStatus,
  actionDescription,
  orderNumber,
  isLoading = false
}: StatusUpdateConfirmDialogProps) {
  const cancelRef = React.useRef<HTMLButtonElement>(null)

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
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            {actionDescription}
          </AlertDialogHeader>

          <AlertDialogBody>
            <Text mb={4}>
              Apakah Anda yakin ingin melakukan aksi ini untuk pesanan <strong>{orderNumber}</strong>?
            </Text>
            
            <div>
              <Text fontSize="sm" color="gray.600" mb={2}>Status akan berubah dari:</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Badge 
                  colorScheme={mapOrderStatusToColor[currentStatus]} 
                  fontSize="sm" 
                  px={3} 
                  py={1}
                  borderRadius="md"
                >
                  {mapOrderStatusToMessage[currentStatus] || currentStatus}
                </Badge>
                <Text fontSize="sm" color="gray.500">→</Text>
                <Badge 
                  colorScheme={mapOrderStatusToColor[nextStatus]} 
                  fontSize="sm" 
                  px={3} 
                  py={1}
                  borderRadius="md"
                >
                  {getNextStatusMessage(currentStatus)}
                </Badge>
              </div>
            </div>
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose} disabled={isLoading}>
              Batal
            </Button>
            <Button 
              colorScheme="blue" 
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