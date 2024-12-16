"use client"
import { useEffect } from 'react';
import Chat from './chat/page';
import style from './Style/home.module.css'

export default function Home() {
  useEffect(()=>{
    document.title = "Chat App";
  },[])
  return (
    <div >
      <Chat/>
    </div>
  );
}
