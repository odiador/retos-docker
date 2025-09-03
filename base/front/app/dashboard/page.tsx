'use client'

import React, { useState, useEffect } from 'react'
import { Navbar } from '../components/Navbar'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { useAuth } from '../contexts/AuthContext'
import Link from 'next/link'
import { Button } from '../components/ui/Button'
import { usersApi, ApiError } from '../lib/api'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  adminUsers: number
  recentUsers: Array<{
    id: string
    username: string
    firstName: string
    lastName: string
    createdAt: string
  }>
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!isAdmin) {
        setIsLoading(false)
        return
      }

      try {
        const response = await usersApi.getUsers({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }) as {
          users: Array<{
            id: string
            username: string
            firstName: string
            lastName: string
            role: string
            status: string
            createdAt: string
          }>
          total: number
        }

        const totalResponse = await usersApi.getUsers({ limit: 1000 }) as {
          users: Array<{ role: string; status: string }>
        }

        const totalUsers = totalResponse.users.length
        const activeUsers = totalResponse.users.filter(u => u.status === 'active').length
        const adminUsers = totalResponse.users.filter(u => u.role === 'admin').length

        setStats({
          totalUsers,
          activeUsers,
          adminUsers,
          recentUsers: response.users.slice(0, 5)
        })
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message)
        } else {
          setError('Error al cargar los datos del dashboard')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [isAdmin])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {getGreeting()}, {user?.firstName}!
            </h1>
            <p className="mt-2 text-gray-600">
              Aquí tienes un resumen de la actividad del sistema
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-800">{error}</div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tarjetas de acceso rápido */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">Mi Perfil</h3>
                      <p className="text-gray-600">Gestiona tu información personal</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link href="/profile">
                      <Button variant="outline" size="sm" fullWidth>Ver Perfil</Button>
                    </Link>
                  </div>
                </div>

                {isAdmin && (
                  <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900">Gestión de Usuarios</h3>
                        <p className="text-gray-600">Administra usuarios del sistema</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link href="/users">
                        <Button variant="outline" size="sm" fullWidth>Ver Usuarios</Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Información de la cuenta */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tu Cuenta</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{user?.username}</div>
                    <div className="text-sm text-gray-600">Usuario</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${user?.role === 'admin' ? 'text-purple-600' : 'text-blue-600'}`}>
                      {user?.role === 'admin' ? 'Admin' : 'Usuario'}
                    </div>
                    <div className="text-sm text-gray-600">Rol</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${user?.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                      {user?.status === 'active' ? 'Activo' : 'Inactivo'}
                    </div>
                    <div className="text-sm text-gray-600">Estado</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Creado</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel lateral */}
            <div className="space-y-6">
              {/* Estadísticas del sistema (solo para admin) */}
              {isAdmin && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas del Sistema</h3>
                  
                  {isLoading ? (
                    <div className="text-center py-4">
                      <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                  ) : stats ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total de usuarios</span>
                        <span className="font-semibold text-blue-600">{stats.totalUsers}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Usuarios activos</span>
                        <span className="font-semibold text-green-600">{stats.activeUsers}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Administradores</span>
                        <span className="font-semibold text-purple-600">{stats.adminUsers}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Usuarios recientes (solo para admin) */}
              {isAdmin && stats?.recentUsers && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Usuarios Recientes</h3>
                    <Link href="/users" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Ver todos
                    </Link>
                  </div>
                  
                  <div className="space-y-3">
                    {stats.recentUsers.map((recentUser) => (
                      <div key={recentUser.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            {recentUser.firstName} {recentUser.lastName}
                          </div>
                          <div className="text-sm text-gray-600">@{recentUser.username}</div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(recentUser.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Acciones rápidas */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
                <div className="space-y-3">
                  <Link href="/profile">
                    <Button variant="outline" size="sm" fullWidth>
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar Perfil
                    </Button>
                  </Link>
                  
                  {isAdmin && (
                    <Link href="/users/create">
                      <Button variant="outline" size="sm" fullWidth>
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Crear Usuario
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
