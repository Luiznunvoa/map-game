import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'

export function setupInterceptors(instance: AxiosInstance): void {
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('auth_token')
      
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
      
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Opcional: Aqui também poderiamos adicionar interceptador de resposta
  // para lidar com expiração do token (401 Unauthorized), e realizar logout automático
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        // Token inválido ou expirado
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_email')
        // alert("Sua sessão expirou!") 
        // window.location.reload() // Poderia forçar refresh para ir pro menu
      }
      return Promise.reject(error)
    }
  )
}
