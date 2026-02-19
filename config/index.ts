import * as z from 'zod'

const envSchema = z.object({
  EXPO_PUBLIC_MAIN_NET_RPC_URL: z.url(),
  EXPO_PUBLIC_DEV_NET_RPC_URL: z.url(),
})

const config = envSchema.parse(process.env)

export default config

//TODO: fix the network switch implementations

export const RPC_URL = false
  ? config.EXPO_PUBLIC_DEV_NET_RPC_URL
  : config.EXPO_PUBLIC_MAIN_NET_RPC_URL
