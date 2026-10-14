// Де живуть книги.
// Раніше — у метаданих кімнати, а їх Owlbear обмежує 16 кБ на ВСІ розширення разом.
// Тепер:
//  • прикріплена книга лежить на самому предметі мапи (метадані предмета) — гравці читають її
//    будь-коли, навіть без Майстра;
//  • усі книги, разом із чернетками, — у браузері Майстра (це його робоча копія для редактора);
//  • неприкріплену книгу, яку Майстер «показує всім», гравці отримують повідомленнями й тримають копію.
// Предмети заодно служать резервною копією: якщо в браузері Майстра книги немає, а на предметі є —
// вона повертається в його список.
import OBR from "@owlbear-rodeo/sdk";
import { BOOKS, REQ, DATA, ATTACH, BOOK } from "./common.js";

const KEY = "knyhy.books";          // у Майстра — усі книги; у гравця — отримані
const MOVED = "knyhy.moved";        // позначка: книги щойно перенесено з кімнати
const GONE = "knyhy.deleted";       // id видалених Майстром книг — щоб предмети їх не повертали
const PART = 5000;                  // символів в одному повідомленні (межа Owlbear — 16 кБ)

export function getBooks() {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}") ?? {}; } catch { return {}; }
}
export function setBooks(books) {
  try { localStorage.setItem(KEY, JSON.stringify(books)); return true; } catch { return false; }
}
export const wasMoved = () => { try { return localStorage.getItem(MOVED); } catch { return null; } };
export const clearMoved = () => { try { localStorage.removeItem(MOVED); } catch { /* */ } };

// Книги з кімнати → у браузер Майстра. Кімнату звільняємо лише після того, як копія збереглась.
export async function migrate() {
  const room = await OBR.room.getMetadata();
  const old = room[BOOKS];
  if (!old || !Object.keys(old).length) {
    if (old) await OBR.room.setMetadata({ [BOOKS]: undefined });
    return 0;
  }
  const merged = { ...old, ...getBooks() };   // якщо книга вже є тут — лишаємо тутешню
  if (!setBooks(merged)) return 0;
  const check = getBooks();
  if (Object.keys(old).some((id) => !check[id])) return 0;
  try { localStorage.setItem(MOVED, String(Object.keys(old).length)); } catch { /* */ }
  await OBR.room.setMetadata({ [BOOKS]: undefined });
  return Object.keys(old).length;
}

// Майстер: розіслати книгу гравцям. open — одразу відкрити її в усіх.
export async function sendBook(bookId, open) {
  const book = getBooks()[bookId];
  if (!book) return;
  const text = JSON.stringify(book);
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const of = Math.max(1, Math.ceil(text.length / PART));
  for (let k = 0; k < of; k++) {
    await OBR.broadcast.sendMessage(DATA, { id, k, of, bookId, open: Boolean(open), part: text.slice(k * PART, (k + 1) * PART) }, { destination: "REMOTE" });
  }
}

// Гравець: зібрати книгу зі шматків і покласти в свою копію
const incoming = new Map();
export function takePart(data, done) {
  if (!data?.id) return;
  const got = incoming.get(data.id) ?? [];
  got[data.k] = data.part;
  incoming.set(data.id, got);
  if (got.filter((x) => x != null).length < data.of) return;
  incoming.delete(data.id);
  try {
    const book = JSON.parse(got.join(""));
    setBooks({ ...getBooks(), [book.id]: book });
    done(book, data.open);
  } catch (err) { console.error("Книги: не вдалося зібрати книгу", err); }
}

export const askBook = (bookId) => OBR.broadcast.sendMessage(REQ, { bookId }, { destination: "REMOTE" }).catch(() => {});

// Позначка у Майстра: цю книгу гравці вже мають — правки до неї розсилаються їм одразу
export function share(bookId) {
  const books = getBooks();
  if (books[bookId] && !books[bookId].shared) {
    books[bookId].shared = true;
    setBooks(books);
  }
}

// --- книги на предметах ---

const clean = (book) => { const { shared, ...rest } = book; return rest; };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const gone = () => { try { return new Set(JSON.parse(localStorage.getItem(GONE) ?? "[]")); } catch { return new Set(); } };
export function forget(bookId) {
  const set = gone(); set.add(bookId);
  try { localStorage.setItem(GONE, JSON.stringify([...set])); } catch { /* */ }
}
export function unforget(bookId) {
  const set = gone(); set.delete(bookId);
  try { localStorage.setItem(GONE, JSON.stringify([...set])); } catch { /* */ }
}

// Читалка: книга з предмета у відкритій сцені, інакше — зі своєї копії
export async function findBook(bookId) {
  try {
    if (await OBR.scene.isReady()) {
      const [item] = await OBR.scene.items.getItems((i) => i.metadata?.[ATTACH] === bookId && i.metadata?.[BOOK]);
      if (item) return item.metadata[BOOK];
    }
  } catch { /* сцена недоступна — беремо копію */ }
  return getBooks()[bookId] ?? null;
}

// Майстер: покласти свіжу версію книги на всі предмети з нею у відкритій сцені
export async function pushToItems(bookId) {
  if (!(await OBR.scene.isReady())) return;
  const book = getBooks()[bookId];
  // Книги немає ні тут, ні серед видалених (скажімо, інший комп'ютер) — предмет не чіпаємо
  if (!book && !gone().has(bookId)) return;
  const items = await OBR.scene.items.getItems((i) => i.metadata?.[ATTACH] === bookId);
  const stale = items.filter((i) => !book || !same(i.metadata[BOOK], clean(book)));
  if (!stale.length) return;
  await OBR.scene.items.updateItems(stale.map((i) => i.id), (drafts) => {
    for (const d of drafts) {
      if (book) d.metadata[BOOK] = clean(book);
      else { delete d.metadata[BOOK]; delete d.metadata[ATTACH]; }   // книгу видалено
    }
  });
}

// Майстер, щойно відкрилась сцена: оновити книги на предметах і забрати ті, яких у нього немає
export async function syncScene() {
  if (!(await OBR.scene.isReady())) return;
  const items = await OBR.scene.items.getItems((i) => i.metadata?.[ATTACH]);
  const books = getBooks();
  const removed = gone();
  let found = 0;
  for (const i of items) {
    const id = i.metadata[ATTACH];
    if (!books[id] && i.metadata[BOOK] && !removed.has(id)) { books[id] = i.metadata[BOOK]; found++; }
  }
  if (found) setBooks(books);
  for (const id of new Set(items.map((i) => i.metadata[ATTACH]))) await pushToItems(id);
  return found;
}
