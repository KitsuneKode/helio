import * as z from 'zod'
const envSchema = z.object({
  EXPO_PUBLIC_MAIN_NET_RPC_URL: z.url(),
  EXPO_PUBLIC_DEV_NET_RPC_URL: z.url(),
  EXPO_PUBLIC_HELIUS_DEV_NET_RPC_URL: z.url(),
})

const config = envSchema.parse(process.env)

export default config
