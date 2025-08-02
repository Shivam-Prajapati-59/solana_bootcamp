import { WalletButton } from '../solana/solana-provider'
import { CrudappList, CrudappProgramExplorerLink, CrudappProgramGuard, CrudappCreate } from './crudapp-ui'
import { AppHero } from '../app-hero'
import { useWalletUi } from '@wallet-ui/react'

export default function CrudappFeature() {
  const { account } = useWalletUi()

  return (
    <CrudappProgramGuard>
      <AppHero
        title="Crudapp"
        subtitle={
          account
            ? "Create, read, update, and delete journal entries on the Solana blockchain."
            : 'Select a wallet to run the program.'
        }
      >
        <p className="mb-6">
          <CrudappProgramExplorerLink />
        </p>
        {account ? (
          <div className="space-y-4">
            <CrudappCreate />
          </div>
        ) : (
          <div style={{ display: 'inline-block' }}>
            <WalletButton />
          </div>
        )}
      </AppHero>
      {account ? <CrudappList /> : null}
    </CrudappProgramGuard>
  )
}
