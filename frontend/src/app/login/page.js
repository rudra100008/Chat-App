import { useState } from 'react'
import Style from '../Style/form.module.css'
export default function LogInPage(){
    const [user,setUser] = useState({
        username: "",
        password :""
    })

    const newUser=(e)=>{
        setUser({...user,[e.target.name]:e.target.value})
    }
    return(
        <div className={Style.Container}>
            <div className={Style.Form}>
                <header className={Style.Header}>Login here</header>
                <div className={Style.FormGroup}>
                    <label htmlFor="username" className={Style.Label}>Username</label>
                    <input 
                    type="text"
                    name='username'
                    id='username'
                    placeholder='Enter username..'
                    className={Style.InputForm}
                    value={user.username}
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
                <div className={Style.Submit}>
                    <button>Login</button>
                </div>
            </div>
        </div>
    )
}