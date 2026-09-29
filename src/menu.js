import "./style.css";
import OBR from "@owlbear-rodeo/sdk";
import { BOOKS, ATTACH, OPEN } from "./common.js";

const $ = (id) => document.getElementById(id);
let targets = [];

OBR.onReady(init);

async function init() {
  targets = (await OBR.player.getSelection()) ?? [];
  if (!targets.length) return;

  const items = await OBR.scene.items.getItems(targets);
  $("who").textContent =
    items.length > 1 ? `Вибрано: ${items.length}` : items[0]?.name || "Предмет";

  const meta = await OBR.room.getMetadata();
  const books = meta[BOOKS] ?? {};

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
  await OBR.scene.items.updateItems(targets, (items) => {
    for (const item of items) {
      if (id) item.metadata[ATTACH] = id;
      else delete item.metadata[ATTACH];
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
  await OBR.broadcast.sendMessage(OPEN, { bookId: id }, { destination: "ALL" });
}
