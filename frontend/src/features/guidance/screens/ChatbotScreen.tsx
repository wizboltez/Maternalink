import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Keyboard } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import Theme from '../../../core/theme/theme';
import { Heading, BodyText, Caption } from '../../../core/components/Typography';
import { useAuth } from '../../../core/context/AuthContext';
import guidanceApi, { ChatMessageResponse } from '../api/guidanceApi';
import { useMaternalHealth } from '../../maternal-health/hooks/useMaternalHealth';
import { SosButton } from '../../../core/components/SosButton';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export const ChatbotScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, profile } = useAuth();
  const { heartRate, spO2, temperature, stressScore } = useMaternalHealth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      text: "Hello! I'm your Maternalink AI assistant. I have access to your live health vitals. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    Keyboard.dismiss();

    try {
      const sensorData = {
        heartRate,
        spo2: spO2,
        temperature,
        stressScore,
        pregnancyWeek: profile?.pregnancyWeek,
      };

      const response = await guidanceApi.sendMessage({
        message: userMsg.text,
        sensorData,
      });

      if (response.success) {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            text: response.reply,
            isUser: false,
            timestamp: new Date(),
          }
        ]);
      } else {
        throw new Error('Failed response');
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "I'm sorry, I'm having trouble connecting to the server right now. Please try again later.",
          isUser: false,
          timestamp: new Date(),
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Heading style={styles.title}>AI Assistant</Heading>
        </View>
        <SosButton />
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
      >
        {messages.map(msg => (
          <View key={msg.id} style={[styles.messageBubble, msg.isUser ? styles.userBubble : styles.aiBubble]}>
            <BodyText style={[styles.messageText, msg.isUser ? styles.userText : styles.aiText]}>
              {msg.text}
            </BodyText>
            <Caption style={[styles.timestamp, msg.isUser ? styles.userTimestamp : styles.aiTimestamp]}>
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Caption>
          </View>
        ))}
        {isTyping && (
          <View style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}>
            <ActivityIndicator size="small" color={Theme.colors.primary} />
            <Caption style={styles.typingText}>Typing...</Caption>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Ask a question..."
          placeholderTextColor={Theme.colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isTyping}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Theme.spacing.xxl + 10,
    paddingBottom: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    backgroundColor: Theme.colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  backIcon: {
    fontSize: 24,
    color: Theme.colors.primary,
  },
  title: {
    color: Theme.colors.primaryDark,
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: Theme.spacing.lg,
    paddingBottom: 24,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Theme.colors.cardBackground,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Theme.colors.divider,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#FFF',
  },
  aiText: {
    color: Theme.colors.text,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  aiTimestamp: {
    color: Theme.colors.textMuted,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  typingText: {
    marginLeft: 8,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Theme.colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.divider,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  input: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    color: Theme.colors.text,
    borderWidth: 1,
    borderColor: Theme.colors.divider,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendBtnDisabled: {
    backgroundColor: Theme.colors.divider,
  },
  sendIcon: {
    color: '#FFF',
    fontSize: 16,
  },
});

export default ChatbotScreen;
