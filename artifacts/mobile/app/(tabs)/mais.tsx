import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, SECTION_COLORS } from "@/constants/colors";
import { useAppData } from "@/contexts/AppDataContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type Tab = "notas" | "financas" | "saude" | "freela";

/* ─── Notas ─── */
function NotasTab() {
  const { notas, addNota, deleteNota } = useAppData();
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState("");

  const filtered = notas.filter(n =>
    n.titulo.toLowerCase().includes(search.toLowerCase()) ||
    n.conteudo.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!novoTitulo.trim()) return;
    const id = await addNota(novoTitulo.trim(), "");
    setNovoTitulo(""); setAdding(false);
    router.push({ pathname: "/nota-editor" as any, params: { id } });
  };

  return (
    <View>
      <View style={styles.notasHeader}>
        <View style={styles.searchRow}>
          <Feather name="search" size={16} color={Colors.textTertiary} style={{ marginLeft: 12 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar notas..."
            placeholderTextColor={Colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <Pressable style={styles.addNotaBtn} onPress={() => setAdding(a => !a)}>
          <Feather name={adding ? "x" : "plus"} size={18} color="#fff" />
        </Pressable>
      </View>

      {adding && (
        <View style={styles.addNotaForm}>
          <TextInput
            style={styles.addInput}
            placeholder="Título da nota..."
            placeholderTextColor={Colors.textTertiary}
            value={novoTitulo}
            onChangeText={setNovoTitulo}
            autoFocus
            onSubmitEditing={handleAdd}
          />
          <Pressable style={styles.confirmBtn} onPress={handleAdd}>
            <Text style={styles.confirmBtnText}>Criar nota</Text>
          </Pressable>
        </View>
      )}

      {filtered.length === 0 && (
        <View style={styles.emptyState}>
          <Feather name="file-text" size={40} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>
            {search ? "Nenhuma nota encontrada" : "Nenhuma nota ainda"}
          </Text>
          <Text style={styles.emptyDesc}>
            Crie notas em formato Markdown para organizar seus estudos, ideias e anotações.
          </Text>
        </View>
      )}

      {filtered.map(nota => (
        <Pressable
          key={nota.id}
          style={styles.notaCard}
          onPress={() => router.push({ pathname: "/nota-editor" as any, params: { id: nota.id } })}
          onLongPress={() => {
            Alert.alert("Excluir nota", `Excluir "${nota.titulo}"?`, [
              { text: "Cancelar", style: "cancel" },
              { text: "Excluir", style: "destructive", onPress: () => deleteNota(nota.id) },
            ]);
          }}
        >
          <View style={styles.notaCardHeader}>
            <Text style={styles.notaTitulo} numberOfLines={1}>{nota.titulo}</Text>
            <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
          </View>
          {nota.conteudo ? (
            <Text style={styles.notaPreview} numberOfLines={2}>{nota.conteudo}</Text>
          ) : (
            <Text style={styles.notaPreviewEmpty}>Nota vazia — toque para editar</Text>
          )}
          <Text style={styles.notaDate}>
            {new Date(nota.updatedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/* ─── Finanças ─── */
function FinancasTab() {
  const { transacoes, addTransacao, deleteTransacao } = useAppData();
  const [adding, setAdding] = useState(false);
  const [tipo, setTipo] = useState<"entrada" | "saida">("saida");
  const [desc, setDesc] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("geral");

  const saldo = transacoes.reduce((acc, t) => t.tipo === "entrada" ? acc + t.valor : acc - t.valor, 0);
  const entradas = transacoes.filter(t => t.tipo === "entrada").reduce((a, t) => a + t.valor, 0);
  const saidas = transacoes.filter(t => t.tipo === "saida").reduce((a, t) => a + t.valor, 0);

  const handleAdd = async () => {
    if (!desc.trim() || !valor.trim()) return;
    await addTransacao({ tipo, descricao: desc.trim(), valor: parseFloat(valor.replace(",", ".")), categoria });
    setDesc(""); setValor(""); setAdding(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View>
      <Card style={styles.saldoCard}>
        <Text style={styles.saldoLabel}>Saldo Total</Text>
        <Text style={[styles.saldoValue, { color: saldo >= 0 ? Colors.green : Colors.red }]}>
          R$ {saldo.toFixed(2)}
        </Text>
        <View style={styles.saldoRow}>
          <View style={styles.saldoItem}>
            <Feather name="arrow-up-circle" size={14} color={Colors.green} />
            <Text style={[styles.saldoItemVal, { color: Colors.green }]}>R${entradas.toFixed(2)}</Text>
            <Text style={styles.saldoItemLabel}>Entradas</Text>
          </View>
          <View style={styles.saldoItem}>
            <Feather name="arrow-down-circle" size={14} color={Colors.red} />
            <Text style={[styles.saldoItemVal, { color: Colors.red }]}>R${saidas.toFixed(2)}</Text>
            <Text style={styles.saldoItemLabel}>Saídas</Text>
          </View>
        </View>
      </Card>

      <View style={styles.transRow}>
        <Text style={styles.subLabel}>Transações</Text>
        <Pressable style={styles.addBtn} onPress={() => setAdding(a => !a)}>
          <Feather name={adding ? "x" : "plus"} size={16} color={Colors.accent} />
        </Pressable>
      </View>

      {adding && (
        <Card style={{ marginBottom: 12 }}>
          <View style={styles.tipoRow}>
            {(["entrada", "saida"] as const).map(t => (
              <Pressable
                key={t}
                style={[styles.tipoBtn, tipo === t && { backgroundColor: t === "entrada" ? Colors.green : Colors.red }]}
                onPress={() => setTipo(t)}
              >
                <Text style={[styles.tipoBtnText, tipo === t && { color: "#fff" }]}>
                  {t === "entrada" ? "Entrada" : "Saída"}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput style={styles.addInput} placeholder="Descrição..." placeholderTextColor={Colors.textTertiary} value={desc} onChangeText={setDesc} />
          <TextInput style={styles.addInput} placeholder="Valor (R$)..." placeholderTextColor={Colors.textTertiary} value={valor} onChangeText={setValor} keyboardType="decimal-pad" />
          <Pressable style={styles.confirmBtn} onPress={handleAdd}>
            <Text style={styles.confirmBtnText}>Adicionar</Text>
          </Pressable>
        </Card>
      )}

      {transacoes.length === 0 && <Text style={styles.emptyText}>Nenhuma transação ainda.</Text>}
      {transacoes.map(t => (
        <Pressable
          key={t.id}
          style={styles.transacaoItem}
          onLongPress={() => {
            Alert.alert("Excluir", `Excluir "${t.descricao}"?`, [
              { text: "Cancelar", style: "cancel" },
              { text: "Excluir", style: "destructive", onPress: () => deleteTransacao(t.id) },
            ]);
          }}
        >
          <View style={[styles.transIcon, { backgroundColor: t.tipo === "entrada" ? Colors.greenDim : Colors.redDim }]}>
            <Feather name={t.tipo === "entrada" ? "arrow-up" : "arrow-down"} size={14} color={t.tipo === "entrada" ? Colors.green : Colors.red} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.transDesc}>{t.descricao}</Text>
            <Text style={styles.transDate}>{new Date(t.data).toLocaleDateString("pt-BR")}</Text>
          </View>
          <Text style={[styles.transValue, { color: t.tipo === "entrada" ? Colors.green : Colors.red }]}>
            {t.tipo === "entrada" ? "+" : "-"}R${t.valor.toFixed(2)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/* ─── Saúde ─── */
function SaudeTab() {
  const { pesos, addPeso } = useAppData();
  const [novoPeso, setNovoPeso] = useState("");

  const pesoAtual = pesos.length > 0 ? pesos[pesos.length - 1].peso : null;
  const pesoInicial = pesos.length > 0 ? pesos[0].peso : null;

  return (
    <View>
      <Card style={{ marginBottom: 14 }}>
        <View style={styles.saudeRow}>
          <View style={styles.saudeItem}>
            <Text style={[styles.saudeValue, { color: Colors.orange }]}>{pesoAtual ? `${pesoAtual}kg` : "--"}</Text>
            <Text style={styles.saudeLabel}>Peso atual</Text>
          </View>
          <View style={styles.saudeItem}>
            <Text style={styles.saudeValue}>1,79m</Text>
            <Text style={styles.saudeLabel}>Altura</Text>
          </View>
          {pesoAtual && (
            <View style={styles.saudeItem}>
              <Text style={[styles.saudeValue, { color: Colors.gold }]}>
                {(pesoAtual / (1.79 * 1.79)).toFixed(1)}
              </Text>
              <Text style={styles.saudeLabel}>IMC</Text>
            </View>
          )}
        </View>

        {pesoInicial && pesoAtual && pesoInicial !== pesoAtual && (
          <Text style={[styles.pesoChange, { color: pesoAtual < pesoInicial ? Colors.green : Colors.orange }]}>
            {pesoAtual < pesoInicial ? "▼" : "▲"} {Math.abs(pesoAtual - pesoInicial).toFixed(1)}kg desde o início
          </Text>
        )}

        <View style={styles.pesoInputRow}>
          <TextInput
            style={styles.pesoInput}
            placeholder="Novo peso (kg)..."
            placeholderTextColor={Colors.textTertiary}
            value={novoPeso}
            onChangeText={setNovoPeso}
            keyboardType="decimal-pad"
          />
          <Pressable
            style={styles.pesoAddBtn}
            onPress={async () => {
              const v = parseFloat(novoPeso.replace(",", "."));
              if (v > 0) {
                await addPeso(v);
                setNovoPeso("");
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            }}
          >
            <Feather name="plus" size={18} color="#fff" />
          </Pressable>
        </View>
      </Card>

      <Pressable
        style={styles.aiTreinoBtn}
        onPress={() => router.push({ pathname: "/chat", params: { initialMessage: "Crie um plano de treino bodyweight completo para mim: 17 anos, 81kg, 1,79m, sem equipamentos. Inclua aquecimento, exercícios, séries, reps e dicas de alimentação barata." } })}
      >
        <Feather name="cpu" size={14} color={Colors.accent} />
        <Text style={styles.aiTreinoBtnText}>Gerar plano de treino personalizado com IA</Text>
      </Pressable>

      {pesos.length > 1 && (
        <View>
          <Text style={[styles.subLabel, { marginTop: 12 }]}>Histórico de peso</Text>
          {pesos.slice(-5).reverse().map(p => (
            <View key={p.id} style={styles.pesoHistItem}>
              <Text style={styles.pesoHistData}>{new Date(p.data).toLocaleDateString("pt-BR")}</Text>
              <Text style={styles.pesoHistVal}>{p.peso}kg</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

/* ─── Freela ─── */
function FreelaTab() {
  const { freelas, addFreela, updateFreela, deleteFreela } = useAppData();
  const [adding, setAdding] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [plataforma, setPlataforma] = useState("Upwork");

  const STATUS_COLORS: Record<string, string> = {
    prospectando: Colors.textSecondary,
    enviado: Colors.accent,
    negociando: Colors.gold,
    fechado: Colors.green,
    concluido: Colors.purple,
  };
  const STATUS_LABELS: Record<string, string> = {
    prospectando: "Prospectando",
    enviado: "Enviado",
    negociando: "Negociando",
    fechado: "Fechado",
    concluido: "Concluído",
  };
  const PLATAFORMAS = ["Upwork", "Fiverr", "99Freelas", "LinkedIn", "Direto"];

  return (
    <View>
      <Card style={styles.primeiroFreelaCard}>
        <Text style={styles.primeiroFreelaTitle}>🎯 Primeiro Freela</Text>
        {[
          "Perfil Upwork/Fiverr 100% completo",
          "Portfolio com 2+ projetos no GitHub",
          "Definir nicho (ex: landing pages React)",
          "Template de proposta em inglês",
          "Preço inicial: $50–150 (projeto pequeno)",
          "Aplicar 5 vagas por dia",
        ].map((item, i) => (
          <View key={i} style={styles.checklistItem}>
            <Feather name="check-circle" size={14} color={Colors.gold} />
            <Text style={styles.checklistText}>{item}</Text>
          </View>
        ))}
        <Pressable
          style={styles.aiPropBtn}
          onPress={() => router.push({ pathname: "/chat", params: { initialMessage: "Crie um template de proposta para Upwork em inglês para desenvolvedor React/TypeScript e Java de 17 anos. Inclua: apresentação, habilidades, por que me contratar, preço inicial sugerido." } })}
        >
          <Feather name="cpu" size={13} color={Colors.gold} />
          <Text style={styles.aiPropBtnText}>Gerar proposta com IA</Text>
        </Pressable>
      </Card>

      <View style={styles.transRow}>
        <Text style={styles.subLabel}>Pipeline de freelas</Text>
        <Pressable style={styles.addBtn} onPress={() => setAdding(a => !a)}>
          <Feather name={adding ? "x" : "plus"} size={16} color={Colors.accent} />
        </Pressable>
      </View>

      {adding && (
        <Card style={{ marginBottom: 10 }}>
          <TextInput style={styles.addInput} placeholder="Nome do freela..." placeholderTextColor={Colors.textTertiary} value={titulo} onChangeText={setTitulo} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            {PLATAFORMAS.map(p => (
              <Pressable key={p} style={[styles.platChip, plataforma === p && styles.platChipActive]} onPress={() => setPlataforma(p)}>
                <Text style={[styles.platChipText, plataforma === p && { color: "#fff" }]}>{p}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable style={styles.confirmBtn} onPress={async () => {
            if (!titulo.trim()) return;
            await addFreela({ titulo: titulo.trim(), plataforma });
            setTitulo(""); setAdding(false);
          }}>
            <Text style={styles.confirmBtnText}>Adicionar</Text>
          </Pressable>
        </Card>
      )}

      {freelas.length === 0 && <Text style={styles.emptyText}>Nenhum freela ainda. Vamos começar!</Text>}

      {freelas.map(f => (
        <Card key={f.id} style={{ marginBottom: 8 }}>
          <View style={styles.freelaHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.freelalTitulo}>{f.titulo}</Text>
              <Text style={styles.freelalPlat}>{f.plataforma}</Text>
            </View>
            <View style={styles.freelaRight}>
              <Badge
                label={STATUS_LABELS[f.status] ?? f.status}
                color={STATUS_COLORS[f.status] + "22"}
                textColor={STATUS_COLORS[f.status]}
                size="sm"
              />
              <Pressable onPress={() => {
                Alert.alert("Excluir", `Excluir "${f.titulo}"?`, [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Excluir", style: "destructive", onPress: () => deleteFreela(f.id) },
                ]);
              }}>
                <Feather name="trash-2" size={14} color={Colors.textTertiary} />
              </Pressable>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {(["prospectando", "enviado", "negociando", "fechado", "concluido"] as const).map(s => (
              <Pressable
                key={s}
                style={[styles.statusBtn, f.status === s && { backgroundColor: STATUS_COLORS[s] + "33" }]}
                onPress={() => updateFreela(f.id, { status: s })}
              >
                <Text style={[styles.statusBtnText, f.status === s && { color: STATUS_COLORS[s] }]}>
                  {STATUS_LABELS[s]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Card>
      ))}
    </View>
  );
}

export default function MaisScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>("notas");
  const isWeb = Platform.OS === "web";

  const TABS: { id: Tab; label: string; icon: string; color: string }[] = [
    { id: "notas", label: "Notas", icon: "file-text", color: Colors.purple },
    { id: "freela", label: "Freela", icon: "briefcase", color: SECTION_COLORS.freela.main },
    { id: "financas", label: "Finanças", icon: "dollar-sign", color: SECTION_COLORS.financas.main },
    { id: "saude", label: "Saúde", icon: "activity", color: SECTION_COLORS.saude.main },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.topHeader, { paddingTop: insets.top + (isWeb ? 67 : 0) + 12 }]}>
        <Text style={styles.title}>Mais</Text>
        <Pressable style={styles.aiHeaderBtn} onPress={() => router.push("/chat")}>
          <Feather name="cpu" size={16} color={Colors.accent} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {TABS.map(t => (
          <Pressable
            key={t.id}
            style={[styles.tabBtn, activeTab === t.id && { backgroundColor: t.color + "22", borderColor: t.color }]}
            onPress={() => setActiveTab(t.id)}
          >
            <Feather name={t.icon as any} size={14} color={activeTab === t.id ? t.color : Colors.textSecondary} />
            <Text style={[styles.tabBtnText, activeTab === t.id && { color: t.color }]}>{t.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: (isWeb ? 34 : 0) + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "notas" && <NotasTab />}
        {activeTab === "financas" && <FinancasTab />}
        {activeTab === "saude" && <SaudeTab />}
        {activeTab === "freela" && <FreelaTab />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", color: Colors.text },
  aiHeaderBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.accentDim, justifyContent: "center", alignItems: "center",
  },
  tabBar: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabBarContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tabBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99,
    backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border,
  },
  tabBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  subLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 10 },
  // Notas
  notasHeader: { flexDirection: "row", gap: 10, marginBottom: 12 },
  searchRow: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.surfaceElevated, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: {
    flex: 1, color: Colors.text, fontFamily: "Inter_400Regular",
    fontSize: 13, paddingHorizontal: 10, paddingVertical: 10,
  },
  addNotaBtn: {
    width: 42, height: 42, borderRadius: 10,
    backgroundColor: Colors.accent, justifyContent: "center", alignItems: "center",
  },
  addNotaForm: { marginBottom: 12 },
  notaCard: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: Colors.border,
  },
  notaCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  notaTitulo: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text, flex: 1 },
  notaPreview: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 18 },
  notaPreviewEmpty: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textTertiary, fontStyle: "italic" },
  notaDate: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textTertiary, marginTop: 8 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.text },
  emptyDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, textAlign: "center", paddingHorizontal: 20 },
  emptyText: { fontSize: 13, color: Colors.textTertiary, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 20 },
  // Finanças
  saldoCard: { marginBottom: 14 },
  saldoLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary, marginBottom: 4 },
  saldoValue: { fontSize: 34, fontFamily: "Inter_700Bold" },
  saldoRow: { flexDirection: "row", gap: 24, marginTop: 12 },
  saldoItem: { gap: 2 },
  saldoItemVal: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  saldoItemLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  transRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.surfaceElevated, justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: Colors.border,
  },
  tipoRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  tipoBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    backgroundColor: Colors.surfaceElevated, alignItems: "center",
    borderWidth: 1, borderColor: Colors.border,
  },
  tipoBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  transacaoItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  transIcon: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
  transDesc: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.text },
  transDate: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  transValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  // Saúde
  saudeRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 14 },
  saudeItem: { alignItems: "center" },
  saudeValue: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.text },
  saudeLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  pesoChange: { fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center", marginBottom: 12 },
  pesoInputRow: { flexDirection: "row", gap: 10 },
  pesoInput: {
    flex: 1, backgroundColor: Colors.surfaceElevated, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, color: Colors.text,
    fontFamily: "Inter_400Regular", fontSize: 14, borderWidth: 1, borderColor: Colors.border,
  },
  pesoAddBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.orange, justifyContent: "center", alignItems: "center" },
  aiTreinoBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.surfaceElevated, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  aiTreinoBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.accent },
  pesoHistItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pesoHistData: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  pesoHistVal: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.orange },
  // Freela
  primeiroFreelaCard: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 12, padding: 14,
    marginBottom: 16, borderWidth: 1, borderColor: Colors.goldDim,
  },
  primeiroFreelaTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.gold, marginBottom: 10 },
  checklistItem: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  checklistText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.text, flex: 1 },
  aiPropBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    marginTop: 10, paddingVertical: 9, backgroundColor: Colors.goldDim + "44", borderRadius: 8,
  },
  aiPropBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.gold },
  freelaHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  freelaRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  freelalTitulo: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  freelalPlat: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  platChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99,
    backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border, marginRight: 6,
  },
  platChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  platChipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  statusBtn: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99,
    backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border, marginRight: 6,
  },
  statusBtnText: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  // Common
  addInput: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, color: Colors.text,
    fontFamily: "Inter_400Regular", fontSize: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  confirmBtn: { backgroundColor: Colors.accent, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  confirmBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
