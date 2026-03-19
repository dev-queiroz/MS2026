import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Markdown from "react-native-markdown-display";
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
import { useSettings } from "@/contexts/SettingsContext";

const SYSTEM_PROMPT = `Responda sempre em markdown limpo: use apenas parágrafos, listas com - ou números. Sem **negrito**, sem ### headings, sem tabelas. Seja direto e útil.`;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

let cnt = 0;
function uid() { cnt++; return `m-${Date.now()}-${cnt}`; }

const QUICK_PROMPTS = [
  "Como conseguir meu primeiro freela?",
  "Salários dev junior em Londres",
  "Global Talent Visa UK",
  "Plano de treino bodyweight",
  "Cotação do dólar e libra",
];

const mdStyles = StyleSheet.create({
  body: { color: Colors.text, fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21 },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  list_item: { marginVertical: 2 },
  paragraph: { marginVertical: 4 },
});

function TypingIndicator() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN(x => (x + 1) % 4), 400);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={[styles.bubble, styles.assistantBubble]}>
      <View style={styles.typingRow}>
        {[0, 1, 2].map(i => (
          <View key={i} style={[styles.typingDot, n > i && styles.typingDotOn]} />
        ))}
      </View>
    </View>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
      {!isUser && (
        <View style={styles.aiAvatar}>
          <Feather name="cpu" size={13} color={Colors.accent} />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble, { maxWidth: "82%" }]}>
        {isUser ? (
          <Text style={styles.userBubbleText}>{msg.content}</Text>
        ) : (
          <Markdown style={mdStyles}>{msg.content}</Markdown>
        )}
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ initialMessage?: string }>();
  const { groqApiKey, groqModel } = useSettings();
  const isWeb = Platform.OS === "web";

  const [messages, setMessages] = useState<Message[]>([
    {
      id: uid(),
      role: "assistant",
      content: "Olá, Douglas!\n\nSou sua IA pessoal. Posso te ajudar com programação, carreira, inglês, saúde, finanças e seu caminho para Londres.\n\nO que você quer saber?",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const initRef = useRef(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem("chat_history").then(val => {
      if (val) {
        try {
          const parsed = JSON.parse(val);
          if (parsed.length > 0) setMessages(parsed);
        } catch {}
      }
      loadedRef.current = true;
      if (params.initialMessage && !initRef.current) {
        initRef.current = true;
        setTimeout(() => handleSend(params.initialMessage!), 600);
      }
    });
  }, []);

  useEffect(() => {
    if (loadedRef.current) {
      AsyncStorage.setItem("chat_history", JSON.stringify(messages)).catch(() => {});
    }
  }, [messages]);

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;
    if (!text) setInput("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const history = [...messages];
    const userMsg: Message = { id: uid(), role: "user", content: msg };
    setMessages(prev => [...prev, userMsg]);
    setStreaming(true);
    setShowTyping(true);

    if (!groqApiKey) {
      setShowTyping(false);
      setMessages(prev => [...prev, {
        id: uid(),
        role: "assistant",
        content: "API Key do Groq não configurada. Vá em Configurações (ícone ⚙️ no dashboard) e insira sua chave gratuita de console.groq.com",
      }]);
      setStreaming(false);
      return;
    }

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: groqModel,
          stream: false,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...history.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: msg },
          ],
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err);
      }

      const json = await response.json();
      const content = json.choices?.[0]?.message?.content || "";
      
      setShowTyping(false);
      
      // Simulate typing effect for UX
      const msgId = uid();
      setMessages(prev => [...prev, { id: msgId, role: "assistant", content: "" }]);
      
      let currentContent = "";
      const chunks = content.split(" ");
      for (let i = 0; i < chunks.length; i++) {
        currentContent += (i > 0 ? " " : "") + chunks[i];
        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx].id === msgId) {
            updated[lastIdx] = { ...updated[lastIdx], content: currentContent };
          }
          return updated;
        });
        await new Promise(r => setTimeout(r, 20)); // typing speed
      }
      
    } catch (e: any) {
      setShowTyping(false);
      setMessages(prev => [...prev, {
        id: uid(),
        role: "assistant",
        content: `Erro ao chamar a API Groq. Verifique sua API Key nas Configurações.\n\nDetalhe: ${e.message}`,
      }]);
    } finally {
      setStreaming(false);
      setShowTyping(false);
    }
  }

  const reversed = [...messages].reverse();

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: Colors.background }]}
      behavior="padding"
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (isWeb ? 67 : 0) + 8 }]}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <Feather name="chevron-down" size={22} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={[styles.statusDot, !groqApiKey && { backgroundColor: Colors.red }]} />
          <Text style={styles.headerTitle}>IA Pessoal</Text>
          {!groqApiKey && <Text style={styles.noKeyHint}>sem API Key</Text>}
        </View>
        <Pressable style={styles.iconBtn} onPress={() => {
          setMessages([{ id: uid(), role: "assistant", content: "Conversa reiniciada! Como posso te ajudar?" }]);
        }}>
          <Feather name="refresh-cw" size={16} color={Colors.textSecondary} />
        </Pressable>
      </View>

      {/* Messages */}
      <FlatList
        data={reversed}
        keyExtractor={m => m.id}
        renderItem={({ item }) => <MessageBubble msg={item} />}
        inverted={messages.length > 0}
        ListHeaderComponent={showTyping ? <TypingIndicator /> : null}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.msgList}
        showsVerticalScrollIndicator={false}
      />

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <FlatList
          horizontal
          data={QUICK_PROMPTS}
          keyExtractor={i => i}
          renderItem={({ item }) => (
            <Pressable style={styles.quickChip} onPress={() => handleSend(item)}>
              <Text style={styles.quickChipText}>{item}</Text>
            </Pressable>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickList}
          style={styles.quickListWrap}
        />
      )}

      {/* Input */}
      <View style={[styles.inputWrap, { paddingBottom: insets.bottom + (isWeb ? 34 : 0) + 8 }]}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Pergunte qualquer coisa..."
          placeholderTextColor={Colors.textTertiary}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={2000}
          returnKeyType="send"
          onSubmitEditing={() => handleSend()}
        />
        <Pressable
          style={[styles.sendBtn, (!input.trim() || streaming) && styles.sendBtnOff]}
          onPress={() => handleSend()}
          disabled={!input.trim() || streaming}
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
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 8, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  iconBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.green },
  headerTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.text },
  noKeyHint: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.red },
  msgList: { paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  msgRowUser: { flexDirection: "row-reverse", alignSelf: "flex-end" },
  aiAvatar: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.accentDim, justifyContent: "center", alignItems: "center",
    marginBottom: 2,
  },
  bubble: {
    borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
  },
  userBubble: { backgroundColor: Colors.accent, borderBottomRightRadius: 4 },
  userBubbleText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#fff", lineHeight: 20 },
  assistantBubble: {
    backgroundColor: Colors.surfaceElevated,
    borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border,
  },
  typingRow: { flexDirection: "row", gap: 4, paddingVertical: 3, paddingHorizontal: 4 },
  typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.textTertiary },
  typingDotOn: { backgroundColor: Colors.accent },
  quickListWrap: { flexGrow: 0, borderTopWidth: 1, borderTopColor: Colors.border },
  quickList: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  quickChip: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 99,
    paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: Colors.border,
  },
  quickChipText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  inputWrap: {
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    paddingHorizontal: 14, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1, backgroundColor: Colors.surfaceElevated, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    color: Colors.text, fontFamily: "Inter_400Regular", fontSize: 14,
    maxHeight: 120, borderWidth: 1, borderColor: Colors.border,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.accent, justifyContent: "center", alignItems: "center",
  },
  sendBtnOff: { backgroundColor: Colors.accentDim, opacity: 0.5 },
});
