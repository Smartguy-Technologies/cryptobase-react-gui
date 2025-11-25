// src/theme/appConfig.ts
// Dynamic config loader to select the correct AppConfig based on ENV.APP_CONFIG.
// This assumes `env.ts` + `envConfig.ts` produce an ENV object with APP_CONFIG,
// and that you have `edgeConfig`, `testConfig`, and `cryptobaseConfig` available.

import { ENV } from '../env'
import type { AppConfig } from '../types/types'
import { edgeConfig } from './edgeConfig'
import { testConfig } from './testConfig'
import { cbConfig } from './cryptobaseConfig'

const configs: AppConfig[] = [edgeConfig, testConfig, cbConfig]
const configName = ENV.APP_CONFIG ?? 'edge'
let exportConfig: AppConfig = edgeConfig

for (const c of configs) {
  if (c.configName === configName) {
    exportConfig = c
    break
  }
}

export const config = exportConfig
