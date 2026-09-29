import "./style.css";
import OBR from "@owlbear-rodeo/sdk";
import { BOOKS, OPEN, STYLES, emptyBook } from "./common.js";

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

  books = await read();
  drawList();

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
  });
  $("title").addEventListener("input", () => {
    if (current) current.title = $("title").value;
  });
  $("style").addEventListener("change", () => {
    if (current) current.style = $("style").value;
  });
}

async function read() {
  const meta = await OBR.room.getMetadata();
  return meta[BOOKS] ?? {};
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
  draw();
}

function draw() {
  $("counter").textContent = `${page + 1} / ${current.pages.length}`;
  $("text").value = current.pages[page] ?? "";
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
  delete books[current.id];
  current = null;
  await write();
  drawList();
}

async function showAll() {
  if (!current) return;
  await save();
  await OBR.broadcast.sendMessage(OPEN, { bookId: current.id }, { destination: "ALL" });
}

async function write() {
  try {
    await OBR.room.setMetadata({ [BOOKS]: books });
  } catch (err) {
    $("hint").textContent = "Не вдалося зберегти: " + (err?.message ?? err);
    console.error(err);
  }
}

// Метадані кімнати обмежені за розміром, тож показуємо, скільки вже зайнято
function size() {
  const bytes = new Blob([JSON.stringify(books)]).size;
  const kb = (bytes / 1024).toFixed(1);
  $("hint").textContent =
    bytes > 12000
      ? `Увага: книги важать ${kb} КБ. Наближаємось до межі метаданих кімнати.`
      : `Книг: ${Object.keys(books).length} · ${kb} КБ`;
}
