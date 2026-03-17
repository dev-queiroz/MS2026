import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useAppData } from "@/contexts/AppDataContext";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

const POMODORO_MINUTES = 25;
const SHORT_BREAK = 5;
const LONG_BREAK = 15;

function PomodoroTimer() {
  const [mode, setMode] = useState<"pomodoro" | "short" | "long">("pomodoro");
  const [seconds, setSeconds] = useState(POMODORO_MINUTES * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = mode === "pomodoro" ? POMODORO_MINUTES * 60 : mode === "short" ? SHORT_BREAK * 60 : LONG_BREAK * 60;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            setRunning(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (mode === "pomodoro") setSessions(prev => prev + 1);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, mode]);

  const switchMode = (m: "pomodoro" | "short" | "long") => {
    setRunning(false);
    setMode(m);
    setSeconds(m === "pomodoro" ? POMODORO_MINUTES * 60 : m === "short" ? SHORT_BREAK * 60 : LONG_BREAK * 60);
  };

  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  const progress = ((totalSeconds - seconds) / totalSeconds) * 100;

  return (
    <Card style={styles.pomodoroCard}>
      <View style={styles.modeRow}>
        {(["pomodoro", "short", "long"] as const).map(m => (
          <Pressable
            key={m}
            style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
            onPress={() => switchMode(m)}
          >
            <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
              {m === "pomodoro" ? "Foco" : m === "short" ? "Pausa" : "Longo"}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.timerDisplay}>{mins}:{secs}</Text>
      <ProgressBar value={progress} max={100} color={Colors.accent} height={4} style={{ marginBottom: 16 }} />
      <View style={styles.timerControls}>
        <Pressable
          style={[styles.timerBtn, styles.timerBtnSecondary]}
          onPress={() => { setRunning(false); setSeconds(totalSeconds); }}
        >
          <Feather name="refresh-cw" size={18} color={Colors.textSecondary} />
        </Pressable>
        <Pressable
          style={[styles.timerBtn, styles.timerBtnPrimary]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setRunning(r => !r); }}
        >
          <Feather name={running ? "pause" : "play"} size={22} color="#fff" />
        </Pressable>
        <View style={styles.sessionsLabel}>
          <Text style={styles.sessionsCount}>{sessions}</Text>
          <Text style={styles.sessionsText}>🍅</Text>
        </View>
      </View>
    </Card>
  );
}

interface TrackerCardProps {
  tracker: ReturnType<typeof useAppData>["data"]["studyTrackers"][0];
  onToggleCheck: (id: string) => void;
}

function TrackerCard({ tracker, onToggleCheck }: TrackerCardProps) {
  const [expanded, setExpanded] = useState(false);
  const done = tracker.checklistDiario.filter(c => c.concluido).length;

  return (
    <Card style={[styles.trackerCard, { borderLeftColor: tracker.cor, borderLeftWidth: 3 }]}>
      <Pressable onPress={() => setExpanded(e => !e)} style={styles.trackerHeader}>
        <View style={[styles.trackerIcon, { backgroundColor: tracker.cor + "22" }]}>
          <Feather name={tracker.icon as any} size={18} color={tracker.cor} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.trackerName}>{tracker.nome}</Text>
          <Text style={styles.trackerDesc}>{tracker.descricao}</Text>
        </View>
        <View style={styles.trackerRight}>
          <Text style={[styles.trackerProgress, { color: tracker.cor }]}>
            {done}/{tracker.checklistDiario.length}
          </Text>
          <Feather name={expanded ? "chevron-up" : "chevron-down"} size={16} color={Colors.textSecondary} />
        </View>
      </Pressable>
      <ProgressBar value={done} max={tracker.checklistDiario.length} color={tracker.cor} height={3} style={{ marginTop: 10 }} />

      {expanded && (
        <View style={styles.checklist}>
          {tracker.checklistDiario.map(item => (
            <Pressable
              key={item.id}
              style={styles.checkItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggleCheck(item.id);
              }}
            >
              <View style={[styles.checkbox, item.concluido && { backgroundColor: tracker.cor, borderColor: tracker.cor }]}>
                {item.concluido && <Feather name="check" size={12} color="#fff" />}
              </View>
              <Text style={[styles.checkText, item.concluido && styles.checkTextDone]}>{item.texto}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </Card>
  );
}

export default function EstudosScreen() {
  const insets = useSafeAreaInsets();
  const { data, toggleCheckItem } = useAppData();
  const isWeb = Platform.OS === "web";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + (isWeb ? 67 : 0) + 16, paddingBottom: (isWeb ? 34 : 0) + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Estudos & Programação</Text>
      <Text style={styles.subtitle}>Java • TypeScript • Go • Inglês</Text>

      <View style={styles.githubCard}>
        <Feather name="github" size={20} color={Colors.text} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.githubTitle}>github.com/dev-queiroz</Text>
          <Text style={styles.githubSub}>Lembre de fazer um commit hoje!</Text>
        </View>
        <View style={[styles.commitDot, { backgroundColor: Colors.green }]} />
      </View>

      <Text style={styles.sectionLabel}>Pomodoro</Text>
      <PomodoroTimer />

      <Text style={styles.sectionLabel}>Trackers de Estudo</Text>
      {data.studyTrackers.map(t => (
        <TrackerCard
          key={t.id}
          tracker={t}
          onToggleCheck={(itemId) => toggleCheckItem(t.id, itemId)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular", marginBottom: 16, marginTop: 2 },
  githubCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.surfaceElevated, borderRadius: 12,
    padding: 14, marginBottom: 20, borderWidth: 1, borderColor: Colors.border,
  },
  githubTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  githubSub: { fontSize: 11, color: Colors.textSecondary, fontFamily: "Inter_400Regular", marginTop: 2 },
  commitDot: { width: 8, height: 8, borderRadius: 4 },
  sectionLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 12 },
  pomodoroCard: { marginBottom: 24, alignItems: "center" },
  modeRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  modeBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, backgroundColor: Colors.surfaceElevated },
  modeBtnActive: { backgroundColor: Colors.accent },
  modeBtnText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  modeBtnTextActive: { color: "#fff" },
  timerDisplay: { fontSize: 64, fontFamily: "Inter_700Bold", color: Colors.text, letterSpacing: 2, marginBottom: 16, alignSelf: "center" },
  timerControls: { flexDirection: "row", alignItems: "center", gap: 16, justifyContent: "center" },
  timerBtn: { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center" },
  timerBtnPrimary: { backgroundColor: Colors.accent, width: 64, height: 64, borderRadius: 32 },
  timerBtnSecondary: { backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  sessionsLabel: { alignItems: "center" },
  sessionsCount: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.text },
  sessionsText: { fontSize: 16 },
  trackerCard: { marginBottom: 10 },
  trackerHeader: { flexDirection: "row", alignItems: "center" },
  trackerIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  trackerName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  trackerDesc: { fontSize: 12, color: Colors.textSecondary, fontFamily: "Inter_400Regular" },
  trackerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  trackerProgress: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  checklist: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  checkItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 7 },
  checkbox: {
    width: 20, height: 20, borderRadius: 6, borderWidth: 1.5,
    borderColor: Colors.textTertiary, justifyContent: "center", alignItems: "center",
  },
  checkText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.text, flex: 1 },
  checkTextDone: { color: Colors.textTertiary, textDecorationLine: "line-through" },
});
