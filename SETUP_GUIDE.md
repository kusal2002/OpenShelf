# OpenShelf Setup Guide

This guide will help you set up and run the OpenShelf university library mobile app.

## 🚀 Quick Start

### Prerequisites Checklist
- [ ] Node.js 18+ installed
- [ ] React Native CLI installed (`npm install -g @react-native-community/cli`)
- [ ] Android Studio (for Android development)
- [ ] Xcode (for iOS development - macOS only)
- [ ] Supabase account

### Step 1: Environment Setup
1. Create a `.env` file in the root directory:
```env
SUPABASE_URL=https://your-project-url.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
OPENROUTER_API_KEY=your-openrouter-api-key-here
APP_ENV=development
```

2. **Get OpenRouter API Key**:
   - Go to [openrouter.ai](https://openrouter.ai) and sign up for an account
   - Navigate to your API keys section and create a new key
   - Copy the API key and add it to your `.env` file as `OPENROUTER_API_KEY`
   - The AI chatbot feature uses the `tngtech/deepseek-r1t2-chimera:free` model for educational content generation

### Step 2: Supabase Backend Setup
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and anon key from Settings > API
3. Go to the SQL editor in your Supabase dashboard
4. Copy and paste the entire content of `supabase_schema.sql` and execute it
5. This will create all necessary tables, policies, and storage buckets

### Step 3: Install Dependencies
```bash
npm install

# For iOS (macOS only)
cd ios && pod install && cd ..
```

### Step 4: Run the App
```bash
# Start Metro bundler
npm start

# In a new terminal, run on your platform:
npm run android  # For Android
npm run ios      # For iOS (macOS only)
```

## 📁 What's Included

### Complete File Structure
✅ **Authentication System**
- Login/Signup screens with validation
- Supabase authentication integration
- Persistent sessions

✅ **Core Features**
- Material upload with file picker
- Search and filtering functionality
- Personal library management
- User profiles and statistics

✅ **Technical Features**
- TypeScript strict mode
- Offline caching with AsyncStorage
- Network status monitoring
- Error handling and user feedback

✅ **Backend Integration**
- Complete Supabase service layer
- Row Level Security (RLS) policies
- File storage with access control
- Real-time data synchronization

## 🔧 Database Schema

The `supabase_schema.sql` file includes:

### Tables
- `users` - User profiles and authentication
- `materials` - Study materials with metadata
- `reading_progress` - Track reading state (future)
- `bookmarks` - Material bookmarks (future)
- `notes` - User annotations (future)

### Security
- Row Level Security policies for all tables
- User-specific data access control
- Secure file upload policies

### Storage
- `study-materials` bucket with 50MB file limit
- Automatic file validation and security

## 🎯 Next Steps

### Immediate Actions
1. **Set up Supabase**: Create project and run the SQL schema
2. **Update .env**: Add your actual Supabase credentials
3. **Test the app**: Run on device/emulator and test key features

### Future Enhancements
The app is designed for easy extension:

1. **PDF Viewer**: Add react-native-pdf for in-app reading
2. **AI Integration**: Implement OpenAI API for suggestions
3. **Push Notifications**: Add Firebase for real-time updates
4. **Analytics**: Integrate analytics for usage tracking

### AI Features (Placeholders Included)
- `generateAISuggestions()` in Supabase service
- `moderateContent()` for automatic content validation
- Ready for OpenAI API integration

## 🐛 Troubleshooting

### Common Issues
1. **Metro bundler cache**: `npx react-native start --reset-cache`
2. **Android build**: Clean with `cd android && ./gradlew clean`
3. **iOS pods**: Clean and reinstall with `cd ios && rm -rf Pods && pod install`
4. **Supabase connection**: Verify .env variables and RLS policies

### Environment Variables
Make sure your `.env` file has the correct Supabase credentials:
- SUPABASE_URL should end with `.supabase.co`
- SUPABASE_ANON_KEY should be the "anon/public" key, not the service key

## 📱 Testing the App

### Authentication Flow
1. Open the app → should show Login screen
2. Tap "Sign Up" → register with email
3. Check Supabase Auth → user should appear
4. Login → should navigate to main app

### Core Features
1. **Upload**: Test file selection and upload
2. **Search**: Try searching materials by title/category
3. **Offline**: Disable network and check cached data
4. **Profile**: View user statistics and settings

## 🚀 Deployment Ready

The app includes:
- Production environment configuration
- Error boundary handling
- Performance optimizations
- Security best practices

Ready for app store submission after adding:
- App icons and splash screens
- Privacy policy and terms
- App store metadata
- Final testing on physical devices

---

**Your OpenShelf app is now ready to run! 🎉**

Need help? Check the main README.md for detailed documentation.
