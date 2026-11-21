import * as FileSystem from 'expo-file-system/legacy';
import { ensurePdfDirectoryExists, getPdfStorageDirectory } from './fileStorage';

export function buildSampleStudyGuidePdfString(): string {
  // Construct a valid multi-page PDF 1.4 document with text streams
  const p1Content = `BT
/F1 22 Tf
50 720 Td
(StudyVault - Offline Study Notes Guide) Tj
/F1 14 Tf
0 -36 Td
(Chapter 1: Fundamental Data Structures & Systems) Tj
/F1 11 Tf
0 -24 Td
(Welcome to StudyVault! All your study materials are saved locally on your device.) Tj
0 -18 Td
(1. Arrays: Contiguous memory allocation, O(1) random access, fixed size.) Tj
0 -18 Td
(2. Linked Lists: Dynamic size, efficient insertion/deletion O(1) at head, O(n) lookup.) Tj
0 -18 Td
(3. Binary Search Trees: Ordered tree where left child < node and right child > node.) Tj
0 -18 Td
(4. Hash Tables: Key-value mapping with expected O(1) insertion, deletion and search.) Tj
0 -28 Td
/F1 12 Tf
(Annotation Instructions:) Tj
/F1 11 Tf
0 -18 Td
(Select any sentence above to highlight in Yellow, Green, Blue, Pink, Orange or Purple.) Tj
0 -18 Td
(You can also add personal notes, underline important theorems, or bookmark this page.) Tj
ET`;

  const p2Content = `BT
/F1 22 Tf
50 720 Td
(StudyVault - Offline Study Notes Guide) Tj
/F1 14 Tf
0 -36 Td
(Chapter 2: Operating Systems & Computer Architecture) Tj
/F1 11 Tf
0 -24 Td
(Processes and Threads:) Tj
0 -18 Td
(A process is a program in execution containing code, data, heap, and stack segments.) Tj
0 -18 Td
(Threads share the address space, file descriptors, and global variables of their parent process.) Tj
0 -18 Td
(Memory Management:) Tj
0 -18 Td
(Virtual memory provides an abstraction of physical storage via Paging and TLB caches.) Tj
0 -18 Td
(Deadlocks require 4 conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait.) Tj
0 -28 Td
/F1 12 Tf
(Quick Reading Tips:) Tj
/F1 11 Tf
0 -18 Td
(Use the bottom bar to switch between Continuous vertical scroll and Single page mode.) Tj
0 -18 Td
(Tap the Moon icon to enable Night Reading Mode in low-light study sessions.) Tj
ET`;

  const p3Content = `BT
/F1 22 Tf
50 720 Td
(StudyVault - Offline Study Notes Guide) Tj
/F1 14 Tf
0 -36 Td
(Chapter 3: Mathematics for Computing & Calculus) Tj
/F1 11 Tf
0 -24 Td
(Key Formulas & Mathematical Properties:) Tj
0 -18 Td
(Linear Algebra: Matrix multiplication is associative: A(BC) = (AB)C, but non-commutative.) Tj
0 -18 Td
(Eigenvalues: det(A - lambda * I) = 0 defines characteristic polynomial.) Tj
0 -18 Td
(Probability: Bayes Theorem: P(A|B) = [P(B|A) * P(A)] / P(B).) Tj
0 -18 Td
(Calculus: Derivative represents rate of change: f'(x) = lim(h->0) [f(x+h) - f(x)] / h.) Tj
0 -28 Td
/F1 12 Tf
(Offline Backup:) Tj
/F1 11 Tf
0 -18 Td
(Export your entire vault anytime from Settings into a portable ZIP archive.) Tj
ET`;

  const objects: string[] = [];
  objects[1] = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj';
  objects[2] = '2 0 obj\n<< /Type /Pages /Kids [3 0 R 4 0 R 5 0 R] /Count 3 >>\nendobj';
  objects[3] =
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 6 0 R /Resources << /Font << /F1 9 0 R >> >> >>\nendobj';
  objects[4] =
    '4 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 7 0 R /Resources << /Font << /F1 9 0 R >> >> >>\nendobj';
  objects[5] =
    '5 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 8 0 R /Resources << /Font << /F1 9 0 R >> >> >>\nendobj';

  objects[6] = `6 0 obj\n<< /Length ${p1Content.length} >>\nstream\n${p1Content}\nendstream\nendobj`;
  objects[7] = `7 0 obj\n<< /Length ${p2Content.length} >>\nstream\n${p2Content}\nendstream\nendobj`;
  objects[8] = `8 0 obj\n<< /Length ${p3Content.length} >>\nstream\n${p3Content}\nendstream\nendobj`;
  objects[9] =
    '9 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj';

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];

  for (let i = 1; i <= 9; i++) {
    offsets[i] = pdf.length;
    pdf += objects[i] + '\n';
  }

  const xrefOffset = pdf.length;
  pdf += 'xref\n0 10\n0000000000 65535 f \n';
  for (let i = 1; i <= 9; i++) {
    const offStr = String(offsets[i]).padStart(10, '0');
    pdf += `${offStr} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size 10 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

export async function createAndSaveSamplePdf(): Promise<{ localPath: string; fileSize: number }> {
  await ensurePdfDirectoryExists();
  const dir = getPdfStorageDirectory();
  const filename = `Sample_Study_Notes_${Date.now()}.pdf`;
  const filePath = `${dir}${filename}`;

  const pdfString = buildSampleStudyGuidePdfString();
  await FileSystem.writeAsStringAsync(filePath, pdfString, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const fileInfo = await FileSystem.getInfoAsync(filePath);
  const fileSize = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : pdfString.length;

  return {
    localPath: filePath,
    fileSize,
  };
}
