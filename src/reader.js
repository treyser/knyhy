import "./style.css";
import OBR from "@owlbear-rodeo/sdk";
import { READER, ATTACH, BOOK } from "./common.js";
import { getBooks, askBook, findBook } from "./store.js";
import { CORNER, ROSE, FOLIO, FOLIO_RIGHT, BRASS_CORNER, CLASP } from "./ornaments.js";

const $ = (id) => document.getElementById(id);
const bookId = new URLSearchParams(location.search).get("book");

let book = null;
let spread = 0;   // номер розвороту: сторінки 2n і 2n+1

// Поповер міг відкритися поза кімнатою або SDK не піднявся —
// краще написати про це на сторінці, ніж лишити порожнечу.
const failsafe = setTimeout(() => {
  if (!book) say("Owlbear не відповів. Спробуй перевідкрити книгу.");
}, 4000);

if (!OBR.isAvailable) {
  say("Сторінку відкрито поза Owlbear.");
} else {
  OBR.onReady(() => init().catch((err) => {
    say("Збій: " + (err?.message ?? err));
    console.error(err);
  }));
}

function say(text) {
  clearTimeout(failsafe);
  $("title").style.display = "";
  $("title").textContent = text;
  $("textLeft").textContent = "";
  $("textRight").textContent = "";
}

async function init() {
  clearTimeout(failsafe);

  if (!bookId) { say("Книгу не вказано"); return; }
  book = await findBook(bookId);

  // Копії ще немає — просимо в Майстра й чекаємо, поки фоновий скрипт її збереже
  if (!book) {
    say("Книга в дорозі…");
    askBook(bookId);
    book = await new Promise((resolve) => {
      const done = (b) => { window.removeEventListener("storage", on); clearTimeout(t); resolve(b); };
      const on = (e) => { if (e.key === "knyhy.books" && getBooks()[bookId]) done(getBooks()[bookId]); };
      const t = setTimeout(() => done(getBooks()[bookId] ?? null), 6000);
      window.addEventListener("storage", on);
    });
    if (!book) { say("Книгу не вдалося отримати: Майстра зараз немає в кімнаті."); return; }
  }

  document.getElementById("book").dataset.style = book.style ?? "leather";
  document.getElementById("book").dataset.font = book.font ?? "print";
  $("title").textContent = book.title ?? "";
  decorate();

  $("prev").addEventListener("click", () => turn(-1));
  $("next").addEventListener("click", () => turn(1));
  $("close").addEventListener("click", () => OBR.popover.close(READER));

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") turn(-1);
    if (e.key === "ArrowRight") turn(1);
    if (e.key === "Escape") OBR.popover.close(READER);
  });

  // якщо Майстер правив книгу, поки вона відкрита: нова версія приходить на предмет або в копію
  const refresh = (fresh) => {
    if (!fresh || JSON.stringify(fresh.pages) === JSON.stringify(book.pages) && fresh.title === book.title && fresh.style === book.style && fresh.font === book.font) return;
    book = fresh;
    $("title").textContent = book.title ?? "";
    spread = Math.min(spread, spreads() - 1);
    document.getElementById("book").dataset.font = book.font ?? "print";
    document.getElementById("book").dataset.style = book.style ?? "leather";
    draw();
  };
  window.addEventListener("storage", (e) => { if (e.key === "knyhy.books") refresh(getBooks()[bookId]); });
  OBR.scene.items.onChange((items) => {
    const item = items.find((i) => i.metadata?.[ATTACH] === bookId && i.metadata?.[BOOK]);
    if (item) refresh(item.metadata[BOOK]);
  });

  draw();
}

// Орнаменти малюємо один раз при відкритті
function decorate() {
  for (const side of ["Left", "Right"]) {
    const paper = $("paper" + side);
    for (const place of ["tl", "tr", "bl", "br"]) {
      paper.insertAdjacentHTML(
        "beforeend",
        CORNER.replace('class="orn corner"', `class="orn corner ${place}"`)
      );
    }
    $("rose" + side).innerHTML = ROSE;
  }

  // латунні кути палітурки
  const board = $("board");
  for (const place of ["tl", "tr", "bl", "br"]) {
    board.insertAdjacentHTML(
      "beforeend",
      BRASS_CORNER.replace('class="brass"', `class="brass ${place}"`)
    );
  }

  // дві застібки на зовнішньому краю
  $("clasps").innerHTML = CLASP + CLASP;
}

const spreads = () => Math.ceil(book.pages.length / 2);

function turn(step) {
  const next = spread + step;
  if (next < 0 || next >= spreads()) return;

  // коротка анімація гортання
  const leaf = document.querySelector(step > 0 ? ".leaf.right" : ".leaf.left");
  leaf.classList.add(step > 0 ? "flip-next" : "flip-prev");
  setTimeout(() => leaf.classList.remove("flip-next", "flip-prev"), 320);

  spread = next;
  draw();
}

function draw() {
  const left = book.pages[spread * 2] ?? "";
  const right = book.pages[spread * 2 + 1];

  const first = spread === 0;
  $("title").style.display = first ? "" : "none";
  $("ruleLeft").style.display = first ? "" : "none";

  // на першій сторінці перша літера стає буквицею в рамці
  if (first && left.trim()) {
    const letter = left.trim()[0];
    const rest = left.trim().slice(1);
    $("textLeft").innerHTML = "";
    const cap = document.createElement("span");
    cap.className = "dropcap";
    cap.textContent = letter;
    $("textLeft").append(cap, document.createTextNode(rest));
  } else {
    $("textLeft").textContent = left;
  }

  $("textRight").textContent = right ?? "";

  $("folioLeft").innerHTML = FOLIO + `<span>${spread * 2 + 1}</span>` + FOLIO_RIGHT;
  $("folioRight").innerHTML =
    right === undefined ? "" : FOLIO + `<span>${spread * 2 + 2}</span>` + FOLIO_RIGHT;
  document.querySelector(".leaf.right").classList.toggle("blank", right === undefined);

  $("prev").disabled = spread === 0;
  $("next").disabled = spread >= spreads() - 1;
}
