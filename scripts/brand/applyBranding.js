/**
 * Cryptobase ATM Wallet – Branding Script v6
 *
 * Automates:
 *  - env.json generation & overrides
 *  - envConfig.ts APP_CONFIG default
 *  - theme/config/appConfig wiring
 *  - iOS & Android native branding (name, bundleId)
 *  - Icon & splash replacement
 *  - Localization branding (JSON + en_US.ts)
 *  - GettingStartedScene.tsx replacement
 *  - Main.tsx patch:
 *      * Map (extraTab) first + default
 *      * Tab order: extraTab, home, walletsTab, buyTab, sellTab
 *      * Remove swapTab
 *      * Buy tab → MoonPayBuyScene
 *      * Sell tab → MoonPaySellScene
 */

const fs = require('fs')
const path = require('path')

// -----------------------------------------------------
// PATHS & CONSTANTS
// -----------------------------------------------------
const rootDir = path.resolve(__dirname, '..', '..')
const brandingRoot = path.join(rootDir, 'branding', 'cryptobase')
const envTemplatePath = path.join(brandingRoot, 'env', 'env.cryptobase.json')
const brandConfigPath = path.join(brandingRoot, 'brand-config.json')

const CRYPTOBASE_IOS_URL =
  'https://apps.apple.com/app/cryptobase-atm-wallet/id6446409331'
const CRYPTOBASE_ANDROID_URL =
  'https://play.google.com/store/apps/details?id=com.cryptobase.wallet'

const args = process.argv.slice(2)
const options = {
  androidAppId: undefined
}

for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  if (arg === '--android-app-id') {
    const value = args[i + 1]
    if (value == null || value.startsWith('--')) {
      console.error('[branding] Missing value for --android-app-id')
      process.exit(1)
    }
    options.androidAppId = value
    i += 1
  }
}

// -----------------------------------------------------
// UTILITIES
// -----------------------------------------------------
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

function loadJson(jsonPath) {
  return JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
}

// -----------------------------------------------------
// STEP 1 — Build env.json with Cryptobase overrides
// -----------------------------------------------------
function mergeEnvWithCryptobaseAPIs() {
  console.log('[branding] Generating env.json with Cryptobase overrides...')

  if (!fs.existsSync(envTemplatePath)) {
    console.error('[branding] Missing env template:', envTemplatePath)
    process.exit(1)
  }

  const envJson = loadJson(envTemplatePath)

  // Load CryptobaseAPIs.ts if present:
  const cryptobaseApiPath = path.join(
    brandingRoot,
    'config',
    'cryptobaseAPIs.ts'
  )

  let cryptobaseAPIs = {}
  if (fs.existsSync(cryptobaseApiPath)) {
    try {
      const raw = readFileSafe(cryptobaseApiPath)
        .replace(/export\s+const\s+/g, 'const ')
        .replace(/export\s+\{[\s\S]*?\}/g, '')
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
            bitcoinCash,
            ethereumInit,
            litecoin,
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
      console.warn('[branding] Failed to parse cryptobaseAPIs.ts:', e.message)
    }
  } else {
    console.warn('[branding] No cryptobaseAPIs.ts found; skipping API overrides.')
  }

  // 1) Coingecko
  if (cryptobaseAPIs.coingeckoApi) {
    envJson.COINGECKO_API_KEY = cryptobaseAPIs.coingeckoApi
  }

  // 2) Edge API (Airbitz)
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

  const makeApiKeyInit = apiKey => ({
    apiKey: apiKey ?? ''
  })
  const makeNowNodesInit = apiKey => ({
    apiKey: apiKey ?? '',
    nowNodesApiKey: apiKey ?? ''
  })

  // 4) Swap providers enabled (must be objects, not booleans)
  if (typeof cryptobaseAPIs.changenowApi === 'string') {
    envJson.CHANGE_NOW_INIT = makeApiKeyInit(cryptobaseAPIs.changenowApi)
  }
  if (typeof cryptobaseAPIs.changeheroApi === 'string') {
    envJson.CHANGEHERO_INIT = makeApiKeyInit(cryptobaseAPIs.changeheroApi)
  }
  if (typeof cryptobaseAPIs.exolixApi === 'string') {
    envJson.EXOLIX_INIT = makeApiKeyInit(cryptobaseAPIs.exolixApi)
  }
  if (typeof cryptobaseAPIs.letsexchangeApi === 'string') {
    envJson.LETSEXCHANGE_INIT = makeApiKeyInit(cryptobaseAPIs.letsexchangeApi)
  }
  if (typeof cryptobaseAPIs.swapuzApi === 'string') {
    envJson.SWAPUZ_INIT = makeApiKeyInit(cryptobaseAPIs.swapuzApi)
  }

  // 5) plugin API keys
  envJson.PLUGIN_API_KEYS = envJson.PLUGIN_API_KEYS || {}
  if (typeof cryptobaseAPIs.changeheroApi === 'string') {
    envJson.PLUGIN_API_KEYS.changehero = makeApiKeyInit(
      cryptobaseAPIs.changeheroApi
    )
  }
  if (typeof cryptobaseAPIs.changenowApi === 'string') {
    envJson.PLUGIN_API_KEYS.changenow = makeApiKeyInit(
      cryptobaseAPIs.changenowApi
    )
  }
  if (typeof cryptobaseAPIs.exolixApi === 'string') {
    envJson.PLUGIN_API_KEYS.exolix = makeApiKeyInit(
      cryptobaseAPIs.exolixApi
    )
  }
  if (typeof cryptobaseAPIs.letsexchangeApi === 'string') {
    envJson.PLUGIN_API_KEYS.letsexchange = makeApiKeyInit(
      cryptobaseAPIs.letsexchangeApi
    )
  }
  if (typeof cryptobaseAPIs.swapuzApi === 'string') {
    envJson.PLUGIN_API_KEYS.swapuz = makeApiKeyInit(cryptobaseAPIs.swapuzApi)
  }

  // 6) Bitcoin init
  if (typeof cryptobaseAPIs.bitcoinInit === 'string') {
    envJson.BITCOIN_INIT = makeNowNodesInit(cryptobaseAPIs.bitcoinInit)
  }
  if (typeof cryptobaseAPIs.bitcoinCash === 'string') {
    envJson.BITCOINCASH_INIT = makeNowNodesInit(cryptobaseAPIs.bitcoinCash)
  }
  if (typeof cryptobaseAPIs.litecoin === 'string') {
    envJson.LITECOIN_INIT = makeNowNodesInit(cryptobaseAPIs.litecoin)
  }

  // 7) Sentry
  if (cryptobaseAPIs.sentryDSN) {
    envJson.SENTRY_DSN_URL = cryptobaseAPIs.sentryDSN
  }
  if (cryptobaseAPIs.sentryUrl) {
    envJson.SENTRY_MAP_UPLOAD_URL = cryptobaseAPIs.sentryUrl
  }
  if (cryptobaseAPIs.sentryAuth) {
    envJson.SENTRY_MAP_UPLOAD_AUTH_TOKEN = cryptobaseAPIs.sentryAuth
  }
  if (cryptobaseAPIs.sentryOSlug) {
    envJson.SENTRY_ORGANIZATION_SLUG = cryptobaseAPIs.sentryOSlug
  }
  if (cryptobaseAPIs.sentryPSlug) {
    envJson.SENTRY_PROJECT_SLUG = cryptobaseAPIs.sentryPSlug
  }

  // 8) APP_CONFIG
  envJson.APP_CONFIG = 'cryptobase'

  // Final write:
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
    console.warn('[branding] envConfig.ts missing, skipping APP_CONFIG patch.')
    return
  }

  const before = "APP_CONFIG: asOptional(asString, 'edge')"
  const after = "APP_CONFIG: asOptional(asString, 'cryptobase')"

  if (contents.includes(before)) {
    contents = contents.replace(before, after)
    writeFileSafe(envConfigPath, contents)
    console.log('[branding] Patched envConfig.ts APP_CONFIG → cryptobase')
  } else if (contents.includes(after)) {
    console.log('[branding] envConfig.ts APP_CONFIG already cryptobase')
  } else {
    console.warn('[branding] APP_CONFIG default not found in envConfig.ts')
  }
}

// -----------------------------------------------------
// STEP 3 — Copy Cryptobase configs & theme files
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

  const templateSrc = path.join(
    rootDir,
    'src',
    'theme',
    'appConfig.cryptobase.template.ts'
  )
  const destAppConfig = path.join(rootDir, 'src', 'theme', 'appConfig.ts')
  copyFileSafe(templateSrc, destAppConfig)
}

function patchAndroidAppIdOverride(androidAppId) {
  const configPath = path.join(rootDir, 'src', 'theme', 'cryptobaseConfig.ts')
  let contents = readFileSafe(configPath)
  if (!contents) {
    console.warn('[branding] cryptobaseConfig.ts missing, skipping appId patch.')
    return
  }

  contents = contents.replace(
    /appId:\s*'[^']*'/,
    `appId: '${androidAppId}'`
  )
  writeFileSafe(configPath, contents)
  console.log('[branding] Patched cryptobaseConfig.ts appId →', androidAppId)
}

// -----------------------------------------------------
// STEP 4 — Android native branding
// -----------------------------------------------------
function updateAndroidNative(brandMeta, androidAppId) {
  const bundleId = androidAppId ?? brandMeta.bundleId
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

  // strings.xml app_name
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
// STEP 5 — iOS native branding
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

  const plists = findFiles(iosDir, 'Info.plist')
  for (const plist of plists) {
    if (plist.includes('/Pods/')) continue
    if (plist.includes('.framework/')) continue

    let txt = readFileSafe(plist)
    if (!txt) continue
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
// STEP 6 — Icons & Splash
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
// STEP 7 — Localization JSON branding
// -----------------------------------------------------
function patchLocalizationJson() {
  console.log('[branding] Patching localization JSON files...')

  const targetDirs = [
    path.join(rootDir, 'src', 'locales', 'strings'),
    path.join(rootDir, 'localization')
  ]

  function processFile(filePath) {
    if (!filePath.endsWith('.json')) return
    let contents = readFileSafe(filePath)
    if (!contents) return

    let updated = contents

    // Brand phrase replacements (Option A)
    updated = updated.replace(/\bEdge Wallet\b/g, 'Cryptobase Wallet')
    updated = updated.replace(/\bEdge Account\b/g, 'Cryptobase Account')
    updated = updated.replace(/\bEdge Login\b/g, 'Cryptobase Login')

    updated = updated.replace(/\bEDGE WALLET\b/g, 'CRYPTOBASE WALLET')
    updated = updated.replace(/\bEDGE ACCOUNT\b/g, 'CRYPTOBASE ACCOUNT')
    updated = updated.replace(/\bEDGE LOGIN\b/g, 'CRYPTOBASE LOGIN')

    // Standalone "Edge"
    updated = updated.replace(/\bEdge\b/g, 'Cryptobase')
    updated = updated.replace(/\bEDGE\b/g, 'CRYPTOBASE')

    // edge.app → cryptobaseatm.com
    updated = updated.replace(/https?:\/\/edge\.app[^\s"']*/g, 'https://cryptobaseatm.com')
    updated = updated.replace(/\bedge\.app\b/g, 'cryptobaseatm.com')

    // Any iOS App Store link → Cryptobase ATM Wallet iOS URL
    updated = updated.replace(
      /https?:\/\/apps\.apple\.com[^\s"']*/g,
      CRYPTOBASE_IOS_URL
    )

    // Any Play Store link → Cryptobase ATM Wallet Android URL
    updated = updated.replace(
      /https?:\/\/play\.google\.com\/store\/apps\/details[^\s"']*/g,
      CRYPTOBASE_ANDROID_URL
    )

    if (updated !== contents) {
      writeFileSafe(filePath, updated)
      console.log('[branding] Patched localization JSON:', filePath)
    }
  }

  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) continue
    const stack = [dir]
    while (stack.length > 0) {
      const current = stack.pop()
      const entries = fs.readdirSync(current, { withFileTypes: true })
      for (const entry of entries) {
        const full = path.join(current, entry.name)
        if (entry.isDirectory()) {
          stack.push(full)
        } else {
          processFile(full)
        }
      }
    }
  }
}

// -----------------------------------------------------
// STEP 8 — Localization TS branding (en_US.ts)
// -----------------------------------------------------
function patchLocalizationTsStrings() {
  console.log('[branding] Patching en_US.ts strings...')

  const filePath = path.join(rootDir, 'src', 'locales', 'en_US.ts')
  if (!fs.existsSync(filePath)) {
    console.warn('[branding] en_US.ts not found, skipping.')
    return
  }

  let data = readFileSafe(filePath)

  // Replace brand references:
  data = data.replace(/\bEdge Wallet\b/g, 'Cryptobase Wallet')
  data = data.replace(/\bEdge Account\b/g, 'Cryptobase Account')
  data = data.replace(/\bEdge Login\b/g, 'Cryptobase Login')
  data = data.replace(/\bEdge\b/g, 'Cryptobase')
  data = data.replace(/\bEDGE\b/g, 'CRYPTOBASE')

  // edge.app → cryptobaseatm.com
  data = data.replace(/edge\.app/g, 'cryptobaseatm.com')

  // Apple App Store link
  data = data.replace(
    /https:\/\/apps\.apple\.com\/[^"']+/g,
    CRYPTOBASE_IOS_URL
  )

  // Play Store link
  data = data.replace(
    /https:\/\/play\.google\.com\/store\/apps\/details\?id=[^"']+/g,
    CRYPTOBASE_ANDROID_URL
  )

  writeFileSafe(filePath, data)
  console.log('[branding] en_US.ts patched.')
}

// -----------------------------------------------------
// STEP 9 — Patch GettingStartedScene.tsx (logo branding)
// -----------------------------------------------------
function patchGettingStartedScene() {
  console.log('[branding] Patching GettingStartedScene.tsx...')

  const src = path.join(
    brandingRoot,
    'js',
    'GettingStartedScene.tsx'
  )
  const dest = path.join(
    rootDir,
    'src',
    'components',
    'scenes',
    'GettingStartedScene.tsx'
  )

  if (!fs.existsSync(src)) {
    console.warn(
      '[branding] Missing branded GettingStartedScene.tsx at:',
      src
    )
    return
  }

  copyFileSafe(src, dest)
  console.log('[branding] Applied Cryptobase GettingStartedScene.tsx')
}

// -----------------------------------------------------
// STEP 10 — Patch Main.tsx (tabs, MoonPay, remove swap)
// -----------------------------------------------------
function patchMainTs() {
  console.log('[branding] Patching Main.tsx (tabs & MoonPay)...')

  const mainPath = path.join(rootDir, 'src', 'components', 'Main.tsx')
  let contents = readFileSafe(mainPath)
  if (!contents) {
    console.warn('[branding] Main.tsx not found, skipping.')
    return
  }

  // 1) Insert MoonPay imports (if not already present)
  if (!contents.includes("MoonPayBuyScene") && !contents.includes("MoonPaySellScene")) {
    const marker =
      "import { GuiPluginViewScene as GuiPluginViewSceneComponent } from './scenes/GuiPluginViewScene'\n"
    if (contents.includes(marker)) {
      contents = contents.replace(
        marker,
        marker +
          "import MoonPayBuyScene from './scenes/MoonPayBuyScene'\n" +
          "import MoonPaySellScene from './scenes/MoonPaySellScene'\n"
      )
      console.log('[branding] Inserted MoonPay scene imports in Main.tsx')
    } else {
      console.warn(
        '[branding] Could not find GuiPluginViewScene import marker; MoonPay imports not added.'
      )
    }
  }

  // 2) Patch EdgeBuyTabScreen initialRoute & first screen → MoonPayBuyScene
  if (contents.includes('const EdgeBuyTabScreen: React.FC = () => {')) {
    contents = contents.replace(
      'initialRouteName="pluginListBuy"',
      'initialRouteName="moonpayBuy"'
    )

    const oldBuyFirstScreen =
      `      <BuyStack.Screen\n` +
      `        name="pluginListBuy"\n` +
      `        component={RampCreateBuyScene}\n` +
      `        options={firstSceneScreenOptions}\n` +
      `      />`

    const newBuyFirstScreen =
      `      <BuyStack.Screen\n` +
      `        name="moonpayBuy"\n` +
      `        component={MoonPayBuyScene}\n` +
      `        options={firstSceneScreenOptions}\n` +
      `      />`

    if (contents.includes(oldBuyFirstScreen)) {
      contents = contents.replace(oldBuyFirstScreen, newBuyFirstScreen)
      console.log('[branding] Patched EdgeBuyTabScreen to use MoonPayBuyScene')
    } else {
      console.warn(
        '[branding] Could not find pluginListBuy first screen block in EdgeBuyTabScreen.'
      )
    }
  } else {
    console.warn('[branding] EdgeBuyTabScreen not found in Main.tsx')
  }

  // 3) Patch EdgeSellTabScreen initialRoute & first screen → MoonPaySellScene
  if (contents.includes('const EdgeSellTabScreen: React.FC = () => {')) {
    contents = contents.replace(
      'initialRouteName="pluginListSell"',
      'initialRouteName="moonpaySell"'
    )

    const oldSellFirstScreen =
      `      <SellStack.Screen\n` +
      `        name="pluginListSell"\n` +
      `        component={RampCreateSellScene}\n` +
      `        options={firstSceneScreenOptions}\n` +
      `      />`

    const newSellFirstScreen =
      `      <SellStack.Screen\n` +
      `        name="moonpaySell"\n` +
      `        component={MoonPaySellScene}\n` +
      `        options={firstSceneScreenOptions}\n` +
      `      />`

    if (contents.includes(oldSellFirstScreen)) {
      contents = contents.replace(oldSellFirstScreen, newSellFirstScreen)
      console.log('[branding] Patched EdgeSellTabScreen to use MoonPaySellScene')
    } else {
      console.warn(
        '[branding] Could not find pluginListSell first screen block in EdgeSellTabScreen.'
      )
    }
  } else {
    console.warn('[branding] EdgeSellTabScreen not found in Main.tsx')
  }

  // 4) Force initialRouteName = 'extraTab' in EdgeTabs
  const initialRouteLine =
    "  const initialRouteName = defaultScreen === 'assets' ? 'walletsTab' : 'home'"
  if (contents.includes(initialRouteLine)) {
    contents = contents.replace(
      initialRouteLine,
      "  const initialRouteName = 'extraTab'"
    )
    console.log('[branding] Set initialRouteName to extraTab in EdgeTabs')
  } else if (!contents.includes("const initialRouteName = 'extraTab'")) {
    console.warn(
      '[branding] Could not find initialRouteName line in EdgeTabs; not patched.'
    )
  }

  // 5) Reorder Tabs: extraTab, home, walletsTab, buyTab, sellTab, devTab; remove swapTab
  const oldTabsBlock =
    `  return (\n` +
    `    <Tabs.Navigator\n` +
    `      initialRouteName={initialRouteName}\n` +
    `      tabBar={props => <MenuTabs {...props} />}\n` +
    `      screenOptions={{\n` +
    `        headerShown: false\n` +
    `      }}\n` +
    `    >\n` +
    `      <Tabs.Screen\n` +
    `        name="home"\n` +
    `        component={HomeScene}\n` +
    `        options={{ ...defaultScreenOptions, ...firstSceneScreenOptions }}\n` +
    `      />\n` +
    `      <Tabs.Screen name="walletsTab" component={EdgeWalletsTabScreen} />\n` +
    `      <Tabs.Screen name="buyTab" component={EdgeBuyTabScreen} />\n` +
    `      <Tabs.Screen name="sellTab" component={EdgeSellTabScreen} />\n` +
    `      <Tabs.Screen name="swapTab" component={EdgeSwapTabScreen} />\n` +
    `      <Tabs.Screen name="extraTab" component={ExtraTabScene} />\n` +
    `      <Tabs.Screen name="devTab" component={DevTestScene} />\n` +
    `    </Tabs.Navigator>\n` +
    `  )\n` +
    `}\n`

  const newTabsBlock =
    `  return (\n` +
    `    <Tabs.Navigator\n` +
    `      initialRouteName={initialRouteName}\n` +
    `      tabBar={props => <MenuTabs {...props} />}\n` +
    `      screenOptions={{\n` +
    `        headerShown: false\n` +
    `      }}\n` +
    `    >\n` +
    `      <Tabs.Screen name="extraTab" component={ExtraTabScene} />\n` +
    `      <Tabs.Screen\n` +
    `        name="home"\n` +
    `        component={HomeScene}\n` +
    `        options={{ ...defaultScreenOptions, ...firstSceneScreenOptions }}\n` +
    `      />\n` +
    `      <Tabs.Screen name="walletsTab" component={EdgeWalletsTabScreen} />\n` +
    `      <Tabs.Screen name="buyTab" component={EdgeBuyTabScreen} />\n` +
    `      <Tabs.Screen name="sellTab" component={EdgeSellTabScreen} />\n` +
    `      <Tabs.Screen name="devTab" component={DevTestScene} />\n` +
    `    </Tabs.Navigator>\n` +
    `  )\n` +
    `}\n`

  if (contents.includes(oldTabsBlock)) {
    contents = contents.replace(oldTabsBlock, newTabsBlock)
    console.log('[branding] Reordered tabs & removed swapTab in Main.tsx')
  } else if (!contents.includes('name="swapTab"')) {
    console.log(
      '[branding] Tabs block already patched or swapTab missing; skipping tabs reorder.'
    )
  } else {
    console.warn(
      '[branding] Tabs block not found exactly as expected; manual check recommended.'
    )
  }

  writeFileSafe(mainPath, contents)
  console.log('[branding] Main.tsx patch complete.')
}

// -----------------------------------------------------
// MAIN
// -----------------------------------------------------
function main() {
  console.log('\n=== Applying Cryptobase Branding v6 ===\n')

  if (!fs.existsSync(brandConfigPath)) {
    console.error('[branding] Missing brand-config.json')
    process.exit(1)
  }

  const brandMeta = loadJson(brandConfigPath)
  const androidAppId = options.androidAppId

  mergeEnvWithCryptobaseAPIs()
  patchEnvConfigTs()
  applyThemeAndConfigTs()
  if (androidAppId != null) {
    patchAndroidAppIdOverride(androidAppId)
  }
  updateAndroidNative(brandMeta, androidAppId)
  updateIosNative(brandMeta)
  applyIosIcons()
  applyAndroidIcons()
  patchGettingStartedScene()
  patchLocalizationJson()
  patchLocalizationTsStrings()
  patchMainTs()

  console.log('\n=== Cryptobase Branding Applied Successfully ===\n')
}

if (require.main === module) {
  main()
}
