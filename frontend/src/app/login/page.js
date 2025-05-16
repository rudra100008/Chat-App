"use client"
import { useEffect, useState } from 'react'
import Style from '../Style/form.module.css'
import baseUrl from '../baseUrl'
import { useRouter } from 'next/navigation'
import axiosInterceptor from '../Component/Interceptor'
import Link from 'next/link'
export default function LogInPage(){
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [user,setUser] = useState({
        userName: "",
        password :""
    })

    const newUser=(e)=>{
        setUser({...user,[e.target.name]:e.target.value})
    }
    const verifyToken= async()=>{
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId")
        if(!token && !userId){
            setIsLoading(false)
            return;
        }

        try{
            const response = await axiosInterceptor.post(`${baseUrl}/auth/verify-token?userId=${userId}`,userId,{
                headers:{Authorization:`Bearer ${token}`}
            })
            
            const {isTokenValid} = response.data;
            console.log("IstokenValid: ",isTokenValid)
            if(isTokenValid){
                router.push("/chat");
            }else {
                // Clear storage if token is invalid
                localStorage.clear();
                setIsLoading(false);
            }
        }catch(error){
            console.log("Token verification failed:", error.response?.data || error);
            localStorage.clear();
            setIsLoading(false)
        }
    }
    useEffect(()=>{
        verifyToken();
    },[router])

    const handleLoginForm=async()=>{
        await axiosInterceptor.post(`${baseUrl}/auth/login`,user,{
            headers:{"Content-Type":"application/json"}
        })
        .then((response)=>{
            if(response && response.data){
                const { token, user: { userId },isTokenValid } = response.data;
                localStorage.setItem("token", token);
                localStorage.setItem("userId", userId);
                localStorage.setItem("isTokenValid",isTokenValid);
                setUser({ userName: "", password: "" });
                console.log("Login Successfully");
            }else{
                console.log("No data received from the server")
            }
            setTimeout(() => {
                router.push("/chat")
            }, 2000);
        }).catch((error)=>{
            const message = error.response.data || "Unknown Error";
            if(error.response.status === 401){
                console.log("Invalid username or password");
            }else if(error.response.status === 500){
                console.log("Error:\n",message);
            }else{
                console.log("Something went wrong")
            }
            localStorage.clear();
           
        })
    }
    const handleForm=(e)=>{
        e.preventDefault();
        handleLoginForm();
    }
    if(isLoading){
        return(<div className={Style.Container}>Loading.....</div>)
    }
    return(
        <div className={Style.Container}>
            <form onSubmit={handleForm} className={Style.Form}>
                <header className={Style.Header}>Login to your account</header>
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
                    value={user.password}
                    onChange={newUser}
                     />
                </div>
                <div className={Style.Radio}>
                    <input 
                    type="radio"
                    name='Rememberme'
                    id='Rememberme'
                    className={Style.InputForm}
                    />
                    <label htmlFor="Rememberme" className={Style.Label}>Remember me</label>
                </div>
                <div className={Style.ButtonGroup}>
                    <button type='submit'>Login</button>
                </div>
                <div className={Style.paragraph}>
                    <p>Dont have an account? <Link href="/signup" className={Style.SignUpDesign}>SignUp</Link></p>
                </div>
            </form>
        </div>
    )
}