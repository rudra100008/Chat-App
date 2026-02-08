"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";
import styles from "../../Style/route.module.css"; // Import CSS module

export default function RoutePath({ children }) {
  const [isLogIn, setIsLogIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { logout ,  isTokenValid, tokenValidationList, isAuthenticated, userId } = useAuth();

  const onLogoutClick = () => {
    logout();
    router.refresh();
  };


  useEffect(()=>{
    if(typeof window === 'undefined') return;
    if(userId){
      isTokenValid();
    }

    setIsLoading(false)
  },[userId,isTokenValid])

  // useEffect(() => {
  //   if (typeof window === "undefined") return;

  //   if (userId) {
  //     setIsLogIn(true);
  //   } else {
  //     setIsLogIn(false);
  //     // Optionally redirect to home or login page if not logged in
  //     // router.push('/');
  //   }

  //   setIsLoading(false);
  // }, [router]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <p className={styles.loadingText}>Loading</p>
      </div>
    );
  }
  else  if (isAuthenticated  && tokenValidationList.isTokenValid) {
    return (
      <div className={styles.container}>
        <div className={styles.dashboard}>
          <h1 className={styles.welcomeText}>
            Welcome! You are already <span>logged in</span>
          </h1>
          <div className={styles.buttonGroup}>
            <button className={styles.logoutButton} onClick={onLogoutClick}>
              Log Out
            </button>
            <Link href={"/chat"} className={styles.chatLink}>
              Redirect to Chat
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
