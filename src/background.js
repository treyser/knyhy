// Фоновий скрипт: слухає команду «показати книгу» і реєструє пункти меню.
import OBR from "@owlbear-rodeo/sdk";
import { ID, ATTACH, OPEN, READER } from "./common.js";

const BASE = import.meta.env.BASE_URL;
const url = (p) => new URL(BASE + p, window.location.origin).href;

OBR.onReady(() => {
  // Слухач іде ПЕРШИМ і окремо від усього іншого.
  // Якщо реєстрація меню впаде, решта коду в тому ж блоці не виконається —
  // і кнопка «Показати всім» відправлятиме команду в порожнечу.
  try {
    OBR.broadcast.onMessage(OPEN, (event) => {
      const bookId = event?.data?.bookId;
      if (bookId) openReader(bookId);
    });
  } catch (err) {
    console.error("Книги: не вдалося підписатись на канал", err);
  }

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

export async function openReader(bookId) {
  try {
    const width = await OBR.viewport.getWidth();
    const height = await OBR.viewport.getHeight();

    await OBR.popover.close(READER).catch(() => {});
    await OBR.popover.open({
      id: READER,
      url: url(`reader.html?book=${encodeURIComponent(bookId)}`),
      width: Math.min(900, Math.max(320, width - 40)),
      height: Math.min(620, Math.max(320, height - 60)),
      anchorReference: "POSITION",
      anchorPosition: { top: Math.round(height / 2), left: Math.round(width / 2) },
      anchorOrigin: { horizontal: "CENTER", vertical: "CENTER" },
      transformOrigin: { horizontal: "CENTER", vertical: "CENTER" },
      hidePaper: true,
      marginThreshold: 0,
    });
  } catch (err) {
    console.error("Книги: не вдалося відкрити читалку", err);
    OBR.notification.show("Не вдалося відкрити книгу", "ERROR").catch(() => {});
  }
}
