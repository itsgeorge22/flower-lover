import type { Flower } from "../types/flower";
import { renderFlowerShareCard, renderFlowerShareCover, type ShareCoverSection } from "./generate-share-card";
import { groupShareResults, type ShareAnswer } from "./share-results";

export async function generateFlowerSharePdf(
  flowers: readonly Flower[],
  answers: Readonly<Record<string, ShareAnswer>>,
) {
  const { jsPDF } = await import("jspdf");
  const sections: ShareCoverSection[] = [];
  let nextPage = 2;
  const pages = groupShareResults(flowers, answers).flatMap((group) => {
    const count = Math.ceil(group.flowers.length / 6);
    sections.push({ ...group, firstPage: count ? nextPage : null, lastPage: count ? nextPage + count - 1 : null });
    nextPage += count;
    const chunks = [];
    for (let offset = 0; offset < group.flowers.length; offset += 6) {
      chunks.push({
        flowers: group.flowers.slice(offset, offset + 6),
        category: group,
        label: `Цветы ${offset + 1}–${Math.min(offset + 6, group.flowers.length)} из ${group.flowers.length}`,
      });
    }
    return chunks;
  });
  if (pages.length === 0) throw new Error("Нет цветов для PDF");

  // Keep the original 4:5 artwork and six-card layout on every PDF page.
  const pdf = new jsPDF({ unit: "pt", format: [648, 810], compress: true });
  pdf.setProperties({ title: "Мои цветочные предпочтения", author: "FlowerLover" });
  const pageCount = pages.length + 1;
  const cover = await renderFlowerShareCover(sections, pageCount);
  pdf.addImage(cover.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 648, 810);
  pdf.link(230, 750, 188, 28, { url: "https://flowerlover.fun" });
  for (const section of sections) {
    if (section.firstPage !== null) {
      const row = sections.indexOf(section);
      pdf.link(43.2, (626 + row * 124) * 0.6, 561.6, 64.8, { pageNumber: section.firstPage });
    }
  }
  for (const [index, page] of pages.entries()) {
    const canvas = await renderFlowerShareCard(flowers, answers, {
      featuredFlowers: page.flowers,
      title: page.category.label,
      category: page.category,
      subtitle: page.label,
      footer: `Создано в FlowerLover · ${index + 2} / ${pageCount}`,
      fullNames: true,
      showSummary: false,
    });
    pdf.addPage([648, 810]);
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 648, 810);
    pdf.link(230, 750, 188, 28, { url: "https://flowerlover.fun" });
  }
  return pdf.output("blob");
}
