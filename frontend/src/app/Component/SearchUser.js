"use clients"

import { useState } from "react"
import style from '../Style/search.module.css'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import axiosInterceptor from "./Interceptor";
import baseUrl from "../baseUrl";

export default function SearchUser() {
    const [userName, setUserName] = useState("");
    const [user,setUser] =  useState([]);
    const onValueChange = (e) => {
        setUserName(e.target.value)
    }
    const searchUser=async()=>{
        const token = localStorage.getItem('token');
        
        axiosInterceptor.get(`${baseUrl}/api/users/search/${userName}`,{
            headers:{Authorization:`Bearer ${token}`}
        }).then((response)=>{
            console.log(response.data)
            setUser(response.data)
        }).catch((error)=>{
            console.error('Error in SearchUser:\n',error.response?.data)
        })
    }
    return (
        <div  className={style.searchcontainer}>
            <div className={style.searchbox}>
            <FontAwesomeIcon className={style.searchicon}  icon={faSearch}/>
                <input
                    type="text"
                    id="username"
                    name="username"
                    value={userName}
                    className={style.searchinput}
                    onChange={onValueChange}
                    placeholder="Search here" />
            </div>
        </div>
    )
}