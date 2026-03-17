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
import { useAppData, type Freela } from "@/contexts/AppDataContext";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";

type Tab = "financas" | "saude" | "vida" | "freela";

function FinancasTab() {
  const { data, addTransacao } = useAppData();
  const [adding, setAdding] = useState(false);
  const [tipo, setTipo] = useState<"entrada" | "saida">("saida");
  const [desc, setDesc] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("alimentação");

  const saldo = data.transacoes.reduce(
    (acc, t) => t.tipo === "entrada" ? acc + t.valor : acc - t.valor, 0
  );
  const entradas = data.transacoes.filter(t => t.tipo === "entrada").reduce((a, t) => a + t.valor, 0);
  const saidas = data.transacoes.filter(t => t.tipo === "saida").reduce((a, t) => a + t.valor, 0);

  const handleAdd = async () => {
    if (!desc.trim() || !valor.trim()) return;
    await addTransacao({ tipo, descricao: desc.trim(), valor: parseFloat(valor), categoria });
    setDesc(""); setValor(""); setAdding(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View>
      {/* Saldo */}
      <Card style={styles.saldoCard}>
        <Text style={styles.saldoLabel}>Saldo Total</Text>
        <Text style={[styles.saldoValue, { color: saldo >= 0 ? Colors.green : Colors.red }]}>
          R$ {saldo.toFixed(2)}
        </Text>
        <View style={styles.saldoRow}>
          <View style={styles.saldoItem}>
            <Feather name="arrow-up-circle" size={14} color={Colors.green} />
            <Text style={styles.saldoItemText}>R$ {entradas.toFixed(2)}</Text>
            <Text style={styles.saldoItemLabel}>Entradas</Text>
          </View>
          <View style={styles.saldoItem}>
            <Feather name="arrow-down-circle" size={14} color={Colors.red} />
            <Text style={[styles.saldoItemText, { color: Colors.red }]}>R$ {saidas.toFixed(2)}</Text>
            <Text style={styles.saldoItemLabel}>Saídas</Text>
          </View>
        </View>
      </Card>

      {/* Currency Rates - via AI */}
      <Pressable
        style={styles.currencyCard}
        onPress={() => router.push({ pathname: "/chat", params: { initialMessage: "Me dê as cotações atuais de: Dólar (USD), Euro (EUR), Libra (GBP), Franco Suíço (CHF) e Coroa Norueguesa (NOK) em relação ao Real brasileiro (BRL). Formato: moeda, símbolo, valor atual, variação do dia." } })}
      >
        <View style={styles.currencyHeader}>
          <Text style={styles.currencyTitle}>💱 Cotações do Dia</Text>
          <View style={styles.currencyAiBtn}>
            <Feather name="cpu" size={12} color={Colors.accent} />
            <Text style={styles.currencyAiText}>Atualizar via IA</Text>
          </View>
        </View>
        {[
          { symbol: "USD", name: "Dólar", flag: "🇺🇸", hint: "~R$5.20" },
          { symbol: "GBP", name: "Libra", flag: "🇬🇧", hint: "~R$6.60" },
          { symbol: "EUR", name: "Euro", flag: "🇪🇺", hint: "~R$5.70" },
        ].map(c => (
          <View key={c.symbol} style={styles.currencyItem}>
            <Text style={styles.currencyFlag}>{c.flag}</Text>
            <Text style={styles.currencyName}>{c.name}</Text>
            <Text style={styles.currencyHint}>{c.hint}</Text>
            <Text style={styles.currencySymbol}>{c.symbol}</Text>
          </View>
        ))}
      </Pressable>

      {/* Transações */}
      <View style={styles.transRow}>
        <Text style={styles.subLabel}>Transações</Text>
        <Pressable onPress={() => setAdding(a => !a)} style={styles.addBtn}>
          <Feather name={adding ? "x" : "plus"} size={16} color={Colors.accent} />
        </Pressable>
      </View>

      {adding && (
        <Card style={styles.addTransCard}>
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
          <TextInput style={styles.input} placeholder="Descrição..." placeholderTextColor={Colors.textTertiary}
            value={desc} onChangeText={setDesc} />
          <TextInput style={styles.input} placeholder="Valor (R$)..." placeholderTextColor={Colors.textTertiary}
            value={valor} onChangeText={setValor} keyboardType="decimal-pad" />
          <Pressable style={styles.confirmBtn} onPress={handleAdd}>
            <Text style={styles.confirmBtnText}>Adicionar</Text>
          </Pressable>
        </Card>
      )}

      {data.transacoes.slice(-10).reverse().map(t => (
        <View key={t.id} style={styles.transacaoItem}>
          <View style={[styles.transIcon, { backgroundColor: t.tipo === "entrada" ? Colors.greenDim : Colors.redDim }]}>
            <Feather name={t.tipo === "entrada" ? "arrow-up" : "arrow-down"} size={14}
              color={t.tipo === "entrada" ? Colors.green : Colors.red} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.transDesc}>{t.descricao}</Text>
            <Text style={styles.transDate}>{new Date(t.data).toLocaleDateString("pt-BR")}</Text>
          </View>
          <Text style={[styles.transValue, { color: t.tipo === "entrada" ? Colors.green : Colors.red }]}>
            {t.tipo === "entrada" ? "+" : "-"}R${t.valor.toFixed(2)}
          </Text>
        </View>
      ))}

      {data.transacoes.length === 0 && (
        <Text style={styles.emptyText}>Nenhuma transação ainda. Registre sua primeira!</Text>
      )}
    </View>
  );
}

function SaudeTab() {
  const { data, addPeso, updateData } = useAppData();
  const [novoPeso, setNovoPeso] = useState("");
  const pesoAtual = data.pesos.length > 0 ? data.pesos[data.pesos.length - 1].peso : 81;
  const imc = parseFloat((81 / (1.79 * 1.79)).toFixed(1));

  return (
    <View>
      {/* Stats */}
      <Card style={styles.saudeStatsCard}>
        <View style={styles.saudeRow}>
          <View style={styles.saudeItem}>
            <Text style={styles.saudeValue}>{pesoAtual}kg</Text>
            <Text style={styles.saudeLabel}>Peso atual</Text>
          </View>
          <View style={styles.saudeItem}>
            <Text style={styles.saudeValue}>1,79m</Text>
            <Text style={styles.saudeLabel}>Altura</Text>
          </View>
          <View style={styles.saudeItem}>
            <Text style={[styles.saudeValue, { color: Colors.gold }]}>{imc}</Text>
            <Text style={styles.saudeLabel}>IMC</Text>
          </View>
        </View>
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
              if (novoPeso.trim()) {
                await addPeso(parseFloat(novoPeso));
                setNovoPeso("");
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            }}
          >
            <Feather name="plus" size={18} color="#fff" />
          </Pressable>
        </View>
      </Card>

      {/* Treinos */}
      <Text style={styles.subLabel}>Planner de Treinos (Bodyweight)</Text>
      {data.treinos.map(treino => (
        <Card key={treino.id} style={[styles.treinoCard, { marginBottom: 10 }]}>
          <View style={styles.treinoHeader}>
            <View style={[styles.treinoIcon, { backgroundColor: SECTION_COLORS.saude.dim }]}>
              <Feather name="activity" size={16} color={SECTION_COLORS.saude.main} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.treinoName}>{treino.nome}</Text>
              <Text style={styles.treinoDias}>
                {treino.diasSemana.map(d => ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][d]).join(" • ")}
              </Text>
            </View>
            <Badge label={`${treino.exercicios.length} exerc.`} size="sm" />
          </View>
          {treino.exercicios.map((ex, i) => (
            <View key={ex.id} style={[styles.exercicioItem, i < treino.exercicios.length - 1 && styles.exercicioItemBorder]}>
              <Text style={styles.exercicioName}>{ex.exercicio}</Text>
              <Text style={styles.exercicioSeries}>{ex.series}x{ex.reps}</Text>
            </View>
          ))}
        </Card>
      ))}

      <Pressable
        style={styles.aiTreinoBtn}
        onPress={() => router.push({ pathname: "/chat", params: { initialMessage: "Crie um plano de treino bodyweight em casa para mim: 17 anos, 81kg, 1,79m, objetivo de reduzir gordura e ganhar massa muscular. Sem equipamentos. Dieta barata brasileira (arroz, feijão, ovo, frango, banana). Inclua séries, repetições e dicas de alimentação." } })}
      >
        <Feather name="cpu" size={14} color={Colors.accent} />
        <Text style={styles.aiTreinoBtnText}>Gerar plano personalizado com IA</Text>
      </Pressable>
    </View>
  );
}

function VidaTab() {
  const lembretes = [
    { id: "1", icon: "sun", titulo: "Missa", desc: "Todo domingo", cor: Colors.purple, tipo: "recorrente" },
    { id: "2", icon: "github", titulo: "Post no GitHub", desc: "Semanal - commit ou artigo", cor: Colors.accent, tipo: "semanal" },
    { id: "3", icon: "linkedin", titulo: "Networking LinkedIn", desc: "Conectar 3 devs esta semana", cor: Colors.teal, tipo: "semanal" },
    { id: "4", icon: "music", titulo: "Música", desc: "30 min diários", cor: Colors.pink, tipo: "diário" },
    { id: "5", icon: "book-open", titulo: "Leitura", desc: "20 min diários", cor: Colors.gold, tipo: "diário" },
    { id: "6", icon: "smartphone", titulo: "Jogos / Lazer", desc: "1h diária (equilíbrio)", cor: Colors.green, tipo: "diário" },
  ];

  return (
    <View>
      <Text style={styles.subLabel}>Lembretes de Vida</Text>
      {lembretes.map(l => (
        <Card key={l.id} style={[styles.vidaCard, { marginBottom: 8 }]} accentColor={l.cor}>
          <View style={styles.vidaHeader}>
            <View style={[styles.vidaIcon, { backgroundColor: l.cor + "22" }]}>
              <Feather name={l.icon as any} size={18} color={l.cor} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.vidaTitulo}>{l.titulo}</Text>
              <Text style={styles.vidaDesc}>{l.desc}</Text>
            </View>
            <Badge label={l.tipo} color={l.cor + "22"} textColor={l.cor} size="sm" />
          </View>
        </Card>
      ))}

      <Card style={styles.networkingCard}>
        <Text style={styles.networkingTitle}>🤝 Networking Esta Semana</Text>
        {[
          "Conectar 3 devs no LinkedIn",
          "Mensagem para alumni UFC",
          "Comentar em 2 posts tech",
        ].map((item, i) => (
          <View key={i} style={styles.networkingItem}>
            <Feather name="arrow-right" size={12} color={Colors.teal} />
            <Text style={styles.networkingText}>{item}</Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

function FreelaTab() {
  const { data, addFreela, updateFreela } = useAppData();
  const [adding, setAdding] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [plataforma, setPlataforma] = useState("Upwork");
  const [desc, setDesc] = useState("");

  const STATUS_COLORS: Record<string, string> = {
    prospectando: Colors.textSecondary,
    enviado: Colors.accent,
    negociando: Colors.gold,
    fechado: Colors.green,
    concluido: Colors.purple,
  };

  const STATUS_LABELS: Record<string, string> = {
    prospectando: "Prospectando",
    enviado: "Proposta enviada",
    negociando: "Negociando",
    fechado: "Fechado",
    concluido: "Concluído",
  };

  const PLATAFORMAS = ["Upwork", "Fiverr", "99Freelas", "LinkedIn", "Direto"];

  const handleAdd = async () => {
    if (!titulo.trim()) return;
    await addFreela({ titulo: titulo.trim(), plataforma, status: "prospectando", descricao: desc.trim(), notas: "" });
    setTitulo(""); setDesc(""); setAdding(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View>
      {/* Checklist Primeiro Freela */}
      <Card style={styles.primeiroFreelaCard}>
        <Text style={styles.primeiroFreelaTitle}>🎯 Primeiro Freela Este Mês</Text>
        <Text style={styles.primeiroFreelaSub}>Checklist para conseguir o primeiro cliente</Text>
        {[
          "Perfil Upwork/Fiverr completo",
          "Portfolio com 2+ projetos",
          "Definir nicho (ex: landing pages em React)",
          "Proposta em inglês pronta",
          "Preço inicial: $50-150 (projeto pequeno)",
          "Aplicar para 5 vagas por dia",
        ].map((item, i) => (
          <View key={i} style={styles.checklistItem}>
            <Feather name="check-circle" size={14} color={Colors.gold} />
            <Text style={styles.checklistText}>{item}</Text>
          </View>
        ))}
        <Pressable
          style={styles.aiPropBtn}
          onPress={() => router.push({ pathname: "/chat", params: { initialMessage: "Crie um template de proposta para Upwork em inglês para um desenvolvedor junior de 17 anos especializado em React/TypeScript e Java. Inclua: apresentação, experiência, por que me contratar, e preço inicial sugerido." } })}
        >
          <Feather name="cpu" size={13} color={Colors.gold} />
          <Text style={styles.aiPropBtnText}>Gerar template de proposta com IA</Text>
        </Pressable>
      </Card>

      {/* Add Freela */}
      <View style={styles.transRow}>
        <Text style={styles.subLabel}>Meus Freelas</Text>
        <Pressable onPress={() => setAdding(a => !a)} style={styles.addBtn}>
          <Feather name={adding ? "x" : "plus"} size={16} color={Colors.accent} />
        </Pressable>
      </View>

      {adding && (
        <Card style={styles.addTransCard}>
          <TextInput style={styles.input} placeholder="Nome do freela..." placeholderTextColor={Colors.textTertiary}
            value={titulo} onChangeText={setTitulo} />
          <TextInput style={styles.input} placeholder="Descrição..." placeholderTextColor={Colors.textTertiary}
            value={desc} onChangeText={setDesc} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {PLATAFORMAS.map(p => (
              <Pressable
                key={p}
                style={[styles.platBtn, plataforma === p && styles.platBtnActive]}
                onPress={() => setPlataforma(p)}
              >
                <Text style={[styles.platBtnText, plataforma === p && styles.platBtnTextActive]}>{p}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable style={styles.confirmBtn} onPress={handleAdd}>
            <Text style={styles.confirmBtnText}>Adicionar Freela</Text>
          </Pressable>
        </Card>
      )}

      {data.freelas.length === 0 && (
        <Text style={styles.emptyText}>Nenhum freela ainda. Vamos começar!</Text>
      )}

      {data.freelas.map(f => (
        <Card key={f.id} style={{ marginBottom: 10 }}>
          <View style={styles.freealaHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.freealaTitle}>{f.titulo}</Text>
              <Text style={styles.freealaPlatform}>{f.plataforma}</Text>
            </View>
            <Badge
              label={STATUS_LABELS[f.status]}
              color={STATUS_COLORS[f.status] + "22"}
              textColor={STATUS_COLORS[f.status]}
              size="sm"
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
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
  const [activeTab, setActiveTab] = useState<Tab>("freela");
  const isWeb = Platform.OS === "web";

  const TABS: { id: Tab; label: string; icon: string; color: string }[] = [
    { id: "freela", label: "Freela", icon: "briefcase", color: SECTION_COLORS.freela.main },
    { id: "financas", label: "Finanças", icon: "dollar-sign", color: SECTION_COLORS.financas.main },
    { id: "saude", label: "Saúde", icon: "activity", color: SECTION_COLORS.saude.main },
    { id: "vida", label: "Vida", icon: "heart", color: SECTION_COLORS.vida.main },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.topHeader, { paddingTop: insets.top + (isWeb ? 67 : 0) + 12 }]}>
        <Text style={styles.title}>Mais</Text>
        <Pressable
          style={styles.aiHeaderBtn}
          onPress={() => router.push("/chat")}
        >
          <Feather name="cpu" size={18} color={Colors.accent} />
          <Text style={styles.aiHeaderText}>IA</Text>
        </Pressable>
      </View>

      {/* Tab Bar */}
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
        contentContainerStyle={[
          styles.content,
          { paddingBottom: (isWeb ? 34 : 0) + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "financas" && <FinancasTab />}
        {activeTab === "saude" && <SaudeTab />}
        {activeTab === "vida" && <VidaTab />}
        {activeTab === "freela" && <FreelaTab />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", color: Colors.text },
  aiHeaderBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.surfaceElevated, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.border },
  aiHeaderText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.accent },
  tabBar: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabBarContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tabBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  tabBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  subLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 10 },
  // Financas
  saldoCard: { marginBottom: 16, backgroundColor: Colors.surfaceElevated },
  saldoLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary, marginBottom: 4 },
  saldoValue: { fontSize: 36, fontFamily: "Inter_700Bold" },
  saldoRow: { flexDirection: "row", gap: 20, marginTop: 12 },
  saldoItem: { gap: 2 },
  saldoItemText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.green },
  saldoItemLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  currencyCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  currencyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  currencyTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  currencyAiBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  currencyAiText: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.accent },
  currencyItem: { flexDirection: "row", alignItems: "center", paddingVertical: 7, borderTopWidth: 1, borderTopColor: Colors.border },
  currencyFlag: { fontSize: 20, marginRight: 8 },
  currencyName: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.text, flex: 1 },
  currencyHint: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.green, marginRight: 8 },
  currencySymbol: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textTertiary },
  transRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surfaceElevated, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  addTransCard: { marginBottom: 12 },
  tipoRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  tipoBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.surfaceElevated, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  tipoBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  input: { backgroundColor: Colors.surfaceElevated, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: Colors.text, fontFamily: "Inter_400Regular", fontSize: 13, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  confirmBtn: { backgroundColor: Colors.accent, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  confirmBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  transacaoItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  transIcon: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
  transDesc: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.text },
  transDate: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  transValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, color: Colors.textTertiary, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 20 },
  // Saúde
  saudeStatsCard: { marginBottom: 16 },
  saudeRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 16 },
  saudeItem: { alignItems: "center" },
  saudeValue: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.orange },
  saudeLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  pesoInputRow: { flexDirection: "row", gap: 10 },
  pesoInput: { flex: 1, backgroundColor: Colors.surfaceElevated, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: Colors.text, fontFamily: "Inter_400Regular", fontSize: 13, borderWidth: 1, borderColor: Colors.border },
  pesoAddBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.orange, justifyContent: "center", alignItems: "center" },
  treinoCard: {},
  treinoHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  treinoIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  treinoName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  treinoDias: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  exercicioItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7 },
  exercicioItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  exercicioName: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.text, flex: 1 },
  exercicioSeries: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.orange },
  aiTreinoBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.surfaceElevated, borderRadius: 12, padding: 12, marginTop: 8, borderWidth: 1, borderColor: Colors.border },
  aiTreinoBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.accent },
  // Vida
  vidaCard: {},
  vidaHeader: { flexDirection: "row", alignItems: "center" },
  vidaIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  vidaTitulo: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text, flex: 1, marginLeft: 12 },
  vidaDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginLeft: 12 },
  networkingCard: { marginTop: 8, marginBottom: 16 },
  networkingTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 10 },
  networkingItem: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 5 },
  networkingText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  // Freela
  primeiroFreelaCard: { marginBottom: 16, borderWidth: 1, borderColor: Colors.goldDim, backgroundColor: Colors.surfaceElevated },
  primeiroFreelaTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.gold, marginBottom: 4 },
  primeiroFreelaSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginBottom: 12 },
  checklistItem: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 5 },
  checklistText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.text, flex: 1 },
  aiPropBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12, paddingVertical: 10, backgroundColor: Colors.goldDim + "44", borderRadius: 8 },
  aiPropBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.gold },
  freealaHeader: { flexDirection: "row", alignItems: "flex-start" },
  freealaTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  freealaPlatform: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  platBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border, marginRight: 6 },
  platBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  platBtnText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  platBtnTextActive: { color: "#fff" },
  statusBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border, marginRight: 6 },
  statusBtnText: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
});
