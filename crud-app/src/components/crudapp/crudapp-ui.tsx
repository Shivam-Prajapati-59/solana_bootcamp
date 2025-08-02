import { ellipsify, useWalletUi } from '@wallet-ui/react'
import {
  useCrudappAccountsQuery,
  useCrudappProgram,
  useCrudappProgramId,
  useCrudappCreateMutation,
  useCrudappUpdateMutation,
  useCrudappDeleteMutation,
  useCrudappAccountQuery,
} from './crudapp-data-access'
import { ExplorerLink } from '../cluster/cluster-ui'
import { CrudappAccount } from '@project/anchor'
import { ReactNode, useState } from 'react'

export function CrudappCreate() {

  const [title, setTitle] = useState("");
  const [message , setMessage] = useState("");
  const createEntry = useCrudappCreateMutation();

  const { account } = useWalletUi();

  const isFormInvalid = title.trim() === "" || message.trim() === "";

  const handleSubmit = () => {
    if(account && !isFormInvalid) {
      createEntry.mutateAsync({ title, message });
    }
  }

  if(!account)  {
    return <p>
      Connect your wallet to create a new entry.
    </p>
  }

  return (
    <div>
      <input 
        type="text" 
        placeholder="Title"
        value={title} 
        onChange={(e) => setTitle(e.target.value)} 
        className='input input-bordered w-full mb-2 max-w-xs'
      />
      <textarea 
        name="message" 
        id="" 
        placeholder="Message"
        className='input input-bordered w-full mb-2 max-w-xs' 
        value={message} 
        onChange={(e) => setMessage(e.target.value)} 
      />
      <button 
        onClick={handleSubmit} 
        disabled={isFormInvalid || createEntry.isPending}
        className='btn btn-primary w-full max-w-xs'
      >
        {createEntry.isPending ? 'Creating...' : 'Create'}
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
  const accountQuery = useCrudappAccountQuery({ account: crudapp })
  const updateEntry = useCrudappUpdateMutation()
  const deleteEntry = useCrudappDeleteMutation()

  const { account } = useWalletUi()
  const [message, setMessage] = useState("")
  const isFormInvalid = message.trim() === ""
  const title = accountQuery.data?.title

  const handleSubmit = () => {
    if (account && !isFormInvalid && title) {
      updateEntry.mutateAsync({ title, message })
    }
  }

  const handleDelete = () => {
    if (title) {
      deleteEntry.mutateAsync({ title })
    }
  }

  if (!account) {
    return <p>Connect your wallet to view entries.</p>
  }

  return accountQuery.isLoading ? (
    <span className="loading loading-spinner loading-lg"></span>
  ) : (
    <div className='card card-bordered border-base-300 bg-base-100 text-neutral-content shadow-xl'>
      <div className='card-body items-center text-center'>
        <div className='space-y-6'>
          <h2 
            className='card-title text-2xl font-bold cursor-pointer'
            onClick={() => accountQuery.refetch()}
          >
            {accountQuery.data?.title || 'Untitled Entry'}
          </h2>
          <p>
            {accountQuery.data?.message || 'No message provided.'}
          </p>

          <div className='card-actions justify-center space-x-2'>
            <textarea 
              name="message" 
              placeholder="Update message"
              className='input input-bordered w-full mb-2 max-w-xs' 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
            />

            <button 
              className='btn btn-xs lg:btn-md btn-primary' 
              disabled={updateEntry.isPending || isFormInvalid}
              onClick={handleSubmit}
            > 
              {updateEntry.isPending ? 'Updating...' : 'Update'}
            </button>
            
            <button
              onClick={handleDelete}
              disabled={deleteEntry.isPending}
              className='btn btn-error'
            >
              {deleteEntry.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
