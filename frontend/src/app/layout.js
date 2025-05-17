import localFont from "next/font/local";
import "./globals.css"; // Import the AuthProvider
import { AuthProvider } from "./context/AuthContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Chat App</title>
      </head>
      <body>
        <AuthProvider>
          {children} {/* Children wrapped in AuthProvider */}
        </AuthProvider>
      </body>
    </html>
  );
}