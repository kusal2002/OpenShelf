# OpenShelf - University Library Mobile App

OpenShelf is a React Native CLI mobile application that allows university students to upload, share, and access study materials. Built with TypeScript, Supabase backend, and designed for both online and offline functionality.

## Features

### Core Features
- 📚 **Study Material Management**: Upload and organize PDFs, DOCs, and DOCX files
- 🔍 **Smart Search**: Find materials by title, category, tags, or content
- 📱 **Offline Support**: Access cached materials without internet connection
- 👥 **User Profiles**: Manage personal information and track contributions
- 📊 **Analytics**: Track uploads, downloads, and popular materials
- 🔒 **Authentication**: Secure login/signup with email verification

### Advanced Features (Future Implementation)
- 📖 **Online/Offline Reading**: Built-in PDF viewer with reading progress tracking
- 🤖 **AI-Powered Suggestions**: Personalized material recommendations
- 🔍 **Full-text Search**: Search within document content
- 📝 **Notes & Bookmarks**: Annotate and bookmark important sections
- 🛡️ **Content Moderation**: AI-based content validation and categorization
- 🎯 **Study Plans**: AI-generated study schedules based on materials

## Tech Stack

- **Frontend**: React Native CLI with TypeScript
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Navigation**: React Navigation 7
- **State Management**: React Hooks + Context (future: Redux Toolkit)
- **Offline Storage**: AsyncStorage + React Native FS
- **Network Detection**: NetInfo
- **File Handling**: React Native Document Picker
- **Styling**: StyleSheet (Custom Design System)

## Prerequisites

Before running the app, ensure you have:

- Node.js (≥18.0.0)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Supabase project account

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd openshelf
```

### 2. Install Dependencies
```bash
npm install

# For iOS (macOS only)
cd ios && pod install && cd ..
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-url.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# App Configuration
APP_ENV=development
```

### 4. Setup Supabase Backend

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key to the `.env` file
3. Run the SQL schema in your Supabase SQL editor:
   ```bash
   # Copy and paste the content of supabase_schema.sql
   # into your Supabase SQL editor and execute
   ```

### 5. Platform-Specific Setup

#### Android
```bash
# Start Metro bundler
npm start

# Run on Android (in a new terminal)
npm run android
```

#### iOS (macOS only)
```bash
# Start Metro bundler
npm start

# Run on iOS (in a new terminal)
npm run ios
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
│   ├── LoginScreen.tsx
│   ├── SignUpScreen.tsx
│   ├── HomeScreen.tsx
│   ├── UploadScreen.tsx
│   ├── LibraryScreen.tsx
│   └── ProfileScreen.tsx
├── services/           # API and external services
│   └── supabase.ts     # Supabase client and methods
├── utils/              # Utility functions and helpers
│   └── index.ts        # Cache, network, validation utilities
├── types/              # TypeScript type definitions
│   ├── index.ts        # Main types
│   └── env.d.ts        # Environment variable types
└── assets/             # Images, fonts, etc. (future)
```

## Key Components

### Authentication Flow
- **LoginScreen**: Email/password login with validation
- **SignUpScreen**: User registration with profile creation
- **AuthState Management**: Persistent sessions with automatic refresh

### Main App Features
- **HomeScreen**: Browse all public study materials with search and filtering
- **UploadScreen**: Upload materials with metadata and categorization
- **LibraryScreen**: Personal material management with statistics
- **ProfileScreen**: User profile and app settings

### Backend Integration
- **Supabase Service**: Centralized API calls and error handling
- **Real-time Updates**: Live data synchronization across devices
- **File Storage**: Secure file uploads with access control
- **Row Level Security**: User-specific data access policies

## Database Schema

### Tables
- `users`: User profiles and metadata
- `materials`: Study materials with file information
- `reading_progress`: Reading state tracking (future)
- `bookmarks`: Material bookmarks (future)
- `notes`: User annotations (future)

### Storage Buckets
- `study-materials`: File storage with 50MB size limit

## Environment Configuration

### Development
```env
SUPABASE_URL=https://your-dev-project.supabase.co
SUPABASE_ANON_KEY=your-dev-anon-key
APP_ENV=development
```

### Production
```env
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_ANON_KEY=your-prod-anon-key
APP_ENV=production
```

## Available Scripts

```bash
# Development
npm start              # Start Metro bundler
npm run android        # Run on Android
npm run ios           # Run on iOS
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues
npm test              # Run tests

# Build (future)
npm run build:android  # Build Android APK
npm run build:ios     # Build iOS archive
```

## Offline Support

The app includes comprehensive offline functionality:

- **Cached Materials**: Recently viewed materials are cached locally
- **Offline Reading**: Access downloaded materials without internet
- **Queue Uploads**: Materials uploaded offline are queued and sync when online
- **Network Status**: Visual indicators for connection state
- **Smart Sync**: Automatic synchronization when connection is restored

## Code Style and Best Practices

### TypeScript
- Strict type checking enabled
- Custom type definitions for all data structures
- Interface-based component props

### React Native
- Functional components with hooks
- No class components
- Consistent styling with design tokens
- Platform-specific code when necessary

### Code Organization
- Feature-based folder structure
- Separation of concerns (UI, logic, data)
- Centralized error handling
- Utility functions for common operations

## Future Enhancements

### Phase 1 (Next Release)
- [ ] PDF viewer with reading progress
- [ ] Full-text search functionality
- [ ] Push notifications for new materials
- [ ] Dark mode support

### Phase 2
- [ ] AI-powered content recommendations
- [ ] Social features (ratings, comments)
- [ ] Advanced analytics dashboard
- [ ] Material version control

### Phase 3
- [ ] Study group collaboration
- [ ] Video and audio material support
- [ ] Offline-first architecture
- [ ] Multi-language support

## API Documentation

### Authentication
```typescript
// Sign up
const response = await supabaseService.signUp({
  email: 'user@university.edu',
  password: 'securePassword123',
  name: 'John Doe',
  university_id: 'STU12345'
});

// Sign in
const response = await supabaseService.signIn({
  email: 'user@university.edu',
  password: 'securePassword123'
});
```

### Materials Management
```typescript
// Upload material
const material = await supabaseService.createMaterial({
  title: 'Calculus Notes',
  file_url: 'https://...',
  category: 'Mathematics',
  description: 'Chapter 1-5 notes',
  tags: ['calculus', 'derivatives'],
  is_public: true
});

// Get materials
const materials = await supabaseService.getMaterials(page, limit);
const userMaterials = await supabaseService.getUserMaterials(userId);
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Write comprehensive tests for new features
- Update documentation for API changes
- Use conventional commit messages
- Ensure cross-platform compatibility

## Troubleshooting

### Common Issues

#### Metro Bundler Issues
```bash
# Clear Metro cache
npx react-native start --reset-cache
```

#### Android Build Issues
```bash
# Clean and rebuild
cd android && ./gradlew clean && cd ..
npm run android
```

#### iOS Build Issues (macOS)
```bash
# Clean and reinstall pods
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
npm run ios
```

#### Supabase Connection Issues
- Verify environment variables in `.env`
- Check Supabase project URL and keys
- Ensure RLS policies are correctly configured

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation wiki

## Acknowledgments

- React Native community for excellent tooling
- Supabase for the amazing backend-as-a-service
- University students who inspired this project
- Open source contributors and maintainers

---

**OpenShelf** - Empowering students through shared knowledge 📚
