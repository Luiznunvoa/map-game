export function Loading({ message }: { message: string }) {
  return (
    <div class="flex items-center justify-center h-full w-full bg-gray-900 text-white z-50">
      <div class="flex flex-col items-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
        <h2 class="text-xl font-bold tracking-widest text-indigo-300">{message}</h2>
      </div>
    </div>
  )
}