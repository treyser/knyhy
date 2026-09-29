// Пункт меню на будь-якому предметі й читалка, яку можна показати всім.
import OBR from "@owlbear-rodeo/sdk";
import { ID, ATTACH, OPEN, READER } from "./common.js";

const BASE = import.meta.env.BASE_URL;
const url = (p) => new URL(BASE + p, window.location.origin).href;

OBR.onReady(() => {
  // «Читати» — лише там, де книга вже прикріплена. Бачать усі.
  OBR.contextMenu.create({
    id: `${ID}/read`,
    icons: [
      {
        icon: url("icon.svg"),
        label: "Читати",
        filter: {
          every: [{ key: ["metadata", ATTACH], operator: "!=", value: undefined }],
        },
      },
    ],
    onClick: (context) => {
      const item = context.items[0];
      const bookId = item?.metadata[ATTACH];
      if (bookId) openReader(bookId);
    },
  });

  // «Книга» — прикріпити або зняти. Тільки Майстер.
  OBR.contextMenu.create({
    id: `${ID}/attach`,
    icons: [
      {
        icon: url("icon.svg"),
        label: "Книга",
        filter: { roles: ["GM"] },
      },
    ],
    embed: { url: url("menu.html"), height: 260 },
  });

  // Майстер відкрив книгу всім
  OBR.broadcast.onMessage(OPEN, (event) => {
    if (event.data?.bookId) openReader(event.data.bookId);
  });
});

export async function openReader(bookId) {
  const width = await OBR.viewport.getWidth();
  const height = await OBR.viewport.getHeight();

  await OBR.popover.close(READER).catch(() => {});
  await OBR.popover.open({
    id: READER,
    url: url(`reader.html?book=${encodeURIComponent(bookId)}`),
    width: Math.min(900, width - 40),
    height: Math.min(620, height - 60),
    anchorReference: "POSITION",
    anchorPosition: { top: Math.round(height / 2), left: Math.round(width / 2) },
    anchorOrigin: { horizontal: "CENTER", vertical: "CENTER" },
    transformOrigin: { horizontal: "CENTER", vertical: "CENTER" },
    hidePaper: true,
    marginThreshold: 0,
  });
}
