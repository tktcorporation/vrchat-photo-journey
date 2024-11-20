export interface Photo {
  id: number | string;
  url: string;
  width: number;
  height: number;
  title: string;
  tags: string[];
  takenAt: Date;
  location: {
    name: string;
    prefecture: string;
    country: string;
    description: string;
    coverImage: string;
    visitedWith: string[];
    lastVisited: Date;
  };
}
