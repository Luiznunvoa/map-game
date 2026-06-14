import axios, { type AxiosInstance, type AxiosRequestConfig, isAxiosError } from 'axios'

import type { HttpRequest, HttpResponse, IRequestClient } from '@/types/network'

const METHODS_WITH_BODY = new Set(['POST', 'PUT', 'PATCH'])

export class AxiosRequestClient implements IRequestClient {
  private readonly instance: AxiosInstance

  constructor(baseURL: string) {
    const instance = axios.create({ baseURL })

    // TODO:
    // setupInterceptors(instance);

    this.instance = instance
  }

  public async request<TRequest, TResponse>(
    config: HttpRequest<TRequest>,
  ): Promise<HttpResponse<TResponse>> {
    const req: AxiosRequestConfig = {
      ...config,
      headers: config.headers ?? (
        METHODS_WITH_BODY.has(config.method) ? 
          { 'Content-Type': 'application/json' } 
          : undefined
      ),
    }

    try {
      const res = await this.instance.request<TResponse>(req)

      return {
        ...res,
        headers: res.headers as Record<string, string>,
      }
    } catch (error) {
      throw this.toError(error)
    } 
  }

  private toError(error: unknown): Error {
    if (!isAxiosError(error)) {
      return error instanceof Error ? error : new Error(String(error))
    }
    if (error.response) {
      return new Error(error.response.data.message, {
        cause: error.status,
      })
    }
    return new Error(error.message, { cause: error.status })
  }
}
