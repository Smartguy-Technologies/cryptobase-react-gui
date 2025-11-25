import React from 'react';
import { WebView } from 'react-native-webview';

export default function SellScreen() {
    return (
        <WebView
            //   source={{ uri: 'https://sell-sandbox.moonpay.com?apiKey=pk_test_TE5hdy2bEL4mvbWtZXsNV16iEhDB0xq&baseCurrencyCode=eth&refundWalletAddress=0xb34175CbA06b810366431eBf7cf74C38de4249E7&theme=dark&baseCurrencyAmount=0.05&email=developers@cryptobaseatm.com' }}
            source={{ uri: 'https://sell.moonpay.com?apiKey=pk_live_NWOV9M89TmiXNafI1qWZfhQG4eOk3Q2&theme=dark' }}

            style={{ flex: 1, marginTop: 55, marginBottom: 55 }}
        />
    );

};
