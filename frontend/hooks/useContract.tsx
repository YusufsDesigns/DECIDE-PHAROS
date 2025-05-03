"use client";

import { Contract, BrowserProvider } from 'ethers';
import { useWallet } from './useWallet';

const address = "0xFF7FcC43310c04A0fbc8849fFA6bed251C1B7872";

export const useContractWrite = (abi: any) => {
    const { signer } = useWallet();
    const contract = new Contract(address, abi, signer);
    return contract;
};

export const useContractRead = (abi: any, provider: BrowserProvider) => {
    if (!provider) {
        throw new Error("Provider is not available");
    }
    const contract = new Contract(address, abi, provider);
    return contract;
};