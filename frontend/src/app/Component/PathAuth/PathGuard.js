"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import styles from '@/app/Style/pathguard.module.css';
import { useEffect } from "react";



export default function PathGuard({children}) {
  const { isAuthenticated ,isInitialized,isLoading} = useAuth();
  const router = useRouter();

  useEffect(()=>{
    if(isInitialized && !isLoading && !isAuthenticated){
        router.push("/")
    }
  },[isAuthenticated,isLoading,isInitialized,router])

  if(!isInitialized || isLoading){
    return(
        <div className={styles.loadingSection}>
            <p className={styles.loading}>Loading....</p>
        </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.loadingSection}>
        <p>Please login to access this page</p>
        <p className={styles.loading}>Redirecting to login...</p>
      </div>
    );
  }

  return <>{children}</>
}
