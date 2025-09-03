'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: 'admin' | 'user'
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Cargar token del localStorage al iniciar
    const savedToken = localStorage.getItem('auth_token')
    if (savedToken) {
      setToken(savedToken)
      fetchUserProfile(savedToken)
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        // Token inválido, limpiar
        localStorage.removeItem('auth_token')
        setToken(null)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      localStorage.removeItem('auth_token')
      setToken(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (authToken: string) => {
    setToken(authToken)
    localStorage.setItem('auth_token', authToken)
    await fetchUserProfile(authToken)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
  }

  const value = {
    user,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
