// scripts/brand/applyBranding.js
//
// Cryptobase ATM Wallet branding script (v2)
//
// This script does the following:
//   1. Copies Cryptobase theme & config files into src/theme.
//   2. Replaces appConfig.ts with a dynamic loader that supports `cryptobase`.
//   3. Regenerates env.json from branding/cryptobase/env/env.cryptobase.json,
//      forcing APP_CONFIG='cryptobase'.
//   4. Optionally patches envConfig.ts to ensure APP_CONFIG default is 'cryptobase'.
//   5. Applies native Android & iOS branding (bundleId + app name).
//
// Usage from repo root:
//   yarn brand:cryptobase
//
// Add to package.json scripts:
//   "brand:cryptobase": "node scripts/brand/applyBranding.js"

const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..', '..')
const brandingRoot = path.join(rootDir, 'branding', 'cryptobase')
const envTemplatePath = path.join(brandingRoot, 'env', 'env.cryptobase.json')
const brandConfigPath = path.join(brandingRoot, 'brand-config.json')

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
  if (contents == null) {
    console.warn('[branding] Missing file, skipping copy:', src)
    return
  }
  writeFileSafe(dest, contents)
  console.log('[branding] Copied', src, '->', dest)
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function applyEnvJson() {
  if (!fs.existsSync(envTemplatePath)) {
    console.warn('[branding] No Cryptobase env template found at', envTemplatePath)
    return
  }
  const raw = fs.readFileSync(envTemplatePath, 'utf8')
  const envObj = JSON.parse(raw)

  // Force APP_CONFIG to cryptobase:
  envObj.APP_CONFIG = 'cryptobase'

  const destPath = path.join(rootDir, 'env.json')
  writeFileSafe(destPath, JSON.stringify(envObj, null, 2))
  console.log('[branding] Wrote env.json with APP_CONFIG="cryptobase"')
}

function patchEnvConfigTs() {
  const envConfigPath = path.join(rootDir, 'src', 'envConfig.ts')
  let contents = readFileSafe(envConfigPath)
  if (contents == null) {
    console.warn('[branding] envConfig.ts not found; skipping patch')
    return
  }

  // Ensure APP_CONFIG default points to 'edge' or any—this is just a decoder schema.
  // No need to change asOptional default, since we explicitly set APP_CONFIG in env.json.
  // However, we leave this here in case we want to bias it:
  contents = contents.replace(
    /APP_CONFIG:\s*asOptional\(asString,\s*'edge'\s*\)/,
    "APP_CONFIG: asOptional(asString, 'cryptobase')"
  )

  writeFileSafe(envConfigPath, contents)
  console.log('[branding] Patched APP_CONFIG default in envConfig.ts (optional)')
}

function applyThemeAndConfigTs() {
  // Copy Cryptobase configs & themes from branding bundle into src/theme tree:
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

  // Replace appConfig.ts with the dynamic loader template (provided in bundle):
  const localAppConfigTemplate = path.join(rootDir, 'src', 'theme', 'appConfig.cryptobase.template.ts')
  const templateContents = readFileSafe(localAppConfigTemplate)
  if (templateContents == null) {
    console.warn('[branding] appConfig.cryptobase.template.ts missing; please copy it into src/theme.')
  } else {
    const destAppConfig = path.join(rootDir, 'src', 'theme', 'appConfig.ts')
    writeFileSafe(destAppConfig, templateContents)
    console.log('[branding] Replaced src/theme/appConfig.ts with Cryptobase dynamic loader')
  }
}

function updateAndroidNative(brandMeta) {
  const bundleId = brandMeta.bundleId
  const appName = brandMeta.appName

  const buildGradlePath = path.join(rootDir, 'android', 'app', 'build.gradle')
  const manifestPath = path.join(rootDir, 'android', 'app', 'src', 'main', 'AndroidManifest.xml')
  const stringsPath = path.join(rootDir, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml')

  const buildGradle = readFileSafe(buildGradlePath)
  if (buildGradle) {
    const replaced = buildGradle.replace(/applicationId\s+['\"]([^'\"]+)['\"]/, `applicationId '${bundleId}'`)
    writeFileSafe(buildGradlePath, replaced)
    console.log('[branding] Updated Android applicationId ->', bundleId)
  } else {
    console.warn('[branding] Missing android/app/build.gradle')
  }

  const manifest = readFileSafe(manifestPath)
  if (manifest) {
    const replaced = manifest.replace(/package="[^"]+"/, `package="${bundleId}"`)
    writeFileSafe(manifestPath, replaced)
    console.log('[branding] Updated Android manifest package ->', bundleId)
  } else {
    console.warn('[branding] Missing AndroidManifest.xml')
  }

  const strings = readFileSafe(stringsPath)
  if (strings) {
    const replaced = strings.replace(
      /<string name="app_name">[\s\S]*?<\/string>/,
      `<string name="app_name">${appName}</string>`
    )
    writeFileSafe(stringsPath, replaced)
    console.log('[branding] Updated Android app_name ->', appName)
  } else {
    console.warn('[branding] Missing Android strings.xml')
  }
}

function updateIosNative(brandMeta) {
  const bundleId = brandMeta.bundleId
  const appName = brandMeta.appName
  const iosDir = path.join(rootDir, 'ios')

  function findFilesByName(root, fileName) {
    const out = []
    if (!fs.existsSync(root)) return out
    const entries = fs.readdirSync(root, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(root, entry.name)
      if (entry.isDirectory()) {
        out.push(...findFilesByName(full, fileName))
      } else if (entry.isFile() && entry.name === fileName) {
        out.push(full)
      }
    }
    return out
  }

  // Info.plist updates:
  const infoPlists = findFilesByName(iosDir, 'Info.plist')
  if (infoPlists.length === 0) {
    console.warn('[branding] No Info.plist found under ios/')
  } else {
    for (const plistPath of infoPlists) {
      let contents = readFileSafe(plistPath)
      if (!contents) continue

      contents = contents.replace(
        /<key>CFBundleName<\/key>[\s\S]*?<string>[\s\S]*?<\/string>/,
        `<key>CFBundleName</key>
  <string>${appName}</string>`
      )
      contents = contents.replace(
        /<key>CFBundleDisplayName<\/key>[\s\S]*?<string>[\s\S]*?<\/string>/,
        `<key>CFBundleDisplayName</key>
  <string>${appName}</string>`
      )
      contents = contents.replace(
        /<key>CFBundleIdentifier<\/key>[\s\S]*?<string>[\s\S]*?<\/string>/,
        `<key>CFBundleIdentifier</key>
  <string>${bundleId}</string>`
      )

      writeFileSafe(plistPath, contents)
      console.log('[branding] Updated iOS Info.plist ->', plistPath)
    }
  }

  // Xcode project bundle identifier:
  const pbxprojFiles = findFilesByName(iosDir, 'project.pbxproj')
  if (pbxprojFiles.length === 0) {
    console.warn('[branding] No project.pbxproj found under ios/')
  } else {
    for (const pbx of pbxprojFiles) {
      let contents = readFileSafe(pbx)
      if (!contents) continue

      contents = contents.replace(
        /PRODUCT_BUNDLE_IDENTIFIER\s*=\s*[^;]+;/g,
        `PRODUCT_BUNDLE_IDENTIFIER = ${bundleId};`
      )
      writeFileSafe(pbx, contents)
      console.log('[branding] Updated PRODUCT_BUNDLE_IDENTIFIER in', pbx)
    }
  }
}

function main() {
  console.log('[branding] Applying Cryptobase ATM Wallet branding (v2)...')

  if (!fs.existsSync(brandConfigPath)) {
    console.error('[branding] Missing brand-config.json at', brandConfigPath)
    process.exit(1)
  }
  const brandMeta = loadJson(brandConfigPath)

  applyThemeAndConfigTs()
  applyEnvJson()
  patchEnvConfigTs()
  updateAndroidNative(brandMeta)
  updateIosNative(brandMeta)

  console.log('[branding] Done. You can now run yarn android / yarn ios for a Cryptobase build.')
}

if (require.main === module) {
  main()
}
