export interface Photo {
  id: number | string;
  url: string;
  fileName: string;
  width: number;
  height: number;
  takenAt: Date;
  location: {
    joinedAt: Date;
  };
}
