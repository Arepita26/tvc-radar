import { NewsItem } from "./scanner";

function cleanText(raw: string): string {
  return raw
    .replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      ""
    )
    .trim();
}

/**
 * Plantilla 1: Reporte Completo Institucional (Titular + Fuente + Enlace)
 */
export function formatInstitutionalReport(
  items: NewsItem[],
  hours: number,
  category: string = "all"
): string {
  const categoryLabel =
    category === "all" || category === "Todas"
      ? "Todas las categorias"
      : category === "DDHH"
      ? "Derechos Humanos"
      : category;

  const header = `LA TV CALLE | MONITOREO INFORMATIVO\nVentana de cobertura: Ultimas ${hours} horas\nCategoria: ${categoryLabel}\nTotal registros: ${items.length}\n`;

  if (items.length === 0) {
    return `${header}\nNo se registraron informaciones verificadas en el periodo seleccionado.\n\n---\nReporte generado via La TV Calle Radar.`;
  }

  const formattedItems = items.map((item, index) => {
    const title = cleanText(item.title);
    return `${index + 1}. ${title}\nFuente: ${item.source}\nEnlace: ${item.url}`;
  });

  const body = formattedItems.join("\n\n");
  const footer = `\n\n---\nReporte generado via La TV Calle Radar.`;

  return `${header}\n${body}${footer}`;
}

/**
 * Plantilla 2: Titulares Flash (Top 5 Hechos Clave)
 */
export function formatFlashHeadlines(
  items: NewsItem[],
  hours: number
): string {
  const topItems = items.slice(0, 5);

  const header = `LA TV CALLE | TITULARES FLASH\nResumen de los hechos clave (Ultimas ${hours}h)\n`;

  if (topItems.length === 0) {
    return `${header}\nSin informaciones urgentes registradas en el periodo.\n\n---\nLa TV Calle Radar.`;
  }

  const formattedItems = topItems.map((item, index) => {
    const title = cleanText(item.title);
    return `[${index + 1}] ${title} (${item.source})`;
  });

  const body = formattedItems.join("\n\n");
  const footer = `\n\n---\nMonitoreo continuo via La TV Calle Radar.`;

  return `${header}\n${body}${footer}`;
}

/**
 * Plantilla 3: Escaleta Radial / Guion de Locución
 */
export function formatBroadcastScript(
  items: NewsItem[],
  hours: number
): string {
  const selectedItems = items.slice(0, 7);

  const header = `ESCALETA DE NOTICIAS | LA TV CALLE\nBloque Informativo - Cobertura ultimas ${hours} horas\nTotal notas: ${selectedItems.length}\n==============================\n`;

  if (selectedItems.length === 0) {
    return `${header}\n[LOCUTOR]: En este momento no se reportan hechos extraordinarios en el monitoreo.\n==============================\n`;
  }

  const formattedItems = selectedItems.map((item, index) => {
    const title = cleanText(item.title);
    const categoryName =
      item.category === "DDHH" ? "Derechos Humanos" : item.category;

    return `NOTA ${index + 1} | [${categoryName.toUpperCase()}] (${item.relativeTime})\n- HECHO: ${title}\n- FUENTE CONSULTADA: ${item.source}\n- VERIFICACION: ${item.url}`;
  });

  const body = formattedItems.join("\n\n------------------------------\n\n");
  const footer = `\n\n==============================\n[CIERRE DE BLOQUE INFORMATIVO - LA TV CALLE]`;

  return `${header}\n${body}${footer}`;
}

/**
 * Genera el enlace de WhatsApp para cualquier texto formateado
 */
export function generateWhatsAppLink(text: string): string {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}
