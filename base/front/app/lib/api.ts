const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

interface UpdateUserData {
  username?: string
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  role?: string
  status?: string
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  // Agregar token si está disponible
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    }
  }

  try {
    const response = await fetch(url, config)
    const data = await response.json()

    if (!response.ok) {
      throw new ApiError(
        data.message || `Error ${response.status}`,
        response.status,
        data
      )
    }

    return data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError('Network error', 0)
  }
}

// Auth API
export const authApi = {
  login: (identifier: string, password: string) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }),

  register: (userData: {
    username: string
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
  }) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  forgotPassword: (email: string) =>
    apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),
}

// Users API
export const usersApi = {
  getUsers: (params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
    }
    const query = queryParams.toString()
    return apiRequest(`/users${query ? `?${query}` : ''}`)
  },

  createUser: (userData: {
    username: string
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
    role?: string
    status?: string
  }) =>
    apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  getUserById: (userId: string) => apiRequest(`/users/${userId}`),

  updateUser: (userId: string, userData: UpdateUserData) =>
    apiRequest(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),

  patchUser: (userId: string, userData: Partial<UpdateUserData>) =>
    apiRequest(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    }),

  deleteUser: (userId: string) =>
    apiRequest(`/users/${userId}`, {
      method: 'DELETE',
    }),

  // Profile endpoints
  getProfile: () => apiRequest('/users/me'),

  updateProfile: (userData: Partial<UpdateUserData>) =>
    apiRequest('/users/me', {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest('/users/me/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
}

export { ApiError }
