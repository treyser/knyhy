import "./style.css";
import OBR from "@owlbear-rodeo/sdk";
import { BOOKS, READER } from "./common.js";
import { CORNER, ROSE, FOLIO, FOLIO_RIGHT, BRASS_CORNER, CLASP } from "./ornaments.js";

const $ = (id) => document.getElementById(id);
const bookId = new URLSearchParams(location.search).get("book");

let book = null;
let spread = 0;   // номер розвороту: сторінки 2n і 2n+1

OBR.onReady(init);

async function init() {
  const meta = await OBR.room.getMetadata();
  book = (meta[BOOKS] ?? {})[bookId];

  if (!book) {
    $("title").textContent = "Книги не знайдено";
    return;
  }

  document.getElementById("book").dataset.style = book.style ?? "leather";
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

  // якщо Майстер правив книгу, поки вона відкрита
  OBR.room.onMetadataChange((m) => {
    const fresh = (m[BOOKS] ?? {})[bookId];
    if (!fresh) return;
    book = fresh;
    draw();
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
