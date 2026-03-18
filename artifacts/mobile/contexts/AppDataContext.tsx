import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import * as db from "@/lib/db";

async function agendarLembrete(titulo: string, prazoStr?: string): Promise<string | null> {
  if (!prazoStr) return null;
  const t = new Date(new Date(prazoStr).getTime() - 86400000); // 1 dia antes
  if (isNaN(t.getTime())) return null;
  if (t.getTime() > Date.now()) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Prazo chegando! ⏳",
          body: `A atividade "${titulo}" vence em amanhã.`,
        },
        trigger: { date: t } as any,
      });
      return id;
    } catch (e) {
      console.log("Erro ao agendar notificação", e);
      return null;
    }
  }
  return null;
}

/* ─── Types ─── */
export interface Materia {
  id: string;
  nome: string;
  semestre: number;
  maxFaltas: number;
  cor: string;
  nota?: number;
  createdAt: string;
  faltasAtuais?: number;
}

export interface FaltaRegistro {
  id: string;
  materiaId: string;
  data: string;
}

export interface Atividade {
  id: string;
  materiaId: string;
  titulo: string;
  tipo: string;
  prazo: string | null;
  status: string;
  concluida: boolean;
  notificationId: string | null;
  createdAt: string;
}

export interface Goal {
  id: string;
  titulo: string;
  especifica: string;
  mensuravel: string;
  metrica: string;
  metaNumerica: number;
  valorAtual: number;
  alcancavel: string;
  relevante: string;
  prazo?: string;
  progresso: number;
  cor: string;
  createdAt: string;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  goalId: string;
  titulo: string;
  concluido: boolean;
}

export interface Nota {
  id: string;
  titulo: string;
  conteudo: string;
  updatedAt: string;
  createdAt: string;
}

export interface Transacao {
  id: string;
  tipo: string;
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
}

export interface Peso {
  id: string;
  peso: number;
  data: string;
}

export interface Freela {
  id: string;
  titulo: string;
  plataforma: string;
  status: string;
  valor?: number;
  descricao: string;
  notas: string;
  dataCriacao: string;
}

interface AppDataContextType {
  materias: Materia[];
  atividades: Atividade[];
  goals: Goal[];
  notas: Nota[];
  transacoes: Transacao[];
  pesos: Peso[];
  freelas: Freela[];
  loading: boolean;
  refreshMaterias: () => Promise<void>;
  refreshGoals: () => Promise<void>;
  refreshNotas: () => Promise<void>;
  refreshTransacoes: () => Promise<void>;
  refreshFreelas: () => Promise<void>;
  refreshAll: () => Promise<void>;
  // Matérias
  addMateria: (data: { nome: string; semestre?: number; maxFaltas?: number; cor?: string }) => Promise<void>;
  updateMateria: (id: string, data: any) => Promise<void>;
  deleteMateria: (id: string) => Promise<void>;
  // Faltas
  addFalta: (materiaId: string) => Promise<void>;
  removeFalta: (materiaId: string) => Promise<void>;
  // Atividades
  addAtividade: (data: { materiaId: string; titulo: string; tipo?: string; prazo?: string; status?: string }) => Promise<void>;
  updateAtividade: (id: string, data: { titulo?: string; tipo?: string; prazo?: string; status?: string; concluida?: boolean }) => Promise<void>;
  deleteAtividade: (id: string) => Promise<void>;
  // Goals
  addGoal: (data: any) => Promise<void>;
  updateGoal: (id: string, data: any) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addMilestone: (goalId: string, titulo: string) => Promise<void>;
  toggleMilestone: (id: string) => Promise<void>;
  deleteMilestone: (id: string) => Promise<void>;
  // Notas
  addNota: (titulo: string, conteudo?: string) => Promise<string>;
  updateNota: (id: string, data: { titulo?: string; conteudo?: string }) => Promise<void>;
  deleteNota: (id: string) => Promise<void>;
  // Finanças
  addTransacao: (data: { tipo: string; descricao: string; valor: number; categoria?: string }) => Promise<void>;
  deleteTransacao: (id: string) => Promise<void>;
  // Saúde
  addPeso: (peso: number) => Promise<void>;
  // Freelas
  addFreela: (data: { titulo: string; plataforma?: string; descricao?: string }) => Promise<void>;
  updateFreela: (id: string, data: any) => Promise<void>;
  deleteFreela: (id: string) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [pesos, setPesos] = useState<Peso[]>([]);
  const [freelas, setFreelas] = useState<Freela[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshMaterias = useCallback(async () => {
    try {
      const rows = await db.getMaterias() as Materia[];
      setMaterias(rows);
      const ativRows = await db.getAtividades() as Atividade[];
      setAtividades(ativRows.map(a => ({ ...a, concluida: (a.concluida as any) === 1 || a.concluida === true })));
    } catch (e) { console.error(e); }
  }, []);

  const refreshGoals = useCallback(async () => {
    const rows = await db.getGoals() as Goal[];
    setGoals(rows);
  }, []);

  const refreshNotas = useCallback(async () => {
    const rows = await db.getNotas() as Nota[];
    setNotas(rows);
  }, []);

  const refreshTransacoes = useCallback(async () => {
    const rows = await db.getTransacoes() as Transacao[];
    setTransacoes(rows);
    const pesoRows = await db.getPesos() as Peso[];
    setPesos(pesoRows);
  }, []);

  const refreshFreelas = useCallback(async () => {
    const rows = await db.getFreelas() as Freela[];
    setFreelas(rows);
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshMaterias(), refreshGoals(), refreshNotas(), refreshTransacoes(), refreshFreelas()]);
    setLoading(false);
  }, [refreshMaterias, refreshGoals, refreshNotas, refreshTransacoes, refreshFreelas]);

  useEffect(() => { refreshAll(); }, []);

  /* Matérias */
  const addMateria = useCallback(async (data: any) => {
    await db.addMateria(data);
    await refreshMaterias();
  }, [refreshMaterias]);

  const updateMateriaCtx = useCallback(async (id: string, data: any) => {
    await db.updateMateria(id, data);
    await refreshMaterias();
  }, [refreshMaterias]);

  const deleteMateria = useCallback(async (id: string) => {
    await db.deleteMateria(id);
    await refreshMaterias();
  }, [refreshMaterias]);

  /* Faltas */
  const addFalta = useCallback(async (materiaId: string) => {
    try {
      await db.addFalta(materiaId);
      await refreshMaterias();
    } catch (e) { console.error(e); }
  }, [refreshMaterias]);

  const removeFalta = useCallback(async (materiaId: string) => {
    try {
      await db.removeFalta(materiaId);
      await refreshMaterias();
    } catch (e) { console.error(e); }
  }, [refreshMaterias]);

  /* Atividades */
  const addAtividade = useCallback(async (data: any) => {
    const notificationId = await agendarLembrete(data.titulo, data.prazo);
    await db.addAtividade({ ...data, notificationId });
    await refreshMaterias();
  }, [refreshMaterias]);

  const updateAtividade = useCallback(async (id: string, data: any) => {
    let notificationId;
    if (data.prazo || data.titulo) {
      const act = atividades.find((a: Atividade) => a.id === id);
      if (act && act.notificationId) {
        try { await Notifications.cancelScheduledNotificationAsync(act.notificationId); } catch (e) {}
      }
      notificationId = await agendarLembrete(data.titulo || act?.titulo || "Atividade", data.prazo || act?.prazo);
      await db.updateAtividade(id, { ...data, notificationId });
    } else {
      await db.updateAtividade(id, data);
    }
    await refreshMaterias();
  }, [refreshMaterias]);

  const deleteAtividade = useCallback(async (id: string) => {
    // Find activity to see if it has a scheduled notification
    const act = atividades.find((a: Atividade) => a.id === id);
    if (act && act.notificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(act.notificationId);
      } catch (e) { console.log("Fail to cancel notification"); }
    }
    await db.deleteAtividade(id);
    await refreshMaterias();
  }, [atividades, refreshMaterias]);

  /* Goals */
  const addGoal = useCallback(async (data: any) => {
    await db.addGoal(data);
    await refreshGoals();
  }, [refreshGoals]);

  const updateGoal = useCallback(async (id: string, data: any) => {
    await db.updateGoal(id, data);
    await refreshGoals();
  }, [refreshGoals]);

  const deleteGoal = useCallback(async (id: string) => {
    await db.deleteGoal(id);
    await refreshGoals();
  }, [refreshGoals]);

  const addMilestone = useCallback(async (goalId: string, titulo: string) => {
    await db.addMilestone(goalId, titulo);
    await refreshGoals();
  }, [refreshGoals]);

  const toggleMilestone = useCallback(async (id: string) => {
    await db.toggleMilestone(id);
    await refreshGoals();
  }, [refreshGoals]);

  const deleteMilestone = useCallback(async (id: string) => {
    await db.deleteMilestone(id);
    await refreshGoals();
  }, [refreshGoals]);

  /* Notas */
  const addNota = useCallback(async (titulo: string, conteudo?: string) => {
    const id = await db.addNota(titulo, conteudo);
    await refreshNotas();
    return id;
  }, [refreshNotas]);

  const updateNota = useCallback(async (id: string, data: any) => {
    await db.updateNota(id, data);
    await refreshNotas();
  }, [refreshNotas]);

  const deleteNota = useCallback(async (id: string) => {
    await db.deleteNota(id);
    await refreshNotas();
  }, [refreshNotas]);

  /* Finanças */
  const addTransacao = useCallback(async (data: any) => {
    await db.addTransacao(data);
    await refreshTransacoes();
  }, [refreshTransacoes]);

  const deleteTransacao = useCallback(async (id: string) => {
    await db.deleteTransacao(id);
    await refreshTransacoes();
  }, [refreshTransacoes]);

  const addPeso = useCallback(async (peso: number) => {
    await db.addPeso(peso);
    await refreshTransacoes();
  }, [refreshTransacoes]);

  /* Freelas */
  const addFreela = useCallback(async (data: any) => {
    await db.addFreela(data);
    await refreshFreelas();
  }, [refreshFreelas]);

  const updateFreela = useCallback(async (id: string, data: any) => {
    await db.updateFreela(id, data);
    await refreshFreelas();
  }, [refreshFreelas]);

  const deleteFreela = useCallback(async (id: string) => {
    await db.deleteFreela(id);
    await refreshFreelas();
  }, [refreshFreelas]);

  return (
    <AppDataContext.Provider value={{
      materias, atividades, goals, notas, transacoes, pesos, freelas, loading,
      refreshMaterias, refreshGoals, refreshNotas, refreshTransacoes, refreshFreelas, refreshAll,
      addMateria, updateMateria: updateMateriaCtx, deleteMateria,
      addFalta, removeFalta,
      addAtividade, updateAtividade, deleteAtividade,
      addGoal, updateGoal, deleteGoal, addMilestone, toggleMilestone, deleteMilestone,
      addNota, updateNota, deleteNota,
      addTransacao, deleteTransacao, addPeso,
      addFreela, updateFreela, deleteFreela,
    }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be inside AppDataProvider");
  return ctx;
}
