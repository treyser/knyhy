import "./style.css";
import OBR from "@owlbear-rodeo/sdk";
import { ATTACH, BOOK } from "./common.js";
import { getBooks, sendBook, share } from "./store.js";
import { openReader } from "./reader-open.js";

const $ = (id) => document.getElementById(id);
let targets = [];

OBR.onReady(init);

async function init() {
  targets = (await OBR.player.getSelection()) ?? [];
  if (!targets.length) return;

  const items = await OBR.scene.items.getItems(targets);
  $("who").textContent =
    items.length > 1 ? `Вибрано: ${items.length}` : items[0]?.name || "Предмет";

  const books = getBooks();

  for (const book of Object.values(books)) {
    $("pick").appendChild(new Option(book.title || "Без назви", book.id));
  }
  $("pick").value = items[0]?.metadata[ATTACH] ?? "";

  $("attach").addEventListener("click", attach);
  $("open").addEventListener("click", open);

  if (!Object.keys(books).length) {
    $("hint").textContent = "Книг ще немає. Створи їх у вікні «Книги».";
  }
}

async function attach() {
  const id = $("pick").value;
  // Разом з id кладемо на предмет і саму книгу — так її прочитають і без Майстра
  const book = id ? getBooks()[id] : null;
  const copy = book ? (({ shared, ...rest }) => rest)(book) : null;
  await OBR.scene.items.updateItems(targets, (items) => {
    for (const item of items) {
      if (id) { item.metadata[ATTACH] = id; if (copy) item.metadata[BOOK] = copy; }
      else { delete item.metadata[ATTACH]; delete item.metadata[BOOK]; }
    }
  });
  $("hint").textContent = id
    ? "Прикріплено. Гравці побачать «Читати» в меню предмета."
    : "Книгу знято";
}

async function open() {
  const id = $("pick").value;
  if (!id) {
    $("hint").textContent = "Спершу обери книгу";
    return;
  }
  share(id);
  await sendBook(id, true);
  await openHere(id);
}

// Майстрові книга відкривається одразу: вона в нього вже є
async function openHere(bookId) {
  await openReader(bookId);
}
