'use client'
import React from 'react'

import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  useToast,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react'

import { Layout } from '@/components'

import { useMigrateStoresToVendors, useGetVendors } from '../actions'

export default function VendorMigrationPage() {
  const toast = useToast()
  const { data: vendors } = useGetVendors()
  const migrateMutation = useMigrateStoresToVendors()

  const breadcrumbs = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Vendors', path: '/admin/vendors' },
    { label: 'Migration', path: '/admin/vendors/migrate' }
  ]

  const handleMigration = async () => {
    try {
      await migrateMutation.mutateAsync()
      
      toast({
        title: 'Migration completed successfully!',
        description: 'All store data has been migrated to the vendors collection.',
        status: 'success',
        duration: 5000,
        isClosable: true
      })
    } catch (error) {
      console.error('Migration error:', error)
      
      let errorMessage = (error as Error).message
      
      // Provide more helpful error messages
      if (errorMessage.includes('Missing or insufficient permissions')) {
        errorMessage = 'You need admin permissions to run this migration. Please ensure you are logged in as an admin user.'
      } else if (errorMessage.includes('auth')) {
        errorMessage = 'Authentication error. Please make sure you are signed in and have admin privileges.'
      }
      
      toast({
        title: 'Migration failed',
        description: errorMessage,
        status: 'error',
        duration: 8000,
        isClosable: true
      })
    }
  }

  return (
    <Layout breadcrumbs={breadcrumbs}>
      <VStack spacing={6} align="stretch">
        <Card>
          <CardHeader>
            <Heading size="lg">Vendor Data Migration</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text>
                This tool migrates vendor data from the legacy &ldquo;stores&rdquo; collection to the new &ldquo;vendors&rdquo; collection.
                This ensures proper vendor name resolution in invoices and improves system organization.
              </Text>

              <Alert status="warning">
                <AlertIcon />
                <Box>
                  <AlertTitle>Admin Access Required:</AlertTitle>
                  <AlertDescription>
                    This migration requires admin permissions. Make sure you are logged in as an admin user before running the migration.
                  </AlertDescription>
                </Box>
              </Alert>

              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>Migration Process:</AlertTitle>
                  <AlertDescription>
                    • Reads all data from the &ldquo;stores&rdquo; collection<br/>
                    • Creates corresponding records in the &ldquo;vendors&rdquo; collection<br/>
                    • Preserves all original data and relationships<br/>
                    • Skips vendors that already exist (safe to run multiple times)
                  </AlertDescription>
                </Box>
              </Alert>

              <Box p={4} bg="gray.50" borderRadius="md">
                <Text fontWeight="bold" mb={2}>Current Status:</Text>
                <Text>Vendors in collection: {vendors?.length || 0}</Text>
                <Text fontSize="sm" color="gray.600">
                  {vendors?.length ? 'Vendors collection exists and has data' : 'Vendors collection is empty or doesn&apos;t exist'}
                </Text>
              </Box>

              <Button
                colorScheme="blue"
                size="lg"
                onClick={handleMigration}
                isLoading={migrateMutation.isPending}
                loadingText="Migrating..."
              >
                Start Migration
              </Button>

              {vendors?.length ? (
                <Alert status="success">
                  <AlertIcon />
                  <AlertTitle>Migration appears to be complete!</AlertTitle>
                  <AlertDescription>
                    The vendors collection already contains data. You can still run the migration to ensure all data is synchronized.
                  </AlertDescription>
                </Alert>
              ) : null}
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Layout>
  )
}