"use clients"

import { useState } from "react"
import style from '../Style/search.module.css'

export default function SearchUser() {
    const [userName, setUserName] = useState("");

    const onValueChange = (e) => {
        setUserName(e.target.value)
    }
    return (
        <div  className={style.searchcontainer}>
            <div className={style.searchbox}>
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