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
  user_id: string;
  title: string;
  description?: string;
  author?: string;
  category: MaterialCategory;
  sub_category?: string;
  file_type: string;
  file_size: number;
  file_url: string;
  storage_path?: string;
  file_name?: string;
  cover_url?: string;
  tags?: string[];
  is_public: boolean;
  download_count?: number;
  average_rating?: number;
  reviews_count?: number;
  // Indicates whether the resource is free to access/download
  is_free: boolean;
  created_at: string;
  updated_at: string;
  
  // Computed fields from joins
  uploader_name?: string;  // Name of the user who uploaded this material
  is_bookmarked?: boolean; // Whether current user has bookmarked this
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

  export type SubCategory = 
  | 'Textbook'
  | 'Notes'
  | 'Presentation'
  | 'Assignment'
  | 'Research'
  | 'Thesis'
  | 'Reference'
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
  url?: string; // For OAuth flows that need to redirect to external URLs
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
  AIChatbot: undefined;
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
