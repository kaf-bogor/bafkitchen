'use client'

import React, { useState, useEffect } from 'react'

import {
  Box,
  Heading,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast
} from '@chakra-ui/react'

import { Layout } from '@/components'
import SettingsForm from '@/components/admin/settings/SettingsForm'
import {
  ICreateSettingsRequest,
  IUpdateSettingsRequest
} from '@/interfaces/settings'

import { useGetSettings, useCreateSettings, useUpdateSettings } from './actions'

export default function SettingsPage() {
  const toast = useToast()

  const {
    data: settings,
    loading: isFetching,
    error,
    refetch
  } = useGetSettings()
  const { createSettings, loading: isCreating } = useCreateSettings()
  const { updateSettings, loading: isUpdating } = useUpdateSettings()

  const [formData, setFormData] = useState({
    admin_phone_number: '',
    app_name: 'BAF Kitchen',
    app_domain: ''
  })

  const [formErrors, setFormErrors] = useState<{
    admin_phone_number?: string
    app_name?: string
    app_domain?: string
  }>({})

  // Update form data when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormData({
        admin_phone_number: settings.admin_phone_number,
        app_name: settings.app_name,
        app_domain: settings.app_domain
      })
    }
  }, [settings])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error for this field when user starts typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const validateForm = () => {
    const errors: typeof formErrors = {}

    if (!formData.admin_phone_number.trim()) {
      errors.admin_phone_number = 'Admin phone number is required'
    } else if (!/^\d+$/.test(formData.admin_phone_number)) {
      errors.admin_phone_number = 'Phone number should contain only digits'
    }

    if (!formData.app_name.trim()) {
      errors.app_name = 'App name is required'
    }

    if (!formData.app_domain.trim()) {
      errors.app_domain = 'App domain is required'
    } else if (!/^https?:\/\/.+/.test(formData.app_domain)) {
      errors.app_domain =
        'Please enter a valid URL (starting with http:// or https://)'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (
    data: ICreateSettingsRequest | IUpdateSettingsRequest
  ) => {
    if (!validateForm()) return

    try {
      if (settings) {
        // Update existing settings
        await updateSettings(data as IUpdateSettingsRequest)
        toast({
          title: 'Settings updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true
        })
      } else {
        // Create new settings
        await createSettings(data as ICreateSettingsRequest)
        toast({
          title: 'Settings created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true
        })
      }

      await refetch()
    } catch (error) {
      toast({
        title: `Failed to ${settings ? 'update' : 'create'} settings`,
        description: (error as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const breadcrumbs = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Settings', path: '/admin/settings' }
  ]

  return (
    <Layout
      breadcrumbs={breadcrumbs}
      isFetching={isFetching}
      error={error as Error}
    >
      <Box w="full">
        <Heading size="lg" mb={6}>
          Application Settings
        </Heading>

        {!isFetching && !settings && (
          <Alert status="info" mb={6}>
            <AlertIcon />
            <Box>
              <AlertTitle>No settings found!</AlertTitle>
              <AlertDescription>
                Create your first settings configuration to manage app settings
                like admin phone number.
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {!isFetching && (
          <SettingsForm
            settings={settings}
            onSubmit={handleSubmit}
            onChange={handleChange}
            isLoading={isCreating || isUpdating}
            formData={formData}
            errors={formErrors}
          />
        )}

        {settings && (
          <Box mt={6} p={4} bg="gray.50" borderRadius="md">
            <Text fontSize="sm" color="gray.600">
              <strong>Last updated:</strong>{' '}
              {new Date(settings.updated_at).toLocaleString()}
            </Text>
          </Box>
        )}
      </Box>
    </Layout>
  )
}
