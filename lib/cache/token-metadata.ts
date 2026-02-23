import { TokenMetadata } from '@/types'
import { getAllTokenMetadataFromJupiter, getAllTokenMetadataFromHelius } from '../solana'
import { storage } from '../storage'
import type { Network } from '@/context/network-context'

type Config = { mints: string[]; network: Network }

const getFromCache = (mint: string): TokenMetadata | null => {
  try {
    const item = storage.getItem(mint)
    return item ? (JSON.parse(item) as TokenMetadata) : null
  } catch {
    console.log('Error parsing cache item for mint:', mint)
    return null
  }
}

const getMetaDataAndMissingKeysFromCache = (mints: string[], network: Network) => {
  return mints.reduce(
    (acc, mint) => {
      const mintWithNetworkSuffix = `${mint}-${network}`
      const cached = storage.contains(mintWithNetworkSuffix)
        ? getFromCache(mintWithNetworkSuffix)
        : null

      if (cached) {
        acc.present.set(mint, cached)
      } else {
        acc.missing.push(mintWithNetworkSuffix)
      }

      return acc
    },
    { present: new Map<string, TokenMetadata>(), missing: [] as string[] },
  )
}

export const getMetaDataFromCacheOrFetch = async (config: Config) => {
  const { mints, network } = config
  const { present, missing } = getMetaDataAndMissingKeysFromCache(mints, network)

  console.log(network, present, missing)

  if (missing.length !== 0) {
    const metadataFromJupiter =
      network === 'devnet'
        ? await getAllTokenMetadataFromHelius(buildMints(missing))
        : await getAllTokenMetadataFromJupiter(buildMints(missing))
    if (!metadataFromJupiter) return present

    metadataFromJupiter.forEach((metadata, mint) => {
      const mintWithNetworkSuffix = `${mint}-${network}`
      storage.setItem(mintWithNetworkSuffix, JSON.stringify(metadata))
      present.set(mint, metadata)
    })
  }

  return present
}

function buildMints(missing: string[]): string[] {
  return missing.map((msng) => msng.split('-')[0])
}
