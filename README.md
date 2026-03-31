<p align="center">
  <img src="https://img.shields.io/badge/Spring_Boot-3.4.2-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white" />
  <img src="https://img.shields.io/badge/WebSocket-STOMP-010101?style=for-the-badge&logo=websocket&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

# 💬 Chat-App

A full-stack real-time chat application inspired by **WhatsApp**, built with **Spring Boot** and **Next.js**. Supports one-on-one messaging, group chats, file attachments, real-time presence tracking, and more.

---

## ✨ Features

### 💬 Messaging
- **Real-time messaging** via WebSocket (STOMP over SockJS)
- **One-on-one (Single) chats** and **Group chats**
- **Message read receipts** — track who has read each message
- **Last message preview** on the chat list
- **File attachments** — send images, documents, audio, and presentations

### 👥 Group Chat Management
- Create group chats with custom names and group images
- **Admin roles** — promote members to admin
- Add/remove participants
- Update group name and group image
- Delete group chats (admin only)

### 🔐 Authentication & Security
- **JWT-based authentication** with HTTP-only cookie support
- **Two-Factor Authentication (2FA)** via Twilio SMS OTP
- **Phone number login** support
- Token verification and refresh
- Route protection with **PathGuard** on the frontend
- Spring Security integration

### 👤 User Management
- User registration with **profile picture upload**
- Profile editing (username, about, profile picture)
- **Online/Offline status** tracking with last seen timestamp
- User search functionality
- Friends list management

### 📎 File & Media Management
- **Cloudinary** integration for cloud-based image/file storage
- Profile picture uploads (users & groups)
- Attachment uploads with file type tracking
- Secure URL-based file access

### 🔔 Real-time Features
- **WebSocket** for instant message delivery
- Online/Offline presence indicators
- Notification bar for alerts
- Real-time chat list updates

---

## 🏗️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Spring Boot 3.4.2** | REST API framework |
| **Java 21** | Programming language |
| **MongoDB** | NoSQL database |
| **Spring Security** | Authentication & authorization |
| **Spring WebSocket** | Real-time communication (STOMP) |
| **JWT (jjwt)** | Token-based auth |
| **Twilio SDK** | SMS OTP for 2FA |
| **Cloudinary** | Cloud file/image storage |
| **Lombok** | Boilerplate reduction |
| **MapStruct** | DTO ↔ Entity mapping |
| **ModelMapper** | Object mapping |
| **Spring Actuator** | Application monitoring |

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 16** | React framework (App Router) |
| **React 18** | UI library |
| **Tailwind CSS 3.4** | Utility-first styling |
| **STOMP.js** | WebSocket client |
| **SockJS** | WebSocket fallback |
| **Axios** | HTTP client |
| **Framer Motion** | Animations & transitions |
| **Font Awesome** | Icon library |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Docker** | Containerization (multi-stage build) |
| **Cloudinary** | CDN & media management |
| **MongoDB** | Database |

---

## 📁 Project Structure

```
Chat-App/
├── Backend/                          # Spring Boot application
│   ├── src/main/java/com/ChatApplication/
│   │   ├── Config/                   # WebSocket, App configs
│   │   ├── Controller/               # REST & WebSocket controllers
│   │   │   ├── AuthenticationController.java
│   │   │   ├── ChatController.java
│   │   │   ├── MessageController.java
│   │   │   ├── UserController.java
│   │   │   └── AttachmentController.java
│   │   ├── Entity/                   # MongoDB document models
│   │   ├── DTO/                      # Data Transfer Objects
│   │   ├── Enum/                     # ChatType, UserStatus, AuthType
│   │   ├── Repository/               # MongoDB repositories
│   │   ├── Service/                  # Business logic interfaces
│   │   ├── ServiceImpl/              # Service implementations
│   │   ├── Security/                 # JWT, Auth utilities
│   │   ├── Mapper/                   # MapStruct mappers
│   │   ├── Exception/                # Custom exceptions & handlers
│   │   └── Cloudinary/               # Cloudinary configuration
│   ├── Dockerfile                    # Multi-stage Docker build
│   ├── pom.xml                       # Maven dependencies
│   └── .env                          # Environment variables
│
├── frontend/                         # Next.js application
│   └── src/app/
│       ├── Component/                # Reusable UI components
│       │   ├── chat/                 # Chat-related components
│       │   ├── ChatInfoDisplay/      # Chat details panel
│       │   └── PathAuth/             # Route protection
│       ├── context/                  # React context providers
│       │   ├── AuthContext.js
│       │   ├── ChatDetailContext.js
│       │   └── CurrentChatContext.js
│       ├── services/                 # API service functions
│       ├── Style/                    # CSS modules
│       ├── login/                    # Login page
│       ├── loginPhone/               # Phone login page
│       ├── signup/                   # Sign up page
│       ├── chat/                     # Main chat page
│       ├── createChat/               # Create chat page
│       ├── groupChat/                # Group chat page
│       └── profile/                  # User profile page
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Java 21** (JDK)
- **Node.js 18+** and **npm**
- **MongoDB** (local or Atlas)
- **Cloudinary** account (for media uploads)

### 1. Clone the Repository

```bash
git clone https://github.com/rudra100008/Chat-App.git
cd Chat-App
```

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd Backend
   ```

2. Create a `.env` file with your credentials:
   ```env
   CLOUDINARY_URL=cloudinary://your_api_key:your_api_secret@your_cloud_name
   ```

3. Configure `application.properties` with your MongoDB URI and other settings.

4. Run the backend:
   ```bash
   ./mvnw spring-boot:run
   ```
   The server starts on `http://localhost:8080`.

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   The app starts on `http://localhost:3000`.

### 4. Docker (Optional)

Build and run the backend with Docker:

```bash
cd Backend
docker build -t chat-app-backend .
docker run -p 8080:8080 --env-file .env chat-app-backend
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/signup` | Register a new user |
| `POST` | `/auth/login` | Login (username or phone) |
| `GET` | `/auth/logout` | Logout & invalidate session |
| `GET` | `/auth/verify-token` | Verify JWT token validity |

### Chats
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chats` | Create a single chat |
| `POST` | `/api/chats/groupChat/{chatName}` | Create a group chat |
| `GET` | `/api/chats/user/{userId}` | Get all chats for a user |
| `GET` | `/api/chats/{chatId}` | Get chat participants |
| `GET` | `/api/chats/chatDetails/{chatId}` | Get chat details |
| `PATCH` | `/api/chats/{chatId}/user/{userId}` | Add participant |
| `DELETE` | `/api/chats/{chatId}/removeUser/{userId}` | Remove participant |
| `PUT` | `/api/chats/promoteUserToAdmin` | Promote user to admin |
| `DELETE` | `/api/chats/groupChat/{chatId}` | Delete group chat |

### Messages
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/messages` | Send a message |
| `GET` | `/api/messages/{chatId}` | Fetch messages for a chat |

### Users
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users/{userId}` | Get user profile |
| `PUT` | `/api/users/{userId}` | Update user profile |

### Attachments
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/attachments` | Upload attachment |
| `GET` | `/api/attachments/download/{id}` | Download attachment |

---

## 🌐 WebSocket Events

The app uses **STOMP over SockJS** for real-time communication:

| Destination | Description |
|---|---|
| `/app/sendMessage` | Send a message |
| `/topic/chat/{chatId}` | Subscribe to chat messages |
| `/topic/user/{userId}` | Subscribe to user-specific events |

---

## 🛡️ Security

- **JWT tokens** stored in HTTP-only cookies (XSS protection)
- **Spring Security** filter chain for API protection
- **WebSocket authentication** via custom handshake & channel interceptors
- **Token verification** on both frontend and backend
- **Two-Factor Authentication** with Twilio SMS OTP
- **CORS** configuration for cross-origin requests

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/rudra100008">rudra100008</a>
</p>
