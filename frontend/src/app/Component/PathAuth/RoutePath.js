"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";
import styles from "../../Style/route.module.css";

export default function RoutePath({ children }) {
    const router = useRouter();
    const { isAuthenticated, isInitialized, isLoading, logout } = useAuth();

    const onLogoutClick = () => {
        logout();
    };

    // While AuthContext is still initializing, show loading
    if (!isInitialized || isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <p className={styles.loadingText}>Loading...</p>
            </div>
        );
    }

    // Token is valid — user is already logged in
    if (isAuthenticated) {
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
                        <Link href="/chat" className={styles.chatLink}>
                            Go to Chat
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Not authenticated — show login/signup page
    return <>{children}</>;
}