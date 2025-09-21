export interface ISettings {
  id: string
  admin_phone_number: string
  app_name: string
  app_domain: string
  created_at: string
  updated_at: string
}

export interface ICreateSettingsRequest {
  admin_phone_number: string
  app_name: string
  app_domain: string
}

export interface IUpdateSettingsRequest {
  id: string
  admin_phone_number: string
  app_name: string
  app_domain: string
}