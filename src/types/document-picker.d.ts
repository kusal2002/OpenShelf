declare module 'react-native-document-picker' {
  export interface DocumentPickerAsset {
    uri: string;
    name?: string;
    type?: string;
    size?: number;
    fileCopyUri?: string | null;
  }
  export interface PickSingleOptions {
    type?: string[];
    copyTo?: 'cachesDirectory' | 'documentDirectory';
    mode?: 'import' | 'open';
    presentationStyle?: string;
  }
  interface DocumentPickerModule {
    pickSingle(options: PickSingleOptions): Promise<DocumentPickerAsset>;
    types: Record<string, string>;
    isCancel(err: unknown): boolean;
  }
  const DocumentPicker: DocumentPickerModule;
  export default DocumentPicker;
}
