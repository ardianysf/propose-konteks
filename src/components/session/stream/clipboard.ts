/*
 * clipboard — the stream's shared copy helper: async clipboard with a
 * textarea + execCommand fallback for environments (jsdom, insecure
 * contexts) without the async clipboard API. Silently tolerated when
 * neither path works — mockup scope.
 */
export async function copyToClipboard(payload: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(payload)
    return
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const textarea = document.createElement('textarea')
    textarea.value = payload
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  } catch {
    /* clipboard unavailable in this environment — mockup tolerates it */
  }
}
