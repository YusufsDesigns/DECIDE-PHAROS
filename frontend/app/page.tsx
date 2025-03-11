"use client";

import LoginButton from "@/components/LoginButton";
import { useOCAuth } from "@opencampus/ocid-connect-js";
import Image from "next/image";
import Link from "next/link";
import { DotLoader } from "react-spinners";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { useUser } from "@/context/userContext";

interface DecodedToken {
  edu_username: string;
  [key: string]: any;
}

export default function Home() {
  const { authState, ocAuth } = useOCAuth();
  const { setUsername } = useUser();

  useEffect(() => {
    if (authState?.idToken) {
      const decodedToken = jwtDecode<DecodedToken>(authState?.idToken);

      setUsername(decodedToken.edu_username);
    }
  }, [authState?.idToken]);

  if (authState?.error) {
    toast.error("Could not login", {
      position: "top-center",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });
    return <div>Error: {authState.error.message}</div>;
  }

  // Add a loading state
  if (authState?.isLoading) {
    return (
      <div className="h-[90vh] w-full flex items-center justify-center">
        <DotLoader color="#fff" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start sm:items-center justify-center min-h-[90vh] gap-7 max-w-[600px] mx-auto px-5 text-left sm:text-center">
      <h2 className="text-2xl sm:text-4xl font-semibold">Compete, Propose, Vote, and Earn!</h2>
      <p className="">
      Enter contests, propose solutions, and get rewarded for driving change in education. DECIDE empowers students, educators, and innovators to create and vote on ideas that shape the future of learning while crowdsourcing funding for impactful solutions. Your impact starts here!
      </p>
      {authState?.isAuthenticated ? (
        <div>
          <Link
            href="/contests"
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-sm h-10 px-4 bg-[#096897] text-white text-sm font-bold"
          >
            <span className="truncate">View Contests</span>
          </Link>
        </div>
      ) : (
        <LoginButton />
      )}
      <Image src="/web3_noBg.png" alt="hero_img" width={500} height={500} />
    </div>
  );
}
