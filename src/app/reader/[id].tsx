import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { TYPOGRAPHY } from '@/theme/typography';
import { AnnotationBar } from '@/components/pdf/AnnotationBar';
import { ReaderDrawer } from '@/components/pdf/ReaderDrawer';
import { PageJumperModal } from '@/components/pdf/PageJumperModal';
import { PomodoroWidget } from '@/components/study/PomodoroWidget';
import { ScratchpadModal } from '@/components/study/ScratchpadModal';
import { FlashcardModal } from '@/components/study/FlashcardModal';
import { exportPdfRevisionSummary } from '@/services/summaryExportService';
import { speakText, stopSpeaking } from '@/services/speechService';
import { VIEWER_HTML_CONTENT } from '@/services/pdfViewerHtml';
import * as pdfRepo from '@/db/pdfRepo';
import * as highlightRepo from '@/db/highlightRepo';
import * as bookmarkRepo from '@/db/bookmarkRepo';
import * as noteRepo from '@/db/noteRepo';
import {
  PdfDocument,
  Highlight,
  Bookmark,
  PersonalNote,
  HighlightColor,
  AnnotationType,
} from '@/types/database';

export default function ReaderScreen() {
  const { id, page: initialPageParam } = useLocalSearchParams<{ id: string; page?: string }>();
  const pdfId = parseInt(id, 10);
  const targetPage = initialPageParam ? parseInt(initialPageParam, 10) : undefined;
  const { colors } = useTheme();

  const webViewRef = useRef<any>(null);

  const [pdf, setPdf] = useState<PdfDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoomScale, setZoomScale] = useState(1.0);
  const [scrollMode, setScrollMode] = useState<'continuous' | 'single'>('continuous');
  const [nightMode, setNightMode] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Search state
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatchInfo, setSearchMatchInfo] = useState({ count: 0, current: 0 });

  // Annotations & Text selection state
  const [selectedTextData, setSelectedTextData] = useState<{
    text: string;
    page: number;
    rects: any[];
  } | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Modals state
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [pageJumperVisible, setPageJumperVisible] = useState(false);
  const [pageNoteModalVisible, setPageNoteModalVisible] = useState(false);
  const [pageNoteText, setPageNoteText] = useState('');
  const [pomodoroVisible, setPomodoroVisible] = useState(false);
  const [scratchpadVisible, setScratchpadVisible] = useState(false);
  const [flashcardModalVisible, setFlashcardModalVisible] = useState(false);
  const [flashcardDefaultAnswer, setFlashcardDefaultAnswer] = useState('');
  const [selectedHighlightId, setSelectedHighlightId] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Load document and annotations from SQLite
  useEffect(() => {
    if (!pdfId) return;
    try {
      const doc = pdfRepo.getPdfById(pdfId);
      if (!doc) {
        Alert.alert('Error', 'PDF document not found.');
        router.back();
        return;
      }
      setPdf(doc);
      const initialPage = targetPage || doc.last_read_page || 1;
      setCurrentPage(initialPage);

      // Load highlights, bookmarks, notes
      const hList = highlightRepo.getHighlightsByPdf(pdfId);
      setHighlights(hList);

      const bList = bookmarkRepo.getBookmarksByPdf(pdfId);
      setBookmarks(bList);
      setIsBookmarked(bookmarkRepo.isPageBookmarked(pdfId, initialPage));

      const nList = noteRepo.getNotesByPdf(pdfId);
      setNotes(nList);
    } catch (e: any) {
      console.warn('Notice loading PDF metadata:', e?.message || e);
    }
  }, [pdfId]);

  // Load PDF in streaming chunks and inject into WebView when ready
  const onWebViewLoad = async () => {
    if (!pdf) return;
    try {
      const fileInfo = await FileSystem.getInfoAsync(pdf.local_path);
      if (!fileInfo.exists) {
        Alert.alert('File Missing', 'The PDF file could not be found in device storage.');
        setLoading(false);
        return;
      }

      const totalSize = 'size' in fileInfo && typeof fileInfo.size === 'number' ? fileInfo.size : 0;
      const startPage = targetPage || pdf.last_read_page || 1;

      // 256 KB chunk size ensures Android Binder IPC transaction limit (1MB) is never exceeded
      const CHUNK_SIZE = 256 * 1024;

      webViewRef.current?.injectJavaScript(
        `window.startPdfStream(${totalSize}, ${startPage}); true;`
      );

      if (totalSize === 0) {
        // Fallback if file size is not reported by FileSystem
        const base64 = await FileSystem.readAsStringAsync(pdf.local_path, {
          encoding: FileSystem.EncodingType.Base64,
        });
        for (let i = 0; i < base64.length; i += CHUNK_SIZE) {
          const slice = base64.substring(i, i + CHUNK_SIZE);
          webViewRef.current?.injectJavaScript(
            `window.appendPdfChunk('${slice}'); true;`
          );
        }
      } else {
        // Read directly from disk slice-by-slice to keep memory usage minimal
        for (let offset = 0; offset < totalSize; offset += CHUNK_SIZE) {
          const lengthToRead = Math.min(CHUNK_SIZE, totalSize - offset);
          const chunkBase64 = await FileSystem.readAsStringAsync(pdf.local_path, {
            encoding: FileSystem.EncodingType.Base64,
            position: offset,
            length: lengthToRead,
          });

          webViewRef.current?.injectJavaScript(
            `window.appendPdfChunk('${chunkBase64}'); true;`
          );
        }
      }

      webViewRef.current?.injectJavaScript('window.finishPdfStream(); true;');
    } catch (e: any) {
      console.error('Failed to stream PDF to WebView:', e);
      Alert.alert('Loading Error', e?.message || 'Failed to read PDF file.');
      setLoading(false);
    }
  };

  // Handle messages from WebView
  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      switch (data.type) {
        case 'DOC_LOADED':
          setTotalPages(data.totalPages);
          setCurrentPage(data.initialPage);
          setLoading(false);
          // Update total page count in database if not set
          if (pdf && pdf.page_count !== data.totalPages) {
            pdfRepo.updatePdf(pdf.id, { pageCount: data.totalPages });
          }
          // Inject saved highlights
          const hScript = `window.loadSavedHighlights(${JSON.stringify(highlights)}); true;`;
          webViewRef.current?.injectJavaScript(hScript);
          break;

        case 'PAGE_CHANGE':
          setCurrentPage(data.page);
          if (pdf) {
            pdfRepo.updateReadingProgress(pdf.id, data.page, data.totalPages);
            setIsBookmarked(bookmarkRepo.isPageBookmarked(pdf.id, data.page));
          }
          break;

        case 'TEXT_SELECTED':
          setSelectedTextData({
            text: data.text,
            page: data.page,
            rects: data.rects,
          });
          break;

        case 'SEARCH_RESULTS':
          setSearchMatchInfo({ count: data.count, current: data.current });
          break;

        case 'ERROR':
          console.warn('PDF WebView error:', data.message);
          setLoading(false);
          break;
      }
    } catch (e) {
      console.warn('Parse error in webview message:', e);
    }
  };

  // Apply Highlight
  const handleApplyHighlight = (
    color: HighlightColor,
    type: AnnotationType,
    noteText?: string
  ) => {
    if (!selectedTextData || !pdf) return;

    const saved = highlightRepo.addHighlight(
      pdf.id,
      selectedTextData.page,
      selectedTextData.text,
      color,
      {
        type,
        rects: selectedTextData.rects,
        note: noteText,
      }
    );

    setHighlights((prev) => [...prev, saved]);

    // Inject into WebView DOM
    const script = `window.applyHighlight(${JSON.stringify(saved)}); true;`;
    webViewRef.current?.injectJavaScript(script);

    setSelectedTextData(null);
  };

  // Bookmark Toggle
  const handleToggleBookmark = () => {
    if (!pdf) return;
    if (isBookmarked) {
      bookmarkRepo.removeBookmark(pdf.id, currentPage);
      setIsBookmarked(false);
      setBookmarks((prev) => prev.filter((b) => b.page_number !== currentPage));
    } else {
      const b = bookmarkRepo.addBookmark(pdf.id, currentPage, `Page ${currentPage}`);
      setIsBookmarked(true);
      setBookmarks((prev) => [...prev, b]);
    }
  };

  // Add Note to current page
  const handleSavePageNote = () => {
    if (!pdf || !pageNoteText.trim()) return;
    const n = noteRepo.addNote(pdf.id, currentPage, pageNoteText.trim());
    setNotes((prev) => [...prev, n]);
    setPageNoteText('');
    setPageNoteModalVisible(false);
  };

  // Zoom controls
  const handleZoom = (delta: number) => {
    const next = Math.max(0.5, Math.min(2.5, parseFloat((zoomScale + delta).toFixed(2))));
    setZoomScale(next);
    webViewRef.current?.injectJavaScript(`window.setZoom(${next}); true;`);
  };

  // Reset to 100% Fit-to-Width
  const handleResetZoom = () => {
    setZoomScale(1.0);
    webViewRef.current?.injectJavaScript('window.fitToWidth(); true;');
  };

  // Text to speech for selected text
  const handleSpeakSelectedText = () => {
    if (!selectedTextData?.text) return;
    setIsSpeaking(true);
    speakText(
      selectedTextData.text,
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  };

  const handleStopSpeech = () => {
    stopSpeaking();
    setIsSpeaking(false);
  };

  // Open Flashcard modal from selected text
  const handleCreateFlashcardFromSelection = () => {
    if (!selectedTextData?.text) return;
    setFlashcardDefaultAnswer(selectedTextData.text);
    setSelectedHighlightId(null);
    setFlashcardModalVisible(true);
  };

  // Open Flashcard modal from existing highlight
  const handleCreateFlashcardFromHighlight = (h: Highlight) => {
    setFlashcardDefaultAnswer(h.selected_text);
    setSelectedHighlightId(h.id);
    setFlashcardModalVisible(true);
  };

  // Export Revision Sheet
  const handleExportSummary = async () => {
    if (!pdf) return;
    try {
      await exportPdfRevisionSummary(pdf);
    } catch (e: any) {
      Alert.alert('Export Notice', e?.message || 'Could not export notes summary.');
    }
  };

  // Scroll mode toggle
  const handleToggleScrollMode = () => {
    const next = scrollMode === 'continuous' ? 'single' : 'continuous';
    setScrollMode(next);
    webViewRef.current?.injectJavaScript(`window.setScrollMode('${next}'); true;`);
  };

  // Night mode toggle
  const handleToggleNightMode = () => {
    const next = !nightMode;
    setNightMode(next);
    webViewRef.current?.injectJavaScript(`window.setNightMode(${next}); true;`);
  };

  // Navigation: Go to page
  const handleJumpToPage = (pageNum: number) => {
    webViewRef.current?.injectJavaScript(`window.goToPage(${pageNum}); true;`);
  };

  // Search inside PDF
  const handleSearchSubmit = () => {
    webViewRef.current?.injectJavaScript(
      `window.searchPdf('${searchQuery.replace(/'/g, "\\'")}'); true;`
    );
  };

  const handleNextSearch = () => {
    webViewRef.current?.injectJavaScript('window.nextSearchResult(); true;');
  };

  const handlePrevSearch = () => {
    webViewRef.current?.injectJavaScript('window.prevSearchResult(); true;');
  };

  const handleCloseSearch = () => {
    setSearchActive(false);
    setSearchQuery('');
    setSearchMatchInfo({ count: 0, current: 0 });
    webViewRef.current?.injectJavaScript('window.searchPdf(""); true;');
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: nightMode ? '#11111B' : colors.background },
      ]}
      edges={['top']}
    >
      {/* Top Header Bar */}
      {!isFullScreen && (
        <View
          style={[
            styles.topBar,
            {
              backgroundColor: nightMode ? '#1E1E2E' : colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>

          <View style={styles.titleBox}>
            <Text
              style={[TYPOGRAPHY.bodyBold, { color: colors.text }]}
              numberOfLines={1}
            >
              {pdf?.title || 'Reading Note'}
            </Text>
            <Text style={[TYPOGRAPHY.tiny, { color: colors.textSecondary }]}>
              Page {currentPage} of {totalPages}
            </Text>
          </View>

          <View style={styles.topActions}>
            <Pressable
              onPress={() => setSearchActive((prev) => !prev)}
              style={styles.iconBtn}
              hitSlop={8}
            >
              <Ionicons
                name="search"
                size={20}
                color={searchActive ? colors.primary : colors.text}
              />
            </Pressable>

            <Pressable onPress={handleToggleBookmark} style={styles.iconBtn} hitSlop={8}>
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isBookmarked ? colors.primary : colors.text}
              />
            </Pressable>

            {/* Pomodoro Study Timer */}
            <Pressable onPress={() => setPomodoroVisible(true)} style={styles.iconBtn} hitSlop={8}>
              <Ionicons name="timer-outline" size={20} color={colors.primary} />
            </Pressable>

            {/* Scratchpad Rough Notepad */}
            <Pressable onPress={() => setScratchpadVisible(true)} style={styles.iconBtn} hitSlop={8}>
              <Ionicons name="pencil-outline" size={20} color={colors.text} />
            </Pressable>

            {/* Stop TTS button if speaking */}
            {isSpeaking && (
              <Pressable onPress={handleStopSpeech} style={styles.iconBtn} hitSlop={8}>
                <Ionicons name="volume-mute" size={20} color="#EF4444" />
              </Pressable>
            )}

            <Pressable onPress={handleToggleNightMode} style={styles.iconBtn} hitSlop={8}>
              <Ionicons
                name={nightMode ? 'sunny' : 'moon'}
                size={20}
                color={nightMode ? '#FBBF24' : colors.text}
              />
            </Pressable>

            <Pressable
              onPress={() => setDrawerVisible(true)}
              style={styles.iconBtn}
              hitSlop={8}
            >
              <Ionicons name="layers-outline" size={20} color={colors.text} />
            </Pressable>
          </View>
        </View>
      )}

      {/* PDF In-Document Search Toolbar */}
      {searchActive && !isFullScreen && (
        <View
          style={[
            styles.searchBarRow,
            {
              backgroundColor: nightMode ? '#1E1E2E' : colors.surfaceVariant,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            placeholder="Search in PDF..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, TYPOGRAPHY.body, { color: colors.text }]}
            returnKeyType="search"
            autoFocus
          />

          {searchMatchInfo.count > 0 && (
            <Text style={[TYPOGRAPHY.tiny, { color: colors.textSecondary, marginRight: 8 }]}>
              {searchMatchInfo.current}/{searchMatchInfo.count}
            </Text>
          )}

          <Pressable onPress={handlePrevSearch} style={styles.searchNavBtn} hitSlop={6}>
            <Ionicons name="chevron-up" size={18} color={colors.text} />
          </Pressable>

          <Pressable onPress={handleNextSearch} style={styles.searchNavBtn} hitSlop={6}>
            <Ionicons name="chevron-down" size={18} color={colors.text} />
          </Pressable>

          <Pressable onPress={handleCloseSearch} style={styles.searchNavBtn} hitSlop={6}>
            <Ionicons name="close" size={18} color={colors.text} />
          </Pressable>
        </View>
      )}

      {/* PDF.js Offline WebView */}
      <View style={styles.webViewWrapper}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: VIEWER_HTML_CONTENT }}
          onLoadEnd={onWebViewLoad}
          onMessage={handleMessage}
          allowFileAccess={true}
          allowFileAccessFromFileURLs={true}
          allowUniversalAccessFromFileURLs={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scalesPageToFit={true}
          showsVerticalScrollIndicator={false}
          style={[
            styles.webView,
            { backgroundColor: nightMode ? '#11111B' : '#F8FAFC' },
          ]}
        />

        {loading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[TYPOGRAPHY.bodyBold, { color: colors.text, marginTop: 12 }]}>
              Loading PDF offline...
            </Text>
          </View>
        )}
      </View>

      {/* Text Selection Annotation Popup Bar */}
      {selectedTextData && (
        <AnnotationBar
          selectedText={selectedTextData.text}
          onApply={handleApplyHighlight}
          onCancel={() => setSelectedTextData(null)}
          onAddNote={() => {
            setPageNoteText(`"${selectedTextData.text}": `);
            setPageNoteModalVisible(true);
          }}
          onSpeak={handleSpeakSelectedText}
          onCreateFlashcard={handleCreateFlashcardFromSelection}
        />
      )}

      {/* Bottom Floating Navigation Toolbar */}
      {!isFullScreen && (
        <View
          style={[
            styles.bottomToolbar,
            {
              backgroundColor: nightMode ? '#1E1E2E' : colors.card,
              borderColor: colors.cardBorder,
              shadowColor: colors.shadow,
            },
          ]}
        >
          {/* Zoom Out */}
          <Pressable onPress={() => handleZoom(-0.25)} style={styles.toolBtn} hitSlop={6}>
            <Ionicons name="remove" size={20} color={colors.text} />
          </Pressable>

          {/* Reset Zoom to 100% Fit Width */}
          <Pressable onPress={handleResetZoom} style={[styles.toolBtn, { minWidth: 44 }]} hitSlop={6}>
            <Text style={[TYPOGRAPHY.tiny, { color: colors.primary, fontWeight: '700' }]}>
              {Math.round(zoomScale * 100)}%
            </Text>
          </Pressable>

          {/* Zoom In */}
          <Pressable onPress={() => handleZoom(0.25)} style={styles.toolBtn} hitSlop={6}>
            <Ionicons name="add" size={20} color={colors.text} />
          </Pressable>

          {/* Page Jumper Trigger */}
          <Pressable
            onPress={() => setPageJumperVisible(true)}
            style={[styles.pageIndicatorPill, { backgroundColor: colors.surfaceVariant }]}
          >
            <Text style={[TYPOGRAPHY.captionBold, { color: colors.text }]}>
              {currentPage} / {totalPages}
            </Text>
          </Pressable>

          {/* Single Page vs Continuous Toggle */}
          <Pressable
            onPress={handleToggleScrollMode}
            style={styles.toolBtn}
            hitSlop={6}
          >
            <Ionicons
              name={scrollMode === 'continuous' ? 'swap-vertical' : 'document-outline'}
              size={18}
              color={colors.primary}
            />
          </Pressable>

          {/* Add Page Note */}
          <Pressable
            onPress={() => {
              setPageNoteText('');
              setPageNoteModalVisible(true);
            }}
            style={styles.toolBtn}
            hitSlop={6}
          >
            <Ionicons name="create-outline" size={18} color={colors.text} />
          </Pressable>

          {/* Full Screen Toggle */}
          <Pressable
            onPress={() => setIsFullScreen(true)}
            style={styles.toolBtn}
            hitSlop={6}
          >
            <Ionicons name="expand" size={18} color={colors.text} />
          </Pressable>
        </View>
      )}

      {/* Floating Exit Fullscreen Button */}
      {isFullScreen && (
        <Pressable
          onPress={() => setIsFullScreen(false)}
          style={[
            styles.exitFullScreenBtn,
            { backgroundColor: `${colors.card}E6`, borderColor: colors.border },
          ]}
        >
          <Ionicons name="contract" size={20} color={colors.text} />
        </Pressable>
      )}

      {/* Highlights & Notes Drawer */}
      <ReaderDrawer
        visible={drawerVisible}
        highlights={highlights}
        bookmarks={bookmarks}
        notes={notes}
        onSelectPage={handleJumpToPage}
        onDeleteHighlight={(hId) => {
          highlightRepo.deleteHighlight(hId);
          setHighlights((prev) => prev.filter((h) => h.id !== hId));
          webViewRef.current?.injectJavaScript(`window.removeHighlight(${hId}); true;`);
        }}
        onDeleteBookmark={(bId) => {
          bookmarkRepo.deleteBookmarkById(bId);
          setBookmarks((prev) => prev.filter((b) => b.id !== bId));
          if (pdf) {
            setIsBookmarked(bookmarkRepo.isPageBookmarked(pdf.id, currentPage));
          }
        }}
        onDeleteNote={(nId) => {
          noteRepo.deleteNote(nId);
          setNotes((prev) => prev.filter((n) => n.id !== nId));
        }}
        onExportSummary={handleExportSummary}
        onCreateFlashcard={handleCreateFlashcardFromHighlight}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Jump to Page Modal */}
      <PageJumperModal
        visible={pageJumperVisible}
        currentPage={currentPage}
        totalPages={totalPages}
        onJump={handleJumpToPage}
        onClose={() => setPageJumperVisible(false)}
      />

      {/* Page Note Modal */}
      <Modal visible={pageNoteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.noteModalContent,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>
              Add Note on Page {currentPage}
            </Text>
            <TextInput
              value={pageNoteText}
              onChangeText={setPageNoteText}
              placeholder="Write your study note, summary, or formula..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              style={[
                styles.noteInput,
                TYPOGRAPHY.body,
                {
                  color: colors.text,
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.cardBorder,
                },
              ]}
              autoFocus
            />

            <View style={styles.modalFooter}>
              <Pressable
                onPress={() => setPageNoteModalVisible(false)}
                style={[styles.modalBtn, { borderColor: colors.border, borderWidth: 1 }]}
              >
                <Text style={[TYPOGRAPHY.bodyBold, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSavePageNote}
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[TYPOGRAPHY.bodyBold, { color: '#FFFFFF' }]}>Save Note</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      {/* Pomodoro Timer Modal */}
      <PomodoroWidget
        visible={pomodoroVisible}
        onClose={() => setPomodoroVisible(false)}
        pdfId={pdf?.id}
      />

      {/* Scratchpad Rough Notepad */}
      <ScratchpadModal
        visible={scratchpadVisible}
        onClose={() => setScratchpadVisible(false)}
        pdfId={pdf?.id}
      />

      {/* Flashcard Creator Modal */}
      <FlashcardModal
        visible={flashcardModalVisible}
        onClose={() => setFlashcardModalVisible(false)}
        pdfId={pdf?.id}
        defaultAnswer={flashcardDefaultAnswer}
        highlightId={selectedHighlightId || undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  iconBtn: {
    padding: 6,
  },
  titleBox: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  searchNavBtn: {
    padding: 6,
    marginLeft: 4,
  },
  webViewWrapper: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  bottomToolbar: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    elevation: 8,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  toolBtn: {
    padding: 6,
  },
  pageIndicatorPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  exitFullScreenBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  noteModalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    elevation: 10,
  },
  noteInput: {
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 14,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 18,
  },
  modalBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
});
