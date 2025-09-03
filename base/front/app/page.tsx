'use client'

import { useAuth } from './contexts/AuthContext'
import { Navbar } from './components/Navbar'
import Link from 'next/link'
import { Button } from './components/ui/Button'

export default function Home() {
  const { isAuthenticated, user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {isAuthenticated ? (
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              ¡Bienvenido, {user?.firstName}!
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Sistema de Gestión de Usuarios
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Mi Perfil</h3>
                <p className="text-gray-600 mb-4">Gestiona tu información personal y configuración de cuenta</p>
                <Link href="/profile">
                  <Button variant="outline" size="sm">Ver Perfil</Button>
                </Link>
              </div>

              {user?.role === 'admin' && (
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestión de Usuarios</h3>
                  <p className="text-gray-600 mb-4">Administra usuarios del sistema, crear, editar y eliminar cuentas</p>
                  <Link href="/users">
                    <Button variant="outline" size="sm">Gestionar Usuarios</Button>
                  </Link>
                </div>
              )}

              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Dashboard</h3>
                <p className="text-gray-600 mb-4">Vista general de estadísticas y actividad del sistema</p>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">Ver Dashboard</Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Sistema de Gestión de Usuarios
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Una plataforma completa para la administración y gestión de usuarios con autenticación segura y permisos por roles.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link href="/auth/login">
                  <Button size="lg" className="min-w-[150px]">Iniciar Sesión</Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="outline" size="lg" className="min-w-[150px]">Crear Cuenta</Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Seguridad Avanzada</h3>
                  <p className="text-gray-600">Autenticación JWT, cifrado de contraseñas y gestión segura de sesiones</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestión Completa</h3>
                  <p className="text-gray-600">CRUD completo de usuarios, perfiles, roles y permisos administrativos</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Interfaz Moderna</h3>
                  <p className="text-gray-600">Diseño responsive, intuitivo y optimizado para una experiencia excepcional</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
