export type RouteHandler = (params: Record<string, string>) => void | Promise<void>

interface Route {
  path: string
  regex: RegExp
  keys: string[]
  handler: RouteHandler
}

export class Router {
  private routes: Route[] = []
  private fallback?: RouteHandler

  constructor() {
    window.addEventListener('popstate', () => {
      this.resolve(window.location.pathname, false)
    })
  }

  /**
   * Registra uma nova rota.
   * Suporta parâmetros dinâmicos no formato `:param` (ex: `/room/:id`).
   */
  public add(path: string, handler: RouteHandler): this {
    const keys: string[] = []
    
    // Converte /room/:id para regex ^/room/([^/]+)$
    const regexStr = path.replace(/:([^\/]+)/g, (_, key) => {
      keys.push(key)
      return '([^\\/]+)'
    })
    
    this.routes.push({
      path,
      regex: new RegExp(`^${regexStr}$`),
      keys,
      handler,
    })
    return this
  }

  /**
   * Define o handler executado caso nenhuma rota dê match (como 404).
   */
  public setFallback(handler: RouteHandler): this {
    this.fallback = handler
    return this
  }

  /**
   * Navega programaticamente para um caminho, atualizando a URL.
   */
  public navigate(path: string): void {
    this.resolve(path, true)
  }

  /**
   * Resolve a rota atual (ou uma rota especificada).
   */
  public resolve(path: string, pushState: boolean = true): void {
    if (pushState) {
      window.history.pushState({}, '', path)
    }

    for (const route of this.routes) {
      const match = path.match(route.regex)
      if (match) {
        const params: Record<string, string> = {}
        route.keys.forEach((key, index) => {
          params[key] = match[index + 1]
        })
        route.handler(params)
        return
      }
    }

    if (this.fallback) {
      this.fallback({})
    }
  }
}
