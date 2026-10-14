// Відкрити читалку поверх сцени — спільне для фонового скрипта, меню предмета й редактора.
import OBR from "@owlbear-rodeo/sdk";
import { READER } from "./common.js";

const url = (p) => new URL(import.meta.env.BASE_URL + p, window.location.origin).href;

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
