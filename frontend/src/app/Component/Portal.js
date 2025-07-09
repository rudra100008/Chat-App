import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function Portal({children}){

    const [mount, setMount] = useState(false);

    useEffect(()=>{
        setMount(true)

        return ()=>setMount(false)
    },[])

    return mount ? createPortal(children, document.getElementById('portal-root')) : null;
}