// TypeScript's lib.dom.d.ts n'inclut pas encore les méthodes de permission ni
// showSaveFilePicker (File System Access API, non standardisée par le W3C —
// disponible sur Chromium). Déclarations minimales pour les usages de
// src/lib/sauvegardeAuto.ts.
export {};

declare global {
  interface FileSystemHandlePermissionDescriptor {
    mode?: "read" | "readwrite";
  }

  interface FileSystemHandle {
    queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
    requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
  }

  interface SaveFilePickerOptions {
    suggestedName?: string;
    types?: { description?: string; accept: Record<string, string[]> }[];
  }

  interface Window {
    showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
  }
}
