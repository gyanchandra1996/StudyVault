import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';

export interface PickedPdf {
  uri: string;
  name: string;
  size?: number;
}

export async function pickPdfDocuments(): Promise<PickedPdf[]> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      multiple: true,
      copyToCacheDirectory: false, // Keep original content:// URI for direct ContentResolver stream reading
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return [];
    }

    return result.assets.map((asset) => {
      let name = asset.name || 'document.pdf';
      if (!name.toLowerCase().endsWith('.pdf')) {
        name = `${name}.pdf`;
      }
      return {
        uri: asset.uri,
        name,
        size: asset.size ?? 0,
      };
    });
  } catch (error: any) {
    console.warn('Error in pickPdfDocuments:', error);
    Alert.alert(
      'Document Picker Notice',
      error?.message || 'Could not open the Android document picker.'
    );
    return [];
  }
}
