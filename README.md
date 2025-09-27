# BeReal Clone

A fully functional React Native application that replicates the core functionality of BeReal with local data storage, built using Expo and AsyncStorage. Experience the authentic BeReal social media experience with dual-camera posts, friends system, and 24-hour post expiration - all running locally on your device!

## 🚀 Super Simple Setup (1 Command)

```bash
# Run the setup script
./setup.sh
```

That's it! 🎉

**What it does:**
- Installs all dependencies
- Starts the development server
- Works completely offline
- No external services required

## 📱 How to Test

1. **On your phone**: Install Expo Go app and scan the QR code
2. **On computer**: Press `w` to open in web browser
3. **Multiple devices**: Test with friends on different devices

## 🔐 Authentication System

- **Username/Password**: Simple local authentication
- **Multiple Accounts**: Create and switch between different users
- **Persistent Login**: Accounts saved between sessions
- **No Internet Required**: Works completely offline
- **Profile Management**: Update username, bio, and profile pictures

## ✨ Core Features

### 📸 **Dual Camera System**
- **Simultaneous Capture**: Front and back cameras in one post
- **Live Preview**: See what you're capturing in real-time
- **BeReal Style**: Authentic dual-camera experience
- **Image Quality**: High-quality photo capture

### 👥 **Social Network**
- **Friends System**: Add friends by username
- **Friend Requests**: Send, accept, and reject requests
- **Smart Validation**: Can't add yourself or non-existent users
- **Profile Pictures**: See friend avatars everywhere
- **Real Usernames**: Display actual usernames, not IDs

### ⏰ **24-Hour Post Expiration**
- **Temporary Posts**: Posts disappear after 24 hours
- **Real-time Feed**: Only shows current posts
- **Memories System**: View your complete post history
- **Expired Badges**: Clear indication of old posts

### 📱 **Memories Feature**
- **Complete History**: All your posts, regardless of age
- **Smart Dates**: "Today", "Yesterday", "3 days ago"
- **Timestamps**: Exact time posted
- **Personal Gallery**: Your own post collection

### 🔄 **Real-time Updates**
- **Manual Refresh**: Tap refresh button to see new posts
- **Profile Updates**: Changes reflect everywhere instantly
- **Friends-Only Feed**: Only see posts from friends + your own
- **Live Data**: Always shows current information

## 🎯 **User Experience**

### **Camera Screen**
- Take front and back photos simultaneously
- Live camera preview with instructions
- Automatic camera switching
- Post to feed with one tap

### **Feed Screen**
- View friends' posts (last 24 hours only)
- Like posts with heart animation
- See profile pictures and usernames
- Manual refresh to see new content

### **Friends Screen**
- Add friends by typing username
- View friend list with profile pictures
- Manage friend requests
- Remove friends easily

### **Profile Screen**
- Edit username and bio
- Upload profile picture
- View post statistics
- Access memories
- Logout functionality

### **Memories Screen**
- Complete post history
- Smart date formatting
- Expired post indicators
- Personal gallery view

## 🛠️ Technical Stack

- **Frontend**: React Native + Expo
- **Storage**: AsyncStorage (local device storage)
- **Authentication**: Custom username/password system
- **Camera**: Expo Camera for dual-camera functionality
- **Images**: Base64 encoding for local storage
- **State Management**: React Context API
- **Offline First**: No internet connection required

## 🔧 **Architecture**

- **Local Storage**: All data stored on device using AsyncStorage
- **User Management**: Multiple user accounts with persistent storage
- **Friend System**: Bidirectional friendship with request management
- **Post System**: 24-hour expiration with memories preservation
- **Profile System**: Real-time profile updates across all screens

## 🆘 Troubleshooting

**App won't start?**
- Make sure you have Node.js installed
- Try `npm install` again
- Check if port 8081 is available

**Can't login?**
- Create a new account first
- No internet connection needed
- Check username/password spelling

**Camera not working?**
- Grant camera permissions when prompted
- Try restarting the app
- Check device camera functionality

**Posts not showing?**
- Make sure you have friends added
- Check if posts are within 24 hours
- Try refreshing the feed

**Need help?**
- Check the console for error messages
- App works completely offline
- All data is stored locally on your device

## 🎉 **Ready to Go!**

This BeReal clone provides a complete social media experience with:
- ✅ Dual-camera posts
- ✅ Friends system
- ✅ 24-hour post expiration
- ✅ Memories feature
- ✅ Profile management
- ✅ Local data storage
- ✅ No internet required

**Just run `./setup.sh` and start sharing your BeReal moments!** 🚀