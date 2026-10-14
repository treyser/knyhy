import "./style.css";
import OBR from "@owlbear-rodeo/sdk";
import { STYLES, FONTS, emptyBook } from "./common.js";
import { getBooks, setBooks, migrate, wasMoved, clearMoved, sendBook, share, syncScene, pushToItems, forget, unforget } from "./store.js";
import { openReader } from "./reader-open.js";

const $ = (id) => document.getElementById(id);

let books = {};
let current = null;
let page = 0;

OBR.onReady(init);

async function init() {
  const isGM = (await OBR.player.getRole()) === "GM";
  $("gm").hidden = !isGM;
  $("player").hidden = isGM;
  if (!isGM) return;

  for (const s of STYLES) $("style").appendChild(new Option(s.name, s.key));
  for (const f of FONTS) $("font").appendChild(new Option(f.name, f.key));

  await migrate().catch(() => {});
  const found = await syncScene().catch(() => 0);
  books = await read();
  drawList();
  const moved = wasMoved();
  if (moved) {
    $("hint").textContent = `Книги (${moved}) перенесено з кімнати в цей браузер — у кімнаті звільнилось місце. Зроби резервну копію кнопкою нижче.`;
    clearMoved();
  } else if (found) {
    $("hint").textContent = `Повернуто з предметів на мапі книг: ${found}`;
  }

  $("backup").addEventListener("click", () => {
    $("bk").hidden = !$("bk").hidden;
    $("bktext").value = JSON.stringify(getBooks());
  });
  $("bkcopy").addEventListener("click", async () => {
    $("bktext").select();
    try { await navigator.clipboard.writeText($("bktext").value); $("bkcopy").textContent = "Скопійовано ✓"; }
    catch { $("bkcopy").textContent = "Виділено — Ctrl+C"; }
  });
  $("bkload").addEventListener("click", async () => {
    try {
      const next = JSON.parse($("bktext").value);
      if (!next || typeof next !== "object" || Object.values(next).some((b) => !b?.id || !Array.isArray(b.pages))) throw new Error();
      books = { ...books, ...next };
      for (const id of Object.keys(next)) unforget(id);
      await write();
      await syncScene().catch(() => {});
      drawList();
      $("bk").hidden = true;
      $("hint").textContent = `Завантажено книг: ${Object.keys(next).length}`;
    } catch { $("bkload").textContent = "Це не схоже на копію книг"; }
  });

  $("pick").addEventListener("change", () => select($("pick").value));
  $("add").addEventListener("click", create);
  $("prev").addEventListener("click", () => turn(-1));
  $("next").addEventListener("click", () => turn(1));
  $("addPage").addEventListener("click", addPage);
  $("delPage").addEventListener("click", delPage);
  $("save").addEventListener("click", save);
  $("show").addEventListener("click", showAll);
  $("del").addEventListener("click", removeBook);

  // текст запамʼятовуємо одразу в памʼяті, у кімнату — по кнопці
  $("text").addEventListener("input", () => {
    if (current) current.pages[page] = $("text").value;
    preview();
  });
  $("title").addEventListener("input", () => {
    if (current) current.title = $("title").value;
  });
  $("style").addEventListener("change", () => {
    if (current) current.style = $("style").value;
  });
  $("font").addEventListener("change", () => {
    if (current) current.font = $("font").value;
    preview();
  });
}

async function read() {
  return getBooks();
}

function drawList() {
  const select = $("pick");
  const keep = select.value;
  select.innerHTML = "";
  select.appendChild(new Option("— оберіть книгу —", ""));
  for (const book of Object.values(books)) {
    select.appendChild(new Option(book.title || "Без назви", book.id));
  }
  select.value = keep && books[keep] ? keep : "";
  $("editor").hidden = !select.value;
  size();
}

function select(id) {
  current = books[id] ? { ...books[id], pages: [...books[id].pages] } : null;
  page = 0;
  $("editor").hidden = !current;
  if (!current) return;
  $("title").value = current.title;
  $("style").value = current.style;
  $("font").value = current.font ?? "print";
  preview();
  draw();
}

// Показуємо, як виглядатиме почерк, не відкриваючи книгу
function preview() {
  const box = $("preview");
  box.dataset.font = $("font").value;
  box.textContent = current?.pages[page]?.slice(0, 90) || "Аа Бб Вв — так виглядатиме текст";
}

function draw() {
  $("counter").textContent = `${page + 1} / ${current.pages.length}`;
  $("text").value = current.pages[page] ?? "";
  preview();
  $("prev").disabled = page === 0;
  $("next").disabled = page >= current.pages.length - 1;
  $("delPage").disabled = current.pages.length <= 1;
}

function turn(step) {
  const next = page + step;
  if (next < 0 || next >= current.pages.length) return;
  page = next;
  draw();
}

function addPage() {
  current.pages.splice(page + 1, 0, "");
  page += 1;
  draw();
}

function delPage() {
  if (current.pages.length <= 1) return;
  current.pages.splice(page, 1);
  page = Math.max(0, page - 1);
  draw();
}

async function create() {
  const book = emptyBook();
  books[book.id] = book;
  unforget(book.id);
  await write();
  drawList();
  $("pick").value = book.id;
  select(book.id);
}

async function save() {
  if (!current) return;
  books[current.id] = { ...current, pages: [...current.pages] };
  await write();
  drawList();
  $("pick").value = current.id;
  $("hint").textContent = "Збережено";
}

async function removeBook() {
  if (!current) return;
  if (!confirm(`Видалити «${current.title}»? Скасувати буде неможливо.`)) return;
  const id = current.id;
  delete books[id];
  forget(id);
  current = null;
  await write();
  await pushToItems(id).catch(() => {});   // зняти її з предметів цієї сцени
  drawList();
}

async function showAll() {
  if (!current) return;
  await save();
  try {
    share(current.id);
    books = getBooks();
    await sendBook(current.id, true);
    await openReader(current.id);
    $("hint").textContent = "Книгу відкрито всім";
  } catch (err) {
    $("hint").textContent = "Не вдалося надіслати: " + (err?.message ?? err);
    console.error(err);
  }
}

async function write() {
  try {
    if (!setBooks(books)) throw new Error("браузер не дав зберегти");
    if (current && books[current.id]) {
      // прикріплені копії на предметах цієї сцени (в інших — коли їх відкриєш)
      await pushToItems(current.id).catch(() => {});
      // гравці, яким книгу вже показували, отримують нову версію
      if (books[current.id].shared) await sendBook(current.id, false);
    }
  } catch (err) {
    $("hint").textContent = "Не вдалося зберегти: " + (err?.message ?? err);
    console.error(err);
  }
}

// Межі кімнати книг більше не стосуються: робоча копія — у цьому браузері, прикріплені — на предметах
function size() {
  $("hint").textContent = `Книг: ${Object.keys(books).length} · зберігаються в цьому браузері, прикріплені — ще й на предметах мапи`;
}
