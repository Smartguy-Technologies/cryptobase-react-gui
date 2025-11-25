import React from 'react';
import { WebView } from 'react-native-webview';

export default function BuyScreen() {
  return (
    <WebView
      source={{ uri: 'https://buy.moonpay.com?apiKey=pk_live_NWOV9M89TmiXNafI1qWZfhQG4eOk3Q2&theme=dark' }}

      style={{ flex: 1, marginTop: 55, marginBottom: 55 }}
    />
  );

};
