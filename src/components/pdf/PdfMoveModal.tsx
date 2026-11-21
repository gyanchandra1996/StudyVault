import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PdfDocument, Subcategory } from '@/types/database';
import { useAppStore } from '@/stores/useAppStore';
import { useTheme } from '@/hooks/useTheme';
import { TYPOGRAPHY } from '@/theme/typography';
import * as categoryRepo from '@/db/categoryRepo';

interface PdfMoveModalProps {
  visible: boolean;
  pdf: PdfDocument | null;
  onSave: (id: number, categoryId?: number | null, subcategoryId?: number | null) => void;
  onClose: () => void;
}

export function PdfMoveModal({ visible, pdf, onSave, onClose }: PdfMoveModalProps) {
  const { colors } = useTheme();
  const categories = useAppStore((state) => state.categories);

  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  useEffect(() => {
    if (pdf) {
      setSelectedCatId(pdf.category_id ?? null);
      setSelectedSubId(pdf.subcategory_id ?? null);
      if (pdf.category_id) {
        setSubcategories(categoryRepo.getSubcategories(pdf.category_id));
      } else {
        setSubcategories([]);
      }
    }
  }, [pdf, visible]);

  const handleSelectCategory = (catId: number | null) => {
    setSelectedCatId(catId);
    setSelectedSubId(null);
    if (catId) {
      setSubcategories(categoryRepo.getSubcategories(catId));
    } else {
      setSubcategories([]);
    }
  };

  const handleSave = () => {
    if (pdf) {
      onSave(pdf.id, selectedCatId, selectedSubId);
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.header}>
            <View>
              <Text style={[TYPOGRAPHY.h3, { color: colors.text }]}>Move Document</Text>
              <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                {pdf?.title}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={[TYPOGRAPHY.captionBold, { color: colors.textSecondary, marginBottom: 8 }]}>
              SELECT CATEGORY
            </Text>

            {/* Uncategorized option */}
            <Pressable
              onPress={() => handleSelectCategory(null)}
              style={[
                styles.optionRow,
                {
                  backgroundColor:
                    selectedCatId === null ? colors.primaryLight : colors.surfaceVariant,
                  borderColor: selectedCatId === null ? colors.primary : 'transparent',
                },
              ]}
            >
              <Ionicons
                name="file-tray-outline"
                size={20}
                color={selectedCatId === null ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  TYPOGRAPHY.bodyBold,
                  {
                    color: selectedCatId === null ? colors.primary : colors.text,
                    marginLeft: 10,
                    flex: 1,
                  },
                ]}
              >
                No Category (Unfiled)
              </Text>
              {selectedCatId === null && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </Pressable>

            {categories.map((cat) => {
              const isSelected = selectedCatId === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => handleSelectCategory(cat.id)}
                  style={[
                    styles.optionRow,
                    {
                      backgroundColor: isSelected
                        ? `${cat.color}20`
                        : colors.surfaceVariant,
                      borderColor: isSelected ? cat.color : 'transparent',
                    },
                  ]}
                >
                  <Ionicons
                    name={(cat.icon as any) || 'folder-outline'}
                    size={20}
                    color={cat.color}
                  />
                  <Text
                    style={[
                      TYPOGRAPHY.bodyBold,
                      {
                        color: isSelected ? cat.color : colors.text,
                        marginLeft: 10,
                        flex: 1,
                      },
                    ]}
                  >
                    {cat.name}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={cat.color} />
                  )}
                </Pressable>
              );
            })}

            {/* Subcategories if category selected */}
            {selectedCatId !== null && subcategories.length > 0 && (
              <View style={styles.subcatSection}>
                <Text
                  style={[
                    TYPOGRAPHY.captionBold,
                    { color: colors.textSecondary, marginTop: 14, marginBottom: 8 },
                  ]}
                >
                  SELECT SUBCATEGORY (OPTIONAL)
                </Text>

                <Pressable
                  onPress={() => setSelectedSubId(null)}
                  style={[
                    styles.subcatRow,
                    {
                      backgroundColor:
                        selectedSubId === null ? colors.surfaceVariant : 'transparent',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      TYPOGRAPHY.body,
                      { color: selectedSubId === null ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    None (Directly in Category)
                  </Text>
                  {selectedSubId === null && (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  )}
                </Pressable>

                {subcategories.map((sub) => {
                  const isSelected = selectedSubId === sub.id;
                  return (
                    <Pressable
                      key={sub.id}
                      onPress={() => setSelectedSubId(sub.id)}
                      style={[
                        styles.subcatRow,
                        {
                          backgroundColor: isSelected
                            ? colors.surfaceVariant
                            : 'transparent',
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          TYPOGRAPHY.body,
                          {
                            color: isSelected ? colors.primary : colors.text,
                            fontWeight: isSelected ? '700' : '400',
                          },
                        ]}
                      >
                        {sub.name}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark" size={18} color={colors.primary} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Pressable
              onPress={onClose}
              style={[styles.btn, { borderColor: colors.border, borderWidth: 1 }]}
            >
              <Text style={[TYPOGRAPHY.bodyBold, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={[styles.btn, { backgroundColor: colors.primary }]}
            >
              <Text style={[TYPOGRAPHY.bodyBold, { color: '#FFFFFF' }]}>Move Document</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '85%',
    paddingTop: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    paddingHorizontal: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginVertical: 4,
  },
  subcatSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  subcatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
