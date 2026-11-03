/* eslint-disable @typescript-eslint/no-explicit-any -- rows of every table pass through here */

/**
 * An in-memory stand-in for the Prisma client, used through the alias in
 * vitest.config.mts.
 *
 * It really applies `where` and `select`, so a test sees what the code would
 * get back: drop a schoolId from a query and another school's pupil appears.
 * Asserting on the query's arguments would only repeat the code.
 *
 * It covers what the access code uses and throws on anything else, rather than
 * answering wrongly. It does not check the SQL Prisma would generate.
 */
export type Row = Record<string, any>;

const TABLES = [
  "userProfile",
  "userPersonalDetails",
  "userStudentDetails",
  "userPaymentDetails",
  "userLoginSession",
  "school",
  "year",
  "schoolClassTeacher",
  "classroomSession",
] as const;
type Table = (typeof TABLES)[number];

export const db = Object.fromEntries(TABLES.map((t) => [t, []])) as unknown as Record<Table, Row[]>;

let nextId = BigInt(1000);

const same = (a: unknown, b: unknown) =>
  (a ?? null) === (b ?? null) || (a != null && b != null && typeof a !== "object" && String(a) === String(b));
const byId = (table: Table, id: unknown) => db[table].find((r) => same(r.id, id)) ?? null;
const first = (table: Table, column: string, value: unknown) =>
  db[table].find((r) => same(r[column], value)) ?? null;
const all = (table: Table, column: string, value: unknown) =>
  db[table].filter((r) => same(r[column], value));

const RELATIONS: Partial<Record<Table, Record<string, (row: Row) => unknown>>> = {
  userProfile: {
    school: (r) => (r.schoolId == null ? null : byId("school", r.schoolId)),
    personalDetails: (r) => first("userPersonalDetails", "userProfileId", r.id),
    studentDetails: (r) => first("userStudentDetails", "studentId", r.id),
    classroomTurns: (r) => all("classroomSession", "studentId", r.id),
  },
  userStudentDetails: {
    student: (r) => byId("userProfile", r.studentId),
    parent: (r) => (r.parentId == null ? null : byId("userProfile", r.parentId)),
    year: (r) => (r.studentYear == null ? null : byId("year", r.studentYear)),
  },
  userPaymentDetails: { profile: (r) => byId("userProfile", r.userProfileId) },
  year: {
    classTeachers: (r) => all("schoolClassTeacher", "classId", r.id),
    studentDetails: (r) => all("userStudentDetails", "studentYear", r.id),
  },
  schoolClassTeacher: { teacher: (r) => byId("userProfile", r.teacherId) },
};

/** Where a nested `create` puts its row, and the column that points back. */
const NESTED_CREATES: Record<string, { table: Table; column: string }> = {
  studentDetails: { table: "userStudentDetails", column: "studentId" },
  personalDetails: { table: "userPersonalDetails", column: "userProfileId" },
};

const isPlain = (value: unknown): value is Row =>
  typeof value === "object" && value !== null && Object.getPrototypeOf(value) === Object.prototype;

/** Adds a row to a table, with its relations readable as Prisma would nest them. */
export function insert(table: Table, data: Row): Row {
  const row: Row = { id: nextId++ };
  const nested: [string, Row][] = [];
  for (const [key, value] of Object.entries(data)) {
    if (isPlain(value) && "create" in value) nested.push([key, value.create]);
    else if (value !== undefined) row[key] = value;
  }
  for (const [name, read] of Object.entries(RELATIONS[table] ?? {})) {
    Object.defineProperty(row, name, { get: () => read(row), enumerable: false });
  }
  db[table].push(row);
  for (const [key, child] of nested) {
    const target = NESTED_CREATES[key];
    if (!target) throw new Error(`fake-prisma: no nested create for ${table}.${key}`);
    insert(target.table, { ...child, [target.column]: row.id });
  }
  return row;
}

/** Empties every table; the world is built again for each test. */
export function clearDb() {
  for (const table of TABLES) db[table].length = 0;
  nextId = BigInt(1000);
}

function matchesField(value: unknown, condition: unknown): boolean {
  if (!isPlain(condition)) return same(value, condition);
  if ("some" in condition) return (value as Row[]).some((r) => matches(r, condition.some));
  if ("in" in condition) return condition.in.some((c: unknown) => same(value, c));
  if ("startsWith" in condition) return String(value ?? "").startsWith(condition.startsWith);
  if ("equals" in condition) {
    if (condition.mode === "insensitive") {
      return String(value ?? "").toLowerCase() === String(condition.equals).toLowerCase();
    }
    return same(value, condition.equals);
  }
  // A filter on a related row. No row, no match.
  if (value === null || value === undefined) return false;
  if (!isPlain(value)) throw new Error(`fake-prisma: unsupported filter ${JSON.stringify(Object.keys(condition))}`);
  return matches(value, condition);
}

function matches(row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(([key, condition]) => {
    // Prisma ignores an undefined filter, which is exactly how a guard goes missing.
    if (condition === undefined) return true;
    if (["AND", "OR", "NOT"].includes(key)) throw new Error(`fake-prisma: ${key} is not supported`);
    return matchesField(row[key], condition);
  });
}

function project(row: Row, select?: Row): Row {
  if (!select) return { ...row };
  const out: Row = {};
  for (const [key, wanted] of Object.entries(select)) {
    if (wanted === true) {
      out[key] = row[key];
    } else if (key === "_count") {
      out._count = {};
      for (const [relation, spec] of Object.entries<Row>(wanted.select)) {
        out._count[relation] = (row[relation] as Row[]).filter((r) => matches(r, spec.where)).length;
      }
    } else if (Array.isArray(row[key])) {
      const rows = row[key].filter((r: Row) => matches(r, wanted.where));
      out[key] = rows.slice(0, wanted.take ?? rows.length).map((r: Row) => project(r, wanted.select));
    } else {
      out[key] = row[key] ? project(row[key], wanted.select) : null;
    }
  }
  return out;
}

function sorted(rows: Row[], orderBy?: Row): Row[] {
  if (!orderBy) return rows;
  const [[column, direction]] = Object.entries(orderBy);
  const sign = direction === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => (a[column] < b[column] ? -sign : a[column] > b[column] ? sign : 0));
}

function apply(row: Row, data: Row) {
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (isPlain(value) && "update" in value) apply(row[key], value.update);
    else row[key] = value;
  }
}

function delegate(table: Table) {
  const find = ({ where, orderBy, select }: Row = {}) => {
    const row = sorted(db[table].filter((r) => matches(r, where)), orderBy)[0];
    return row ? project(row, select) : null;
  };
  return {
    findFirst: async (args?: Row) => find(args),
    findUnique: async (args?: Row) => find(args),
    findMany: async ({ where, orderBy, select }: Row = {}) =>
      sorted(db[table].filter((r) => matches(r, where)), orderBy).map((r) => project(r, select)),
    count: async ({ where }: Row = {}) => db[table].filter((r) => matches(r, where)).length,
    create: async ({ data, select }: Row) => project(insert(table, data), select),
    update: async ({ where, data, select }: Row) => {
      const row = db[table].find((r) => matches(r, where));
      if (!row) throw new Error(`fake-prisma: no ${table} row to update`);
      apply(row, data);
      return project(row, select);
    },
    updateMany: async ({ where, data }: Row) => {
      const rows = db[table].filter((r) => matches(r, where));
      rows.forEach((r) => apply(r, data));
      return { count: rows.length };
    },
  };
}

export const prisma = Object.fromEntries(TABLES.map((t) => [t, delegate(t)])) as any;
