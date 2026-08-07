// D5-4: SSRF — dispatches to user-supplied URL with no allowlist or validation
export async function dispatch(webhookUrl: string, payload: unknown): Promise<void> {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}
