export function FpsCounter({ fps }: { fps: number | string }) {
  return (
    <div class="bg-gray-900/90 text-white px-3 py-1 rounded border border-gray-700 font-mono text-sm shadow">
      FPS: {fps}
    </div>
  );
}