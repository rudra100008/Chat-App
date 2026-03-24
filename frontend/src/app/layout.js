"use client"
import "./globals.css"; // Import the AuthProvider
import { AuthProvider, useAuth } from "./context/AuthContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import { NotificationProvider } from "./context/NotificationContext";
import NotificationBar from "./Component/NotificationBar";
import { ChatDetailProvider } from "./context/ChatDetailContext";



function ConditionalWebSocket({children}){

  const {isAuthenticated,isLoading} = useAuth();

  if(isLoading){
    return <div>Loading....</div>
  }

  if(isAuthenticated){
    return (
      <WebSocketProvider>
        <ChatDetailProvider>
        {children}
        </ChatDetailProvider>
      </WebSocketProvider>
    )
  }

  return <>{children}</>
}

function AppProvider({ children }){

  return (
    <NotificationProvider>
      <AuthProvider>
        
          <ConditionalWebSocket>
            <NotificationBar />
            {children}
          </ConditionalWebSocket>
        
      </AuthProvider>
    </NotificationProvider>
  )
}
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <title>Chat App</title>
      </head>
      <body>
        <div id="portal-root" />
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
