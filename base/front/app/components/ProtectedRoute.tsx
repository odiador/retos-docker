'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false, 
  redirectTo = '/auth/login' 
}: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(redirectTo)
        return
      }
      
      if (requireAdmin && !isAdmin) {
        router.push('/dashboard')
        return
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, requireAdmin, redirectTo, router])

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    )
  }

  // No mostrar contenido si no está autenticado o no tiene permisos
  if (!isAuthenticated || (requireAdmin && !isAdmin)) {
    return null
  }

  return <>{children}</>
}

// HOC para envolver componentes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requireAdmin = false
) {
  const AuthenticatedComponent = (props: P) => {
    return (
      <ProtectedRoute requireAdmin={requireAdmin}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }

  AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name})`
  
  return AuthenticatedComponent
}
