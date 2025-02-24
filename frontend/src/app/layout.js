import localFont from "next/font/local";
import "./globals.css";





export default function RootLayout({ children }) {
  return (
    <html lang="en">
        <head>
        <title>Chat App</title>
      </head>
      <body>
        {children} {/* Ensure children are rendered inside the body */}
      </body>
    </html>
  );
}
