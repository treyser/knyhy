export const ID = "com.nikita.books";

export const BOOKS = `${ID}/books`;    // усі книги — метадані кімнати
export const ATTACH = `${ID}/attach`;  // id книги на токені
export const OPEN = `${ID}/open`;      // канал: показати книгу всім
export const READER = `${ID}/reader`;  // id поповера-читалки

export const STYLES = [
  { key: "leather", name: "Шкіряний записник" },
  { key: "parchment", name: "Стара книга" },
  { key: "arcane", name: "Чаклунський гримуар" },
  { key: "letter", name: "Лист чи нотатка" },
];

export const emptyBook = () => ({
  id: "b" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
  title: "Нова книга",
  style: "leather",
  pages: [""],
});
