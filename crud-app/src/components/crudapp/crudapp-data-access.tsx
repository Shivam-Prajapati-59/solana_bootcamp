import {
  CrudappAccount,
  getCrudappProgramAccounts,
  getCrudappProgramId,
  getCreateJournalEntryInstructionAsync,
  getUpdateJournalEntryInstructionAsync,
  getDeleteJournalEntryInstructionAsync,
} from '@project/anchor'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { Address } from 'gill'
import { useWalletUi } from '@wallet-ui/react'
import { useWalletTransactionSignAndSend } from '../solana/use-wallet-transaction-sign-and-send'
import { useClusterVersion } from '@/components/cluster/use-cluster-version'
import { toastTx } from '@/components/toast-tx'
import { useWalletUiSigner } from '@/components/solana/use-wallet-ui-signer'
import { install as installEd25519 } from '@solana/webcrypto-ed25519-polyfill'

// polyfill ed25519 for browsers (to allow `generateKeyPairSigner` to work)
installEd25519()

export function useCrudappProgramId() {
  const { cluster } = useWalletUi()
  return useMemo(() => getCrudappProgramId(cluster.id), [cluster])
}

export function useCrudappProgram() {
  const { client, cluster } = useWalletUi()
  const programId = useCrudappProgramId()
  const query = useClusterVersion()

  return useQuery({
    retry: false,
    queryKey: ['get-program-account', { cluster, clusterVersion: query.data }],
    queryFn: () => client.rpc.getAccountInfo(programId).send(),
  })
}

// CRUD Operations for Journal Entries
export function useCrudappCreateMutation() {
  const invalidateAccounts = useCrudappAccountsInvalidate()
  const signer = useWalletUiSigner()
  const signAndSend = useWalletTransactionSignAndSend()

  return useMutation({
    mutationFn: async ({ title, message }: { title: string; message: string }) => {
      const instruction = await getCreateJournalEntryInstructionAsync({
        owner: signer,
        title,
        message,
      })
      
      return await signAndSend(instruction, signer)
    },
    onSuccess: async (tx) => {
      toast.success('Entry created successfully')
      toastTx(tx)
      await invalidateAccounts()
    },
    onError: (error) => {
      toast.error(`Failed to create entry: ${error.message}`)
    }
  })
}

export function useCrudappUpdateMutation() {
  const invalidateAccounts = useCrudappAccountsInvalidate()
  const signer = useWalletUiSigner()
  const signAndSend = useWalletTransactionSignAndSend()

  return useMutation({
    mutationFn: async ({ title, message }: { title: string; message: string }) => {
      const instruction = await getUpdateJournalEntryInstructionAsync({
        owner: signer,
        title,
        message,
      })
      
      return await signAndSend(instruction, signer)
    },
    onSuccess: async (tx) => {
      toast.success('Entry updated successfully')
      toastTx(tx)
      await invalidateAccounts()
    },
    onError: (error) => {
      toast.error(`Failed to update entry: ${error.message}`)
    }
  })
}

export function useCrudappDeleteMutation() {
  const invalidateAccounts = useCrudappAccountsInvalidate()
  const signer = useWalletUiSigner()
  const signAndSend = useWalletTransactionSignAndSend()

  return useMutation({
    mutationFn: async ({ title }: { title: string }) => {
      const instruction = await getDeleteJournalEntryInstructionAsync({
        owner: signer,
        title,
      })
      
      return await signAndSend(instruction, signer)
    },
    onSuccess: async (tx) => {
      toast.success('Entry deleted successfully')
      toastTx(tx)
      await invalidateAccounts()
    },
    onError: (error) => {
      toast.error(`Failed to delete entry: ${error.message}`)
    }
  })
}

export function useCrudappAccountQuery({ account }: { account: CrudappAccount }) {
  const { client, cluster } = useWalletUi()

  return useQuery({
    queryKey: ['crudapp', 'fetch', { cluster, account: account.address }],
    queryFn: async () => {
      const accountInfo = await client.rpc.getAccountInfo(account.address).send()
      if (!accountInfo.value) {
        throw new Error('Account not found')
      }
      return account.data
    },
  })
}

export function useCrudappAccountsQuery() {
  const { client } = useWalletUi()

  return useQuery({
    queryKey: useCrudappAccountsQueryKey(),
    queryFn: async () => await getCrudappProgramAccounts(client.rpc),
  })
}

function useCrudappAccountsInvalidate() {
  const queryClient = useQueryClient()
  const queryKey = useCrudappAccountsQueryKey()

  return () => queryClient.invalidateQueries({ queryKey })
}

function useCrudappAccountsQueryKey() {
  const { cluster } = useWalletUi()

  return ['crudapp', 'accounts', { cluster }]
}
