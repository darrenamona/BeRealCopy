# BeReal Clone - System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  React Native App (Expo)                                       │
│  ├── Authentication Context                                    │
│  ├── API Service Layer                                         │
│  ├── Camera Screen (Dual Photo Capture)                       │
│  ├── Feed Screen (Posts Display)                              │
│  ├── Friends Screen (Social Features)                         │
│  ├── Profile Screen (User Management)                         │
│  └── Discovery Screen (User Discovery)                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTPS/REST API
                                │ WebSocket (Socket.io)
                                │
┌─────────────────────────────────────────────────────────────────┐
│                        SERVER LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  Express.js Server (Node.js)                                   │
│  ├── Authentication Middleware (JWT)                          │
│  ├── Rate Limiting                                            │
│  ├── CORS Configuration                                       │
│  ├── File Upload (Multer)                                     │
│  ├── Real-time Communication (Socket.io)                      │
│  └── API Routes:                                              │
│      ├── /api/auth (Authentication)                           │
│      ├── /api/users (User Management)                         │
│      ├── /api/posts (Post Management)                         │
│      ├── /api/friends (Social Features)                       │
│      └── /api/notifications (Real-time Updates)               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ Database Queries
                                │
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  MongoDB Database                                              │
│  ├── Users Collection                                          │
│  │   ├── Authentication Data                                  │
│  │   ├── Profile Information                                  │
│  │   ├── Privacy Settings                                     │
│  │   └── Statistics                                           │
│  ├── Posts Collection                                          │
│  │   ├── Image Metadata                                       │
│  │   ├── Author Information                                   │
│  │   ├── Engagement Data (Likes, Comments)                    │
│  │   └── Privacy Settings                                     │
│  ├── Friends Collection                                        │
│  │   ├── Friend Relationships                                 │
│  │   ├── Friend Requests                                      │
│  │   └── Block Lists                                          │
│  └── Notifications Collection                                  │
│      ├── Notification Types                                    │
│      ├── Read Status                                           │
│      └── Timestamps                                            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ File Storage
                                │
┌─────────────────────────────────────────────────────────────────┐
│                    STORAGE LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  Local File System                                             │
│  ├── /uploads/avatars (User Profile Pictures)                 │
│  └── /uploads/posts (Post Images)                             │
└─────────────────────────────────────────────────────────────────┘
```

## Multi-User Architecture Changes

### Before (Single User)
- Local data storage with AsyncStorage
- No user authentication
- No friend system
- No real-time features
- No privacy controls

### After (Multi-User)
- Centralized database with MongoDB
- JWT-based authentication system
- Complete friend management system
- Real-time notifications with Socket.io
- Comprehensive privacy controls
- User discovery and search features

## Data Flow

### User Registration/Login
1. User submits credentials
2. Frontend sends request to `/api/auth/register` or `/api/auth/login`
3. Server validates credentials and creates/verifies user
4. JWT token generated and returned
5. Token stored in AsyncStorage for future requests

### Post Creation
1. User captures front and back photos
2. Images uploaded to server via `/api/posts`
3. Server processes and stores images
4. Post metadata saved to MongoDB
5. Real-time notifications sent to friends
6. Feed updated for all relevant users

### Friend Management
1. User searches for other users
2. Friend request sent via `/api/friends/request`
3. Notification sent to recipient
4. Recipient can accept/reject via `/api/friends/accept` or `/api/friends/reject`
5. Friend relationship updated in database
6. Both users' friend lists updated

### Real-time Notifications
1. User action triggers notification
2. Server creates notification record
3. Socket.io emits notification to recipient
4. Frontend receives and displays notification
5. User can mark as read or dismiss

## Security Architecture

### Authentication
- JWT tokens with expiration
- Password hashing with bcryptjs
- Token validation on protected routes
- Secure token storage in AsyncStorage

### Authorization
- Role-based access control
- Friend-only post visibility
- Privacy setting enforcement
- User data isolation

### Data Protection
- Input validation and sanitization
- File upload restrictions
- Rate limiting on API endpoints
- CORS configuration

## Scalability Considerations

### Database
- Indexed queries for performance
- TTL indexes for post expiration
- Geospatial indexes for location features
- Aggregation pipelines for statistics

### File Storage
- Organized directory structure
- File size limits
- Type validation
- Cleanup for expired posts

### Real-time Features
- Socket.io rooms for user isolation
- Efficient notification batching
- Connection management
- Error handling and reconnection

## Technology Stack Details

### Frontend Technologies
- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **TypeScript**: Type safety and better development experience
- **Context API**: State management for authentication
- **AsyncStorage**: Local data persistence

### Backend Technologies
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: Object Document Mapper
- **Socket.io**: Real-time communication
- **JWT**: Authentication tokens
- **Multer**: File upload handling

### Development Tools
- **Expo CLI**: Development and deployment
- **Concurrently**: Running multiple processes
- **Nodemon**: Development server auto-restart
- **ESLint**: Code linting and formatting

## Deployment Architecture

### Development Environment
- Local MongoDB instance
- Local file storage
- Development server with hot reload
- Expo development build

### Production Considerations
- MongoDB Atlas or self-hosted MongoDB
- Cloud storage (AWS S3, Google Cloud Storage)
- Load balancing for multiple server instances
- CDN for static file delivery
- Environment-specific configuration

## API Design Patterns

### RESTful Endpoints
- Consistent HTTP methods (GET, POST, PUT, DELETE)
- Resource-based URLs
- Proper HTTP status codes
- Error handling with meaningful messages

### Real-time Communication
- WebSocket connections for live updates
- Event-based architecture
- Room-based user isolation
- Graceful connection handling

### File Upload Strategy
- Multipart form data for images
- Server-side file validation
- Organized storage structure
- URL generation for client access

This architecture provides a scalable, secure, and maintainable foundation for the multi-user BeReal clone application.
