"use client"
import { useEffect, useState } from 'react'
import styles from '../Style/LoginPage.module.css'
import { useRouter } from 'next/navigation'
import axiosInterceptor from '../Component/Interceptor'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import RoutePath from '../Component/PathAuth/RoutePath'

export default function LogInPage() {
    const router = useRouter();
    const { login, isAuthenticated, isLoading, isInitialized } = useAuth();
    const [showPassword,setShowPassword] = useState(false);
    const [localLoading, setLocalLoading] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [user, setUser] = useState({
        userName: "",
        password: ""
    });

    const newUser = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    }

    const handleLoginForm = async () => {
        setLocalLoading(true);
        setLoginError('');
        try {
            const response = await axiosInterceptor.post(
                `/auth/login`, 
                user, 
                { headers: { "Content-Type": "application/json" } }
            );
            
            if (response?.data) {
                const { userId } = response.data;
                login(userId);
                setUser({ userName: "", password: "" });
                console.log("Login Successfully");
                router.push("/chat");
            } else {
                setLoginError("No data received from the server");
            }
        } catch (error) {
            const message = error.response?.data?.message || "Unknown Error";
            if (error.response?.status === 401) {
                setLoginError("Invalid username or password");
            } else if (error.response?.status === 500) {
                setLoginError(`Server error: ${message}`);
            } else {
                setLoginError("Something went wrong. Please try again.");
            }
        } finally {
            setLocalLoading(false);
        }
    }

    const handleForm = (e) => {
        e.preventDefault();
        handleLoginForm();
    }



    // if (!isInitialized) {
    //     return (
    //     <div className={Style.Container }>
    //         <p className={Style.loading}>Initializing...</p>
    //     </div>);
    // }

    //  if (isAuthenticated && isInitialized) {
    //     return (
    //         <div className={Style.Container}>
    //             <p className={Style.loading}> Redirecting to chat...</p>
    //         </div>
    //     );
    // }
    
     return (
        <RoutePath>
        <div className={styles.pageContainer}>
            {/* Animated Background Elements */}
            <div className={styles.backgroundShapes}>
                <div className={styles.shape1}></div>
                <div className={styles.shape2}></div>
                <div className={styles.shape3}></div>
                <div className={styles.shape4}></div>
            </div>

            {/* Main Login Container */}
            <div className={styles.loginWrapper}>
                {/* Left Side - Illustration/Branding */}
                <div className={styles.illustrationSide}>
                    <div className={styles.brandContent}>
                        <div className={styles.logoContainer}>
                            <div className={styles.logoCircle}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                                    <path d="M9 12l2 2 4-4" />
                                </svg>
                            </div>
                        </div>
                        <h1 className={styles.brandTitle}>Welcome Back!</h1>
                        <p className={styles.brandDescription}>
                            Sign in to continue your journey and access all features
                        </p>
                        
                        {/* Decorative Illustration */}
                        <div className={styles.illustrationGraphic}>
                            <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
                                {/* Computer/Device Illustration */}
                                <rect x="80" y="80" width="240" height="160" rx="8" fill="currentColor" opacity="0.1"/>
                                <rect x="90" y="90" width="220" height="120" rx="4" fill="currentColor" opacity="0.2"/>
                                
                                {/* Lock Icon */}
                                <circle cx="200" cy="140" r="25" fill="currentColor" opacity="0.3"/>
                                <rect x="190" y="150" width="20" height="25" rx="2" fill="currentColor" opacity="0.4"/>
                                <path d="M 185 150 Q 185 135, 200 135 Q 215 135, 215 150" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.4"/>
                                
                                {/* Decorative Elements */}
                                <circle cx="120" cy="50" r="8" fill="currentColor" opacity="0.2"/>
                                <circle cx="280" cy="60" r="6" fill="currentColor" opacity="0.15"/>
                                <circle cx="310" cy="180" r="10" fill="currentColor" opacity="0.2"/>
                                <circle cx="70" cy="220" r="7" fill="currentColor" opacity="0.15"/>
                            </svg>
                        </div>

                        {/* Feature Points */}
                        <div className={styles.featurePoints}>
                            <div className={styles.featurePoint}>
                                <svg viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Secure & Encrypted</span>
                            </div>
                            <div className={styles.featurePoint}>
                                <svg viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Fast & Reliable</span>
                            </div>
                            <div className={styles.featurePoint}>
                                <svg viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>24/7 Support</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className={styles.formSide}>
                    <div className={styles.formContainer}>
                        <div className={styles.formHeader}>
                            <h2 className={styles.formTitle}>Sign In</h2>
                            <p className={styles.formSubtitle}>Enter your credentials to access your account</p>
                        </div>

                        {loginError && (
                            <div className={styles.errorAlert}>
                                <svg className={styles.errorIcon} viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span>{loginError}</span>
                            </div>
                        )}

                        <form onSubmit={handleForm} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label htmlFor="userName" className={styles.label}>
                                    Username
                                </label>
                                <div className={styles.inputWrapper}>
                                    <svg className={styles.inputIcon} viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                    <input
                                        type="text"
                                        name='userName'
                                        id='userName'
                                        placeholder='Enter your username'
                                        className={styles.input}
                                        value={user.userName}
                                        onChange={newUser}
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="password" className={styles.label}>
                                    Password
                                </label>
                                <div className={styles.inputWrapper}>
                                    <svg className={styles.inputIcon} viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name='password'
                                        id='password'
                                        placeholder='Enter your password'
                                        className={styles.input}
                                        value={user.password}
                                        onChange={newUser}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className={styles.togglePassword}
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <svg viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                            </svg>
                                        ) : (
                                            <svg viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className={styles.formOptions}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        name='rememberMe'
                                        id='rememberMe'
                                        className={styles.checkbox}
                                    />
                                    <span className={styles.checkboxText}>Remember me</span>
                                </label>
                                <Link href="/forgot-password" className={styles.forgotLink}>
                                    Forgot password?
                                </Link>
                            </div>

                            <button 
                                type='submit' 
                                className={styles.submitButton}
                                disabled={localLoading}
                            >
                                {localLoading ? (
                                    <>
                                        <svg className={styles.spinner} viewBox="0 0 24 24">
                                            <circle className={styles.spinnerCircle} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        </svg>
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        Sign In
                                        <svg className={styles.buttonIcon} viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </>
                                )}
                            </button>

                            <div className={styles.divider}>
                                <span>or</span>
                            </div>

                            <div className={styles.signupPrompt}>
                                <p>Do not have an account? <Link href="/signup" className={styles.signupLink}>Sign Up</Link></p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        </RoutePath>
    )
}