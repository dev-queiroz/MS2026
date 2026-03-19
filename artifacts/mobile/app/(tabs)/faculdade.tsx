import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState, useCallback } from "react";
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
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useAppData, type Materia, type Atividade, type FaltaRegistro } from "@/contexts/AppDataContext";
import { Card } from "@/components/ui/Card";

const CORES = ["#4F7FFF", "#9C6FFF", "#00BCD4", "#FFB347", "#4CAF50", "#FF7043", "#E91E8C", "#F5C518"];
const TIPOS_ATIVIDADE = ["atividade", "prova", "trabalho", "seminário", "projeto", "lista"];

// FaltasModal removed entirely in favor of inline buttons

function AtividadesModal({ materia, atividades, onClose }: {
  materia: Materia;
  atividades: Atividade[];
  onClose: () => void;
}) {
  const { addAtividade, updateAtividade, deleteAtividade } = useAppData();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("atividade");
  const [prazo, setPrazo] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const isWeb = Platform.OS === "web";

  const mAtividades = atividades.filter(a => a.materiaId === materia.id);

  const handleAdd = async () => {
    if (!titulo.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await addAtividade({
      materiaId: materia.id,
      titulo: titulo.trim(),
      tipo,
      prazo: prazo || undefined,
    });
    setTitulo(""); setPrazo(""); setAdding(false);
  };

  const handleEditInit = (a: Atividade) => {
    setTitulo(a.titulo);
    setTipo(a.tipo);
    setPrazo(a.prazo || "");
    setEditingId(a.id);
    setAdding(false);
  };

  const handleSaveEdit = async () => {
    if (!titulo.trim() || !editingId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateAtividade(editingId, {
      titulo: titulo.trim(),
      tipo,
      prazo: prazo || undefined,
    });
    setTitulo(""); setPrazo(""); setEditingId(null);
  };

  const handleDeleteAtividade = useCallback(async (id: string) => {
    Alert.alert("Excluir atividade", "Tem certeza disso?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => deleteAtividade(id) },
    ]);
  }, [deleteAtividade]);

  const STATUS_CYCLE: Record<string, string> = {
    pendente: "em andamento",
    "em andamento": "concluída",
    concluída: "pendente",
  };

  const STATUS_COLOR: Record<string, string> = {
    pendente: Colors.textTertiary,
    "em andamento": Colors.gold,
    concluída: Colors.green,
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalSheet, { paddingBottom: isWeb ? 40 : 34 }]} onPress={() => { }}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Atividades — {materia.nome}</Text>
            <Pressable onPress={onClose}>
              <Feather name="x" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={{ maxHeight: 360 }}>
            {mAtividades.length === 0 && !adding && !editingId && (
              <Text style={styles.emptyText}>Nenhuma atividade. Adicione abaixo.</Text>
            )}
            {mAtividades.map(a => (
              <View key={a.id} style={styles.ativItem}>
                <Pressable onPress={() => updateAtividade(a.id, { status: STATUS_CYCLE[a.status] || "pendente" })}
                  style={[styles.ativStatus, { backgroundColor: STATUS_COLOR[a.status] + "22" }]}>
                  <Text style={[styles.ativStatusText, { color: STATUS_COLOR[a.status] }]}>{a.status}</Text>
                </Pressable>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ativTitulo}>{a.titulo}</Text>
                  <Text style={styles.ativMeta}>
                    {a.tipo}
                    {a.prazo ? ` • ${new Date(a.prazo + "T12:00:00").toLocaleDateString("pt-BR")}` : ""}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Pressable onPress={() => handleEditInit(a)}>
                    <Feather name="edit-2" size={15} color={Colors.textTertiary} />
                  </Pressable>
                  <Pressable onPress={() => handleDeleteAtividade(a.id)}>
                    <Feather name="trash-2" size={15} color={Colors.textTertiary} />
                  </Pressable>
                </View>
              </View>
            ))}

            {(adding || editingId) ? (
              <View style={styles.addAtivForm}>
                <TextInput
                  style={styles.addInput}
                  placeholder="Título da atividade..."
                  placeholderTextColor={Colors.textTertiary}
                  value={titulo}
                  onChangeText={setTitulo}
                  autoFocus
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  {TIPOS_ATIVIDADE.map(t => (
                    <Pressable
                      key={t}
                      style={[styles.tipoChip, tipo === t && styles.tipoChipActive]}
                      onPress={() => setTipo(t)}
                    >
                      <Text style={[styles.tipoChipText, tipo === t && styles.tipoChipTextActive]}>{t}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Pressable onPress={() => setShowDatePicker(true)} style={styles.addInputDate}>
                  <Text style={{ color: prazo ? Colors.text : Colors.textTertiary }}>
                    {prazo ? new Date(prazo + "T12:00:00").toLocaleDateString("pt-BR") : "Prazo (Selecione a data)..."}
                  </Text>
                </Pressable>
                {showDatePicker && (
                  <DateTimePicker
                    value={prazo ? new Date(prazo + "T12:00:00") : new Date()}
                    mode="date"
                    display="default"
                    onChange={(e, date) => {
                      if (!isWeb) setShowDatePicker(false);
                      if (event?.type === "dismissed") { setShowDatePicker(false); return; }
                      if (date) setPrazo(date.toISOString().split("T")[0]);
                    }}
                  />
                )}

                <View style={styles.addAtivBtns}>
                  <Pressable style={styles.cancelBtn} onPress={() => { setAdding(false); setEditingId(null); }}>
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </Pressable>
                  <Pressable style={styles.confirmBtn} onPress={editingId ? handleSaveEdit : handleAdd}>
                    <Text style={styles.confirmBtnText}>{editingId ? "Salvar" : "Adicionar"}</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable style={styles.addAtivBtn} onPress={() => setAdding(true)}>
                <Feather name="plus" size={16} color={Colors.accent} />
                <Text style={styles.addAtivBtnText}>Nova atividade / prova</Text>
              </Pressable>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MateriaCard({ materia, atividades }: { materia: Materia; atividades: Atividade[] }) {
  const { updateMateria, deleteMateria, addFalta, removeFalta } = useAppData();
  const [showAtividades, setShowAtividades] = useState(false);

  const count = materia.faltasAtuais ?? 0;
  const faltasPercent = materia.maxFaltas > 0 ? count / materia.maxFaltas : 0;
  const statusColor = faltasPercent >= 1 ? Colors.red : faltasPercent >= 0.7 ? Colors.gold : Colors.green;
  const mAtividades = atividades.filter(a => a.materiaId === materia.id);
  const pendentes = mAtividades.filter(a => a.status === "pendente").length;
  const [showEdit, setShowEdit] = useState(false);

  return (
    <>
      <Card style={styles.materiaCard}>
        <View style={styles.materiaHeader}>
          <View style={[styles.materiaDot, { backgroundColor: materia.cor }]} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.materiaNome}>{materia.nome}</Text>
            <Text style={styles.materiaInfo}>
              {materia.semestre}º sem • máx {materia.maxFaltas} faltas
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 14 }}>
            <Pressable onPress={() => setShowEdit(true)}>
              <Feather name="edit-2" size={16} color={Colors.textTertiary} />
            </Pressable>
            <Pressable onPress={() => {
              Alert.alert("Excluir matéria", `Excluir "${materia.nome}"? Todas as faltas e atividades serão removidas.`, [
                { text: "Cancelar", style: "cancel" },
                { text: "Excluir", style: "destructive", onPress: () => deleteMateria(materia.id) },
              ]);
            }}>
              <Feather name="trash-2" size={16} color={Colors.textTertiary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.materiaStats}>
          {/* Faltas */}
          <View style={styles.faltasStat}>
            <View style={[styles.faltasBadge, { backgroundColor: statusColor + "22" }]}>
              <Text style={[styles.faltasCount, { color: statusColor }]}>{count}</Text>
            </View>
            <Text style={styles.faltasLabel}>/{materia.maxFaltas} faltas</Text>

            <View style={styles.faltaBtnsContainer}>
              <Pressable style={styles.faltaBtn} onPress={() => removeFalta(materia.id)}>
                <Feather name="minus" size={14} color={Colors.textSecondary} />
              </Pressable>
              <Pressable style={styles.faltaBtn} onPress={() => addFalta(materia.id)}>
                <Feather name="plus" size={14} color={Colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* Atividades */}
          <Pressable style={styles.ativStat} onPress={() => setShowAtividades(true)}>
            <Feather name="file-text" size={14} color={Colors.accent} />
            <Text style={styles.ativStatText}>
              {mAtividades.length} ativ.{pendentes > 0 ? ` (${pendentes} pend.)` : ""}
            </Text>
          </Pressable>
        </View>

        {pendentes > 0 && (
          <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border }}>
            <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 8 }}>
              Próximos prazos
            </Text>
            {mAtividades
              .filter(a => a.status !== "concluída" && a.prazo)
              .sort((a, b) => new Date(a.prazo!).getTime() - new Date(b.prazo!).getTime())
              .slice(0, 3)
              .map(a => {
                const dias = Math.ceil((new Date(a.prazo!).getTime() - Date.now()) / 86400000);
                const cor = dias <= 1 ? Colors.red : dias <= 5 ? Colors.gold : Colors.textSecondary;
                return (
                  <View key={a.id} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: materia.cor }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.text }}>{a.titulo}</Text>
                      <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary }}>{a.tipo}</Text>
                    </View>
                    <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: cor }}>
                      {dias <= 0 ? "Hoje" : `${dias}d`}
                    </Text>
                  </View>
                );
              })}
          </View>
        )}

        <View style={styles.materiaActions}>
          <Pressable style={[styles.actionBtn, { backgroundColor: Colors.accent }]} onPress={() => setShowAtividades(true)}>
            <Feather name="list" size={14} color="#fff" />
            <Text style={[styles.actionBtnText, { color: "#fff" }]}>Atividades   {pendentes > 0 ? `(${pendentes} pendentes)` : ''}</Text>
          </Pressable>
        </View>
      </Card>

      {showAtividades && (
        <AtividadesModal materia={materia} atividades={atividades} onClose={() => setShowAtividades(false)} />
      )}
      {showEdit && <EditMateriaModal materia={materia} onClose={() => setShowEdit(false)} />}
    </>
  );
}

function AddMateriaModal({ onClose }: { onClose: () => void }) {
  const { addMateria } = useAppData();
  const [nome, setNome] = useState("");
  const [semestre, setSemestre] = useState("1");
  const [maxFaltas, setMaxFaltas] = useState("2");
  const [cor, setCor] = useState(CORES[0]);
  const isWeb = Platform.OS === "web";

  const handleSave = async () => {
    if (!nome.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await addMateria({
      nome: nome.trim(),
      semestre: parseInt(semestre) || 1,
      maxFaltas: parseInt(maxFaltas) || 2,
      cor,
    });
    onClose();
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalSheet, { paddingBottom: isWeb ? 40 : 34 }]} onPress={() => { }}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nova Matéria</Text>
            <Pressable onPress={onClose}>
              <Feather name="x" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <TextInput
            style={styles.addInput}
            placeholder="Nome da matéria..."
            placeholderTextColor={Colors.textTertiary}
            value={nome}
            onChangeText={setNome}
            autoFocus
          />

          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Semestre</Text>
              <TextInput
                style={styles.addInputSmall}
                value={semestre}
                onChangeText={setSemestre}
                keyboardType="number-pad"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.fieldLabel}>Máx. faltas</Text>
              <TextInput
                style={styles.addInputSmall}
                value={maxFaltas}
                onChangeText={setMaxFaltas}
                keyboardType="number-pad"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
          </View>

          <Text style={[styles.fieldLabel, { marginBottom: 8 }]}>Cor</Text>
          <View style={styles.coresRow}>
            {CORES.map(c => (
              <Pressable
                key={c}
                style={[styles.corDot, { backgroundColor: c }, cor === c && styles.corDotSelected]}
                onPress={() => setCor(c)}
              />
            ))}
          </View>

          <Pressable style={[styles.confirmBtn, { marginTop: 16 }]} onPress={handleSave}>
            <Text style={styles.confirmBtnText}>Adicionar Matéria</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function EditMateriaModal({ materia, onClose }: { materia: Materia; onClose: () => void }) {
  const { updateMateria } = useAppData();
  const [nome, setNome] = useState(materia.nome);
  const [semestre, setSemestre] = useState(String(materia.semestre));
  const [maxFaltas, setMaxFaltas] = useState(String(materia.maxFaltas));
  const [cor, setCor] = useState(materia.cor);
  const isWeb = Platform.OS === "web";

  const handleSave = async () => {
    if (!nome.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateMateria(materia.id, {
      nome: nome.trim(),
      semestre: parseInt(semestre) || 1,
      maxFaltas: parseInt(maxFaltas) || 2,
      cor,
    });
    onClose();
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalSheet, { paddingBottom: isWeb ? 40 : 34 }]} onPress={() => { }}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar Matéria</Text>
            <Pressable onPress={onClose}>
              <Feather name="x" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <TextInput
            style={styles.addInput}
            placeholder="Nome da matéria..."
            placeholderTextColor={Colors.textTertiary}
            value={nome}
            onChangeText={setNome}
          />

          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Semestre</Text>
              <TextInput
                style={styles.addInputSmall}
                value={semestre}
                onChangeText={setSemestre}
                keyboardType="number-pad"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.fieldLabel}>Máx. faltas</Text>
              <TextInput
                style={styles.addInputSmall}
                value={maxFaltas}
                onChangeText={setMaxFaltas}
                keyboardType="number-pad"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
          </View>

          <Text style={[styles.fieldLabel, { marginBottom: 8 }]}>Cor</Text>
          <View style={styles.coresRow}>
            {CORES.map(c => (
              <Pressable
                key={c}
                style={[styles.corDot, { backgroundColor: c }, cor === c && styles.corDotSelected]}
                onPress={() => setCor(c)}
              />
            ))}
          </View>

          <Pressable style={[styles.confirmBtn, { marginTop: 16 }]} onPress={handleSave}>
            <Text style={styles.confirmBtnText}>Salvar Alterações</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function FaculdadeScreen() {
  const insets = useSafeAreaInsets();
  const { materias, atividades, loading } = useAppData();
  const [showAdd, setShowAdd] = useState(false);
  const isWeb = Platform.OS === "web";
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + (isWeb ? 67 : 0) + 16, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Faculdade</Text>
            <Text style={styles.subtitle}>{materias.length > 0 ? `${materias.length} matérias` : "UFC Quixadá"}</Text>
          </View>
          <Pressable style={styles.addMateriaBtn} onPress={() => setShowAdd(true)}>
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.addMateriaBtnText}>Matéria</Text>
          </Pressable>
        </View>

        {materias.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="book-open" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyStateTitle}>Nenhuma matéria</Text>
            <Text style={styles.emptyStateDesc}>
              Adicione suas matérias do semestre para controlar faltas e atividades.
            </Text>
            <Pressable style={styles.confirmBtn} onPress={() => setShowAdd(true)}>
              <Text style={styles.confirmBtnText}>Adicionar primeira matéria</Text>
            </Pressable>
          </View>
        )}

        {materias.map(m => (
          <MateriaCard key={m.id} materia={m} atividades={atividades} />
        ))}
      </ScrollView>

      {showAdd && <AddMateriaModal onClose={() => setShowAdd(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular", marginTop: 2 },
  addMateriaBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.accent, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  addMateriaBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  proximasSection: {
    backgroundColor: Colors.surface, borderRadius: 12,
    padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.border,
  },
  proximasTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 10 },
  proximaItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  proximaDot: { width: 8, height: 8, borderRadius: 4 },
  proximaTitulo: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.text },
  proximaMat: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  proximaDias: { fontSize: 13, fontFamily: "Inter_700Bold" },
  materiaCard: { marginBottom: 10 },
  materiaHeader: { flexDirection: "row", alignItems: "center" },
  materiaDot: { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  materiaNome: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  materiaInfo: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 1 },
  materiaStats: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 12 },
  faltasStat: { flexDirection: "row", alignItems: "center", gap: 6 },
  faltasBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  faltasCount: { fontSize: 16, fontFamily: "Inter_700Bold" },
  faltasLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  ativStat: { flexDirection: "row", alignItems: "center", gap: 6 },
  ativStatText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  materiaActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: Colors.surfaceElevated, borderRadius: 8, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  actionBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.text },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyStateTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: Colors.text },
  emptyStateDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, textAlign: "center", paddingHorizontal: 20 },
  emptyText: { fontSize: 13, color: Colors.textTertiary, fontFamily: "Inter_400Regular", textAlign: "center", padding: 16 },
  faltaBtnsContainer: { flexDirection: "row", marginLeft: 8, gap: 4 },
  faltaBtn: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.surfaceElevated,
    justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.border,
  },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "#0008", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, borderWidth: 1, borderColor: Colors.border,
  },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: "center", marginBottom: 16 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.text },
  faltasStatus: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 2 },
  faltasActions: { flexDirection: "row", gap: 10, marginBottom: 16 },
  faltaAddBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.red, borderRadius: 10, paddingVertical: 12,
  },
  faltaAddBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  faltaRemoveLastBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.surfaceElevated, borderRadius: 10, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  faltaRemoveLastBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.text },
  faltaItem: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  faltaItemText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.text },
  faltaDeleteBtn: { padding: 4 },
  ativItem: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  ativStatus: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  ativStatusText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  ativTitulo: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.text },
  ativMeta: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2, textTransform: "capitalize" },
  addAtivForm: { marginTop: 10 },
  addAtivBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 12, marginTop: 10,
    backgroundColor: Colors.surfaceElevated, borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
  },
  addAtivBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.accent },
  addAtivBtns: { flexDirection: "row", gap: 10, marginTop: 4 },
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
  addInputDate: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  tipoChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99,
    backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border, marginRight: 6,
  },
  tipoChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  tipoChipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary, textTransform: "capitalize" },
  tipoChipTextActive: { color: "#fff" },
  row2: { flexDirection: "row", marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary, marginBottom: 6 },
  coresRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  corDot: { width: 28, height: 28, borderRadius: 14 },
  corDotSelected: { borderWidth: 3, borderColor: "#fff" },
  cancelBtn: {
    flex: 1, backgroundColor: Colors.surfaceElevated, borderRadius: 10,
    paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: Colors.border,
  },
  cancelBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  confirmBtn: {
    flex: 1, backgroundColor: Colors.accent, borderRadius: 10,
    paddingVertical: 12, alignItems: "center",
  },
  confirmBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
