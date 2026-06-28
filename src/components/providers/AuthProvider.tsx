import { useLocation,useNavigate } from '@solidjs/router'
import type { ParentComponent } from 'solid-js'
import { createContext, createEffect,createSignal, useContext } from 'solid-js'

import { getCookie, removeCookie,setCookie } from '@/lib/utils/cookies'

interface AuthContextType {
  isAuthenticated: () => boolean
  login: (token: string, email?: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>()

export const AuthProvider: ParentComponent = (props) => {
  const [isAuthenticated, setIsAuthenticated] = createSignal(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Verifica a autenticação sempre que a rota mudar ou no mount
  createEffect(() => {
    const token = getCookie('auth_token')
    const isAuth = !!token
    setIsAuthenticated(isAuth)

    const path = location.pathname

    if (isAuth && path === '/') {
      navigate('/game', { replace: true })
    } else if (!isAuth && path !== '/') {
      navigate('/', { replace: true })
    }
  })

  const login = (token: string, email?: string) => {
    setCookie('auth_token', token)
    if (email) {
      setCookie('user_email', email)
    }
    setIsAuthenticated(true)
    navigate('/game', { replace: true })
  }

  const logout = () => {
    removeCookie('auth_token')
    removeCookie('user_email')
    setIsAuthenticated(false)
    navigate('/', { replace: true })
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {props.children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
