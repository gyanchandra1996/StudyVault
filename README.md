# 📚 StudyVault — Offline-First PDF Study & Knowledge Management Mobile App

[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2058-000020.svg?style=flat&logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.88.1-61DAFB.svg?style=flat&logo=react)](https://reactnative.dev)
[![SQLite](https://img.shields.io/badge/Database-SQLite%20(expo--sqlite)-003B57.svg?style=flat&logo=sqlite)](https://docs.expo.dev/versions/latest/sdk/sqlite/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/EAS%20Build-Android%20APK-success.svg?style=flat&logo=android)](https://expo.dev/accounts/gyanchandra1996/projects/studyvault)

> **StudyVault** is a high-performance, offline-first React Native mobile application built for students, researchers, and competitive exam aspirants. It transforms static PDF documents into an interactive study environment featuring Spaced Repetition Flashcards, a Study Pomodoro Timer, Offline Text-to-Speech narration, multi-color highlighting, document scratchpads, and full-fidelity local backups.

---

## 📱 Key Features & Capabilities

### 📖 1. Advanced Offline PDF Reading Engine
* **100% Offline Mozilla PDF.js**: Inlined engine with Web Worker support — opens and renders documents without requiring an internet connection.
* **Responsive Fit-to-Width**: Dynamic viewport scaling based on the exact screen dimensions:
  $$\text{Scale} = \frac{\text{screenWidth} - 16}{\text{basePageWidth}}$$
* **Zoom & View Controls**:
  * Pinch-to-zoom and bottom toolbar zoom controls (`+` Zoom In, `-` Zoom Out).
  * 1-tap **100% Fit Width** button for instant reset.
  * Continuous vertical scroll mode and single-page focus mode.
* **Document Navigation**:
  * Visual page thumbnail drawer for rapid jumping.
  * Direct "Go to Page" numeric modal jumper.
  * Progress indicator showing current page, total pages, and reading percentage.
* **In-Document Search**: High-speed keyword search with real-time on-page highlighting and Next / Previous match navigation.
* **Comfort Reading Modes**: Light theme and dedicated Night Mode (high-contrast inverted palette) to reduce eye strain during late-night study sessions.

---

### ⚡ 2. Memory-Efficient Chunked Streaming Architecture
Designed to eliminate Android OS IPC Binder limits and Hermes Out-Of-Memory (OOM) crashes:
* **Zero IPC Binder Limit (`TransactionTooLargeException`)**: Large PDFs are streamed to the WebView using **256 KB binary chunks** (~340 KB Base64). Each chunk is well under Android's 1 MB Binder transaction buffer limit.
* **Direct Disk Streaming**: Reads slices using `position` and `length` in `readAsStringAsync`, keeping React Native JavaScript heap memory footprint under **1 MB** even for 50MB–100MB+ PDFs.
* **Direct `Uint8Array` Assembly**: WebView receives chunks and writes them directly into a pre-allocated contiguous typed array before feeding into PDF.js.
* **Chunked Upload Pipeline**: Storage access fallback uses `blob.slice(...)` in 512 KB increments with incremental `writeAsStringAsync({ append: true })` to prevent memory spikes.
* **Resilient Self-Healing SQLite**: Automatic health check on every database access (`SELECT 1`). If the Android activity restarts, any stale or closed connection is transparently re-opened with zero app crashes.

---

### 🃏 3. Student Productivity & Revision Hub

#### A. Spaced Repetition Flashcards (SuperMemo SM-2)
* **1-Tap Card Creation**: Highlight any text in a PDF and tap the Flashcard icon to instantly convert definitions, formulas, or key concepts into an interactive card.
* **Interactive Flip Deck**: 3D animated card flip to reveal questions and answers.
* **Scientific Spaced Repetition**: Implements the SuperMemo SM-2 algorithm:
  * **Again (1d)**: Reset and review tomorrow.
  * **Hard (2d)**: Difficult topic scheduled for short-term review.
  * **Good (3d+)**: Normal progression interval.
  * **Easy (4d+)**: Extended interval for mastered concepts.
* **Home Dashboard Counter**: Real-time "Due Today" counter and 1-tap review banner so you never miss a revision schedule.

#### B. Study Pomodoro Focus Timer
* **Classic Pomodoro Technique**:
  * 25-minute Deep Focus mode.
  * 5-minute Short Break mode.
  * 15-minute Long Break mode.
* **Persistent Session Logging**: Completed focus sessions are recorded in SQLite (`study_sessions`).
* **Study Analytics**: Displays total daily focus minutes (e.g., *"45m focus today"*) on the home screen.

#### C. Offline Text-to-Speech (TTS)
* Tap the **Speaker icon** on any highlighted passage or note to have the device read the text out loud using native text-to-speech (`expo-speech`).
* Ideal for auditory learners and hands-free review.

#### D. Document Scratchpad / Rough Notepad
* Autosaving rough notebook dedicated to each individual PDF.
* Jot down formulas, quick calculations, lecture side-notes, or personal summaries.

#### E. Markdown Summary Sheet Export
* Export all highlights, annotations, personal notes, and bookmarks of any PDF into a clean, portable `.md` revision file.
* Share directly via Android System Share to Google Drive, WhatsApp, email, or Obsidian/Notion.

---

### 🗂️ 4. Categorization & File Management
* **Multi-Level Hierarchy**: Organize documents into Categories (with custom Ionicons and vibrant hex colors) and Subcategories.
* **Tagging System**: Add multiple tags per document for multi-dimensional filtering.
* **Smart Filters**: Fast search, Category filters, Sort by Title, Date Added, File Size, or Last Read.
* **Recycle Bin**: Two-stage deletion protection with soft delete, restore functionality, and permanent storage wipe.
* **Storage Breakdown**: Visual disk usage dashboard showing MB consumed by each category with 1-tap cleanup recommendations.

---

### 🔒 5. Security & Data Sovereignty
* **App Lock**: Biometric authentication (Fingerprint / Face Unlock) using `expo-local-authentication` with PIN fallback.
* **100% Offline-First**: Zero tracking, zero telemetry, and zero third-party cloud dependencies. Your documents and personal study notes remain exclusively on your device.
* **Complete App Backup & Restore**: One-tap export to an encrypted/compressed `.zip` file containing all SQLite relational tables (`categories`, `subcategories`, `pdf_documents`, `highlights`, `bookmarks`, `notes`, `history`, `tags`) and physical PDF files.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [React Native 0.88](https://reactnative.dev) + [Expo SDK 58](https://docs.expo.dev) | Cross-platform mobile foundation |
| **Routing** | [Expo Router v4](https://docs.expo.dev/router/introduction/) | File-based navigation with typed routes |
| **Local Storage & Database** | [`expo-sqlite` (New Synchronous Architecture)](https://docs.expo.dev/versions/latest/sdk/sqlite/) | Relational database engine |
| **File Management** | [`expo-file-system`](https://docs.expo.dev/versions/latest/sdk/filesystem/) | Persistent scoped document & cache storage |
| **PDF Rendering** | [Mozilla PDF.js](https://mozilla.github.io/pdf.js/) + [`react-native-webview`](https://github.com/react-native-webview/react-native-webview) | 100% offline document canvas & textLayer rendering |
| **State Management** | [Zustand v5](https://github.com/pmndrs/zustand) | Lightweight, reactive centralized application state |
| **Biometrics** | [`expo-local-authentication`](https://docs.expo.dev/versions/latest/sdk/local-authentication/) | Secure hardware-level biometric lock |
| **Speech** | [`expo-speech`](https://docs.expo.dev/versions/latest/sdk/speech/) | Native offline Text-to-Speech narration |
| **Backup / Compression** | [JSZip](https://stuk.github.io/jszip/) + [`expo-sharing`](https://docs.expo.dev/versions/latest/sdk/sharing/) | Portable `.zip` archive generation |

---

## 📂 Project Structure

```
StudyApp/
├── assets/                  # App icons, splash screens, offline PDF.js engine
├── src/
│   ├── app/                 # Expo Router file-based screens
│   │   ├── (tabs)/          # Main bottom tab navigators
│   │   │   ├── index.tsx    # Home dashboard, recent PDFs, continue reading, study hub
│   │   │   ├── categories.tsx # Categories & subcategories browser
│   │   │   ├── favorites.tsx  # Starred documents
│   │   │   ├── recent.tsx     # Chronological reading history
│   │   │   └── settings.tsx   # Biometrics, theme, backup & restore, storage
│   │   ├── bookmarks/       # Global bookmarks screen
│   │   ├── category/        # Filtered category view
│   │   ├── flashcards/      # Spaced repetition revision hub
│   │   ├── notes/           # Consolidated personal study notes
│   │   ├── reader/[id].tsx  # High-performance PDF reader & annotation interface
│   │   ├── recycle-bin/     # Soft-deleted document manager
│   │   ├── storage/         # Storage breakdown & cleaner
│   │   ├── subcategory/     # Subcategory document list
│   │   └── _layout.tsx      # Root stack navigator with theme provider
│   ├── components/          # Reusable UI components
│   │   ├── auth/            # LockScreen biometric prompt
│   │   ├── category/        # CategoryCard & management modals
│   │   ├── common/          # Header, SearchBar, EmptyState, ConfirmationModal
│   │   ├── pdf/             # PdfCard, ReaderDrawer, AnnotationBar, PageJumperModal
│   │   └── study/           # PomodoroWidget, FlashcardModal, ScratchpadModal
│   ├── db/                  # SQLite schema, migrations & data repositories
│   │   ├── database.ts      # Self-healing SQLite connection pool
│   │   ├── schema.ts        # Database schema DDL & seed data
│   │   ├── pdfRepo.ts       # PDF CRUD operations & queries
│   │   ├── flashcardRepo.ts # Flashcard & SM-2 algorithm tracking
│   │   ├── studyTimerRepo.ts # Pomodoro study session records
│   │   ├── highlightRepo.ts # Multi-color highlights & coordinate storage
│   │   └── bookmarkRepo.ts  # Document bookmarks
│   ├── hooks/               # Custom React hooks (useTheme)
│   ├── services/            # Core business logic & native bridges
│   │   ├── backupService.ts # ZIP archive export & restore
│   │   ├── fileStorage.ts   # Chunked disk copy & storage management
│   │   ├── pdfPicker.ts     # SAF Android DocumentPicker integration
│   │   ├── pdfViewerHtml.ts # WebView HTML template with chunked stream receiver
│   │   ├── speechService.ts # Offline Text-to-Speech audio controller
│   │   └── summaryExportService.ts # Markdown revision sheet exporter
│   ├── stores/              # Zustand global stores (useAppStore, useAuthStore, useThemeStore)
│   ├── theme/               # Color palettes & typography tokens
│   └── types/               # TypeScript data definitions
├── app.json                 # Expo configuration & native permissions
├── eas.json                 # EAS cloud build profiles (APK & AAB)
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org) (v18 or higher recommended)
* [Expo Go](https://expo.dev/go) app installed on your Android device (for local development)
* [EAS CLI](https://docs.expo.dev/eas/index.md) (`npx eas-cli`)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/gyanchandra1996/StudyVault.git
   cd StudyVault
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the local Metro development server:
   ```bash
   npx expo start
   ```
4. Scan the QR code with **Expo Go** on your Android phone to launch the app!

---

## 📦 Building Standalone Android APK

To generate a standalone `.apk` that can be installed on any Android phone without Expo Go:

1. Log in to your Expo account:
   ```bash
   npx eas-cli login
   ```
2. Run the EAS build command with the `preview` profile:
   ```bash
   npx eas-cli build --platform android --profile preview
   ```
3. When the build finishes, download the `.apk` directly from your EAS dashboard or scan the terminal QR code to install!

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
