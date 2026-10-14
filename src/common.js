export const ID = "com.nikita.books";

export const BOOKS = `${ID}/books`;    // старе місце книг у метаданих кімнати — лише для перенесення
export const REQ = `${ID}/req`;        // канал: гравець просить книгу в Майстра
export const DATA = `${ID}/data`;      // канал: книга шматками від Майстра
export const ATTACH = `${ID}/attach`;  // id книги на токені
export const BOOK = `${ID}/book`;      // сама книга на токені — її читають гравці, навіть коли Майстра немає
export const OPEN = `${ID}/open`;      // канал старої версії: показати книгу всім (книга вже в усіх)
export const READER = `${ID}/reader`;  // id поповера-читалки

export const STYLES = [
  { key: "leather", name: "Шкіряний записник" },
  { key: "parchment", name: "Стара книга" },
  { key: "arcane", name: "Чаклунський гримуар" },
  { key: "letter", name: "Лист чи нотатка" },
];

// Шрифти з підтримкою кирилиці. Ключ іде в клас на сторінці.
export const FONTS = [
  { key: "print",    name: "Друк (Garamond)",        sample: "Аа Бб Вв" },
  { key: "quill",    name: "Пером (Bad Script)",      sample: "Аа Бб Вв" },
  { key: "hand",     name: "Недбалий почерк (Caveat)", sample: "Аа Бб Вв" },
  { key: "script",   name: "Курсив (Marck Script)",   sample: "Аа Бб Вв" },
  { key: "pencil",   name: "Олівцем (Neucha)",        sample: "Аа Бб Вв" },
  { key: "charter",  name: "Устав (Ruslan Display)",  sample: "Аа Бб Вв" },
  { key: "solemn",   name: "Урочистий (Yeseva One)",  sample: "Аа Бб Вв" },
  { key: "machine",  name: "Друкарська машинка",      sample: "Аа Бб Вв" },
];

export const emptyBook = () => ({
  id: "b" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
  title: "Нова книга",
  style: "leather",
  font: "print",
  pages: [""],
});
