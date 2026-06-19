import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

export function Button(props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [local, others] = splitProps(props, ['class', 'children'])

  return (
    <button
      class={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 ${local.class || ''}`}
      {...others}
    >
      {local.children}
    </button>
  )
}
