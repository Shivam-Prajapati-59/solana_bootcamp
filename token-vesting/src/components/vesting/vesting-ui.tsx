"use client";

import { PublicKey } from "@solana/web3.js";
import { useMemo, useState } from "react";
import { ExplorerLink } from "../cluster/cluster-ui";
import { useVestingProgram, useVestingProgramAccount } from "./vesting-data-access";
import { ellipsify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { useWallet } from "@solana/wallet-adapter-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function VestingCreate() {
  const { createVestingAccount } = useVestingProgram();

  const [company, setCompany] = useState("");
  const [mint, setMint] = useState("");
  const { publicKey } = useWallet();

  const isFormValid = company.length > 0 && mint.length > 0 && publicKey;

  const handleSubmit = () => {
    if (isFormValid) {
      createVestingAccount.mutateAsync({
        companyName: company,
        mint: mint,
      });
    }
  };

  if (!publicKey) {
    return (
      <div className="alert alert-warning flex justify-center">
        <span>Please connect your wallet to create a vesting account.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="company">Company Name</Label>
        <Input
          id="company"
          type="text"
          placeholder="Company Name"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mint">Mint Address</Label>
        <Input
          id="mint"
          type="text"
          placeholder="Mint Address"
          value={mint}
          onChange={(e) => setMint(e.target.value)}
        />
      </div>

      <Button onClick={handleSubmit} disabled={createVestingAccount.isPending || !isFormValid}>
        Create New Vesting Account{" "}
        {createVestingAccount.isPending && <span className="loading loading-spinner loading-xs"></span>}
      </Button>
    </div>
  );
}

export function VestingList() {
  const { accounts, getProgramAccount } = useVestingProgram();

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>;
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>Program account not found. Make sure you have deployed the program and are on the correct cluster.</span>
      </div>
    );
  }
  return (
    <div className={"space-y-6"}>
      {accounts.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : accounts.data?.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {accounts.data?.map((account: any) => (
            <VestingCard key={account.publicKey.toString()} account={account.publicKey} />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className={"text-2xl"}>No accounts</h2>
          No accounts found. Create one above to get started.
        </div>
      )}
    </div>
  );
}

function VestingCard({ account }: { account: PublicKey }) {
  const { accountQuery, createEmployeeVesting } = useVestingProgramAccount({
    account,
  });

  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [cliffTime, setCliffTime] = useState(0);
  const [beneficiary, setBeneficiary] = useState("");

  const companyName = useMemo(() => accountQuery.data?.companyName ?? "", [accountQuery.data?.companyName]);

  return accountQuery.isLoading ? (
    <span className="loading loading-spinner loading-lg"></span>
  ) : (
    <Card>
      <CardHeader>
        <CardTitle>Counter: {companyName}</CardTitle>
        <CardDescription>
          Account: <ExplorerLink path={`account/${account}`} label={ellipsify(account.toString())} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="number"
              placeholder="Start Time"
              value={startTime}
              onChange={(e) => setStartTime(parseInt(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              type="number"
              placeholder="End Time"
              value={endTime}
              onChange={(e) => setEndTime(parseInt(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalAmount">Total Amount</Label>
            <Input
              id="totalAmount"
              type="number"
              placeholder="Total Amount"
              value={totalAmount}
              onChange={(e) => setTotalAmount(parseInt(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cliffTime">Cliff Time</Label>
            <Input
              id="cliffTime"
              type="number"
              placeholder="Cliff Time"
              value={cliffTime}
              onChange={(e) => setCliffTime(parseInt(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="beneficiary">Beneficiary</Label>
            <Input
              id="beneficiary"
              type="text"
              placeholder="Beneficiary"
              value={beneficiary}
              onChange={(e) => setBeneficiary(e.target.value)}
            />
          </div>

          <Button
            variant="outline"
            onClick={() =>
              createEmployeeVesting.mutateAsync({
                startTime,
                endTime,
                cliffTime,
                totalAmount,
                beneficiary,
              })
            }
            disabled={createEmployeeVesting.isPending}
          >
            Create Employee Vesting Account
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
