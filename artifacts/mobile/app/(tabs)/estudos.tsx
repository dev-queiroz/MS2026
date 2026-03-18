import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useAppData, type Goal } from "@/contexts/AppDataContext";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

/* ─── Pomodoro Timer ─── */
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
  const accent = mode === "pomodoro" ? Colors.red : Colors.green;

  return (
    <Card style={styles.pomodoroCard}>
      <View style={styles.modeRow}>
        {[
          { key: "pomodoro", label: "Foco" },
          { key: "short", label: "Pausa curta" },
          { key: "long", label: "Pausa longa" },
        ].map(m => (
          <Pressable
            key={m.key}
            style={[styles.modeBtn, mode === m.key && { backgroundColor: accent + "33" }]}
            onPress={() => switchMode(m.key as any)}
          >
            <Text style={[styles.modeBtnText, mode === m.key && { color: accent }]}>{m.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.timerText, { color: accent }]}>{mins}:{secs}</Text>
      <ProgressBar value={progress} max={100} color={accent} height={4} style={styles.timerProgress} />

      <View style={styles.timerActions}>
        <Pressable
          style={[styles.timerBtn, { backgroundColor: accent }]}
          onPress={() => {
            setRunning(r => !r);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
        >
          <Feather name={running ? "pause" : "play"} size={22} color="#fff" />
          <Text style={styles.timerBtnText}>{running ? "Pausar" : "Iniciar"}</Text>
        </Pressable>
        <Pressable
          style={styles.timerResetBtn}
          onPress={() => { setRunning(false); setSeconds(totalSeconds); }}
        >
          <Feather name="refresh-cw" size={18} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <Text style={styles.sessionsText}>{sessions} sessões hoje</Text>
    </Card>
  );
}

/* ─── Goal SMART Form ─── */
// Sugestões Removidas: exibidas apenas como placeholder no form

const CORES_GOAL = ["#4F7FFF", "#9C6FFF", "#00BCD4", "#FFB347", "#4CAF50", "#FF7043", "#E91E8C", "#F5C518"];

function AddGoalModal({ onClose }: { onClose: () => void }) {
  const { addGoal } = useAppData();
  const [titulo, setTitulo] = useState("");
  const [especifica, setEspecifica] = useState("");
  const [mensuravel, setMensuravel] = useState("");
  const [metrica, setMetrica] = useState("");
  const [metaNumerica, setMetaNumerica] = useState("100");
  const [alcancavel, setAlcancavel] = useState("");
  const [relevante, setRelevante] = useState("");
  const [prazo, setPrazo] = useState("");
  const [cor, setCor] = useState(CORES_GOAL[0]);
  const [step, setStep] = useState(0);
  const isWeb = Platform.OS === "web";

  const steps = [
    {
      field: "S — Específica",
      desc: "O que exatamente você quer alcançar?",
      value: especifica,
      set: setEspecifica,
    },
    {
      field: "M — Mensurável",
      desc: "Como você vai medir o progresso?",
      value: mensuravel,
      set: setMensuravel,
    },
    {
      field: "A — Alcançável",
      desc: "Como isso é alcançável para você?",
      value: alcancavel,
      set: setAlcancavel,
    },
    {
      field: "R — Relevante",
      desc: "Por que esse objetivo é importante para você?",
      value: relevante,
      set: setRelevante,
    },
    {
      field: "T — Temporizada",
      desc: "Prazo (ex: 2026-09-05)",
      value: prazo,
      set: setPrazo,
    },
  ];

  const handleSave = async () => {
    if (!titulo.trim()) return;
    await addGoal({
      titulo: titulo.trim(),
      especifica,
      mensuravel,
      metrica,
      metaNumerica: parseFloat(metaNumerica) || 100,
      valorAtual: 0,
      alcancavel,
      relevante,
      prazo: prazo || undefined,
      progresso: 0,
      cor,
    });
    onClose();
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalSheet, { paddingBottom: isWeb ? 40 : 34 }]} onPress={() => {}}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nova Meta SMART</Text>
            <Pressable onPress={onClose}>
              <Feather name="x" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>

          {/* Título */}
          <Text style={styles.fieldLabel}>Título da meta *</Text>
          <TextInput
            style={styles.addInput}
            placeholder="ex: Ficar fluente em inglês (B2/C1)"
            placeholderTextColor={Colors.textTertiary}
            value={titulo}
            onChangeText={setTitulo}
          />

          {/* Métrica */}
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Métrica</Text>
              <TextInput
                style={styles.addInputSmall}
                placeholder="ex: % progresso"
                placeholderTextColor={Colors.textTertiary}
                value={metrica}
                onChangeText={setMetrica}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.fieldLabel}>Meta numérica</Text>
              <TextInput
                style={styles.addInputSmall}
                placeholder="100"
                placeholderTextColor={Colors.textTertiary}
                value={metaNumerica}
                onChangeText={setMetaNumerica}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* SMART Steps */}
          {steps.map((s, i) => (
            <View key={i}>
              <Text style={styles.fieldLabel}>{s.field}</Text>
              <TextInput
                style={[styles.addInput, { minHeight: 48 }]}
                placeholder={s.desc}
                placeholderTextColor={Colors.textTertiary}
                value={s.value}
                onChangeText={s.set}
                multiline
              />
            </View>
          ))}

          {/* Cor */}
          <Text style={styles.fieldLabel}>Cor</Text>
          <View style={[styles.coresRow, { marginBottom: 16 }]}>
            {CORES_GOAL.map(c => (
              <Pressable
                key={c}
                style={[styles.corDot, { backgroundColor: c }, cor === c && styles.corDotSelected]}
                onPress={() => setCor(c)}
              />
            ))}
          </View>

          <Pressable style={styles.confirmBtn} onPress={handleSave}>
            <Text style={styles.confirmBtnText}>Criar Meta SMART</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function EditGoalModal({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const { updateGoal } = useAppData();
  const [titulo, setTitulo] = useState(goal.titulo);
  const [especifica, setEspecifica] = useState(goal.especifica);
  const [mensuravel, setMensuravel] = useState(goal.mensuravel);
  const [metrica, setMetrica] = useState(goal.metrica);
  const [metaNumerica, setMetaNumerica] = useState(goal.metaNumerica.toString());
  const [alcancavel, setAlcancavel] = useState(goal.alcancavel);
  const [relevante, setRelevante] = useState(goal.relevante);
  const [prazo, setPrazo] = useState(goal.prazo || "");
  const [cor, setCor] = useState(goal.cor);
  const isWeb = Platform.OS === "web";

  const steps = [
    { field: "S — Específica", value: especifica, set: setEspecifica },
    { field: "M — Mensurável", value: mensuravel, set: setMensuravel },
    { field: "A — Alcançável", value: alcancavel, set: setAlcancavel },
    { field: "R — Relevante", value: relevante, set: setRelevante },
    { field: "T — Temporizada", value: prazo, set: setPrazo },
  ];

  const handleSave = async () => {
    if (!titulo.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateGoal(goal.id, {
      titulo: titulo.trim(),
      especifica,
      mensuravel,
      metrica,
      metaNumerica: parseFloat(metaNumerica) || 100,
      alcancavel,
      relevante,
      prazo: prazo || undefined,
      cor,
    });
    onClose();
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalSheet, { paddingBottom: isWeb ? 40 : 34 }]} onPress={() => {}}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar Meta</Text>
            <Pressable onPress={onClose}>
              <Feather name="x" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>Título da meta *</Text>
            <TextInput
              style={styles.addInput}
              placeholder="ex: Morar em Londres como programador"
              placeholderTextColor={Colors.textTertiary}
              value={titulo}
              onChangeText={setTitulo}
            />
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Métrica</Text>
                <TextInput
                  style={styles.addInputSmall}
                  value={metrica}
                  onChangeText={setMetrica}
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.fieldLabel}>Meta numérica</Text>
                <TextInput
                  style={styles.addInputSmall}
                  value={metaNumerica}
                  onChangeText={setMetaNumerica}
                  keyboardType="decimal-pad"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
            </View>
            {steps.map((s, i) => (
              <View key={i}>
                <Text style={styles.fieldLabel}>{s.field}</Text>
                <TextInput
                  style={[styles.addInput, { minHeight: 48 }]}
                  value={s.value}
                  onChangeText={s.set}
                  multiline
                />
              </View>
            ))}
            <Text style={styles.fieldLabel}>Cor</Text>
            <View style={[styles.coresRow, { marginBottom: 16 }]}>
              {CORES_GOAL.map(c => (
                <Pressable
                  key={c}
                  style={[styles.corDot, { backgroundColor: c }, cor === c && styles.corDotSelected]}
                  onPress={() => setCor(c)}
                />
              ))}
            </View>
            <Pressable style={styles.confirmBtn} onPress={handleSave}>
              <Text style={styles.confirmBtnText}>Salvar Alterações</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const { updateGoal, deleteGoal, addMilestone, toggleMilestone, deleteMilestone } = useAppData();
  const [expanded, setExpanded] = useState(false);
  const [editingProgress, setEditingProgress] = useState(false);
  const [showEditGoal, setShowEditGoal] = useState(false);
  const [newProgress, setNewProgress] = useState(goal.progresso.toString());
  const [newMilestone, setNewMilestone] = useState("");

  const done = goal.milestones.filter(m => m.concluido).length;
  const total = goal.milestones.length;

  const progressCalc = total > 0
    ? Math.round((done / total) * 100)
    : goal.progresso;

  return (
    <Card style={styles.goalCard}>
      <Pressable onPress={() => setExpanded(e => !e)}>
        <View style={styles.goalHeader}>
          <View style={[styles.goalDot, { backgroundColor: goal.cor }]} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.goalTitulo}>{goal.titulo}</Text>
            {goal.prazo && (
              <Text style={styles.goalPrazo}>
                Meta: {new Date(goal.prazo + "T12:00:00").toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
              </Text>
            )}
          </View>
          <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
            <Pressable onPress={(e) => { e.stopPropagation?.(); setShowEditGoal(true); }}>
              <Feather name="edit-2" size={16} color={Colors.textTertiary} />
            </Pressable>
            <Feather name={expanded ? "chevron-up" : "chevron-down"} size={18} color={Colors.textSecondary} />
          </View>
        </View>

        <View style={styles.goalProgressRow}>
          <ProgressBar value={progressCalc} max={100} color={goal.cor} height={4} style={{ flex: 1 }} />
          <Pressable
            style={styles.progressPct}
            onPress={(e) => { e.stopPropagation?.(); setEditingProgress(true); }}
          >
            <Text style={[styles.progressPctText, { color: goal.cor }]}>{progressCalc}%</Text>
          </Pressable>
        </View>
        {total > 0 && (
          <Text style={styles.milestonesCount}>{done}/{total} milestones</Text>
        )}
      </Pressable>

      {editingProgress && (
        <View style={styles.editProgressRow}>
          <TextInput
            style={styles.progressInput}
            value={newProgress}
            onChangeText={setNewProgress}
            keyboardType="number-pad"
            autoFocus
          />
          <Text style={styles.progressInputPct}>%</Text>
          <Pressable style={styles.progressSaveBtn} onPress={async () => {
            await updateGoal(goal.id, { progresso: parseInt(newProgress) || 0 });
            setEditingProgress(false);
          }}>
            <Feather name="check" size={16} color="#fff" />
          </Pressable>
          <Pressable style={styles.progressCancelBtn} onPress={() => setEditingProgress(false)}>
            <Feather name="x" size={16} color={Colors.textSecondary} />
          </Pressable>
        </View>
      )}

      {expanded && (
        <View style={styles.goalDetails}>
          <View style={styles.divider} />
          {goal.especifica ? <View style={styles.smartRow}><Text style={styles.smartKey}>S</Text><Text style={styles.smartVal}>{goal.especifica}</Text></View> : null}
          {goal.mensuravel ? <View style={styles.smartRow}><Text style={styles.smartKey}>M</Text><Text style={styles.smartVal}>{goal.mensuravel}</Text></View> : null}
          {goal.alcancavel ? <View style={styles.smartRow}><Text style={styles.smartKey}>A</Text><Text style={styles.smartVal}>{goal.alcancavel}</Text></View> : null}
          {goal.relevante ? <View style={styles.smartRow}><Text style={styles.smartKey}>R</Text><Text style={styles.smartVal}>{goal.relevante}</Text></View> : null}

          {/* Milestones */}
          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Milestones</Text>
          {goal.milestones.map(m => (
            <View key={m.id} style={styles.milestoneItem}>
              <Pressable onPress={() => toggleMilestone(m.id)}>
                <View style={[styles.milestoneCb, m.concluido && { backgroundColor: goal.cor, borderColor: goal.cor }]}>
                  {m.concluido && <Feather name="check" size={11} color="#fff" />}
                </View>
              </Pressable>
              <Text style={[styles.milestoneText, m.concluido && styles.milestoneTextDone]}>
                {m.titulo}
              </Text>
              <Pressable onPress={() => deleteMilestone(m.id)}>
                <Feather name="x" size={14} color={Colors.textTertiary} />
              </Pressable>
            </View>
          ))}

          <View style={styles.addMilestoneRow}>
            <TextInput
              style={styles.milestoneInput}
              placeholder="Adicionar milestone..."
              placeholderTextColor={Colors.textTertiary}
              value={newMilestone}
              onChangeText={setNewMilestone}
            />
            <Pressable
              style={styles.milestoneAddBtn}
              onPress={async () => {
                if (newMilestone.trim()) {
                  await addMilestone(goal.id, newMilestone.trim());
                  setNewMilestone("");
                }
              }}
            >
              <Feather name="plus" size={16} color="#fff" />
            </Pressable>
          </View>

          <Pressable
            style={styles.deleteGoalBtn}
            onPress={() => {
              Alert.alert("Excluir meta", `Excluir "${goal.titulo}"?`, [
                { text: "Cancelar", style: "cancel" },
                { text: "Excluir", style: "destructive", onPress: () => deleteGoal(goal.id) },
              ]);
            }}
          >
            <Feather name="trash-2" size={14} color={Colors.red} />
            <Text style={styles.deleteGoalText}>Excluir meta</Text>
          </Pressable>
        </View>
      )}

      {showEditGoal && <EditGoalModal goal={goal} onClose={() => setShowEditGoal(false)} />}
    </Card>
  );
}

export default function EstudosScreen() {
  const insets = useSafeAreaInsets();
  const { goals } = useAppData();
  const [showAddGoal, setShowAddGoal] = useState(false);
  const isWeb = Platform.OS === "web";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + (isWeb ? 67 : 0) + 16, paddingBottom: 120 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.screenTitle}>Estudos</Text>

      {/* Pomodoro */}
      <Text style={styles.sectionLabel}>Pomodoro Timer</Text>
      <PomodoroTimer />

      {/* Goals SMART */}
      <View style={styles.goalsHeader}>
        <View>
          <Text style={styles.sectionLabel}>Metas SMART</Text>
          <Text style={styles.goalsSubtitle}>{goals.length} metas cadastradas</Text>
        </View>
        <Pressable style={styles.addGoalBtn} onPress={() => setShowAddGoal(true)}>
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.addGoalBtnText}>Nova meta</Text>
        </Pressable>
      </View>

      {goals.length === 0 && (
        <View style={styles.emptyState}>
          <Feather name="target" size={40} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>Nenhuma meta SMART</Text>
          <Text style={styles.emptyDesc}>
            Metas SMART são específicas, mensuráveis, alcançáveis, relevantes e temporizadas.
            Adicione sua primeira meta!
          </Text>
        </View>
      )}

      {goals.map(g => (
        <GoalCard key={g.id} goal={g} />
      ))}

      {showAddGoal && <AddGoalModal onClose={() => setShowAddGoal(false)} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16 },
  screenTitle: { fontSize: 28, fontFamily: "Inter_700Bold", color: Colors.text, marginBottom: 16 },
  sectionLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 10 },
  pomodoroCard: { marginBottom: 24 },
  modeRow: { flexDirection: "row", gap: 6, marginBottom: 20 },
  modeBtn: {
    flex: 1, paddingVertical: 7, borderRadius: 99,
    backgroundColor: Colors.surfaceElevated, alignItems: "center",
    borderWidth: 1, borderColor: Colors.border,
  },
  modeBtnText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  timerText: { fontSize: 64, fontFamily: "Inter_700Bold", textAlign: "center", letterSpacing: -2 },
  timerProgress: { marginVertical: 14 },
  timerActions: { flexDirection: "row", alignItems: "center", gap: 12, justifyContent: "center" },
  timerBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 28, paddingVertical: 12, borderRadius: 99,
  },
  timerBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  timerResetBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.surfaceElevated, justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: Colors.border,
  },
  sessionsText: { fontSize: 12, color: Colors.textTertiary, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 10 },
  goalsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 },
  goalsSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 1 },
  addGoalBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.accent, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7,
  },
  addGoalBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.text },
  emptyDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, textAlign: "center", paddingHorizontal: 20 },
  goalCard: { marginBottom: 10 },
  goalHeader: { flexDirection: "row", alignItems: "flex-start" },
  goalDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  goalTitulo: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  goalPrazo: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  goalProgressRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  progressPct: { minWidth: 40 },
  progressPctText: { fontSize: 13, fontFamily: "Inter_700Bold", textAlign: "right" },
  milestonesCount: { fontSize: 11, color: Colors.textTertiary, fontFamily: "Inter_400Regular", marginTop: 4 },
  editProgressRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  progressInput: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 8, paddingHorizontal: 10,
    paddingVertical: 6, color: Colors.text, fontFamily: "Inter_700Bold", fontSize: 18,
    width: 60, borderWidth: 1, borderColor: Colors.border,
  },
  progressInputPct: { fontSize: 16, color: Colors.textSecondary, fontFamily: "Inter_400Regular" },
  progressSaveBtn: { backgroundColor: Colors.green, borderRadius: 8, padding: 8 },
  progressCancelBtn: { borderRadius: 8, padding: 8 },
  goalDetails: { marginTop: 4 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  smartRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  smartKey: {
    width: 22, height: 22, borderRadius: 6,
    backgroundColor: Colors.accentDim, textAlign: "center", lineHeight: 22,
    fontSize: 11, fontFamily: "Inter_700Bold", color: Colors.accent, overflow: "hidden",
  },
  smartVal: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  milestoneItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  milestoneCb: {
    width: 18, height: 18, borderRadius: 5, borderWidth: 1.5,
    borderColor: Colors.textTertiary, justifyContent: "center", alignItems: "center",
  },
  milestoneText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.text },
  milestoneTextDone: { color: Colors.textTertiary, textDecorationLine: "line-through" },
  addMilestoneRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  milestoneInput: {
    flex: 1, backgroundColor: Colors.surfaceElevated, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, color: Colors.text,
    fontFamily: "Inter_400Regular", fontSize: 13,
    borderWidth: 1, borderColor: Colors.border,
  },
  milestoneAddBtn: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: Colors.accent, justifyContent: "center", alignItems: "center",
  },
  deleteGoalBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 12, justifyContent: "center" },
  deleteGoalText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.red },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "#0009", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: "90%", borderWidth: 1, borderColor: Colors.border,
  },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: "center", marginBottom: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.text },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary, marginBottom: 6 },
  addInput: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, color: Colors.text,
    fontFamily: "Inter_400Regular", fontSize: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  addInputSmall: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, color: Colors.text,
    fontFamily: "Inter_400Regular", fontSize: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  sugestaoChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99,
    backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border, marginRight: 6,
  },
  sugestaoText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  row2: { flexDirection: "row", marginBottom: 10 },
  coresRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  corDot: { width: 28, height: 28, borderRadius: 14 },
  corDotSelected: { borderWidth: 3, borderColor: "#fff" },
  confirmBtn: { backgroundColor: Colors.accent, borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  confirmBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
