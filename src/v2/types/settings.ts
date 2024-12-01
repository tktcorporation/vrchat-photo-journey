export interface PathSettings {
  photoDirectory: string;
  logFilePath: string;
}

export interface PhotoSource {
  type: 'local' | 'demo';
  settings: PathSettings;
}

export interface PhotoLog {
  path: string;
  location?: {
    name: string;
    prefecture: string;
    coordinates?: [number, number];
  };
  takenAt?: Date;
  tags?: string[];
  description?: string;
}
