export const mailer = {
  send: async (to: string, subject: string, body: string): Promise<void> => {
    // stub — never sends real email
    console.log('[mailer stub]', { to, subject, bodyLength: body.length })
  },
}
