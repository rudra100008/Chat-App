"use client"

import { useState } from "react"
import style from '../Style/search.module.css'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import axiosInterceptor from "./Interceptor";
import baseUrl from "../baseUrl";
import ErrorPrompt from "./ErrorPrompt";

export default function SearchUser({ onError }) {
    const [userName, setUserName] = useState("");
    const [user, setUser] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');

    const onValueChange = (e) => {
        setUserName(e.target.value)
    }

    const searchUser = async () => {
        await axiosInterceptor.get(`/api/users/search/${userName}`)
            .then((response) => {
                setUser(response.data)
            })
            .catch((error) => {
                console.error('Error in SearchUser:\n', error.response?.data);
                setErrorMessage(error.response?.data.message);
            })
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        searchUser();
    }

    return (
        <div className={style.searchcontainer}>
            <ErrorPrompt errorMessage={errorMessage} setErrorMessage={setErrorMessage} />
            <div className={style.searchbox}>
                <FontAwesomeIcon className={style.searchicon} icon={faSearch} onClick={handleSubmit} />
                <input
                    type="text"
                    id="username"
                    name="username"
                    value={userName}
                    className={style.searchinput}
                    onChange={onValueChange}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                    placeholder="Search here"
                />
            </div>
        </div>
    )
}