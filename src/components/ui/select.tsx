import { splitProps } from 'solid-js';
import type { JSX } from 'solid-js';

export function Select(props: JSX.SelectHTMLAttributes<HTMLSelectElement>) {
  const [local, others] = splitProps(props, ['class', 'children']);
  
  return (
    <select 
      class={`px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded focus:outline-none focus:border-blue-500 ${local.class || ''}`}
      {...others}
    >
      {local.children}
    </select>
  );
}
