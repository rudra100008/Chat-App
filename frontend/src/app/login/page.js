"use client"
import { useEffect, useState } from 'react'
import Style from '../Style/form.module.css'
import baseUrl from '../baseUrl'
import { useRouter } from 'next/navigation'
import axiosInterceptor from '../Component/Interceptor'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'

export default function LogInPage() {
    const router = useRouter();
    const { login, isAuthenticated, isLoading, isInitialized } = useAuth();
    const [localLoading, setLocalLoading] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [user, setUser] = useState({
        userName: "",
        password: ""
    });

    const newUser = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    }

    // Check if user is already authenticated
    useEffect(() => {
        if(isLoading || !isInitialized){
            router.push("/")
        }
        if (isAuthenticated) {
            router.push("/chat");
        }
    }, [isLoading, isAuthenticated, router,isInitialized]);

    const handleLoginForm = async () => {
        setLocalLoading(true);
        setLoginError('');
        try {
            const response = await axiosInterceptor.post(
                `${baseUrl}/auth/login`, 
                user, 
                { headers: { "Content-Type": "application/json" } }
            );
            
            if (response?.data) {
                const { token, user: { userId }, isTokenValid } = response.data;
                login(userId, token);
                console.log("userId:",userId)
                localStorage.setItem("isTokenValid", isTokenValid);
                setUser({ userName: "", password: "" });
                console.log("Login Successfully");
                router.replace("/chat");
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



    if (!isInitialized || isLoading ) {
        return (<div className={Style.Container}>Checking authentication status...</div>);
    }

     if (isAuthenticated && isInitialized) {
        return (
            <div className={Style.Container}>
                <div>Redirecting to chat...</div>
            </div>
        );
    }
    
    return (
        <div className={Style.Container}>
            <form onSubmit={handleForm} className={Style.Form}>
                <header className={Style.Header}>Login to your account</header>
                
                {loginError && (
                    <div className={Style.ErrorMessage}>{loginError}</div>
                )}
                
                <div className={Style.FormGroup}>
                    <label htmlFor="userName" className={Style.Label}>Username</label>
                    <input
                        type="text"
                        name='userName'
                        id='userName'
                        placeholder='Enter username..'
                        className={Style.InputForm}
                        value={user.userName}
                        onChange={newUser}
                        required
                    />
                </div>
                <div className={Style.FormGroup}>
                    <label htmlFor="password" className={Style.Label}>Password</label>
                    <input
                        type="password"
                        name='password'
                        id='password'
                        placeholder='Enter password..'
                        className={Style.InputForm}
                        value={user.password.trim()}
                        onChange={newUser}
                        required
                    />
                </div>
                <div className={Style.Radio}>
                    <input
                        type="checkbox"
                        name='Rememberme'
                        id='Rememberme'
                        className={Style.InputForm}
                    />
                    <label htmlFor="Rememberme" className={Style.Label}>Remember me</label>
                </div>
                <div className={Style.ButtonGroup}>
                    <button type='submit' disabled={localLoading}>
                        {localLoading ? 'Logging in...' : 'Login'}
                    </button>
                </div>
                <div className={Style.paragraph}>
                    <p>Don't have an account? <Link href="/signup" className={Style.SignUpDesign}>SignUp</Link></p>
                </div>
            </form>
        </div>
    )
}