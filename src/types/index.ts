/**
 * TypeScript type definitions for the OpenShelf University Library App
 */

// User Profile Types
export interface User {
  id: string;
  email: string;
  name: string;
  full_name?: string;
  university_id?: string;
  department?: string;
  year_of_study?: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  university_id?: string;
  avatar_url?: string;
  email_confirmed_at?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

// Study Material Types
export interface Material {
  id: string;
  title: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string; // 'pdf' | 'doc' | 'docx'
  user_id: string;
  category: MaterialCategory;
  description?: string;
  tags?: string[];
  is_public: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
  // Offline support
  is_downloaded?: boolean;
  local_path?: string;
  // Bookmark support
  is_bookmarked?: boolean;
  // Uploader information
  uploader_name?: string;
}

export type MaterialCategory = 
  | 'Computer Science'
  | 'Mathematics'
  | 'Physics'
  | 'Chemistry'
  | 'Biology'
  | 'Literature'
  | 'History'
  | 'Economics'
  | 'Psychology'
  | 'Engineering'
  | 'Medicine'
  | 'Other';

// Material Bookmark Type
export interface MaterialBookmark {
  id: string;
  user_id: string;
  material_id: string;
  created_at: string;
}

// Reading Progress Types (Future Implementation)
export interface ReadingProgress {
  id: string;
  material_id: string;
  user_id: string;
  current_page: number;
  total_pages: number;
  progress_percentage: number;
  last_read_at: string;
  bookmarks?: Bookmark[];
  notes?: Note[];
}

export interface Bookmark {
  id: string;
  page_number: number;
  title?: string;
  created_at: string;
}

export interface Note {
  id: string;
  page_number: number;
  content: string;
  highlight_text?: string;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface SupabaseResponse<T> {
  data: T | null;
  error: {
    message: string;
    details?: string;
    hint?: string;
    code?: string;
  } | null;
}

// Upload Types
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileUpload {
  uri: string;
  type: string;
  name: string;
  size: number;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  SignUp: undefined;
  MaterialViewer: { materialId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Upload: undefined;
  Library: undefined;
  Profile: undefined;
};

// Authentication Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials extends LoginCredentials {
  name: string;
  university_id?: string;
}

export interface AuthState {
  user: AuthUser | null;
  session: any | null;
  loading: boolean;
  isAuthenticated: boolean;
}

// App State Types
export interface AppState {
  isOnline: boolean;
  materials: Material[];
  cachedMaterials: Material[];
  uploadQueue: Material[];
  readingProgress: { [materialId: string]: ReadingProgress };
}

// Search Types (Future Implementation)
export interface SearchFilters {
  category?: MaterialCategory;
  fileType?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  tags?: string[];
  author?: string;
}

export interface SearchResult {
  materials: Material[];
  totalCount: number;
  hasMore: boolean;
}

// AI Suggestion Types (Future Implementation)
export interface AISuggestion {
  id: string;
  material_id: string;
  suggestion_type: 'related_content' | 'study_plan' | 'practice_questions';
  title: string;
  description: string;
  confidence_score: number;
  metadata: any;
  created_at: string;
}

// Content Moderation Types (Future Implementation)
export interface ContentModerationResult {
  is_appropriate: boolean;
  confidence_score: number;
  flagged_reasons?: string[];
  suggested_category?: MaterialCategory;
  extracted_text?: string;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

// Form Validation Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormErrors {
  [key: string]: string;
}
