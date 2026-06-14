import type { LoginRequest, LoginResponse } from '@/types/auth'
import type { IRequestClient } from '@/types/network'

export class AuthService {
  private http: IRequestClient

  constructor(http: IRequestClient) {
    this.http = http
  }

  public async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.http.request<LoginRequest, LoginResponse>({
      method: 'POST',
      url: '/api/auth/login',
      data,
    })
    return response.data
  }

  public async logout(): Promise<void> {
    await this.http.request({
      method: 'POST',
      url: '/api/auth/logout',
    })
  }
}
