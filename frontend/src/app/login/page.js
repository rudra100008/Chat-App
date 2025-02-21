import { useState } from 'react'
import Style from '../Style/form.module.css'
import axios from 'axios'
import baseUrl from '../baseUrl'
import { useRouter } from 'next/navigation'
import axiosInterceptor from '../Component/Interceptor'
export default function LogInPage(){
    const router = useRouter();
    const [user,setUser] = useState({
        userName: "",
        password :""
    })

    const newUser=(e)=>{
        setUser({...user,[e.target.name]:e.target.value})
    }
    const handleLoginForm=async()=>{
        await axiosInterceptor.post(`${baseUrl}/auth/login`,user,{
            headers:{"Content-Type":"application/json"}
        })
        .then((response)=>{
            if(response && response.data){
                const { token, user: { user_Id },isTokenValid } = response.data;
                localStorage.setItem("token", token);
                localStorage.setItem("userId", user_Id);
                localStorage.setItem("isTokenValid",isTokenValid);
                setUser({ userName: "", password: "" });
                console.log("Login Successfully");
                console.log(response.data);
                console.log("token: ",token);
                console.log("userId: ",user_Id)
                setTimeout(() => {
                    router.push("/chat")
                }, 2000);
            }else{
                console.log("No data received from the server")
            }
        }).catch((error)=>{
            const message = error.response.data.message || "Unknown Error";
            if(error.response.status === 401){
                console.log("Invalid username or password");
            }else if(error.response.status === 500){
                console.log(message);
            }else{
                console.log("Something went wrong")
            }
            localStorage.clear();
            console.log(error?.response?.data|| "Unknown Error" )
        })
    }
    const handleForm=(e)=>{
        e.preventDefault();
        handleLoginForm();
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
                <div className={Style.Button}>
                    <button type='submit'>Login</button>
                </div>
            </form>
        </div>
    )
}