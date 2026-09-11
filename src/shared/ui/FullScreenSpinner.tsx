export function FullScreenSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div
        role="status"
        aria-label="Cargando"
        className="w-8 h-8 rounded-full border-4 border-border border-t-accent animate-spin"
      />
    </div>
  )
}
