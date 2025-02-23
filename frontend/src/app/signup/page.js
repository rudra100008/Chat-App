import { useRouter } from "next/navigation";
import axiosInterceptor from "../Component/Interceptor";
import baseUrl from "../baseUrl";

export default function SignUp(){
    const router = useRouter();
    
    const handleSignUpForm= async()=>{
        try{
            const response = await axiosInterceptor.post(`${baseUrl}/auth/`)
        }catch(error){

        }
    }
    const handleForm=(e)=>{
        e.preventDefault();

    }
    return(
        <div>
            <form onSubmit={handleForm} action="post">
                <h1>Sign Up here</h1>
                <div className="">
                    <label htmlFor="username">Username</label>
                    <input
                    id="username"
                    name="username"
                    placeholder="Enter user name"
                    />
                </div>
                <div className="">
                    <label htmlFor="email">Email</label>
                    <input
                    id="email"
                    name="email"
                    placeholder="Enter email"
                    />
                </div>
                <div>
                    <label htmlFor="phoneNumber">PhoneNumber</label>
                    <input
                    id="phoneNumber"
                    name="phoneNumber"
                    placeholder="Enter phoneNumber"
                    />
                </div>
                <div className="">
                    <label htmlFor="password">Password</label>
                    <input
                    id="password"
                    name="password"
                    placeholder="Enter password"
                    />
                </div>
            </form>
        </div>
    )
}