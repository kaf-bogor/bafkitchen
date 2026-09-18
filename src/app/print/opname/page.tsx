'use client'

import React, { useCallback, useEffect, useState } from 'react'

import { Box, Button, HStack, Spinner, Text } from '@chakra-ui/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useSearchParams } from 'next/navigation'

import { getChecklistSheet } from '@/app/admin/(panel)/inventory/opname/actions'
import { IStockChecklistItem, IStockOpname } from '@/interfaces/stockOpname'
import { apiFetch } from '@/utils/api'
import { exportStockChecklistToPDF } from '@/utils/exportPDF'

interface ChecklistMeta {
  title: string
  subtitle: string
  fileName: string
}

export default function PrintOpnamePage() {
  const searchParams = useSearchParams()
  const opnameId = searchParams.get('opnameId')

  const [items, setItems] = useState<IStockChecklistItem[]>([])
  const [meta, setMeta] = useState<ChecklistMeta>({
    title: 'Checklist Stok',
    subtitle: '',
    fileName: 'Checklist_Stok.pdf'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (opnameId) {
        const res = await apiFetch<{ opname: IStockOpname }>(
          `/api/inventory/opname/${opnameId}`
        )
        const opname = res.opname
        setItems(
          (opname.items || []).map((item) => ({
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            unit: item.unit,
            systemStock: item.systemStock,
            countedStock: item.countedStock,
            difference: item.difference,
            note: item.note
          }))
        )
        setMeta({
          title: `Checklist Stok — ${opname.opnameNumber}`,
          subtitle: `Tanggal ${format(new Date(opname.opnameDate), 'dd MMMM yyyy', { locale: id })}`,
          fileName: `Opname_${opname.opnameNumber}.pdf`
        })
      } else {
        const sheet = await getChecklistSheet({
          vendorId: searchParams.get('vendorId') || undefined,
          channel: searchParams.get('channel') || undefined,
          inStock: searchParams.get('inStock') === '1',
          categoryIds: searchParams.get('categoryId')
            ? [searchParams.get('categoryId') as string]
            : undefined
        })
        setItems(sheet)
        setMeta({
          title: 'Checklist Stok',
          subtitle: `Dicetak ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })}`,
          fileName: 'Checklist_Stok.pdf'
        })
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [opnameId, searchParams])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Box bg="white" minH="100vh" p={{ base: 4, md: 8 }}>
      <HStack
        className="no-print"
        justify="space-between"
        mb={6}
        sx={{ '@media print': { display: 'none' } }}
      >
        <Box>
          <Text fontWeight="700" fontSize="lg">
            {meta.title}
          </Text>
          <Text fontSize="sm" color="gray.500">
            {meta.subtitle}
          </Text>
        </Box>
        <HStack spacing={2}>
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            Cetak
          </Button>
          <Button
            size="sm"
            colorScheme="green"
            onClick={() =>
              exportStockChecklistToPDF(items, {
                title: meta.title,
                subtitle: meta.subtitle,
                fileName: meta.fileName
              })
            }
          >
            PDF
          </Button>
        </HStack>
      </HStack>

      {loading ? (
        <HStack justify="center" py={20}>
          <Spinner />
        </HStack>
      ) : error ? (
        <Text color="red.500">{error}</Text>
      ) : (
        <>
          <Box mb={4}>
            <Text fontSize="sm">
              Jumlah produk: <strong>{items.length}</strong>
            </Text>
          </Box>
          <Box
            as="table"
            w="100%"
            sx={{
              borderCollapse: 'collapse',
              '& th, & td': {
                border: '1px solid #cbd5e0',
                padding: '6px 8px',
                fontSize: '12px',
                textAlign: 'left'
              },
              '& th': { background: '#f7fafc', fontWeight: 600 }
            }}
          >
            <Box as="thead">
              <Box as="tr">
                <Box as="th" w="40px">
                  No
                </Box>
                <Box as="th" w="140px">
                  SKU
                </Box>
                <Box as="th">Nama produk</Box>
                <Box as="th" w="70px">
                  Satuan
                </Box>
                <Box as="th" w="90px" textAlign="right">
                  Stok sistem
                </Box>
                <Box as="th" w="90px">
                  Stok fisik
                </Box>
                <Box as="th" w="80px">
                  Selisih
                </Box>
                <Box as="th" w="140px">
                  Catatan
                </Box>
              </Box>
            </Box>
            <Box as="tbody">
              {items.map((item, index) => (
                <Box as="tr" key={item.productId}>
                  <Box as="td">{index + 1}</Box>
                  <Box as="td">{item.sku || '-'}</Box>
                  <Box as="td">{item.productName}</Box>
                  <Box as="td">{item.unit || '-'}</Box>
                  <Box as="td" textAlign="right">
                    {item.systemStock}
                  </Box>
                  <Box as="td">
                    {item.countedStock !== null &&
                    item.countedStock !== undefined
                      ? item.countedStock
                      : ''}
                  </Box>
                  <Box as="td">
                    {item.difference !== null && item.difference !== undefined
                      ? item.difference
                      : ''}
                  </Box>
                  <Box as="td">{item.note || ''}</Box>
                </Box>
              ))}
            </Box>
          </Box>
          <Text fontSize="xs" color="gray.500" mt={4}>
            Dicetak oleh Bazaf — {format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })}
          </Text>
        </>
      )}
    </Box>
  )
}
