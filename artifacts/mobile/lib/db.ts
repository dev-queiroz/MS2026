import * as SQLite from "expo-sqlite";

let _dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_dbPromise) return _dbPromise;

  _dbPromise = (async () => {
    const db = await SQLite.openDatabaseAsync("meu_futuro_2026.db");
    await initSchema(db);
    return db;
  })();

  return _dbPromise;
}

async function initSchema(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS materias (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      semestre INTEGER DEFAULT 1,
      maxFaltas INTEGER DEFAULT 2,
      cor TEXT DEFAULT '#4F7FFF',
      nota REAL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS faltas_registro (
      id TEXT PRIMARY KEY,
      materiaId TEXT NOT NULL,
      data TEXT NOT NULL,
      FOREIGN KEY(materiaId) REFERENCES materias(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS atividades (
      id TEXT PRIMARY KEY,
      materiaId TEXT NOT NULL,
      titulo TEXT NOT NULL,
      tipo TEXT DEFAULT 'atividade',
      prazo TEXT,
      status TEXT DEFAULT 'pendente',
      concluida INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      notificationId TEXT,
      FOREIGN KEY(materiaId) REFERENCES materias(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      especifica TEXT DEFAULT '',
      mensuravel TEXT DEFAULT '',
      metrica TEXT DEFAULT '',
      metaNumerica REAL DEFAULT 100,
      valorAtual REAL DEFAULT 0,
      alcancavel TEXT DEFAULT '',
      relevante TEXT DEFAULT '',
      prazo TEXT,
      progresso INTEGER DEFAULT 0,
      cor TEXT DEFAULT '#4F7FFF',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id TEXT PRIMARY KEY,
      goalId TEXT NOT NULL,
      titulo TEXT NOT NULL,
      concluido INTEGER DEFAULT 0,
      FOREIGN KEY(goalId) REFERENCES goals(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notas (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      conteudo TEXT DEFAULT '',
      updatedAt TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transacoes (
      id TEXT PRIMARY KEY,
      tipo TEXT NOT NULL,
      descricao TEXT NOT NULL,
      valor REAL NOT NULL,
      categoria TEXT DEFAULT 'geral',
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pesos (
      id TEXT PRIMARY KEY,
      peso REAL NOT NULL,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS freelas (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      plataforma TEXT DEFAULT 'Upwork',
      status TEXT DEFAULT 'prospectando',
      valor REAL,
      descricao TEXT DEFAULT '',
      notas TEXT DEFAULT '',
      dataCriacao TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_faltas_materia ON faltas_registro(materiaId);
    CREATE INDEX IF NOT EXISTS idx_atividades_materia ON atividades(materiaId);
    CREATE INDEX IF NOT EXISTS idx_atividades_prazo ON atividades(prazo);
    CREATE INDEX IF NOT EXISTS idx_milestones_goal ON milestones(goalId);
  `);

  // Ensure notificationId exists for older tables
  try {
    const tableInfo = await db.getAllAsync<{ name: string }>("PRAGMA table_info(atividades)");
    if (!tableInfo.find(c => c.name === 'notificationId')) {
      await db.execAsync("ALTER TABLE atividades ADD COLUMN notificationId TEXT;");
    }
  } catch (e) { }

  // Ensure faltasAtuais exists in materias
  try {
    const tableInfo = await db.getAllAsync<{ name: string }>("PRAGMA table_info(materias)");
    if (!tableInfo.find(c => c.name === 'faltasAtuais')) {
      await db.execAsync("ALTER TABLE materias ADD COLUMN faltasAtuais INTEGER DEFAULT 0;");
    }
  } catch (e) { }
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/* ─── MATÉRIAS ─── */

export async function getMaterias() {
  const db = await getDb();
  try {
    const rows = await db.getAllAsync<any>("SELECT * FROM materias ORDER BY createdAt");
    return rows.map(r => ({
      ...r,
      maxFaltas: r.maxFaltas ?? 2,
      faltasAtuais: r.faltasAtuais ?? 0,
      nota: r.nota ?? undefined,
    }));
  } catch (error) {
    console.error("Error fetching materias:", error);
    return [];
  }
}

export async function addMateria(data: { nome: string; semestre?: number; maxFaltas?: number; cor?: string }) {
  const db = await getDb();
  const id = uid();
  await db.runAsync(
    "INSERT INTO materias (id, nome, semestre, maxFaltas, cor, createdAt) VALUES (?,?,?,?,?,?)",
    [id, data.nome, data.semestre ?? 1, data.maxFaltas ?? 2, data.cor ?? "#4F7FFF", new Date().toISOString()]
  );
  return id;
}

export async function updateMateria(id: string, data: { nome?: string; semestre?: number; maxFaltas?: number; cor?: string; nota?: number }) {
  const db = await getDb();
  const fields: string[] = [];
  const vals: any[] = [];
  if (data.nome !== undefined) { fields.push("nome=?"); vals.push(data.nome); }
  if (data.semestre !== undefined) { fields.push("semestre=?"); vals.push(data.semestre); }
  if (data.maxFaltas !== undefined) { fields.push("maxFaltas=?"); vals.push(data.maxFaltas); }
  if (data.cor !== undefined) { fields.push("cor=?"); vals.push(data.cor); }
  if (data.nota !== undefined) { fields.push("nota=?"); vals.push(data.nota); }
  if (fields.length) {
    vals.push(id);
    await db.runAsync(`UPDATE materias SET ${fields.join(",")} WHERE id=?`, vals);
  }
}

export async function deleteMateria(id: string) {
  const db = await getDb();
  await db.runAsync("DELETE FROM materias WHERE id=?", [id]);
}

/* ─── FALTAS ─── */

export async function getFaltas(materiaId: string) {
  const db = await getDb();
  return db.getAllAsync<any>("SELECT * FROM faltas_registro WHERE materiaId=? ORDER BY data DESC", [materiaId]);
}

export async function addFalta(materiaId: string) {
  const db = await getDb();
  await db.runAsync("UPDATE materias SET faltasAtuais = faltasAtuais + 1 WHERE id=?", [materiaId]);
}

export async function removeFalta(materiaId: string) {
  const db = await getDb();
  await db.runAsync("UPDATE materias SET faltasAtuais = MAX(0, faltasAtuais - 1) WHERE id=?", [materiaId]);
}

export async function getFaltaCount(materiaId: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(*) as c FROM faltas_registro WHERE materiaId=?", [materiaId]
  );
  return row?.c ?? 0;
}

export async function getAllFaltaCounts(): Promise<Record<string, number>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ materiaId: string; c: number }>(
    "SELECT materiaId, COUNT(*) as c FROM faltas_registro GROUP BY materiaId"
  );
  const result: Record<string, number> = {};
  rows.forEach(r => { result[r.materiaId] = r.c; });
  return result;
}

/* ─── ATIVIDADES ─── */

export async function getAtividades(materiaId?: string) {
  const db = await getDb();
  if (materiaId) {
    return db.getAllAsync<any>("SELECT * FROM atividades WHERE materiaId=? ORDER BY prazo ASC, createdAt DESC", [materiaId]);
  }
  return db.getAllAsync<any>("SELECT * FROM atividades ORDER BY prazo ASC");
}

export async function addAtividade(data: { materiaId: string; titulo: string; tipo?: string; prazo?: string; status?: string; notificationId?: string | null }) {
  const db = await getDb();
  const id = uid();
  await db.runAsync(
    "INSERT INTO atividades (id, materiaId, titulo, tipo, prazo, status, createdAt, notificationId) VALUES (?,?,?,?,?,?,?,?)",
    [id, data.materiaId, data.titulo, data.tipo ?? "atividade", data.prazo ?? null, data.status ?? "pendente", new Date().toISOString(), data.notificationId ?? null]
  );
  return id;
}

export async function updateAtividade(id: string, data: { titulo?: string; tipo?: string; prazo?: string; status?: string; concluida?: boolean; notificationId?: string | null }) {
  const db = await getDb();
  const fields: string[] = [];
  const vals: any[] = [];
  if (data.titulo !== undefined) { fields.push("titulo=?"); vals.push(data.titulo); }
  if (data.tipo !== undefined) { fields.push("tipo=?"); vals.push(data.tipo); }
  if (data.prazo !== undefined) { fields.push("prazo=?"); vals.push(data.prazo); }
  if (data.status !== undefined) { fields.push("status=?"); vals.push(data.status); }
  if (data.concluida !== undefined) { fields.push("concluida=?"); vals.push(data.concluida ? 1 : 0); }
  if (data.notificationId !== undefined) { fields.push("notificationId=?"); vals.push(data.notificationId); }
  if (fields.length) {
    vals.push(id);
    await db.runAsync(`UPDATE atividades SET ${fields.join(",")} WHERE id=?`, vals);
  }
}

export async function deleteAtividade(id: string) {
  const db = await getDb();
  await db.runAsync("DELETE FROM atividades WHERE id=?", [id]);
}

/* ─── GOALS SMART ─── */

export async function getGoals() {
  const db = await getDb();
  const goals = await db.getAllAsync<any>("SELECT * FROM goals ORDER BY createdAt");
  const milestones = await db.getAllAsync<any>("SELECT * FROM milestones ORDER BY id");
  return goals.map((g: any) => ({
    ...g,
    milestones: milestones.filter((m: any) => m.goalId === g.id).map((m: any) => ({
      ...m,
      concluido: m.concluido === 1,
    })),
  }));
}

export async function addGoal(data: {
  titulo: string; especifica?: string; mensuravel?: string; metrica?: string;
  metaNumerica?: number; valorAtual?: number; alcancavel?: string; relevante?: string;
  prazo?: string; progresso?: number; cor?: string;
}) {
  const db = await getDb();
  const id = uid();
  await db.runAsync(
    `INSERT INTO goals (id,titulo,especifica,mensuravel,metrica,metaNumerica,valorAtual,alcancavel,relevante,prazo,progresso,cor,createdAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, data.titulo, data.especifica ?? "", data.mensuravel ?? "", data.metrica ?? "",
      data.metaNumerica ?? 100, data.valorAtual ?? 0, data.alcancavel ?? "",
      data.relevante ?? "", data.prazo ?? null, data.progresso ?? 0, data.cor ?? "#4F7FFF",
      new Date().toISOString()]
  );
  return id;
}

export async function updateGoal(id: string, data: Partial<{
  titulo: string; especifica: string; mensuravel: string; metrica: string;
  metaNumerica: number; valorAtual: number; alcancavel: string; relevante: string;
  prazo: string; progresso: number; cor: string;
}>) {
  const db = await getDb();
  const keys = Object.keys(data) as string[];
  if (!keys.length) return;
  const fields = keys.map(k => `${k}=?`).join(",");
  const vals = [...keys.map(k => (data as any)[k]), id];
  await db.runAsync(`UPDATE goals SET ${fields} WHERE id=?`, vals);
}

export async function deleteGoal(id: string) {
  const db = await getDb();
  await db.runAsync("DELETE FROM goals WHERE id=?", [id]);
}

export async function addMilestone(goalId: string, titulo: string) {
  const db = await getDb();
  const id = uid();
  await db.runAsync("INSERT INTO milestones (id,goalId,titulo,concluido) VALUES (?,?,?,?)", [id, goalId, titulo, 0]);
  return id;
}

export async function toggleMilestone(id: string) {
  const db = await getDb();
  await db.runAsync("UPDATE milestones SET concluido = CASE WHEN concluido=1 THEN 0 ELSE 1 END WHERE id=?", [id]);
}

export async function deleteMilestone(id: string) {
  const db = await getDb();
  await db.runAsync("DELETE FROM milestones WHERE id=?", [id]);
}

/* ─── NOTAS ─── */

export async function getNotas() {
  const db = await getDb();
  return db.getAllAsync<any>("SELECT * FROM notas ORDER BY updatedAt DESC");
}

export async function addNota(titulo: string, conteudo: string = "") {
  const db = await getDb();
  const id = uid();
  const now = new Date().toISOString();
  await db.runAsync("INSERT INTO notas (id,titulo,conteudo,updatedAt,createdAt) VALUES (?,?,?,?,?)", [id, titulo, conteudo, now, now]);
  return id;
}

export async function updateNota(id: string, data: { titulo?: string; conteudo?: string }) {
  const db = await getDb();
  const fields: string[] = ["updatedAt=?"];
  const vals: any[] = [new Date().toISOString()];
  if (data.titulo !== undefined) { fields.push("titulo=?"); vals.push(data.titulo); }
  if (data.conteudo !== undefined) { fields.push("conteudo=?"); vals.push(data.conteudo); }
  vals.push(id);
  await db.runAsync(`UPDATE notas SET ${fields.join(",")} WHERE id=?`, vals);
}

export async function deleteNota(id: string) {
  const db = await getDb();
  await db.runAsync("DELETE FROM notas WHERE id=?", [id]);
}

/* ─── TRANSAÇÕES ─── */

export async function getTransacoes() {
  const db = await getDb();
  return db.getAllAsync<any>("SELECT * FROM transacoes ORDER BY data DESC LIMIT 50");
}

export async function addTransacao(data: { tipo: string; descricao: string; valor: number; categoria?: string }) {
  const db = await getDb();
  const id = uid();
  await db.runAsync("INSERT INTO transacoes (id,tipo,descricao,valor,categoria,data) VALUES (?,?,?,?,?,?)",
    [id, data.tipo, data.descricao, data.valor, data.categoria ?? "geral", new Date().toISOString()]);
  return id;
}

export async function deleteTransacao(id: string) {
  const db = await getDb();
  await db.runAsync("DELETE FROM transacoes WHERE id=?", [id]);
}

/* ─── PESOS ─── */

export async function getPesos() {
  const db = await getDb();
  return db.getAllAsync<any>("SELECT * FROM pesos ORDER BY data");
}

export async function addPeso(peso: number) {
  const db = await getDb();
  const id = uid();
  await db.runAsync("INSERT INTO pesos (id,peso,data) VALUES (?,?,?)", [id, peso, new Date().toISOString()]);
}

/* ─── FREELAS ─── */

export async function getFreelas() {
  const db = await getDb();
  return db.getAllAsync<any>("SELECT * FROM freelas ORDER BY dataCriacao DESC");
}

export async function addFreela(data: { titulo: string; plataforma?: string; descricao?: string }) {
  const db = await getDb();
  const id = uid();
  await db.runAsync("INSERT INTO freelas (id,titulo,plataforma,status,descricao,notas,dataCriacao) VALUES (?,?,?,?,?,?,?)",
    [id, data.titulo, data.plataforma ?? "Upwork", "prospectando", data.descricao ?? "", "", new Date().toISOString()]);
  return id;
}

export async function updateFreela(id: string, data: { status?: string; valor?: number; notas?: string }) {
  const db = await getDb();
  const fields: string[] = [];
  const vals: any[] = [];
  if (data.status !== undefined) { fields.push("status=?"); vals.push(data.status); }
  if (data.valor !== undefined) { fields.push("valor=?"); vals.push(data.valor); }
  if (data.notas !== undefined) { fields.push("notas=?"); vals.push(data.notas); }
  if (fields.length) { vals.push(id); await db.runAsync(`UPDATE freelas SET ${fields.join(",")} WHERE id=?`, vals); }
}

export async function deleteFreela(id: string) {
  const db = await getDb();
  await db.runAsync("DELETE FROM freelas WHERE id=?", [id]);
}

/* ─── SETTINGS ─── */

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key=?", [key]);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  const db = await getDb();
  await db.runAsync("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, value]);
}

/* ─── BACKUP JSON ─── */

export async function exportAllDataAsJSON() {
  const db = await getDb();
  const json: any = {};
  const tables = ["materias", "faltas_registro", "atividades", "goals", "milestones", "notas", "transacoes", "pesos", "freelas", "settings"];

  for (const t of tables) {
    json[t] = await db.getAllAsync(`SELECT * FROM ${t}`);
  }

  return JSON.stringify(json, null, 2);
}
