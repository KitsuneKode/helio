import { getAllTokenMetadataFromJupiter, type TokenMetadata } from '../solana'
import { storage } from '../storage'

const getFromCache = (mint: string): TokenMetadata | null => {
  try {
    const item = storage.getItem(mint)
    return item ? (JSON.parse(item) as TokenMetadata) : null
  } catch {
    console.log('Error parsing cache item for mint:', mint)
    return null
  }
}

const getMetaDataAndMissingKeysFromCache = (mints: string[]) => {
  return mints.reduce(
    (acc, mint) => {
      const cached = storage.contains(mint) ? getFromCache(mint) : null

      if (cached) {
        acc.present.set(mint, cached)
      } else {
        acc.missing.push(mint)
      }

      return acc
    },
    { present: new Map<string, TokenMetadata>(), missing: [] as string[] },
  )
}

export const getMetaDataFromCacheOrFetch = async (mints: string[]) => {
  const { present, missing } = getMetaDataAndMissingKeysFromCache(mints)

  if (missing.length !== 0) {
    const metadataFromJupiter = await getAllTokenMetadataFromJupiter(missing)
    if (!metadataFromJupiter) return present

    metadataFromJupiter.forEach((metadata, mint) => {
      storage.setItem(mint, JSON.stringify(metadata))
      present.set(mint, metadata)
    })
  }

  return present
}
