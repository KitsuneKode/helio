<div align="center">

<!-- Replace with app logo -->
<img src="assets/images/icon.png" alt="Helio" width="100" height="100" />

# Helio

**A native Solana explorer and wallet for Android**

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![React Native](https://img.shields.io/badge/React_Native-0.81-blue.svg)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-SDK_53-black.svg)](https://expo.dev)

</div>

<!-- Screenshots: Replace with 4 app screenshots side by side
<div align="center">
  <img src="" width="24%" alt="Wallet" />
  <img src="" width="24%" alt="Token Details" />
  <img src="" width="24%" alt="Swap" />
  <img src="" width="24%" alt="Transaction" />
</div>
-->

<!-- Demo: Replace with GIF or YouTube embed
<div align="center">
  <img src="" alt="Demo" width="300" />
</div>
-->

<!-- Social: Replace with Twitter/X post embed or link
-->

## What is Helio?

Helio is a mobile Solana explorer and wallet built with React Native. No single mobile app combines address lookup, token details with live market data, token swaps, and SOL transfers in one cohesive experience — Helio does.

## Features

- **Search any Solana wallet** — balances, tokens, transaction history
- **Token details** — live market data from DexScreener, metadata, social links
- **Swap tokens via Jupiter** — live quotes, slippage control, swap history
- **Send SOL** to any address
- **Watchlist & search history** with offline persistence
- **Mainnet + Devnet** with custom RPC support
- **Dark/light theme**

## Getting Started

### Requirements

- Node.js 18+
- [Bun](https://bun.sh)
- Android Studio **or** a physical Android device with USB debugging enabled
- A Solana mobile wallet ([Phantom](https://phantom.app) / [Solflare](https://solflare.com)) for wallet features

> **Note:** This is a **development build** — it does NOT run on Expo Go.

### Setup

```bash
git clone https://github.com/kitsunekode/helio.git
cd helio
bun install
```

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_MAIN_NET_RPC_URL=<your-mainnet-rpc-url>
EXPO_PUBLIC_DEV_NET_RPC_URL=<your-devnet-rpc-url>
EXPO_PUBLIC_HELIUS_DEV_NET_RPC_URL=<your-helius-devnet-rpc-url>
```

Build and run:

```bash
bun expo prebuild
bun expo run:android
```

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Make your changes
4. Run `bun install` and test on a dev build
5. Open a PR — keep it focused

Found a bug or have an idea? [Open an issue](https://github.com/kitsunekode/helio/issues).

## Tech Stack

| Category | Tools |
|----------|-------|
| Framework | React Native 0.81, Expo Router v6, TypeScript |
| State & Storage | Zustand, MMKV |
| Animations | Reanimated |
| Styling | Uniwind (Tailwind for RN) |
| APIs | Jupiter, DexScreener, Helius RPC |

## License

[MIT](LICENSE)

## Author

[KitsuneKode](https://github.com/kitsunekode)

## Contributors

Contributors welcome! Check the [issues page](https://github.com/kitsunekode/helio/issues) to get started.
