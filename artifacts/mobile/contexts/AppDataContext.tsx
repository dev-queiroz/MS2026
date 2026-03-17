import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface Materia {
  id: string;
  nome: string;
  semestre: number;
  nota?: number;
  faltas: number;
  maxFaltas: number;
  cor: string;
  atividades: Atividade[];
}

export interface Atividade {
  id: string;
  titulo: string;
  descricao?: string;
  dataLimite?: string;
  concluida: boolean;
  materiaId: string;
}

export interface StudyTracker {
  id: string;
  nome: string;
  descricao: string;
  cor: string;
  icon: string;
  minutosHoje: number;
  minutosTotal: number;
  streakDias: number;
  ultimoEstudo?: string;
  checklistDiario: CheckItem[];
}

export interface CheckItem {
  id: string;
  texto: string;
  concluido: boolean;
}

export interface Sonho {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  prazo?: string;
  progresso: number;
  fases: FaseSonho[];
  cor: string;
}

export interface FaseSonho {
  id: string;
  titulo: string;
  descricao: string;
  concluida: boolean;
  tarefas: CheckItem[];
}

export interface Transacao {
  id: string;
  tipo: "entrada" | "saida";
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
}

export interface PesoRegistro {
  data: string;
  peso: number;
}

export interface TreinoItem {
  id: string;
  exercicio: string;
  series: number;
  reps: string;
  concluido: boolean;
}

export interface Treino {
  id: string;
  nome: string;
  tipo: string;
  exercicios: TreinoItem[];
  ultimoFeito?: string;
  diasSemana: number[];
}

export interface Freela {
  id: string;
  titulo: string;
  plataforma: string;
  status: "prospectando" | "enviado" | "negociando" | "fechado" | "concluido";
  valor?: number;
  descricao?: string;
  prazo?: string;
  notas: string;
  dataCriacao: string;
}

export interface PomodoroSession {
  id: string;
  materiaId?: string;
  studyId?: string;
  duracao: number;
  data: string;
}

export interface AppData {
  materias: Materia[];
  studyTrackers: StudyTracker[];
  sonhos: Sonho[];
  transacoes: Transacao[];
  pesos: PesoRegistro[];
  treinos: Treino[];
  freelas: Freela[];
  pomodoroSessions: PomodoroSession[];
  streaks: Record<string, number>;
  lastUpdated: string;
}

const DEFAULT_MATERIAS: Materia[] = [
  { id: "m1", nome: "Pré-cálculo", semestre: 1, faltas: 0, maxFaltas: 15, cor: "#9C6FFF", atividades: [] },
  { id: "m2", nome: "Matemática Básica", semestre: 1, faltas: 0, maxFaltas: 15, cor: "#4F7FFF", atividades: [] },
  { id: "m3", nome: "Fund. de Programação", semestre: 1, faltas: 0, maxFaltas: 15, cor: "#00BCD4", atividades: [] },
  { id: "m4", nome: "Ética, Direito e Legislação", semestre: 1, faltas: 0, maxFaltas: 15, cor: "#FFB347", atividades: [] },
  { id: "m5", nome: "Intro à Ciência da Computação", semestre: 1, faltas: 0, maxFaltas: 15, cor: "#4CAF50", atividades: [] },
  { id: "m6", nome: "IHC", semestre: 1, faltas: 0, maxFaltas: 15, cor: "#FF7043", atividades: [] },
];

const DEFAULT_STUDY_TRACKERS: StudyTracker[] = [
  {
    id: "s1", nome: "Inglês", descricao: "Foco: leitura e conversação", cor: "#4F7FFF", icon: "globe",
    minutosHoje: 0, minutosTotal: 0, streakDias: 0, checklistDiario: [
      { id: "c1", texto: "Ler 1 artigo em inglês", concluido: false },
      { id: "c2", texto: "Estudar 10 vocabulários novos", concluido: false },
      { id: "c3", texto: "Praticar 5 frases em voz alta", concluido: false },
    ],
  },
  {
    id: "s2", nome: "Java", descricao: "Backend development", cor: "#FF7043", icon: "code",
    minutosHoje: 0, minutosTotal: 0, streakDias: 0, checklistDiario: [
      { id: "c4", texto: "Código por 30 min", concluido: false },
      { id: "c5", texto: "Estudar POO", concluido: false },
    ],
  },
  {
    id: "s3", nome: "TypeScript", descricao: "Fullstack web", cor: "#00BCD4", icon: "layers",
    minutosHoje: 0, minutosTotal: 0, streakDias: 0, checklistDiario: [
      { id: "c6", texto: "Projeto pessoal por 30 min", concluido: false },
      { id: "c7", texto: "Estudar tipos avançados", concluido: false },
    ],
  },
  {
    id: "s4", nome: "Go", descricao: "Backend performático", cor: "#9C6FFF", icon: "zap",
    minutosHoje: 0, minutosTotal: 0, streakDias: 0, checklistDiario: [
      { id: "c8", texto: "Tutorial Go por 20 min", concluido: false },
    ],
  },
];

const DEFAULT_SONHOS: Sonho[] = [
  {
    id: "d1",
    titulo: "Morar em Londres como Programador",
    descricao: "Meta principal: trabalhar como dev em Londres, UK",
    categoria: "carreira",
    prazo: "2028-01-01",
    progresso: 5,
    cor: "#FFB347",
    fases: [
      {
        id: "f1", titulo: "Fase 1: Base Sólida (até Set/2026)",
        descricao: "Construir portfólio e habilidades fundamentais",
        concluida: false,
        tarefas: [
          { id: "t1", texto: "5 projetos no GitHub (Java/Go/TS)", concluido: false },
          { id: "t2", texto: "Inglês nível B2", concluido: false },
          { id: "t3", texto: "Primeiro freela concluído", concluido: false },
          { id: "t4", texto: "LinkedIn otimizado", concluido: false },
          { id: "t5", texto: "Aprender Go básico", concluido: false },
        ],
      },
      {
        id: "f2", titulo: "Fase 2: Global Talent Visa (a partir de 18 anos)",
        descricao: "Aplicar para o Global Talent Visa via Tech Nation",
        concluida: false,
        tarefas: [
          { id: "t6", texto: "Reunir evidências de contribuição tech", concluido: false },
          { id: "t7", texto: "Carta de endosso (Tech Nation)", concluido: false },
          { id: "t8", texto: "Portfólio público forte", concluido: false },
          { id: "t9", texto: "Inglês C1", concluido: false },
          { id: "t10", texto: "Submeter aplicação Gov.UK", concluido: false },
        ],
      },
      {
        id: "f3", titulo: "Fase 3: Londres - Primeiro Emprego",
        descricao: "Chegar e conseguir o primeiro emprego dev (£38k-£45k)",
        concluida: false,
        tarefas: [
          { id: "t11", texto: "Aplicar para vagas junior UK", concluido: false },
          { id: "t12", texto: "Entrevistas técnicas em inglês", concluido: false },
          { id: "t13", texto: "Oferta assinada £38k+", concluido: false },
          { id: "t14", texto: "Documentos de imigração", concluido: false },
          { id: "t15", texto: "Apartamento em Londres", concluido: false },
        ],
      },
    ],
  },
  {
    id: "d2", titulo: "Independência Financeira", descricao: "Renda suficiente para viver sem depender de outros",
    categoria: "financeiro", progresso: 3, cor: "#4CAF50",
    fases: [
      {
        id: "f4", titulo: "Primeiros Ganhos (2025-2026)",
        descricao: "Gerar renda com freelas", concluida: false,
        tarefas: [
          { id: "t16", texto: "Primeiro freela pago", concluido: false },
          { id: "t17", texto: "Conta bancária própria", concluido: false },
          { id: "t18", texto: "R$500/mês em freelas", concluido: false },
        ],
      },
    ],
  },
  {
    id: "d3", titulo: "Conhecer 3 Países de Primeiro Mundo", descricao: "França, Alemanha, Japão ou outros",
    categoria: "viagem", progresso: 0, cor: "#00BCD4",
    fases: [
      {
        id: "f5", titulo: "Planejamento e Poupança",
        descricao: "Poupar e planejar as viagens", concluida: false,
        tarefas: [
          { id: "t19", texto: "Passaporte válido", concluido: false },
          { id: "t20", texto: "Fundo de viagem R$5.000", concluido: false },
        ],
      },
    ],
  },
];

const DEFAULT_TREINOS: Treino[] = [
  {
    id: "tr1", nome: "Treino A - Peito e Tríceps", tipo: "musculação",
    ultimoFeito: undefined, diasSemana: [1, 3],
    exercicios: [
      { id: "e1", exercicio: "Flexão padrão", series: 4, reps: "15-20", concluido: false },
      { id: "e2", exercicio: "Flexão diamante", series: 3, reps: "12-15", concluido: false },
      { id: "e3", exercicio: "Tríceps banco", series: 3, reps: "15", concluido: false },
      { id: "e4", exercicio: "Pike push-up", series: 3, reps: "10-12", concluido: false },
    ],
  },
  {
    id: "tr2", nome: "Treino B - Costas e Bíceps", tipo: "musculação",
    ultimoFeito: undefined, diasSemana: [2, 4],
    exercicios: [
      { id: "e5", exercicio: "Barra fixa (ou negativa)", series: 4, reps: "Max", concluido: false },
      { id: "e6", exercicio: "Remada com mochila", series: 4, reps: "12-15", concluido: false },
      { id: "e7", exercicio: "Rosca com garrafa d'água", series: 3, reps: "15-20", concluido: false },
      { id: "e8", exercicio: "Superman", series: 3, reps: "15", concluido: false },
    ],
  },
  {
    id: "tr3", nome: "Treino C - Pernas e Core", tipo: "musculação",
    ultimoFeito: undefined, diasSemana: [5],
    exercicios: [
      { id: "e9", exercicio: "Agachamento livre", series: 4, reps: "20", concluido: false },
      { id: "e10", exercicio: "Afundo alternado", series: 3, reps: "12 cada", concluido: false },
      { id: "e11", exercicio: "Prancha", series: 3, reps: "45s", concluido: false },
      { id: "e12", exercicio: "Abdominal bicicleta", series: 3, reps: "20", concluido: false },
      { id: "e13", exercicio: "Elevação de quadril", series: 4, reps: "20", concluido: false },
    ],
  },
];

const DEFAULT_DATA: AppData = {
  materias: DEFAULT_MATERIAS,
  studyTrackers: DEFAULT_STUDY_TRACKERS,
  sonhos: DEFAULT_SONHOS,
  transacoes: [],
  pesos: [{ data: new Date().toISOString().split("T")[0], peso: 81 }],
  treinos: DEFAULT_TREINOS,
  freelas: [],
  pomodoroSessions: [],
  streaks: {},
  lastUpdated: new Date().toISOString(),
};

interface AppDataContextType {
  data: AppData;
  loading: boolean;
  updateData: (updater: (prev: AppData) => AppData) => Promise<void>;
  addTransacao: (t: Omit<Transacao, "id" | "data">) => Promise<void>;
  addPeso: (peso: number) => Promise<void>;
  toggleCheckItem: (studyId: string, itemId: string) => Promise<void>;
  toggleAtividade: (materiaId: string, atividadeId: string) => Promise<void>;
  addFreela: (f: Omit<Freela, "id" | "dataCriacao">) => Promise<void>;
  updateFreela: (id: string, updates: Partial<Freela>) => Promise<void>;
  toggleSonhoTarefa: (sonhoId: string, faseId: string, tarefaId: string) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | null>(null);

const STORAGE_KEY = "@meu_futuro_2026_data";

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AppData;
        setData({ ...DEFAULT_DATA, ...parsed });
      }
    } catch (e) {
      console.error("Failed to load data:", e);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (newData: AppData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch (e) {
      console.error("Failed to save data:", e);
    }
  };

  const updateData = useCallback(async (updater: (prev: AppData) => AppData) => {
    setData(prev => {
      const next = updater({ ...prev, lastUpdated: new Date().toISOString() });
      saveData(next);
      return next;
    });
  }, []);

  const addTransacao = useCallback(async (t: Omit<Transacao, "id" | "data">) => {
    await updateData(prev => ({
      ...prev,
      transacoes: [
        ...prev.transacoes,
        { ...t, id: Date.now().toString(), data: new Date().toISOString() },
      ],
    }));
  }, [updateData]);

  const addPeso = useCallback(async (peso: number) => {
    await updateData(prev => ({
      ...prev,
      pesos: [
        ...prev.pesos,
        { data: new Date().toISOString().split("T")[0], peso },
      ],
    }));
  }, [updateData]);

  const toggleCheckItem = useCallback(async (studyId: string, itemId: string) => {
    await updateData(prev => ({
      ...prev,
      studyTrackers: prev.studyTrackers.map(s =>
        s.id === studyId
          ? {
              ...s,
              checklistDiario: s.checklistDiario.map(c =>
                c.id === itemId ? { ...c, concluido: !c.concluido } : c
              ),
            }
          : s
      ),
    }));
  }, [updateData]);

  const toggleAtividade = useCallback(async (materiaId: string, atividadeId: string) => {
    await updateData(prev => ({
      ...prev,
      materias: prev.materias.map(m =>
        m.id === materiaId
          ? {
              ...m,
              atividades: m.atividades.map(a =>
                a.id === atividadeId ? { ...a, concluida: !a.concluida } : a
              ),
            }
          : m
      ),
    }));
  }, [updateData]);

  const addFreela = useCallback(async (f: Omit<Freela, "id" | "dataCriacao">) => {
    await updateData(prev => ({
      ...prev,
      freelas: [
        ...prev.freelas,
        { ...f, id: Date.now().toString(), dataCriacao: new Date().toISOString() },
      ],
    }));
  }, [updateData]);

  const updateFreela = useCallback(async (id: string, updates: Partial<Freela>) => {
    await updateData(prev => ({
      ...prev,
      freelas: prev.freelas.map(f => f.id === id ? { ...f, ...updates } : f),
    }));
  }, [updateData]);

  const toggleSonhoTarefa = useCallback(async (sonhoId: string, faseId: string, tarefaId: string) => {
    await updateData(prev => ({
      ...prev,
      sonhos: prev.sonhos.map(s =>
        s.id === sonhoId
          ? {
              ...s,
              fases: s.fases.map(f =>
                f.id === faseId
                  ? {
                      ...f,
                      tarefas: f.tarefas.map(t =>
                        t.id === tarefaId ? { ...t, concluido: !t.concluido } : t
                      ),
                    }
                  : f
              ),
            }
          : s
      ),
    }));
  }, [updateData]);

  return (
    <AppDataContext.Provider value={{
      data,
      loading,
      updateData,
      addTransacao,
      addPeso,
      toggleCheckItem,
      toggleAtividade,
      addFreela,
      updateFreela,
      toggleSonhoTarefa,
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
