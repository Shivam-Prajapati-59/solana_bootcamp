import { ellipsify } from '@wallet-ui/react'
import {
  useCrudappAccountsQuery,
  useCrudappCloseMutation,
  useCrudappDecrementMutation,
  useCrudappIncrementMutation,
  useCrudappInitializeMutation,
  useCrudappProgram,
  useCrudappProgramId,
  useCrudappSetMutation,
} from './crudapp-data-access'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExplorerLink } from '../cluster/cluster-ui'
import { CrudappAccount } from '@project/anchor'
import { ReactNode, useState } from 'react'
import { initialize } from 'next/dist/server/lib/render-server'
import { isKeyPairSigner } from 'gill'

export function CrudappCreate() {

  const [title, setTitle] = useState("");
  const [message , setMessage] = useState("");
  const {createEntry} = useCrudappProgram();

  const {publicKey}  = useWallet();

  const isFormInvalid = title.trim() === "" || message.trim() === "";

  const handleSubmit = () => {
    if(publicKey && isFormInvalid) {
      createEntry.mutateAsync({ publicKey, title, message });
    }

    if(!publicKey)  {
      return <p>
        Connect your wallet to create a new entry.
      </p>
    }
  }
  return (
    <div>
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} 
      className='input input-bordered w-full mb-2 max-w-xs'
      />
      <textarea name="message" id="" className='input input-bordered w-full mb-2 max-w-xs' value={message} onChange={(e) => setMessage(e.target.value)} />
      <button onClick={handleSubmit} disabled={isFormInvalid || createEntry.isPending}
      className='btn btn-primary w-full max-w-xs'
      >
        Create
      </button>
    </div>
  )
   
}

export function CrudappProgramExplorerLink() {
  const programId = useCrudappProgramId()

  return <ExplorerLink address={programId.toString()} label={ellipsify(programId.toString())} />
}

export function CrudappList() {
  const crudappAccountsQuery = useCrudappAccountsQuery()

  if (crudappAccountsQuery.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }

  if (!crudappAccountsQuery.data?.length) {
    return (
      <div className="text-center">
        <h2 className={'text-2xl'}>No accounts</h2>
        No accounts found. Initialize one to get started.
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {crudappAccountsQuery.data?.map((crudapp) => (
        <CrudappCard key={crudapp.address} crudapp={crudapp} />
      ))}
    </div>
  )
}

export function CrudappProgramGuard({ children }: { children: ReactNode }) {
  const programAccountQuery = useCrudappProgram()

  if (programAccountQuery.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }

  if (!programAccountQuery.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>Program account not found. Make sure you have deployed the program and are on the correct cluster.</span>
      </div>
    )
  }

  return children
}

function CrudappCard({ crudapp }: { crudapp: CrudappAccount }) {

  const {
    accountQuery , updateEntry, deleteEntry
  } = useCrudappProgram({account: crudapp})

  const {publicKey} = useWallet();
  const [message , setMessage] = useState("");
  const isFormInvalid = message.trim() === "";
  const title = accountQuery.data?.title;
  const handleSubmit = () => {
    if (publicKey && !isFormInvalid) {
      updateEntry.mutateAsync({ publicKey, title, message });
    }

    if (!publicKey) {
      return <p>Connect your wallet to create a new entry.</p>;
    }
  };

}

export function CrudappButtonInitialize() {
  const mutationInitialize = useCrudappInitializeMutation()

  return (
    <Button onClick={() => mutationInitialize.mutateAsync()} disabled={mutationInitialize.isPending}>
      Initialize Crudapp {mutationInitialize.isPending && '...'}
    </Button>
  )
}

export function CrudappButtonIncrement({ crudapp }: { crudapp: CrudappAccount }) {
  const incrementMutation = useCrudappIncrementMutation({ crudapp })

  return (
    <Button variant="outline" onClick={() => incrementMutation.mutateAsync()} disabled={incrementMutation.isPending}>
      Increment
    </Button>
  )
}

export function CrudappButtonSet({ crudapp }: { crudapp: CrudappAccount }) {
  const setMutation = useCrudappSetMutation({ crudapp })

  return (
    <Button
      variant="outline"
      onClick={() => {
        const value = window.prompt('Set value to:', crudapp.data.count.toString() ?? '0')
        if (!value || parseInt(value) === crudapp.data.count || isNaN(parseInt(value))) {
          return
        }
        return setMutation.mutateAsync(parseInt(value))
      }}
      disabled={setMutation.isPending}
    >
      Set
    </Button>
  )
}

export function CrudappButtonDecrement({ crudapp }: { crudapp: CrudappAccount }) {
  const decrementMutation = useCrudappDecrementMutation({ crudapp })

  return (
    <Button variant="outline" onClick={() => decrementMutation.mutateAsync()} disabled={decrementMutation.isPending}>
      Decrement
    </Button>
  )
}

export function CrudappButtonClose({ crudapp }: { crudapp: CrudappAccount }) {
  const closeMutation = useCrudappCloseMutation({ crudapp })

  return (
    <Button
      variant="destructive"
      onClick={() => {
        if (!window.confirm('Are you sure you want to close this account?')) {
          return
        }
        return closeMutation.mutateAsync()
      }}
      disabled={closeMutation.isPending}
    >
      Close
    </Button>
  )
}
