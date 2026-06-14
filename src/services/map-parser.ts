import { createFetchFileLoader, type FileLoader, type ParsedMapData, type PipelineOptions,runParserPipeline } from '@/lib/parsing-pipeline'

export type ParserStatus = 'idle' | 'loading' | 'done' | 'error'

export interface ParserProgress {
  value: number  // 0.0 – 1.0
  stage: string
}

export interface MapParserState {
  status: ParserStatus
  progress: ParserProgress
  data: ParsedMapData | null
  error: string | null
}

type Listener = (state: MapParserState) => void

export class MapParser {
  private status: ParserStatus = 'idle'
  private progress: ParserProgress = { value: 0, stage: '' }
  private data: ParsedMapData | null = null
  private error: string | null = null

  private aborted = false
  private listeners = new Set<Listener>()

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  public getState(): MapParserState {
    return {
      status: this.status,
      progress: this.progress,
      data: this.data,
      error: this.error,
    }
  }

  private notify(): void {
    const state = this.getState()
    this.listeners.forEach(fn => fn(state))
  }


  public async parse(loader: FileLoader): Promise<void> {
    this.aborted = false
    this.status = 'loading'
    this.error = null
    this.data = null
    this.progress = { value: 0, stage: 'Iniciando…' }
    this.notify()

    const options: PipelineOptions = {
      onProgress: (value, stage) => {
        if (this.aborted) return
        this.progress = { value, stage }
        this.notify()
      },
    }

    try {
      const result = await runParserPipeline(loader, options)
      if (this.aborted) return
      this.data = result
      this.status = 'done'
      this.notify()
    } catch (err) {
      if (this.aborted) return
      this.error = err instanceof Error ? err.message : String(err)
      this.status = 'error'
      this.notify()
      console.error('[MapParser]', err)
    }
  }

  public parseFromUrl(baseUrl: string, availableKeys?: string[]): Promise<void> {
    const loader = createFetchFileLoader(baseUrl, availableKeys)
    return this.parse(loader)
  }

  public reset(): void {
    this.aborted = true
    this.status = 'idle'
    this.progress = { value: 0, stage: '' }
    this.data = null
    this.error = null
    this.notify()
  }

  public dispose(): void {
    this.aborted = true
    this.listeners.clear()
  }
}