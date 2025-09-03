'use client'

import React, { useState } from 'react'
import { Navbar } from '../components/Navbar'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Alert } from '../components/ui/Alert'
import { Modal } from '../components/ui/Modal'
import { usersApi, ApiError } from '../lib/api'

export default function ProfilePage() {
  const { user, login } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || ''
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      await usersApi.updateProfile(profileData)
      
      // Actualizar el token para refrescar los datos del usuario
      const token = localStorage.getItem('auth_token')
      if (token) {
        await login(token)
      }
      
      setSuccess('Perfil actualizado exitosamente')
      setIsEditing(false)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Error al actualizar el perfil')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }

    setIsLoading(true)

    try {
      await usersApi.changePassword(passwordData.currentPassword, passwordData.newPassword)
      setSuccess('Contraseña cambiada exitosamente')
      setIsChangingPassword(false)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Error al cambiar la contraseña')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
            <p className="mt-2 text-gray-600">
              Gestiona tu información personal y configuración de cuenta
            </p>
          </div>

          {error && (
            <div className="mb-6">
              <Alert type="error" onClose={() => setError('')}>
                {error}
              </Alert>
            </div>
          )}

          {success && (
            <div className="mb-6">
              <Alert type="success" onClose={() => setSuccess('')}>
                {success}
              </Alert>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Información del perfil */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow-sm rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Información Personal</h2>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      Editar
                    </Button>
                  )}
                </div>

                <div className="p-6">
                  {isEditing ? (
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Nombre"
                          name="firstName"
                          value={profileData.firstName}
                          onChange={handleProfileChange}
                          required
                        />
                        <Input
                          label="Apellido"
                          name="lastName"
                          value={profileData.lastName}
                          onChange={handleProfileChange}
                          required
                        />
                      </div>

                      <Input
                        label="Teléfono"
                        name="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                        placeholder="Opcional"
                      />

                      <div className="flex justify-end space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false)
                            setProfileData({
                              firstName: user?.firstName || '',
                              lastName: user?.lastName || '',
                              phone: user?.phone || ''
                            })
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          isLoading={isLoading}
                        >
                          Guardar Cambios
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Nombre</label>
                          <p className="mt-1 text-sm text-gray-900">{user?.firstName}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Apellido</label>
                          <p className="mt-1 text-sm text-gray-900">{user?.lastName}</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Usuario</label>
                        <p className="mt-1 text-sm text-gray-900">{user?.username}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                        <p className="mt-1 text-sm text-gray-900">{user?.phone || 'No especificado'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Cambiar contraseña */}
              <div className="bg-white shadow-sm rounded-lg mt-6">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Seguridad</h2>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Contraseña</h3>
                      <p className="text-sm text-gray-500">Actualiza tu contraseña regularmente para mantener tu cuenta segura</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsChangingPassword(true)}
                    >
                      Cambiar Contraseña
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Información de la cuenta */}
            <div>
              <div className="bg-white shadow-sm rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Información de la Cuenta</h2>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rol</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                      user?.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                      user?.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user?.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cuenta creada</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {user?.createdAt ? formatDate(user.createdAt) : 'No disponible'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Última actualización</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {user?.updatedAt ? formatDate(user.updatedAt) : 'No disponible'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Modal para cambiar contraseña */}
        <Modal
          isOpen={isChangingPassword}
          onClose={() => setIsChangingPassword(false)}
          title="Cambiar Contraseña"
        >
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              label="Contraseña actual"
              name="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              required
            />

            <Input
              label="Nueva contraseña"
              name="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              required
              helpText="Mínimo 6 caracteres"
            />

            <Input
              label="Confirmar nueva contraseña"
              name="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              required
            />

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsChangingPassword(false)
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  })
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={isLoading}
              >
                Cambiar Contraseña
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </ProtectedRoute>
  )
}
