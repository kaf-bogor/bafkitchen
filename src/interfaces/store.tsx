export interface ICreateStoreRequest {
  name: string
  email: string
}

export interface IUpdateStoreRequest {
  id: string
  name: string
  userId: string
}

export interface ISubmitStoreFormRequest {
  name: string
  id?: string
}

export interface IStore {
  id: string
  name: string
  userId?: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  user: User
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user' | 'customer' // Assuming role can be one of these options
  createdAt: string
  updatedAt: string
  phoneNumber: string | null
  lastSignInAt: string
}
