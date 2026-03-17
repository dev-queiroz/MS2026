import { Feather } from "@expo/vector-icons";
import { fetch } from "expo/fetch";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { getApiUrl } from "@/lib/query-client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

let msgCounter = 0;
function genId(): string {
  msgCounter++;
  return `msg-${Date.now()}-${msgCounter}-${Math.random().toString(36).substr(2, 9)}`;
}

const QUICK_PROMPTS = [
  "Como fazer meu primeiro freela?",
  "Salário dev junior em Londres",
  "Plano de treino bodyweight",
  "Global Talent Visa UK",
  "Cotação dólar/libra hoje",
];

function TypingIndicator() {
  const [dot, setDot] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDot(d => (d + 1) % 4), 400);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={styles.assistantBubble}>
      <View style={styles.typingDots}>
        {[0, 1, 2].map(i => (
          <View key={i} style={[styles.typingDot, dot > i && styles.typingDotActive]} />
        ))}
      </View>
    </View>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
      {!isUser && (
        <View style={styles.assistantAvatar}>
          <Feather name="cpu" size={14} color={Colors.accent} />
        </View>
      )}
      <View style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.assistantBubble,
      ]}>
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ initialMessage?: string }>();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: genId(),
      role: "assistant",
      content: "Olá, Douglas! 👋 Sou sua IA pessoal. Posso te ajudar com:\n\n• Programação e carreira dev\n• Seu caminho para Londres\n• Freelas e primeiro cliente\n• Treino e saúde\n• Finanças e cotações\n• Qualquer dúvida!\n\nO que você quer saber?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (params.initialMessage && !initializedRef.current) {
      initializedRef.current = true;
      setTimeout(() => handleSend(params.initialMessage!), 500);
    }
  }, []);

  async function handleSend(text?: string) {
    const msg = (text || input).trim();
    if (!msg || isStreaming) return;

    if (!text) setInput("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const currentMessages = [...messages];
    const userMsg: Message = { id: genId(), role: "user", content: msg };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);
    setShowTyping(true);

    try {
      const baseUrl = getApiUrl();
      const chatHistory = [
        ...currentMessages.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: msg },
      ];

      const response = await fetch(`${baseUrl}chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/event-stream",
        },
        body: JSON.stringify({ messages: chatHistory }),
      });

      if (!response.ok) throw new Error("Falha ao conectar");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Sem resposta");

      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";
      let assistantAdded = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullContent += parsed.content;

              if (!assistantAdded) {
                setShowTyping(false);
                setMessages(prev => [...prev, {
                  id: genId(),
                  role: "assistant",
                  content: fullContent,
                }]);
                assistantAdded = true;
              } else {
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: fullContent,
                  };
                  return updated;
                });
              }
            }
          } catch {}
        }
      }
    } catch (error) {
      setShowTyping(false);
      setMessages(prev => [...prev, {
        id: genId(),
        role: "assistant",
        content: "Desculpe, ocorreu um erro. Verifique sua conexão e tente novamente.",
      }]);
    } finally {
      setIsStreaming(false);
      setShowTyping(false);
    }
  }

  const reversedMessages = [...messages].reverse();
  const isWeb = Platform.OS === "web";

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: Colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (isWeb ? 67 : 0) + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="chevron-down" size={22} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.aiDot} />
          <Text style={styles.headerTitle}>IA Pessoal</Text>
        </View>
        <Pressable
          style={styles.clearBtn}
          onPress={() => {
            setMessages([{
              id: genId(),
              role: "assistant",
              content: "Conversa reiniciada! Como posso te ajudar, Douglas?",
            }]);
          }}
        >
          <Feather name="refresh-cw" size={16} color={Colors.textSecondary} />
        </Pressable>
      </View>

      {/* Messages */}
      <FlatList
        data={reversedMessages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        inverted={messages.length > 0}
        ListHeaderComponent={showTyping ? <TypingIndicator /> : null}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
      />

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <FlatList
          horizontal
          data={QUICK_PROMPTS}
          keyExtractor={i => i}
          renderItem={({ item }) => (
            <Pressable style={styles.quickPrompt} onPress={() => handleSend(item)}>
              <Text style={styles.quickPromptText}>{item}</Text>
            </Pressable>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickPromptsContainer}
          style={styles.quickPromptsList}
        />
      )}

      {/* Input */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + (isWeb ? 34 : 0) + 8 }]}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Pergunte qualquer coisa..."
          placeholderTextColor={Colors.textTertiary}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={2000}
          blurOnSubmit={false}
          returnKeyType="send"
          onSubmitEditing={() => handleSend()}
        />
        <Pressable
          style={[styles.sendBtn, (!input.trim() || isStreaming) && styles.sendBtnDisabled]}
          onPress={() => {
            handleSend();
            inputRef.current?.focus();
          }}
          disabled={!input.trim() || isStreaming}
        >
          <Feather name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  aiDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.green },
  headerTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.text },
  clearBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  messageList: { padding: 16, gap: 12 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: "90%" },
  messageRowUser: { alignSelf: "flex-end", flexDirection: "row-reverse" },
  assistantAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.accentDim,
    justifyContent: "center", alignItems: "center",
    marginBottom: 2,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: "100%",
  },
  userBubble: { backgroundColor: Colors.accent, borderBottomRightRadius: 4 },
  assistantBubble: {
    backgroundColor: Colors.surfaceElevated,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bubbleText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    lineHeight: 20,
  },
  bubbleTextUser: { color: "#fff" },
  typingDots: { flexDirection: "row", gap: 4, paddingVertical: 2, paddingHorizontal: 4 },
  typingDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.textTertiary },
  typingDotActive: { backgroundColor: Colors.accent },
  quickPromptsList: { flexGrow: 0, borderTopWidth: 1, borderTopColor: Colors.border },
  quickPromptsContainer: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  quickPrompt: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 99, paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: Colors.border,
  },
  quickPromptText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: Colors.text,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.accent,
    justifyContent: "center", alignItems: "center",
  },
  sendBtnDisabled: { backgroundColor: Colors.accentDim, opacity: 0.5 },
});
