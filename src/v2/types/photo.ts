export interface Photo {
  id: number | string;
  url: string;
  width: number;
  height: number;
  takenAt: Date;
  location: {
    name: string;
    description: string;
    coverImage: string;
    visitedWith: string[];
    joinedAt: Date;
  };
}
