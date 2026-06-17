export function Loading({ message }: { message: string }) {
  return (
    <div class="flex items-center justify-center h-full w-full z-50">
      <div class="text-lg font-bold text-white">{message}</div>
    </div>
  )
}
