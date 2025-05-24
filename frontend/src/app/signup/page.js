"use client"
import { useRouter } from "next/navigation";
import axiosInterceptor from "../Component/Interceptor";
import baseUrl from "../baseUrl";
import Style from "../Style/form.module.css"
import { useState } from "react";
import Link from "next/link";

export default function SignUp(){
    const router = useRouter();
    const [validationError,setValidationError] = useState({
        username: "",
        email : "",
        password :"",
        phoneNumber :"",
        message:""
    });
    const [userInfo,setUserInfo] = useState({
        username:"",
        email : "",
        password : "",
        phoneNumber : "",
        image : null
    });
    
    const newUser = (e)=>{
        const {name,value} = e.target;
        setUserInfo(prev=> ({...prev,[name]:value}))
        // setValidationError((prev)=>({...prev,[name]:"",[message]:""}))
    }
    const handleSignUpForm= async()=>{
        const formData = new FormData();
        formData.append("user",new Blob([JSON.stringify({
            username:userInfo.username,
            email:userInfo.email,
            password:userInfo.password,
            phoneNumber:userInfo.phoneNumber
        })],{type:"application/json"}))
        if(userInfo.image){
           formData.append("image",userInfo.image)
        }
        try{
            const response = await axiosInterceptor.post(`${baseUrl}/auth/signup`,formData);
            console.log("UserInfo: ",userInfo)
            console.log(response.data);
            router.push("/")
        }catch(error){
            console.log(error.response.data)
            if (error.response?.status === 400) {
                // Handle validation errors from backend
                const errorData = error.response.data;
                setValidationError(prev => ({
                    ...prev,
                    ...errorData,
                }));
            } else if (error.response?.status === 409) {
                // Handle conflict error (e.g., email already exists)
                setValidationError(prev => ({
                    ...prev,
                    message: error.response.data.message
                }));
            } else if (error.response?.status === 500) {
                setValidationError(prev => ({
                    ...prev,
                    message: error.response.data.message
                }));
            } else {
                setValidationError(prev => ({
                    ...prev,
                    message: "An unexpected error occurred. Please try again."
                }));
            }
        }
    }

    const handleFileChange=(e)=>{
        setUserInfo({...userInfo, image: e.target.files[0]})
    }
    

    const handleForm=(e)=>{
        e.preventDefault();
        handleSignUpForm();
    }
if(validationError.message){
    return(<div>{validationError.message}</div>)
}
    return(
        <div className={Style.Container}>
            <form onSubmit={handleForm} className={Style.Form} action="post">
                <header className={Style.Header}>Sign Up here</header>
                <div className={Style.FormGroup}>
                    <label htmlFor="username" className={Style.Label}>Username</label>
                    <input
                    type="text"
                    id="username"
                    name="username"
                    value={userInfo.username}
                    onChange={newUser}
                    placeholder="Enter user name"
                    className={Style.InputForm}
                    />
                    {validationError.username && (
                        <p className={Style.FieldError}>{validationError.username}</p>
                    )}
                </div>
                <div className={Style.FormGroup}>
                    <label htmlFor="email" className={Style.Label}>Email</label>
                    <input
                    type="email"
                    id="email"
                    name="email"
                    value={userInfo.email}
                    onChange={newUser}
                    placeholder="Enter email"
                    className={Style.InputForm}
                    />
                    {validationError.email &&(
                        <p className={Style.FieldError}>{validationError.email}</p>
                    )}
                </div>
                <div className={Style.FormGroup}>
                    <label htmlFor="phonenumber" className={Style.Label}>PhoneNumber</label>
                    <input
                    type="text"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={userInfo.phoneNumber}
                    onChange={newUser}
                    placeholder="Enter phoneNumber"
                    className={Style.InputForm}
                    />
                    {validationError.phoneNumber && (
                        <p className={Style.FieldError}>{validationError.phoneNumber}</p>
                    )} 
                </div>
                <div className={Style.FormGroup}>
                    <label htmlFor="password" className={Style.Label}>Password</label>
                    <input
                    type="password"
                    id="password"
                    name="password"
                    value={userInfo.password}
                    onChange={newUser}
                    placeholder="Enter password"
                    className={Style.InputForm}
                    />
                    {validationError.password && (
                        <p className={Style.FieldError}>{validationError.password}</p>
                    )} 
                </div>
                <div className={Style.FormGroup}>
                    <input 
                    type="file"
                    name="image"
                    id="image"
                    onChange={handleFileChange}
                    className={Style.InputForm} />
                </div>
                <div className={Style.ButtonGroup}>
                    <div>
                        <button type="submit">SignUp</button>
                    </div>
                </div>
                
                <div className={Style.paragraph}>
                    <p>Have an account? <Link href="/" className={Style.SignUpDesign}>Login</Link></p>
                </div>
            </form>
        </div>
    )
}