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
  participants: string[]; // New field to store information about who was present in the photo
}
