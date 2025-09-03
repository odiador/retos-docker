'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'
import { usePathname } from 'next/navigation'

export function Navbar() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  const handleLogout = () => {
    logout()
    setIsMenuOpen(false)
  }

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">UserManager</span>
            </Link>

            {/* Desktop Navigation */}
            {isAuthenticated && (
              <div className="hidden md:ml-10 md:flex md:space-x-8">
                <Link
                  href="/dashboard"
                  className={`${
                    isActive('/dashboard')
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                >
                  Dashboard
                </Link>
                
                {isAdmin && (
                  <Link
                    href="/users"
                    className={`${
                      isActive('/users')
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                  >
                    Usuarios
                  </Link>
                )}
                
                <Link
                  href="/profile"
                  className={`${
                    isActive('/profile')
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                >
                  Mi Perfil
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
                <span className="text-sm text-gray-700">
                  Hola, <span className="font-medium">{user?.firstName}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <div className="hidden md:flex md:space-x-4">
                <Link
                  href="/auth/login"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Registrarse
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 p-2 rounded-md"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 border-t">
            {isAuthenticated ? (
              <>
                <div className="px-3 py-2 text-sm text-gray-700">
                  Hola, <span className="font-medium">{user?.firstName}</span>
                </div>
                
                <Link
                  href="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className={`${
                    isActive('/dashboard')
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-800'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors`}
                >
                  Dashboard
                </Link>
                
                {isAdmin && (
                  <Link
                    href="/users"
                    onClick={() => setIsMenuOpen(false)}
                    className={`${
                      isActive('/users')
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-transparent text-gray-600 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-800'
                    } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors`}
                  >
                    Usuarios
                  </Link>
                )}
                
                <Link
                  href="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className={`${
                    isActive('/profile')
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-800'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors`}
                >
                  Mi Perfil
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-gray-600 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-800 text-base font-medium transition-colors"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-gray-600 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-800 text-base font-medium transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-gray-600 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-800 text-base font-medium transition-colors"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
