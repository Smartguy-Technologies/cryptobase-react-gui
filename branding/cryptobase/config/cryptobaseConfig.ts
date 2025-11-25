import { AppConfig } from '../types/types'
import { cbDark } from './variables/cbDark'
import { cbLight } from './variables/cbLight'

export const cbConfig: AppConfig = {
  appId: 'com.cryptobase.atm.app',
  appName: 'Cryptobase',
  appNameShort: 'Cryptobase',
  appStore: 'https://apps.apple.com/app/cryptobase-atm-wallet/id6446409331',
  backupAccountSite: 'https://cryptobaseatm.com',
  configName: 'cryptobase',
  darkTheme: cbDark,
  defaultWallets: [
    { pluginId: 'bitcoin', tokenId: null },
    { pluginId: 'fantom', tokenId: null },
    { pluginId: 'ethereum', tokenId: null }
  ],
  forceCloseUrl: 'https://support.edge.app/hc/en-us/articles/26702768694811-How-to-force-close-Edge-Android-and-iOS',
  ip2faSite: 'https://support.edge.app/hc/en-us/articles/7018106439579-Edge-Security-IP-Validation-and-2FA',
  knowledgeBase: 'https://cryptobaseatm.com',
  lightTheme: cbLight,
  notificationServers: ['https://push2.edge.app'],
  phoneNumber: '+1-305-702-0115',
  referralServers: ['https://referral1.edge.app'],
  supportsEdgeLogin: false,
  supportEmail: 'support@cryptobaseatm.com',
  supportContactSite: 'https://cryptobaseatm.com',
  supportSite: 'https://cryptobaseatm.com',
  termsOfServiceSite: 'https://cryptobaseatm.com/terms-and-conditions/',
  website: 'https://cryptobaseatm.com',
  extraTab: {
    tabTitleKey: 'title_map',
    tabType: 'edgeProvider',
    webviewUrl: 'https://www.cryptobaseatm.com/cryptobase-bitcoin-atms-locations',
    extraTabBarIconFont: 'Feather',
    extraTabBarIconName: 'map-pin'
  }
}
