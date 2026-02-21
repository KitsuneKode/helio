import { BalanceCard } from '@/components/wallet-screen/balance-card'
import { SearchLoading } from '@/components/wallet-screen/search-loading'
import { WalletPrompt } from '@/components/wallet-screen/wallet-prompt'
import { TokenSection } from '@/components/wallet-screen/token-section'
import { TransactionSection } from '@/components/wallet-screen/transaction-section'
import type { UseWalletScreenResult } from '@/hooks/use-wallet-screen'

export function WalletResults({
  loading,
  hasSearched,
  walletData,
  hasMoreTokens,
  canShowLess,
  loadingMoreTkn,
  loadingMoreTxn,
  handleShowLessTokens,
  handleLoadMoreTokens,
  handleTokenPress,
  handleLoadMoreTransactions,
  handleTransactionPress,
}: Pick<
  UseWalletScreenResult,
  | 'loading'
  | 'hasSearched'
  | 'walletData'
  | 'hasMoreTokens'
  | 'canShowLess'
  | 'loadingMoreTkn'
  | 'loadingMoreTxn'
  | 'handleShowLessTokens'
  | 'handleLoadMoreTokens'
  | 'handleTokenPress'
  | 'handleLoadMoreTransactions'
  | 'handleTransactionPress'
>) {
  if (loading) return <SearchLoading />
  if (!hasSearched || !walletData) return <WalletPrompt />

  return (
    <>
      <BalanceCard balance={walletData.balance.balance} address={walletData.balance.address} />
      <TokenSection
        allTokens={walletData.allTokens}
        visibleTokens={walletData.visibleTokens}
        hasMoreTokens={hasMoreTokens}
        canShowLess={canShowLess}
        loadingMoreTokens={loadingMoreTkn}
        onShowLess={handleShowLessTokens}
        onLoadMore={handleLoadMoreTokens}
        onPressToken={handleTokenPress}
      />
      <TransactionSection
        transactions={walletData.transactions}
        hasMoreTransactions={walletData.hasMoreTx}
        loadingMoreTransactions={loadingMoreTxn}
        onLoadMore={handleLoadMoreTransactions}
        onPressTransaction={handleTransactionPress}
      />
    </>
  )
}
