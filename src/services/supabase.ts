/**
 * Supabase service for OpenShelf University Library App  
 * Handles authentication, file storage, and database operations
 */

// Import URL polyfill first to fix React Native compatibility
import 'react-native-url-polyfill/auto';

import { createClient, SupabaseClient, AuthError, PostgrestError } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  Material,
  AuthUser,
  LoginCredentials,
  SignUpCredentials,
  ApiResponse,
  MaterialCategory,
  FileUpload,
} from '../types';

// Environment variables - fallback to demo values if .env is not loaded
const supabaseUrl = process.env.SUPABASE_URL || 'https://yyerdifhxvzpmdjedvaz.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZXJkaWZoeHZ6cG1kamVkdmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDAyMjAsImV4cCI6MjA3MVE4NzYyMjAifQ.CqOP2CLyJB7bIX5bwT1cVWnAn4jF2fn6DX3-oLGdVps';

console.log('Supabase URL:', supabaseUrl?.substring(0, 30) + '...');
console.log('Supabase Key:', supabaseAnonKey?.substring(0, 20) + '...');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Using fallback values.');
}

// Create Supabase client with React Native specific configuration
let supabase: SupabaseClient;

try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'react-native',
      },
    },
    db: {
      schema: 'public',
    },
    realtime: {
      params: {
        eventsPerSecond: 2,
      },
    },
  });
  console.log('Supabase client created successfully');
} catch (error) {
  console.error('Failed to create Supabase client:', error);
  // Create a mock client to prevent crashes
  supabase = {} as SupabaseClient;
}

export { supabase };

class SupabaseService {
  private isClientReady: boolean = false;

  constructor() {
    this.isClientReady = supabase && typeof supabase.auth !== 'undefined';
    if (!this.isClientReady) {
      console.warn('Supabase client not properly initialized');
    }
  }

  private checkClient(): boolean {
    if (!this.isClientReady) {
      console.error('Supabase client not available');
      return false;
    }
    return true;
  }

  // Authentication Methods
  
  /**
   * Sign up a new user with email and password
   */
  async signUp(credentials: SignUpCredentials): Promise<ApiResponse<AuthUser>> {
    if (!this.checkClient()) {
      return { data: null, error: 'Supabase client not available', success: false };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            name: credentials.name,
            university_id: credentials.university_id,
          },
        },
      });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      // Create user profile in the users table
      if (data.user) {
        await this.createUserProfile({
          id: data.user.id,
          email: data.user.email!,
          name: credentials.name,
          university_id: credentials.university_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      return {
        data: data.user ? {
          id: data.user.id,
          email: data.user.email || '',
          name: credentials.name,
          university_id: credentials.university_id,
          avatar_url: data.user.user_metadata?.avatar_url,
          email_confirmed_at: data.user.email_confirmed_at,
          phone: data.user.phone,
          created_at: data.user.created_at,
          updated_at: data.user.updated_at || new Date().toISOString(),
        } : null,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Sign up failed',
        success: false,
      };
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(credentials: LoginCredentials): Promise<ApiResponse<AuthUser>> {
    if (!this.checkClient()) {
      return { data: null, error: 'Supabase client not available', success: false };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return {
        data: data.user ? {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name || '',
          university_id: data.user.user_metadata?.university_id,
          avatar_url: data.user.user_metadata?.avatar_url,
          email_confirmed_at: data.user.email_confirmed_at,
          phone: data.user.phone,
          created_at: data.user.created_at,
          updated_at: data.user.updated_at || new Date().toISOString(),
        } : null,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Sign in failed',
        success: false,
      };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { data: null, error: error.message, success: false };
      }

      // Clear cached data
      await AsyncStorage.multiRemove(['materials_cache', 'user_profile']);

      return { data: null, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Sign out failed',
        success: false,
      };
    }
  }

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle(): Promise<ApiResponse<AuthUser>> {
    if (!this.checkClient()) {
      return { data: null, error: 'Supabase client not available', success: false };
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'com.openshelf://',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      // For mobile apps, we need to handle the OAuth flow differently
      // The data.url will contain the OAuth URL that should be opened in a browser
      if (data.url) {
        // In React Native, we'll need to use a WebView or external browser
        // For now, return the URL so the UI can handle it
        return {
          data: null,
          error: null,
          success: true,
          url: data.url,
        };
      }

      return {
        data: data.user ? {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name || '',
          university_id: data.user.user_metadata?.university_id,
          avatar_url: data.user.user_metadata?.avatar_url,
          email_confirmed_at: data.user.email_confirmed_at,
          phone: data.user.phone,
          created_at: data.user.created_at,
          updated_at: data.user.updated_at || new Date().toISOString(),
        } : null,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Google sign in failed',
        success: false,
      };
    }
  }

  /**
   * Get the current authenticated user session
   */
  async getCurrentSession() {
    if (!this.checkClient()) {
      return { session: null, error: 'Supabase client not available' };
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      return { session, error };
    } catch (error) {
      return { session: null, error: error instanceof Error ? error.message : 'Session fetch failed' };
    }
  }

  /**
   * Get the current authenticated user
   */
  async getCurrentUser(): Promise<ApiResponse<AuthUser>> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return {
        data: user ? {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || '',
          university_id: user.user_metadata?.university_id,
          avatar_url: user.user_metadata?.avatar_url,
          email_confirmed_at: user.email_confirmed_at,
          phone: user.phone,
          created_at: user.created_at,
          updated_at: user.updated_at || new Date().toISOString(),
        } : null,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Get user failed',
        success: false,
      };
    }
  }

  // User Profile Methods

  /**
   * Create a user profile in the users table
   */
  async createUserProfile(user: User): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([user])
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Profile creation failed',
        success: false,
      };
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Profile fetch failed',
        success: false,
      };
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Profile update failed',
        success: false,
      };
    }
  }

  // File Storage Methods

  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(file: FileUpload, bucket: string = 'study-materials'): Promise<ApiResponse<string>> {
    try {
      // Handle demo files for development
      if (file.uri.startsWith('demo://')) {
        // Simulate upload process for demo files
        const demoFileName = file.uri.replace('demo://', '');
        const demoUrl = `https://demo-storage.example.com/study-materials/${demoFileName}`;
        
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        return { 
          data: demoUrl, 
          error: null, 
          success: true 
        };
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      // For real files, create proper FormData
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      } as any);

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, formData);

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return { data: publicUrl, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'File upload failed',
        success: false,
      };
    }
  }

  /**
   * Delete a file from Supabase Storage
   */
  async deleteFile(filePath: string, bucket: string = 'study-materials'): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: null, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'File deletion failed',
        success: false,
      };
    }
  }

  // Material Management Methods

  /**
   * Create a new study material record
   */
  async createMaterial(material: Omit<Material, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Material>> {
    try {
      const newMaterial = {
        ...material,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('materials')
        .insert([newMaterial])
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Material creation failed',
        success: false,
      };
    }
  }

  /**
   * Get all materials (with pagination)
   */
  async getMaterials(page: number = 0, limit: number = 20): Promise<ApiResponse<Material[]>> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: data || [], error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Materials fetch failed',
        success: false,
      };
    }
  }

  /**
   * Get materials by user ID
   */
  async getUserMaterials(userId: string): Promise<ApiResponse<Material[]>> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('user_id', userId) 
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: data || [], error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'User materials fetch failed',
        success: false,
      };
    }
  }

  /**
   * Search materials by title, category, or tags
   */
  async searchMaterials(query: string, category?: MaterialCategory): Promise<ApiResponse<Material[]>> {
    try {
      let queryBuilder = supabase
        .from('materials')
        .select('*')
        .eq('is_public', true);

      if (category) {
        queryBuilder = queryBuilder.eq('category', category);
      }

      const { data, error } = await queryBuilder
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: data || [], error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Material search failed',
        success: false,
      };
    }
  }

  /**
   * Update material download count
   */
  async updateDownloadCount(materialId: string): Promise<ApiResponse<Material>> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('download_count')
        .eq('id', materialId)
        .single();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      const currentCount = data.download_count || 0;

      const { data: updatedData, error: updateError } = await supabase
        .from('materials')
        .update({ 
          download_count: currentCount + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', materialId)
        .select()
        .single();

      if (updateError) {
        return { data: null, error: updateError.message, success: false };
      }

      return { data: updatedData, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Download count update failed',
        success: false,
      };
    }
  }

  /**
   * Delete a material
   */
  async deleteMaterial(materialId: string, userId: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', materialId)
        .eq('user_id', userId);

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: null, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Material deletion failed',
        success: false,
      };
    }
  }

  /**
   * Get user statistics (materials count, downloads, etc.)
   */
  async getUserStats(userId: string): Promise<ApiResponse<any>> {
    try {
      // Get user's materials count
      const { data: materialsData, error: materialsError } = await supabase
        .from('materials')
        .select('id, download_count')
        .eq('user_id', userId);

      if (materialsError) {
        return { data: null, error: materialsError.message, success: false };
      }

      const stats = {
        totalMaterials: materialsData?.length || 0,
        totalDownloads: materialsData?.reduce((sum, material) => sum + (material.download_count || 0), 0) || 0,
        averageDownloads: materialsData?.length ? 
          (materialsData.reduce((sum, material) => sum + (material.download_count || 0), 0) / materialsData.length).toFixed(1) : '0',
      };

      return { data: stats, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'User stats fetch failed',
        success: false,
      };
    }
  }

  // Future: AI Content Moderation
  /**
   * Placeholder for AI-powered content moderation
   * This would integrate with OpenAI or similar service to check uploaded content
   */
  async moderateContent(file: FileUpload): Promise<ApiResponse<boolean>> {
    // TODO: Implement AI content moderation
    // - Extract text from PDF/DOC files
    // - Send to AI service for content analysis
    // - Check for inappropriate content, academic integrity
    // - Categorize content automatically
    
    try {
      // Placeholder logic - always approve for now
      return { data: true, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Content moderation failed',
        success: false,
      };
    }
  }

  /**
   * Add a material to bookmarks
   */
  async addBookmark(userId: string, materialId: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .insert([{
          user_id: userId,
          material_id: materialId,
          page_number: 1, // Default to page 1 since page_number is required
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to add bookmark',
        success: false,
      };
    }
  }

  /**
   * Remove a material from bookmarks
   */
  async removeBookmark(userId: string, materialId: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('material_id', materialId);

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: null, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to remove bookmark',
        success: false,
      };
    }
  }

  /**
   * Get all bookmarked materials for a user
   */
  async getBookmarkedMaterials(userId: string): Promise<ApiResponse<Material[]>> {
    try {
      console.log('Getting bookmarked materials for user:', userId);
      
      // First get bookmark entries
      const { data: bookmarks, error: bookmarkError } = await supabase
        .from('bookmarks')
        .select('material_id')
        .eq('user_id', userId);

      if (bookmarkError) {
        console.error('Error fetching bookmarks:', bookmarkError.message);
        return { data: null, error: bookmarkError.message, success: false };
      }

      console.log('Bookmarks found:', bookmarks?.length || 0);
      
      if (!bookmarks || bookmarks.length === 0) {
        return { data: [], error: null, success: true };
      }

      // Get the actual materials using the material_ids
      const materialIds = bookmarks.map(bookmark => bookmark.material_id);
      console.log('Material IDs from bookmarks:', materialIds);
      
      const { data: materials, error: materialsError } = await supabase
        .from('materials')
        .select('*')
        .in('id', materialIds);

      if (materialsError) {
        console.error('Error fetching bookmarked materials:', materialsError.message);
        return { data: null, error: materialsError.message, success: false };
      }

      console.log('Bookmarked materials found:', materials?.length || 0);
      
      // Mark all returned materials as bookmarked
      const bookmarkedMaterials = materials.map(material => ({
        ...material,
        is_bookmarked: true
      }));

      return { data: bookmarkedMaterials || [], error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get bookmarked materials',
        success: false,
      };
    }
  }

  /**
   * Check if a material is bookmarked by the user
   */
  async isBookmarked(userId: string, materialId: string): Promise<ApiResponse<boolean>> {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('material_id', materialId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is 'no rows returned'
        return { data: null, error: error.message, success: false };
      }

      return { data: !!data, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to check bookmark status',
        success: false,
      };
    }
  }

  // Future: AI Suggestions
  /**
   * Placeholder for AI-powered study material suggestions
   */
  async getAISuggestions(userId: string, currentMaterialId?: string): Promise<ApiResponse<Material[]>> {
    // TODO: Implement AI-powered suggestions
    // - Analyze user's study history
    // - Find related materials based on content similarity
    // - Use collaborative filtering
    // - Integrate with OpenAI for semantic understanding
    
    try {
      // Placeholder: return random materials for now
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('is_public', true)
        .limit(5);

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: data || [], error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'AI suggestions failed',
        success: false,
      };
    }
  }
}

// Create and export a singleton instance
export const supabaseService = new SupabaseService();

// Export auth state change listener helper
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  if (!supabase || typeof supabase.auth === 'undefined') {
    console.warn('Supabase auth not available for state change listener');
    return {
      subscription: {
        unsubscribe: () => console.log('Mock unsubscribe called')
      }
    };
  }
  return supabase.auth.onAuthStateChange(callback);
};

export default supabaseService;
