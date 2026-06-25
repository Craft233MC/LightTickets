import type { Role } from './ticket'

export interface User {
  id: number
  email: string
  username: string
  minecraftUuid?: string
  minecraftName?: string
  avatarUrl?: string | null
  role: Role
  createdAt?: string
  updatedAt?: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface RefreshResponse {
  user: User
  accessToken: string
}

export interface Server {
  id: string
  name: string
  apiKey: string
  address?: string
  description?: string
  createdAt: string
}
