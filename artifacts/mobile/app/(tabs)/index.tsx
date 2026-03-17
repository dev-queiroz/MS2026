import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, SECTION_COLORS } from "@/constants/colors";
import { useAppData } from "@/contexts/AppDataContext";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

const hoje = new Date();
const nascimento = new Date("2008-09-05");
const londresToday = new Date("2026-09-05");
const diffTime = londresToday.getTime() - hoje.getTime();
const diasParaLondres = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

function diasParaAniversario() {
  const proximo = new Date(hoje.getFullYear(), 8, 5);
  if (proximo < hoje) proximo.setFullYear(hoje.getFullYear() + 1);
  return Math.ceil((proximo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

interface SectionCardProps {
  title: string;
  icon: string;
  color: string;
  dimColor: string;
  value: string;
  subtitle: string;
  route: string;
}

function SectionCard({ title, icon, color, dimColor, value, subtitle, route }: SectionCardProps) {
  return (
    <Card onPress={() => router.push(route as any)} style={styles.sectionCard}>
      <View style={[styles.sectionIcon, { backgroundColor: dimColor }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={[styles.sectionValue, { color }]}>{value}</Text>
      <Text style={styles.sectionSub}>{subtitle}</Text>
    </Card>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { data } = useAppData();
  const isWeb = Platform.OS === "web";

  const stats = useMemo(() => {
    const pendAtividades = data.materias.reduce(
      (acc, m) => acc + m.atividades.filter(a => !a.concluida).length, 0
    );
    const totalChecks = data.studyTrackers.reduce((acc, s) => acc + s.checklistDiario.length, 0);
    const doneChecks = data.studyTrackers.reduce(
      (acc, s) => acc + s.checklistDiario.filter(c => c.concluido).length, 0
    );
    const saldo = data.transacoes.reduce(
      (acc, t) => t.tipo === "entrada" ? acc + t.valor : acc - t.valor, 0
    );
    const pesoAtual = data.pesos.length > 0 ? data.pesos[data.pesos.length - 1].peso : 81;
    const freeAsAbertos = data.freelas.filter(f => f.status !== "concluido").length;
    const sonhoProgress = data.sonhos.reduce((acc, s) => acc + s.progresso, 0) / Math.max(1, data.sonhos.length);

    return { pendAtividades, totalChecks, doneChecks, saldo, pesoAtual, freeAsAbertos, sonhoProgress };
  }, [data]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + (isWeb ? 67 : 0) + 16, paddingBottom: (isWeb ? 34 : 0) + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Boa tarde, Douglas 👋</Text>
          <Text style={styles.subtitle}>
            {diasParaLondres > 0 ? `${diasParaLondres} dias para os 18 anos` : "Chegou a hora! 🚀"}
          </Text>
        </View>
        <Pressable
          style={styles.aiBtn}
          onPress={() => router.push("/chat")}
        >
          <Feather name="cpu" size={20} color={Colors.accent} />
        </Pressable>
      </View>

      {/* Londres Countdown */}
      <Card style={styles.londonCard}>
        <View style={styles.londonRow}>
          <View>
            <Text style={styles.londonLabel}>🎯 Meta Londres</Text>
            <Text style={styles.londonDays}>{diasParaLondres}</Text>
            <Text style={styles.londonSub}>dias até 05/09/2026 • £38k-£45k</Text>
          </View>
          <View style={styles.londonRight}>
            <Text style={styles.londonflag}>🇬🇧</Text>
          </View>
        </View>
        <ProgressBar
          value={Math.max(0, 730 - diasParaLondres)}
          max={730}
          color={Colors.gold}
          height={6}
          style={{ marginTop: 12 }}
        />
      </Card>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: Colors.surfaceElevated }]}>
          <Text style={[styles.statValue, { color: Colors.green }]}>
            {stats.doneChecks}/{stats.totalChecks}
          </Text>
          <Text style={styles.statLabel}>Checks hoje</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: Colors.surfaceElevated }]}>
          <Text style={[styles.statValue, { color: stats.saldo >= 0 ? Colors.green : Colors.red }]}>
            R${Math.abs(stats.saldo).toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>Saldo</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: Colors.surfaceElevated }]}>
          <Text style={[styles.statValue, { color: Colors.orange }]}>{stats.pesoAtual}kg</Text>
          <Text style={styles.statLabel}>Peso atual</Text>
        </View>
      </View>

      {/* Section Grid */}
      <Text style={styles.sectionHeading}>Seções</Text>
      <View style={styles.grid}>
        <SectionCard
          title="Faculdade"
          icon="book"
          color={SECTION_COLORS.faculdade.main}
          dimColor={SECTION_COLORS.faculdade.dim}
          value={`${stats.pendAtividades} pendentes`}
          subtitle="6 matérias • 1º sem UFC"
          route="/(tabs)/faculdade"
        />
        <SectionCard
          title="Estudos"
          icon="code"
          color={SECTION_COLORS.estudos.main}
          dimColor={SECTION_COLORS.estudos.dim}
          value={`${stats.doneChecks}/${stats.totalChecks}`}
          subtitle="Java • TS • Go • Inglês"
          route="/(tabs)/estudos"
        />
        <SectionCard
          title="Sonhos"
          icon="star"
          color={SECTION_COLORS.sonhos.main}
          dimColor={SECTION_COLORS.sonhos.dim}
          value={`${Math.round(stats.sonhoProgress)}%`}
          subtitle="Londres • Liberdade"
          route="/(tabs)/sonhos"
        />
        <SectionCard
          title="Finanças"
          icon="dollar-sign"
          color={SECTION_COLORS.financas.main}
          dimColor={SECTION_COLORS.financas.dim}
          value={`R$${stats.saldo.toFixed(0)}`}
          subtitle="Saldo atual"
          route="/(tabs)/mais"
        />
        <SectionCard
          title="Saúde"
          icon="activity"
          color={SECTION_COLORS.saude.main}
          dimColor={SECTION_COLORS.saude.dim}
          value={`${stats.pesoAtual}kg`}
          subtitle="1,79m • Bodyweight"
          route="/(tabs)/mais"
        />
        <SectionCard
          title="Freela"
          icon="briefcase"
          color={SECTION_COLORS.freela.main}
          dimColor={SECTION_COLORS.freela.dim}
          value={`${stats.freeAsAbertos} abertos`}
          subtitle="Upwork • Fiverr • 99Freelas"
          route="/(tabs)/mais"
        />
      </View>

      {/* AI Quick Actions */}
      <Text style={styles.sectionHeading}>Perguntar à IA</Text>
      <View style={styles.quickActions}>
        {[
          "Como fazer meu primeiro freela hoje?",
          "Salário médio dev junior em Londres 2026",
          "Plano de treino com 81kg e bodyweight",
          "Como conseguir Global Talent Visa UK?",
        ].map((q, i) => (
          <Pressable
            key={i}
            style={styles.quickAction}
            onPress={() => router.push({ pathname: "/chat", params: { initialMessage: q } })}
          >
            <Feather name="zap" size={13} color={Colors.accent} />
            <Text style={styles.quickActionText}>{q}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  aiBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  londonCard: {
    marginBottom: 16,
    backgroundColor: Colors.surfaceElevated,
  },
  londonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  londonLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  londonDays: {
    fontSize: 42,
    fontFamily: "Inter_700Bold",
    color: Colors.gold,
  },
  londonSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  londonRight: {
    alignItems: "center",
  },
  londonflag: { fontSize: 40 },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  sectionCard: {
    flex: 1,
    minWidth: "44%",
    gap: 6,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  sectionValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  sectionSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  quickActions: {
    gap: 8,
    marginBottom: 16,
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    flex: 1,
  },
});
