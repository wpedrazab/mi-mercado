/**
 * supabase.functions.invoke() no expone directo el JSON de error que
 * devuelven nuestras Edge Functions ({ error: "mensaje claro" }); hay que
 * leerlo del Response crudo que trae adjunto el FunctionsHttpError.
 */
export async function extractFunctionErrorMessage(error: unknown): Promise<string> {
  if (error && typeof error === 'object' && 'context' in error) {
    const context = (error as { context?: unknown }).context
    if (context instanceof Response) {
      try {
        const body = await context.json()
        if (typeof body?.error === 'string') return body.error
      } catch {
        // el cuerpo no era JSON parseable; se cae al mensaje genérico de abajo
      }
    }
  }
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
}
