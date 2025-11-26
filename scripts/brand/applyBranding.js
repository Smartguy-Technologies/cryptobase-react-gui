/**
 * Cryptobase ATM Wallet – Branding Script v3
 *
 * This script:
 *   1. Generates env.json from branding/cryptobase/env/env.cryptobase.json
 *   2. Injects Cryptobase API keys & overrides (Option A rules)
 *   3. Injects Moonpay into RAMP_PLUGIN_INITS
 *   4. Enables swap providers (your final choice)
 *   5. Forces APP_CONFIG = "cryptobase"
 *   6. Patches envConfig.ts default APP_CONFIG
 *   7. Injects cryptobase theme/config/appConfig.ts
 *   8. Applies bundleId + appName to Android native files
 *   9. Applies bundleId + appName to iOS native Info.plist (safe mode)
 *  10. Copies native icons/splashes for iOS + Android
 */

const fs = require('fs')
const path = require('path')

// -----------------------------------------------------
// PATHS
// -----------------------------------------------------
const rootDir = path.resolve(__dirname, '..', '..')
const brandingRoot = path.join(rootDir, 'branding', 'cryptobase')
const envTemplatePath = path.join(brandingRoot, 'env', 'env.cryptobase.json')
const brandConfigPath = path.join(brandingRoot, 'brand-config.json')

// Utility functions
function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8')
  } catch (e) {
    return null
  }
}

function writeFileSafe(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, contents, 'utf8')
}

function copyFileSafe(src, dest) {
  const contents = readFileSafe(src)
  if (!contents) {
    console.warn('[branding] Missing file:', src)
    return
  }
  writeFileSafe(dest, contents)
  console.log(`[branding] Copied ${src} → ${dest}`)
}

function copyDir(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return
  fs.mkdirSync(destDir, { recursive: true })

  for (const entry of fs.readdirSync(srcDir)) {
    const srcPath = path.join(srcDir, entry)
    const destPath = path.join(destDir, entry)

    if (fs.lstatSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
      console.log(`[branding] Copied: ${srcPath} -> ${destPath}`)
    }
  }
}

function loadJson(pathToJson) {
  return JSON.parse(fs.readFileSync(pathToJson, 'utf8'))
}

// -----------------------------------------------------
// STEP 1 — Build env.json (with overrides from cryptobaseAPIs.ts)
// -----------------------------------------------------
function mergeEnvWithCryptobaseAPIs() {
  console.log('[branding] Generating env.json with Cryptobase overrides...')

  if (!fs.existsSync(envTemplatePath)) {
    console.error('[branding] Missing env template:', envTemplatePath)
    process.exit(1)
  }

  const envJson = loadJson(envTemplatePath)

  // -----------------------------------------------------
  // Load Cryptobase APIs (TS file). We can require() safely
  // because Node understands basic TS format for simple exports.
  // -----------------------------------------------------
  const cryptobaseApiPath = path.join(
    brandingRoot,
    'config',
    'cryptobaseAPIs.ts'
  )

  if (!fs.existsSync(cryptobaseApiPath)) {
    console.warn('[branding] No cryptobaseAPIs.ts found; skipping API overrides.')
  }

  // Quick TS loader: strip exports + parse with eval
  let cryptobaseAPIs = {}
  try {
    const raw = readFileSafe(cryptobaseApiPath)
      .replace(/export\s+const\s+/g, 'const ')
      .replace(/export\s+\{[\s\S]*?\}/g, '')
    const sandbox = {}
    const wrapper = new Function('sandbox', `
      with (sandbox) {
        ${raw}
        return {
          coingeckoApi,
          airbitzAPI,
          moonpayApi,
          changeheroApi,
          changenowApi,
          exolixApi,
          letsexchangeApi,
          swapuzApi,
          bitcoinInit,
          sentryDSN,
          sentryUrl,
          sentryAuth,
          sentryOSlug,
          sentryPSlug
        }
      }
    `)
    cryptobaseAPIs = wrapper({})
  } catch (e) {
    console.warn('[branding] Failed to parse cryptobaseAPIs.ts')
  }

  // -----------------------------------------------------
  // Apply Option A overrides:
  // ONLY keys present in cryptobaseAPIs.ts are overridden
  // -----------------------------------------------------

  // 1) Coingecko
  if (cryptobaseAPIs.coingeckoApi) {
    envJson.COINGECKO_API_KEY = cryptobaseAPIs.coingeckoApi
  }

  // 2) Airbitz / Edge API
  if (cryptobaseAPIs.airbitzAPI) {
    envJson.EDGE_API_KEY = cryptobaseAPIs.airbitzAPI
  }

  // 3) Moonpay
  if (cryptobaseAPIs.moonpayApi) {
    envJson.RAMP_PLUGIN_INITS = envJson.RAMP_PLUGIN_INITS || {}
    envJson.RAMP_PLUGIN_INITS.moonpay = {
      apiKey: cryptobaseAPIs.moonpayApi
    }
  }

  // 4) Swap providers enabled (your choice A)
  envJson.CHANGE_NOW_INIT = true
  envJson.CHANGEHERO_INIT = true
  envJson.EXOLIX_INIT = true
  envJson.LETSEXCHANGE_INIT = true
  envJson.SWAPUZ_INIT = true

  // 5) plugin API keys
  envJson.PLUGIN_API_KEYS = envJson.PLUGIN_API_KEYS || {}
  if (cryptobaseAPIs.changeheroApi?.apiKey) {
    envJson.PLUGIN_API_KEYS.changehero = cryptobaseAPIs.changeheroApi.apiKey
  }
  if (cryptobaseAPIs.changenowApi?.apiKey) {
    envJson.PLUGIN_API_KEYS.changenow = cryptobaseAPIs.changenowApi.apiKey
  }
  if (cryptobaseAPIs.exolixApi?.apiKey) {
    envJson.PLUGIN_API_KEYS.exolix = cryptobaseAPIs.exolixApi.apiKey
  }
  if (cryptobaseAPIs.letsexchangeApi?.apiKey) {
    envJson.PLUGIN_API_KEYS.letsexchange = cryptobaseAPIs.letsexchangeApi.apiKey
  }
  if (cryptobaseAPIs.swapuzApi?.apiKey) {
    envJson.PLUGIN_API_KEYS.swapuz = cryptobaseAPIs.swapuzApi.apiKey
  }

  // 6) Bitcoin init
  if (cryptobaseAPIs.bitcoinInit?.nowNodeApiKey) {
    envJson.BITCOIN_INIT = envJson.BITCOIN_INIT || {}
    envJson.BITCOIN_INIT.nowNodeApiKey =
      cryptobaseAPIs.bitcoinInit.nowNodeApiKey
  }

  // 7) Sentry
  if (cryptobaseAPIs.sentryDSN) envJson.SENTRY_DSN_URL = cryptobaseAPIs.sentryDSN
  if (cryptobaseAPIs.sentryUrl)
    envJson.SENTRY_MAP_UPLOAD_URL = cryptobaseAPIs.sentryUrl
  if (cryptobaseAPIs.sentryAuth)
    envJson.SENTRY_MAP_UPLOAD_AUTH_TOKEN = cryptobaseAPIs.sentryAuth
  if (cryptobaseAPIs.sentryOSlug)
    envJson.SENTRY_ORGANIZATION_SLUG = cryptobaseAPIs.sentryOSlug
  if (cryptobaseAPIs.sentryPSlug)
    envJson.SENTRY_PROJECT_SLUG = cryptobaseAPIs.sentryPSlug

  // 8) Force APP_CONFIG = "cryptobase"
  envJson.APP_CONFIG = 'cryptobase'

  // Write final env.json
  const dest = path.join(rootDir, 'env.json')
  writeFileSafe(dest, JSON.stringify(envJson, null, 2))
  console.log('[branding] env.json created.')
}

// -----------------------------------------------------
// STEP 2 — Patch envConfig.ts default APP_CONFIG
// -----------------------------------------------------
function patchEnvConfigTs() {
  const envConfigPath = path.join(rootDir, 'src', 'envConfig.ts')
  let contents = readFileSafe(envConfigPath)
  if (!contents) {
    console.warn('[branding] envConfig.ts missing, skipping default APP_CONFIG patch.')
    return
  }

  const before = "APP_CONFIG: asOptional(asString, 'edge')"
  const after = "APP_CONFIG: asOptional(asString, 'cryptobase')"

  if (contents.includes(before)) {
    contents = contents.replace(before, after)
    writeFileSafe(envConfigPath, contents)
    console.log('[branding] Patched envConfig.ts default APP_CONFIG → cryptobase')
  } else if (contents.includes(after)) {
    console.log('[branding] envConfig.ts APP_CONFIG already set to cryptobase')
  } else {
    console.warn('[branding] Could not locate APP_CONFIG default in envConfig.ts')
  }
}

// -----------------------------------------------------
// STEP 3 — Inject Cryptobase configs & theme files
// -----------------------------------------------------
function applyThemeAndConfigTs() {
  const mappings = [
    {
      src: path.join(brandingRoot, 'config', 'cryptobaseConfig.ts'),
      dest: path.join(rootDir, 'src', 'theme', 'cryptobaseConfig.ts')
    },
    {
      src: path.join(brandingRoot, 'config', 'cryptobaseConfigAndroid.ts'),
      dest: path.join(rootDir, 'src', 'theme', 'cryptobaseConfigAndroid.ts')
    },
    {
      src: path.join(brandingRoot, 'config', 'cryptobaseAPIs.ts'),
      dest: path.join(rootDir, 'src', 'theme', 'cryptobaseAPIs.ts')
    },
    {
      src: path.join(brandingRoot, 'theme', 'variables', 'cbDark.ts'),
      dest: path.join(rootDir, 'src', 'theme', 'variables', 'cbDark.ts')
    },
    {
      src: path.join(brandingRoot, 'theme', 'variables', 'cbLight.ts'),
      dest: path.join(rootDir, 'src', 'theme', 'variables', 'cbLight.ts')
    }
  ]

  for (const { src, dest } of mappings) {
    copyFileSafe(src, dest)
  }

  // Replace appConfig.ts with dynamic loader
  const templateSrc = path.join(
    rootDir,
    'src',
    'theme',
    'appConfig.cryptobase.template.ts'
  )
  const destAppConfig = path.join(rootDir, 'src', 'theme', 'appConfig.ts')
  copyFileSafe(templateSrc, destAppConfig)
}

// -----------------------------------------------------
// STEP 4 — Android native branding
// -----------------------------------------------------
function updateAndroidNative(brandMeta) {
  const bundleId = brandMeta.bundleId
  const appName = brandMeta.appName

  const buildGradle = path.join(rootDir, 'android', 'app', 'build.gradle')
  const manifest = path.join(
    rootDir,
    'android',
    'app',
    'src',
    'main',
    'AndroidManifest.xml'
  )
  const strings = path.join(
    rootDir,
    'android',
    'app',
    'src',
    'main',
    'res',
    'values',
    'strings.xml'
  )

  // applicationId
  let gradleText = readFileSafe(buildGradle)
  if (gradleText) {
    gradleText = gradleText.replace(
      /applicationId\s+['"][^'"]+['"]/,
      `applicationId '${bundleId}'`
    )
    writeFileSafe(buildGradle, gradleText)
    console.log('[branding] Updated Android applicationId →', bundleId)
  }

  // manifest package
  let manifestText = readFileSafe(manifest)
  if (manifestText) {
    manifestText = manifestText.replace(
      /package="[^"]+"/,
      `package="${bundleId}"`
    )
    writeFileSafe(manifest, manifestText)
    console.log('[branding] Updated Android Manifest package →', bundleId)
  }

  // app_name
  let stringsText = readFileSafe(strings)
  if (stringsText) {
    stringsText = stringsText.replace(
      /<string name="app_name">[\s\S]*?<\/string>/,
      `<string name="app_name">${appName}</string>`
    )
    writeFileSafe(strings, stringsText)
    console.log('[branding] Updated Android app_name →', appName)
  }
}

// -----------------------------------------------------
// STEP 5 — iOS native branding (SAFE plist logic)
// -----------------------------------------------------
function updateIosNative(brandMeta) {
  const bundleId = brandMeta.bundleId
  const appName = brandMeta.appName
  const iosDir = path.join(rootDir, 'ios')

  function findFiles(root, filename) {
    const results = []
    if (!fs.existsSync(root)) return results
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      const full = path.join(root, entry.name)
      if (entry.isDirectory()) {
        results.push(...findFiles(full, filename))
      } else if (entry.isFile() && entry.name === filename) {
        results.push(full)
      }
    }
    return results
  }

  // Info.plist modifications
  const plists = findFiles(iosDir, 'Info.plist')
  for (const plist of plists) {
    if (plist.includes('/Pods/')) continue
    if (plist.includes('.framework/')) continue

    let txt = readFileSafe(plist)
    if (!txt) continue

    // Skip binary plists
    if (!txt.trim().startsWith('<?xml')) {
      console.log('[branding] Skipping non-XML plist:', plist)
      continue
    }

    txt = txt.replace(
      /<key>CFBundleName<\/key>[\s\S]*?<string>[\s\S]*?<\/string>/,
      `<key>CFBundleName</key>\n\t<string>${appName}</string>`
    )

    txt = txt.replace(
      /<key>CFBundleDisplayName<\/key>[\s\S]*?<string>[\s\S]*?<\/string>/,
      `<key>CFBundleDisplayName</key>\n\t<string>${appName}</string>`
    )

    txt = txt.replace(
      /<key>CFBundleIdentifier<\/key>[\s\S]*?<string>[\s\S]*?<\/string>/,
      `<key>CFBundleIdentifier</key>\n\t<string>${bundleId}</string>`
    )

    writeFileSafe(plist, txt)
    console.log('[branding] Updated iOS Info.plist →', plist)
  }

  // PBXProject bundle ID updates
  const pbxFiles = findFiles(iosDir, 'project.pbxproj')
  for (const pbx of pbxFiles) {
    let txt = readFileSafe(pbx)
    if (!txt) continue
    txt = txt.replace(
      /PRODUCT_BUNDLE_IDENTIFIER\s*=\s*[^;]+;/g,
      `PRODUCT_BUNDLE_IDENTIFIER = ${bundleId};`
    )
    writeFileSafe(pbx, txt)
    console.log('[branding] Updated PRODUCT_BUNDLE_IDENTIFIER in', pbx)
  }
}

// -----------------------------------------------------
// STEP 6 — Apply native icons/splashes
// -----------------------------------------------------
function applyIosIcons() {
  const srcRoot = path.join(brandingRoot, 'native', 'ios')
  const destRoot = path.join(rootDir, 'ios', 'edge', 'Images.xcassets')

  const appIconSrc = path.join(srcRoot, 'AppIcon.appiconset')
  const appIconDest = path.join(destRoot, 'AppIcon.appiconset')

  const splashSrc = path.join(srcRoot, 'SplashImage.imageset')
  const splashDest = path.join(destRoot, 'SplashImage.imageset')

  if (fs.existsSync(appIconSrc)) {
    copyDir(appIconSrc, appIconDest)
    console.log('[branding] Applied iOS App Icon set.')
  }

  if (fs.existsSync(splashSrc)) {
    copyDir(splashSrc, splashDest)
    console.log('[branding] Applied iOS SplashImage set.')
  }
}

function applyAndroidIcons() {
  const srcRoot = path.join(brandingRoot, 'native', 'android')
  const destRoot = path.join(rootDir, 'android', 'app', 'src', 'main', 'res')

  if (!fs.existsSync(srcRoot)) return

  for (const folder of fs.readdirSync(srcRoot)) {
    const fullSrc = path.join(srcRoot, folder)
    const fullDest = path.join(destRoot, folder)
    if (fs.lstatSync(fullSrc).isDirectory()) {
      copyDir(fullSrc, fullDest)
      console.log('[branding] Applied Android assets →', folder)
    }
  }
}

// -----------------------------------------------------
// MAIN
// -----------------------------------------------------
function main() {
  console.log('\n=== Applying Cryptobase Branding v3 ===\n')

  if (!fs.existsSync(brandConfigPath)) {
    console.error('[branding] Missing brand-config.json')
    process.exit(1)
  }

  const brandMeta = loadJson(brandConfigPath)

  mergeEnvWithCryptobaseAPIs()
  patchEnvConfigTs()
  applyThemeAndConfigTs()
  updateAndroidNative(brandMeta)
  updateIosNative(brandMeta)
  applyIosIcons()
  applyAndroidIcons()

  console.log('\n=== Cryptobase Branding Applied Successfully ===\n')
}

if (require.main === module) {
  main()
}
