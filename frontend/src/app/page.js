"use client"
import { useEffect } from 'react';
import Chat from './chat/page';
import style from './Style/home.module.css'
import LogInPage from './login/page';

export default function Home() {
  useEffect(()=>{
    document.title = "Chat App";
  },[])
  return (
    <div >
      <LogInPage/>
    </div>
  );
}
