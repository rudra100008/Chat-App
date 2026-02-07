import localFont from "next/font/local";
import "./globals.css"; // Import the AuthProvider
import { AuthProvider } from "./context/AuthContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import { NotificationProvider } from "./context/NotificationContext";
import NotificationBar from "./Component/NotificationBar";

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
        <NotificationProvider>
          <AuthProvider>
            <WebSocketProvider>
              <NotificationBar />
              {children}
            </WebSocketProvider>
          </AuthProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}
