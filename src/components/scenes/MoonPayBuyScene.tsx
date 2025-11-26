import React from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'

export default function BuyScreen() {
  return (
    <View style={{ flex: 1 }}>
      <WebView
        source={{
          uri: 'https://buy.moonpay.com?apiKey=pk_live_NWOV9M89TmiXNafI1qWZfhQG4eOk3Q2&theme=dark'
          //uri: 'https://sell.moonpay.com?apiKey=pk_live_NWOV9M89TmiXNafI1qWZfhQG4eOk3Q2&theme=dark'
        }}
        style={{ flex: 1, marginTop: 120, marginBottom: 90 }}
      />
    </View>
  )
}
