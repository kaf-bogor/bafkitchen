import { useToast, UseToastOptions } from '@chakra-ui/react'

export const useToastMessage = () => {
  const toast = useToast()
  const defaultOptions = {
    duration: 3000,
    isClosable: true
  }

  const success = ({ title, message, options }: Args) => {
    toast({
      title: title || 'Success',
      description: message,
      status: 'success',
      ...defaultOptions,
      ...options
    })
  }

  const warning = ({ title, message, options }: Args) => {
    toast({
      title: title || 'Warning',
      description: message,
      status: 'warning',
      ...defaultOptions,
      ...options
    })
  }

  const error = ({ title, message, options }: Args) => {
    toast({
      title: title || 'Error',
      description: message,
      status: 'error',
      ...defaultOptions,
      ...options
    })
  }

  return { success, warning, error }
}

type Args = {
  title?: string
  message: string
  options?: UseToastOptions
}
export default useToastMessage
