import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { PdfDocument } from '@/types/database';
import * as highlightRepo from '@/db/highlightRepo';
import * as bookmarkRepo from '@/db/bookmarkRepo';
import * as noteRepo from '@/db/noteRepo';

export async function exportPdfRevisionSummary(pdf: PdfDocument): Promise<void> {
  const highlights = highlightRepo.getHighlightsByPdf(pdf.id);
  const bookmarks = bookmarkRepo.getBookmarksByPdf(pdf.id);
  const notes = noteRepo.getNotesByPdf(pdf.id);

  if (highlights.length === 0 && bookmarks.length === 0 && notes.length === 0) {
    Alert.alert(
      'No Notes Yet',
      'This document does not have any highlights, bookmarks, or notes to export yet.'
    );
    return;
  }

  const dateStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let md = `# 📖 StudyVault Revision Sheet: ${pdf.title}\n`;
  md += `**Document**: ${pdf.original_filename}  \n`;
  if (pdf.category_name) md += `**Category**: ${pdf.category_name}  \n`;
  md += `**Exported on**: ${dateStr}  \n`;
  md += `**Total Pages**: ${pdf.page_count} | **Highlights**: ${highlights.length} | **Notes**: ${notes.length}\n\n`;
  md += `---\n\n`;

  // Highlights section
  if (highlights.length > 0) {
    md += `## 🌟 Key Highlights & Formulas\n\n`;
    highlights.forEach((h, index) => {
      let colorTag = h.color.toUpperCase();
      let noteText = '';
      try {
        const data = JSON.parse(h.annotation_data);
        if (data.note) noteText = `\n  > 💡 *Note*: ${data.note}`;
      } catch {}

      md += `${index + 1}. **Page ${h.page_number}** [${colorTag}]:\n`;
      md += `   > "${h.selected_text}"${noteText}\n\n`;
    });
    md += `---\n\n`;
  }

  // Personal Notes section
  if (notes.length > 0) {
    md += `## 📝 Study Notes\n\n`;
    notes.forEach((n, index) => {
      md += `### Note ${index + 1} (Page ${n.page_number})\n`;
      md += `${n.note}\n\n`;
    });
    md += `---\n\n`;
  }

  // Bookmarks section
  if (bookmarks.length > 0) {
    md += `## 🔖 Bookmarked Pages\n\n`;
    bookmarks.forEach((b) => {
      md += `- **Page ${b.page_number}**: ${b.title || 'Important Topic'}\n`;
    });
    md += `\n---\n\n`;
  }

  md += `*Generated automatically by StudyVault – Offline Study Notes Manager.*`;

  // Write to temporary file
  const safeTitle = pdf.title.replace(/[^a-zA-Z0-9_-]/g, '_');
  const tempPath = `${FileSystem.cacheDirectory}${safeTitle}_Revision_Notes.md`;

  await FileSystem.writeAsStringAsync(tempPath, md, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    Alert.alert('Sharing Unavailable', 'File sharing is not supported on this device.');
    return;
  }

  await Sharing.shareAsync(tempPath, {
    mimeType: 'text/markdown',
    dialogTitle: `Share ${pdf.title} Revision Sheet`,
    UTI: 'net.daringfireball.markdown',
  });
}
