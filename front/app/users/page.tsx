'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '../components/Navbar'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Table } from '../components/ui/Table'
import { Modal } from '../components/ui/Modal'
import { Alert } from '../components/ui/Alert'
import { usersApi, ApiError } from '../lib/api'

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

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [sortKey, setSortKey] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const router = useRouter()

  const loadUsers = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await usersApi.getUsers({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter,
        sortBy: sortKey,
        sortOrder: sortDirection
      }) as { users: User[], total: number }
      
      setUsers(response.users || [])
      setTotalPages(Math.ceil((response.total || 0) / 10))
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Error al cargar usuarios')
      }
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchTerm, statusFilter, sortKey, sortDirection])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      setCurrentPage(1)
      loadUsers()
    }, 500)

    return () => clearTimeout(delayedSearch)
  }, [loadUsers])

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key)
    setSortDirection(direction)
  }

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setIsDeleteModalOpen(true)
    setDeleteError('')
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    try {
      await usersApi.deleteUser(userToDelete.id)
      setIsDeleteModalOpen(false)
      setUserToDelete(null)
      loadUsers()
    } catch (err) {
      if (err instanceof ApiError) {
        setDeleteError(err.message)
      } else {
        setDeleteError('Error al eliminar usuario')
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
        status === 'active' 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {status === 'active' ? 'Activo' : 'Inactivo'}
      </span>
    )
  }

  const getRoleBadge = (role: string) => {
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
        role === 'admin' 
          ? 'bg-purple-100 text-purple-800' 
          : 'bg-blue-100 text-blue-800'
      }`}>
        {role === 'admin' ? 'Admin' : 'Usuario'}
      </span>
    )
  }

  const columns = [
    { key: 'username', label: 'Usuario', sortable: true },
    { key: 'firstName', label: 'Nombre', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Rol', sortable: false },
    { key: 'status', label: 'Estado', sortable: false },
    { key: 'createdAt', label: 'Creado', sortable: true },
    { key: 'actions', label: 'Acciones', sortable: false }
  ]

  const tableData = users.map(user => ({
    username: user.username,
    firstName: `${user.firstName} ${user.lastName}`,
    email: user.email,
    role: getRoleBadge(user.role),
    status: getStatusBadge(user.status),
    createdAt: formatDate(user.createdAt),
    actions: (
      <div className="flex space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push(`/users/${user.id}`)}
        >
          Ver
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push(`/users/${user.id}/edit`)}
        >
          Editar
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={() => handleDeleteClick(user)}
        >
          Eliminar
        </Button>
      </div>
    )
  }))

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
                <p className="mt-2 text-gray-600">
                  Administra los usuarios del sistema
                </p>
              </div>
              <Button onClick={() => router.push('/users/create')}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear Usuario
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-6">
              <Alert type="error" onClose={() => setError('')}>
                {error}
              </Alert>
            </div>
          )}

          <div className="bg-white shadow-sm rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos los estados</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
                <div className="text-sm text-gray-500 flex items-center">
                  {users.length} usuario{users.length !== 1 ? 's' : ''} encontrado{users.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            <Table
              columns={columns}
              data={tableData}
              onSort={handleSort}
              sortKey={sortKey}
              sortDirection={sortDirection}
              isLoading={isLoading}
              emptyMessage="No se encontraron usuarios"
            />

            {totalPages > 1 && (
              <div className="p-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Anterior
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Modal de confirmación de eliminación */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Confirmar Eliminación"
        >
          <div className="space-y-4">
            {deleteError && (
              <Alert type="error">
                {deleteError}
              </Alert>
            )}
            
            <p className="text-gray-600">
              ¿Estás seguro de que deseas eliminar al usuario{' '}
              <span className="font-semibold">{userToDelete?.username}</span>?
            </p>
            <p className="text-sm text-red-600">
              Esta acción no se puede deshacer.
            </p>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </ProtectedRoute>
  )
}
