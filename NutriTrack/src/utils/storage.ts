import { File, Directory, Paths } from 'expo-file-system';

const getFile = (key: string): File => {
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_') + '.json';
  return new File(Paths.document, 'nutritrack', safeKey);
};

const ensureDir = (): void => {
  const dir = new Directory(Paths.document, 'nutritrack');
  if (!dir.exists) {
    dir.create();
  }
};

export const storageGet = async (key: string): Promise<string | null> => {
  try {
    ensureDir();
    const file = getFile(key);
    if (!file.exists) return null;
    return file.text();
  } catch {
    return null;
  }
};

export const storageSet = async (key: string, value: string): Promise<void> => {
  try {
    ensureDir();
    const file = getFile(key);
    file.write(value);
  } catch {}
};
