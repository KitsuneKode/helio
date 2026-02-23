import { prefix } from '@/constants'

import { createMMKV } from 'react-native-mmkv'

class LocalStorage {
  private storage: ReturnType<typeof createMMKV>

  constructor(id: string) {
    this.storage = createMMKV({ id })
  }

  getItem(key: string): string | null {
    return this.storage.getString(key) ?? null
  }
  contains(key: string): boolean {
    return this.storage.contains(key)
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value)
  }

  removeItem(key: string): void {
    this.storage.remove(key)
  }
}

export const storage = new LocalStorage(`${prefix}-storage`)
