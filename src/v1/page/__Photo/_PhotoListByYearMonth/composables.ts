interface WorldJoinData {
  id: string;
  worldId: string;
  worldName: string;
  worldInstanceId: string;
  joinDateTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface PhotoPathData {
  id: string;
  photoPath: string;
  photoTakenAt: Date;
}

type WorldJoinWithPhotos = {
  worldJoin: WorldJoinData | null;
  photos: PhotoPathData[];
}[];

export const groupPhotosByWorldJoin = (
  worldJoinData: WorldJoinData[],
  photoPathList: PhotoPathData[],
): WorldJoinWithPhotos => {
  // ソートを行い、新しい順に並べる
  const sortedWorldJoinData = [...worldJoinData].sort(
    (a, b) => b.joinDateTime.getTime() - a.joinDateTime.getTime(),
  );

  let remainingPhotos = [...photoPathList];
  const result = [];

  // 各 worldJoin に対して対応する写真をグループ化
  for (const worldJoin of sortedWorldJoinData) {
    const photos = remainingPhotos.filter(
      (photo) => photo.photoTakenAt >= worldJoin.joinDateTime,
    );

    // 既に処理済みの写真を削除
    remainingPhotos = remainingPhotos.filter(
      (photo) => photo.photoTakenAt < worldJoin.joinDateTime,
    );

    result.push({
      worldJoin,
      photos,
    });
  }

  // worldJoin に対応しない写真を処理
  if (remainingPhotos.length > 0) {
    result.push({
      worldJoin: null,
      photos: remainingPhotos,
    });
  }

  return result;
};
