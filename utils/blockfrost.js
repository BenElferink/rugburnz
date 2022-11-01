import { BlockFrostAPI } from '@blockfrost/blockfrost-js'
import { BLOCKFROST_API_KEY } from '../constants'

export default class Blockfrost {
  constructor() {
    // https://github.com/blockfrost/blockfrost-js
    this.api = new BlockFrostAPI({
      projectId: BLOCKFROST_API_KEY,
      // version: 0,
      // debug: false,
      // isTestnet: false,
      // rateLimiter: true,
      // requestTimeout: 20000,
    })
  }
}

export const blockfrost = new Blockfrost()
