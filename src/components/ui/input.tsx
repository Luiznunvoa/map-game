import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

export function Input(props: JSX.InputHTMLAttributes<HTMLInputElement>) {
  const [local, others] = splitProps(props, ['class'])

  return (
    <input
      class={`px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded focus:outline-none focus:border-blue-500 ${local.class || ''}`}
      {...others}
    />
  )
}
