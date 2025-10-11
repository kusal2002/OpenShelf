/**
 * AI Chatbot Screen Component
 * AI-powered educational content generation with chat interface
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { supabaseService } from '../services/supabase';
import { MainTabParamList } from '../types';
import { THEME_COLORS, UI_CONSTANTS } from '../utils';

type Props = NativeStackScreenProps<MainTabParamList, 'AIChatbot'>;

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AIChatbotScreen = ({ navigation: _navigation }: Props) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const loadChatHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('ai_chat_history');
      if (history) {
        setChatHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const loadMessages = useCallback(async () => {
    try {
      const savedMessages = await AsyncStorage.getItem('ai_chat_messages');
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(parsedMessages);
      } else {
        // Add welcome message
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          role: 'assistant',
          content: 'Hello! I\'m your AI educational assistant. I can help you with:\n\n📚 Study guides and explanations\n📝 Essay writing and research\n🔬 Science concepts\n📊 Math problems\n📖 Literature analysis\n🎓 Exam preparation\n\nWhat would you like to learn about today?',
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
        saveMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, []);

  // Load chat history on component mount
  useEffect(() => {
    loadChatHistory();
    loadMessages();
  }, [loadMessages]);

  const saveMessages = async (messagesToSave: ChatMessage[]) => {
    try {
      await AsyncStorage.setItem('ai_chat_messages', JSON.stringify(messagesToSave));
    } catch (error) {
      console.error('Failed to save messages:', error);
    }
  };

  const saveToHistory = async (query: string) => {
    try {
      const updatedHistory = [query, ...chatHistory.filter(h => h !== query)].slice(0, 10);
      setChatHistory(updatedHistory);
      await AsyncStorage.setItem('ai_chat_history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to save to history:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    // Save to history
    await saveToHistory(inputMessage.trim());

    try {
      const aiResponse = await supabaseService.generateAIContent(inputMessage.trim());

      if (!aiResponse.success) {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Sorry, I encountered an error: ${aiResponse.error}`,
          timestamp: new Date()
        };
        const finalMessages = [...updatedMessages, errorMessage];
        setMessages(finalMessages);
        saveMessages(finalMessages);
        return;
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.data || 'I apologize, but I couldn\'t generate a response.',
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      saveMessages(finalMessages);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('AI generation error:', error);
      Alert.alert('Error', 'Failed to generate AI response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveAsPDF = async (content: string, title: string) => {
    try {
      // For now, we'll use a simple text-based PDF approach
      // In a real implementation, you'd use a proper PDF library
      const pdfContent = `
${title}

Generated on: ${new Date().toLocaleDateString()}

${content}
      `;

      const fileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.txt`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

      await RNFS.writeFile(filePath, pdfContent, 'utf8');

      Alert.alert(
        'Document Saved',
        `Document saved as ${fileName} in your documents folder.`,
        [
          { text: 'OK' },
          {
            text: 'Share',
            onPress: async () => {
              try {
                await Share.share({
                  url: `file://${filePath}`,
                  title: title,
                });
              } catch (error) {
                console.error('Share error:', error);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('PDF save error:', error);
      Alert.alert('Error', 'Failed to save document. Please try again.');
    }
  };

  const clearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const welcomeMessage: ChatMessage = {
              id: 'welcome',
              role: 'assistant',
              content: 'Hello! I\'m your AI educational assistant. What would you like to learn about today?',
              timestamp: new Date()
            };
            setMessages([welcomeMessage]);
            saveMessages([welcomeMessage]);
            await AsyncStorage.removeItem('ai_chat_messages');
          }
        }
      ]
    );
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[
      styles.messageContainer,
      item.role === 'user' ? styles.userMessage : styles.assistantMessage
    ]}>
      <View style={styles.messageHeader}>
        <Text style={styles.messageRole}>
          {item.role === 'user' ? 'You' : 'AI Assistant'}
        </Text>
        <Text style={styles.messageTime}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      <Text style={styles.messageContent}>{item.content}</Text>

      {item.role === 'assistant' && item.content.length > 100 && (
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => saveAsPDF(item.content, `AI_Generated_Content_${item.id}`)}
        >
          <Text style={styles.saveButtonText}>💾 Save as Document</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderQuickPrompt = (prompt: string) => (
    <TouchableOpacity
      style={styles.quickPrompt}
      onPress={() => setInputMessage(prompt)}
    >
      <Text style={styles.quickPromptText}>{prompt}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Study Assistant</Text>
          <TouchableOpacity style={styles.clearButton} onPress={clearChat}>
            <Text style={styles.clearButtonText}>🗑️ Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Prompts */}
        {messages.length === 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickPromptsContainer}
            contentContainerStyle={styles.quickPromptsContent}
          >
            {[
              'Explain photosynthesis step by step',
              'Write an essay on climate change',
              'Solve this math problem: 2x + 3 = 7',
              'Summarize Romeo and Juliet',
              'Create a study guide for biology',
            ].map((prompt, index) => (
              <View key={index}>
                {renderQuickPrompt(prompt)}
              </View>
            ))}
          </ScrollView>
        )}

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={THEME_COLORS.primary} />
            <Text style={styles.loadingText}>AI is thinking...</Text>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder="Ask me anything about your studies..."
            placeholderTextColor={THEME_COLORS.textTertiary}
            multiline
            maxLength={1000}
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputMessage.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
          >
            <Text style={styles.sendButtonText}>
              {isLoading ? '⏳' : '📤'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: UI_CONSTANTS.spacing.md,
    paddingVertical: UI_CONSTANTS.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.outline,
    backgroundColor: THEME_COLORS.surface,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
  },
  clearButton: {
    padding: UI_CONSTANTS.spacing.sm,
  },
  clearButtonText: {
    fontSize: 16,
    color: THEME_COLORS.error,
  },
  quickPromptsContainer: {
    maxHeight: 60,
    backgroundColor: THEME_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.outline,
  },
  quickPromptsContent: {
    paddingHorizontal: UI_CONSTANTS.spacing.md,
    paddingVertical: UI_CONSTANTS.spacing.sm,
    gap: UI_CONSTANTS.spacing.sm,
  },
  quickPrompt: {
    backgroundColor: THEME_COLORS.primary + '20',
    paddingHorizontal: UI_CONSTANTS.spacing.md,
    paddingVertical: UI_CONSTANTS.spacing.sm,
    borderRadius: UI_CONSTANTS.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME_COLORS.primary,
  },
  quickPromptText: {
    fontSize: 14,
    color: THEME_COLORS.primary,
    fontWeight: '500',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: UI_CONSTANTS.spacing.md,
    paddingBottom: UI_CONSTANTS.spacing.xl,
  },
  messageContainer: {
    marginBottom: UI_CONSTANTS.spacing.md,
    padding: UI_CONSTANTS.spacing.md,
    borderRadius: UI_CONSTANTS.borderRadius.md,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: THEME_COLORS.primary,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: THEME_COLORS.surface,
    borderWidth: 1,
    borderColor: THEME_COLORS.outline,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UI_CONSTANTS.spacing.sm,
  },
  messageRole: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME_COLORS.textSecondary,
  },
  messageTime: {
    fontSize: 10,
    color: THEME_COLORS.textTertiary,
  },
  messageContent: {
    fontSize: 16,
    color: THEME_COLORS.text,
    lineHeight: 22,
  },
  saveButton: {
    marginTop: UI_CONSTANTS.spacing.sm,
    padding: UI_CONSTANTS.spacing.sm,
    backgroundColor: THEME_COLORS.success + '20',
    borderRadius: UI_CONSTANTS.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  saveButtonText: {
    fontSize: 12,
    color: THEME_COLORS.success,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: UI_CONSTANTS.spacing.md,
  },
  loadingText: {
    marginLeft: UI_CONSTANTS.spacing.sm,
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: UI_CONSTANTS.spacing.md,
    backgroundColor: THEME_COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: THEME_COLORS.outline,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    padding: UI_CONSTANTS.spacing.md,
    backgroundColor: THEME_COLORS.background,
    borderRadius: UI_CONSTANTS.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME_COLORS.outline,
    fontSize: 16,
    color: THEME_COLORS.text,
    marginRight: UI_CONSTANTS.spacing.sm,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: THEME_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: THEME_COLORS.disabled,
  },
  sendButtonText: {
    fontSize: 20,
  },
});

export default AIChatbotScreen;
