export interface IVendor {
  id: string
  name: string
  email: string
  type?: 'bafkitchen' | 'bazaf' | 'both'
  userId?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name: string
    email: string
    role: 'admin' | 'user' | 'vendor'
    createdAt: string
    updatedAt: string
    phoneNumber: string | null
    lastSignInAt: string
  }
}

export interface ICreateVendorRequest {
  name: string
  email: string
  type?: 'bafkitchen' | 'bazaf' | 'both'
}

export interface IUpdateVendorRequest {
  id: string
  name: string
  userId: string
  type?: 'bafkitchen' | 'bazaf' | 'both'
}

export interface ISubmitVendorFormRequest {
  name: string
  id?: string
}
