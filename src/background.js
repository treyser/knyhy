// Фоновий скрипт: слухає команду «показати книгу» і реєструє пункти меню.
import OBR from "@owlbear-rodeo/sdk";
import { ID, ATTACH, OPEN, READER, REQ, DATA } from "./common.js";
import { migrate, sendBook, takePart, getBooks, share, syncScene } from "./store.js";
import { openReader } from "./reader-open.js";

const BASE = import.meta.env.BASE_URL;
const url = (p) => new URL(BASE + p, window.location.origin).href;

OBR.onReady(() => {
  // Слухач іде ПЕРШИМ і окремо від усього іншого.
  // Якщо реєстрація меню впаде, решта коду в тому ж блоці не виконається —
  // і кнопка «Показати всім» відправлятиме команду в порожнечу.
  try {
    // Книга від Майстра: кладемо в свою копію, і якщо Майстер показує її всім — відкриваємо
    OBR.broadcast.onMessage(DATA, (event) => takePart(event.data, (book, open) => { if (open) openReader(book.id); }));
    // Гравець просить книгу (відкрив «Читати», а копії ще немає) — відповідає лише Майстер
    OBR.broadcast.onMessage(REQ, async (event) => {
      if ((await OBR.player.getRole()) !== "GM") return;
      const bookId = event?.data?.bookId;
      if (!bookId || !getBooks()[bookId]) return;
      share(bookId);
      await sendBook(bookId, false);
    });
    // Стара версія розширення в когось із гравців могла ще надіслати це
    OBR.broadcast.onMessage(OPEN, (event) => {
      const bookId = event?.data?.bookId;
      if (bookId) openReader(bookId);
    });
  } catch (err) {
    console.error("Книги: не вдалося підписатись на канал", err);
  }

  // Книги, що досі лежать у кімнаті, Майстер забирає у свій браузер і звільняє місце
  // і розкладає книги по предметах, до яких вони прикріплені, — у кожній сцені, щойно вона відкриється
  OBR.player.getRole().then(async (role) => {
    if (role !== "GM") return;
    try { await migrate(); } catch (err) { console.error("Книги: перенесення не вдалось", err); }
    syncScene().catch(() => {});
    OBR.scene.onReadyChange((ready) => { if (ready) syncScene().catch(() => {}); });
  });

  // «Книга» — прикріпити або зняти. Тільки Майстер.
  try {
    OBR.contextMenu.create({
      id: `${ID}/attach`,
      icons: [{ icon: url("icon.svg"), label: "Книга", filter: { roles: ["GM"] } }],
      embed: { url: url("menu.html"), height: 260 },
    });
  } catch (err) {
    console.error("Книги: меню «Книга» не зареєструвалось", err);
  }

  // «Читати» — там, де книга вже прикріплена. Бачать усі.
  try {
    OBR.contextMenu.create({
      id: `${ID}/read`,
      icons: [
        {
          icon: url("icon.svg"),
          label: "Читати",
          filter: {
            every: [{ key: ["metadata", ATTACH], value: undefined, operator: "!=" }],
          },
        },
      ],
      onClick: (context) => {
        const bookId = context?.items?.[0]?.metadata?.[ATTACH];
        if (bookId) openReader(bookId);
      },
    });
  } catch (err) {
    console.error("Книги: меню «Читати» не зареєструвалось", err);
  }
});
