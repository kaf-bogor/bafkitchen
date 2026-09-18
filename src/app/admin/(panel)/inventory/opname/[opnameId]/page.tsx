'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'

import { CheckIcon, DownloadIcon } from '@chakra-ui/icons'
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertIcon,
  Box,
  Button,
  HStack,
  Input,
  SimpleGrid,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useParams } from 'next/navigation'

import { Layout } from '@/components'
import {
  Card,
  CardBody,
  CardHeader,
  PageHeader,
  StatCard,
  StatusBadge
} from '@/components/ui'
import { exportStockChecklistToPDF } from '@/utils/exportPDF'

import {
  useFinalizeOpname,
  useGetOpname,
  useUpdateOpnameItems
} from '../actions'

export default function StockOpnameDetailPage() {
  const { opnameId } = useParams()
  const toast = useToast()

  const {
    data: opname,
    loading,
    error,
    refetch
  } = useGetOpname(opnameId as string)
  const { updateOpnameItems, loading: isSaving } = useUpdateOpnameItems()
  const { finalizeOpname, loading: isFinalizing } = useFinalizeOpname()

  const finalizeDialog = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement>(null)

  const [counts, setCounts] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const initIdRef = useRef('')

  useEffect(() => {
    if (!opname?.items) return
    if (initIdRef.current === opname.id) return
    initIdRef.current = opname.id
    const nextCounts: Record<string, string> = {}
    const nextNotes: Record<string, string> = {}
    opname.items.forEach((item) => {
      nextCounts[item.id] =
        item.countedStock === null || item.countedStock === undefined
          ? ''
          : String(item.countedStock)
      nextNotes[item.id] = item.note || ''
    })
    setCounts(nextCounts)
    setNotes(nextNotes)
  }, [opname])

  const isFinalized = opname?.status === 'finalized'

  const summary = useMemo(() => {
    const items = opname?.items || []
    let counted = 0
    let difference = 0
    items.forEach((item) => {
      const raw = counts[item.id]
      if (raw !== undefined && raw !== '') {
        counted += 1
        difference += Number(raw) - item.systemStock
      }
    })
    return { total: items.length, counted, difference }
  }, [opname, counts])

  const handleSave = async () => {
    if (!opname) return
    try {
      await updateOpnameItems(
        opname.id,
        opname.items?.map((item) => ({
          id: item.id,
          countedStock:
            counts[item.id] === '' || counts[item.id] === undefined
              ? null
              : Number(counts[item.id]),
          note: notes[item.id] || ''
        })) || []
      )
      toast({
        title: 'Hitungan disimpan',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      refetch()
    } catch (err) {
      toast({
        title: 'Gagal menyimpan',
        description: (err as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const handleFinalize = async () => {
    if (!opname) return
    try {
      const res = await finalizeOpname(opname.id)
      toast({
        title: 'Opname difinalisasi',
        description: `${res.adjusted} produk disesuaikan`,
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      finalizeDialog.onClose()
      refetch()
    } catch (err) {
      toast({
        title: 'Gagal finalisasi',
        description: (err as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const handleExportPDF = () => {
    if (!opname?.items) return
    exportStockChecklistToPDF(
      opname.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        unit: item.unit,
        systemStock: item.systemStock,
        countedStock: counts[item.id] === '' ? null : Number(counts[item.id]),
        difference:
          counts[item.id] === ''
            ? null
            : Number(counts[item.id]) - item.systemStock,
        note: notes[item.id]
      })),
      {
        title: `Checklist Stok — ${opname.opnameNumber}`,
        subtitle: `Tanggal ${format(new Date(opname.opnameDate), 'dd MMMM yyyy', { locale: id })}`,
        fileName: `Opname_${opname.opnameNumber}.pdf`
      }
    )
  }

  const breadcrumbs = [
    { label: 'Dasbor', path: '/admin' },
    { label: 'Stok Opname', path: '/admin/inventory/opname' },
    { label: opname?.opnameNumber || (opnameId as string) }
  ]

  return (
    <Layout error={error as Error} isFetching={loading}>
      {opname && (
        <>
          <PageHeader
            title={`Opname ${opname.opnameNumber}`}
            subtitle={`Dibuat ${format(new Date(opname.createdAt), 'dd MMMM yyyy', { locale: id })}`}
            breadcrumbs={breadcrumbs}
            actions={
              <HStack spacing={2}>
                <StatusBadge color={isFinalized ? 'green' : 'orange'}>
                  {isFinalized ? 'Selesai' : 'Draft'}
                </StatusBadge>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="brand"
                  leftIcon={<DownloadIcon />}
                  onClick={handleExportPDF}
                >
                  PDF
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="brand"
                  onClick={() =>
                    window.open(`/print/opname?opnameId=${opname.id}`, '_blank')
                  }
                >
                  Cetak
                </Button>
                {!isFinalized && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      colorScheme="brand"
                      onClick={handleSave}
                      isLoading={isSaving}
                    >
                      Simpan
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="brand"
                      leftIcon={<CheckIcon />}
                      onClick={finalizeDialog.onOpen}
                    >
                      Finalisasi
                    </Button>
                  </>
                )}
              </HStack>
            }
          />

          <SimpleGrid columns={{ base: 1, sm: 3 }} gap={5} mb={6}>
            <StatCard
              label="Jumlah produk"
              value={String(summary.total)}
              tone="brand"
            />
            <StatCard
              label="Sudah dihitung"
              value={`${summary.counted} / ${summary.total}`}
              tone="blue"
            />
            <StatCard
              label="Total selisih"
              value={`${summary.difference > 0 ? '+' : ''}${summary.difference}`}
              sublabel="Fisik − sistem"
              tone={
                summary.difference < 0
                  ? 'red'
                  : summary.difference > 0
                    ? 'green'
                    : 'gray'
              }
            />
          </SimpleGrid>

          {opname.note && (
            <Alert status="info" borderRadius="lg" mb={5}>
              <AlertIcon />
              <AlertDescription fontSize="sm">{opname.note}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader
              title="Hitungan stok"
              description="Isi stok fisik tiap produk, lalu simpan atau finalisasi"
            />
            <CardBody p={0}>
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Produk</Th>
                      <Th isNumeric>Stok sistem</Th>
                      <Th isNumeric>Stok fisik</Th>
                      <Th isNumeric>Selisih</Th>
                      <Th>Catatan</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {opname.items?.map((item) => {
                      const raw = counts[item.id] ?? ''
                      const hasCount = raw !== ''
                      const difference = hasCount
                        ? Number(raw) - item.systemStock
                        : null
                      return (
                        <Tr key={item.id}>
                          <Td>
                            <Text fontWeight="600">{item.productName}</Text>
                            <Text fontSize="xs" color="text-muted">
                              {item.sku || '-'} · {item.unit || '-'}
                            </Text>
                          </Td>
                          <Td isNumeric>{item.systemStock}</Td>
                          <Td isNumeric>
                            <Input
                              size="sm"
                              type="number"
                              min={0}
                              w="90px"
                              textAlign="right"
                              isDisabled={isFinalized}
                              value={raw}
                              onChange={(e) =>
                                setCounts((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value
                                }))
                              }
                            />
                          </Td>
                          <Td isNumeric>
                            {difference === null ? (
                              <Text color="text-muted">-</Text>
                            ) : (
                              <Text
                                fontWeight="600"
                                color={
                                  difference < 0
                                    ? 'red.500'
                                    : difference > 0
                                      ? 'green.600'
                                      : 'text-body'
                                }
                              >
                                {difference > 0 ? '+' : ''}
                                {difference}
                              </Text>
                            )}
                          </Td>
                          <Td>
                            <Input
                              size="sm"
                              placeholder="Opsional"
                              isDisabled={isFinalized}
                              value={notes[item.id] ?? ''}
                              onChange={(e) =>
                                setNotes((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value
                                }))
                              }
                            />
                          </Td>
                        </Tr>
                      )
                    })}
                  </Tbody>
                </Table>
              </Box>
            </CardBody>
          </Card>
        </>
      )}

      <AlertDialog
        isOpen={finalizeDialog.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={finalizeDialog.onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="600">
              Finalisasi opname
            </AlertDialogHeader>
            <AlertDialogBody color="text-body">
              Stok sistem akan disesuaikan dengan stok fisik untuk{' '}
              <strong>{summary.counted} produk</strong> yang sudah dihitung.
              Tindakan ini tidak bisa dibatalkan.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                ref={cancelRef}
                onClick={finalizeDialog.onClose}
                isDisabled={isFinalizing}
              >
                Batal
              </Button>
              <Button
                colorScheme="brand"
                onClick={handleFinalize}
                ml={3}
                isLoading={isFinalizing}
                loadingText="Memproses..."
              >
                Ya, finalisasi
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Layout>
  )
}
