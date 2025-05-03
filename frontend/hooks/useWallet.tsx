"use client";

import { useState, useEffect, useCallback } from "react";
import { BrowserProvider, Signer } from "ethers";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { generateEducationalUsername } from "@/lib/utils";

declare global {
  interface Window {
    ethereum: any;
  }
}

// Pharos Devnet configuration
const PHAROS_CHAIN_ID = "0xc352"; // 50002 in hex
const PHAROS_CHAIN_CONFIG = {
  chainId: PHAROS_CHAIN_ID,
  chainName: "Pharos Devnet",
  nativeCurrency: {
    name: "PTT",
    symbol: "PTT",
    decimals: 18,
  },
  rpcUrls: ["https://devnet.dplabs-internal.com"],
  blockExplorerUrls: ["https://pharosscan.xyz/"],
};

// Toast config
const TOAST_CONFIG = {
  position: "top-center",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "light",
} as const;

export const useWallet = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [academicIdentity, setAcademicIdentity] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    if (!window.ethereum) {
      toast.error("Please install MetaMask to connect", TOAST_CONFIG);
      return;
    }

    if (!window.ethereum.isMetaMask) {
      toast.error("Please use MetaMask wallet to connect", TOAST_CONFIG);
      return;
    }

    try {
      setProvider(new BrowserProvider(window.ethereum));
    } catch (err) {
      toast.error("Failed to initialize provider", TOAST_CONFIG);
    }
  }, []);

  const switchToPharosNetwork = useCallback(async () => {
    if (!window.ethereum || !window.ethereum.isMetaMask) {
      toast.error("Please use MetaMask wallet to connect", TOAST_CONFIG);
      return false;
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: PHAROS_CHAIN_ID }],
      });
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [PHAROS_CHAIN_CONFIG],
          });
          return true;
        } catch (addError) {
          toast.error("Failed to add Pharos Devnet", TOAST_CONFIG);
          return false;
        }
      } else {
        toast.error("Failed to switch to Pharos Devnet", TOAST_CONFIG);
        return false;
      }
    }
  }, []);

  const connectWallet = useCallback(async (): Promise<void> => {
    setIsConnecting(true);

    if (!provider) {
      toast.error("Provider not initialized", TOAST_CONFIG);
      setIsConnecting(false);
      return;
    }

    if (!window.ethereum || !window.ethereum.isMetaMask) {
      toast.error("Please use MetaMask wallet to connect", TOAST_CONFIG);
      setIsConnecting(false);
      return;
    }

    const networkSwitched = await switchToPharosNetwork();
    if (!networkSwitched) {
      toast.error("Network switch failed", TOAST_CONFIG);
      setIsConnecting(false);
      return;
    }

    try {
      await provider.send("eth_requestAccounts", []);
      const newSigner = await provider.getSigner();
      const newAddress = await newSigner.getAddress();

      localStorage.setItem("walletAddress", newAddress);
      setSigner(newSigner);
      setAddress(newAddress);

      if (newSigner) {
        try {
          const username = generateEducationalUsername(newAddress);
          setAcademicIdentity(username);
        } catch (error) {
          console.error("Error generating academic identity:", error);
        }
      }

      router.push("/contests");
    } catch (err: any) {
      const errorMessage =
        err.code === 4001
          ? "User rejected the connection request"
          : err.message?.includes("MetaMask not detected")
          ? "Please install MetaMask to connect"
          : err.message || "Failed to connect wallet";

      toast.error(errorMessage, TOAST_CONFIG);
      setSigner(null);
      setAddress(null);
      localStorage.removeItem("walletAddress");
    } finally {
      setIsConnecting(false);
    }
  }, [provider, switchToPharosNetwork]);

  const disconnect = useCallback(() => {
    setSigner(null);
    setAddress(null);
    setAcademicIdentity("");
    localStorage.removeItem("walletAddress");
  }, []);

  const checkConnection = useCallback(async () => {
    if (!provider || !window.ethereum || !window.ethereum.isMetaMask) return;

    try {
      const storedAddress = localStorage.getItem("walletAddress");
      if (!storedAddress) return;

      const accounts = await provider.listAccounts();
      if (
        accounts.length > 0 &&
        accounts[0].address.toLowerCase() === storedAddress.toLowerCase()
      ) {
        const newSigner = await provider.getSigner();
        const confirmedAddress = await newSigner.getAddress();
        setSigner(newSigner);
        setAddress(confirmedAddress);

        if (newSigner) {
          try {
            const username = generateEducationalUsername(confirmedAddress);
            setAcademicIdentity(username);
          } catch (error) {
            console.error("Error generating academic identity:", error);
          }
        }
      } else {
        localStorage.removeItem("walletAddress");
      }
    } catch (err) {
      toast.error("Failed to restore connection", TOAST_CONFIG);
      localStorage.removeItem("walletAddress");
    }
  }, [provider]);

  useEffect(() => {
    if (provider && window.ethereum && window.ethereum.isMetaMask) {
      checkConnection();
    }
  }, [provider, checkConnection]);

  useEffect(() => {
    if (!window.ethereum || !window.ethereum.isMetaMask) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (provider) {
        try {
          const newSigner = await provider.getSigner();
          const newAddress = await newSigner.getAddress();
          localStorage.setItem("walletAddress", newAddress);
          setSigner(newSigner);
          setAddress(newAddress);
          if (newSigner) {
            try {
              const username = generateEducationalUsername(newAddress);
              setAcademicIdentity(username);
            } catch (error) {
              console.error("Error generating academic identity:", error);
            }
          }
        } catch (err) {
          toast.error("Failed to update signer", TOAST_CONFIG);
          disconnect();
        }
      }
    };

    const handleChainChanged = async () => {
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId !== PHAROS_CHAIN_ID) {
        const switched = await switchToPharosNetwork();
        if (!switched) {
          toast.error("Please connect to the Pharos Devnet network", TOAST_CONFIG);
        }
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [provider, disconnect, switchToPharosNetwork]);

  return {
    signer,
    address,
    academicIdentity,
    isConnecting,
    provider,
    connectWallet,
    disconnect,
  };
};
