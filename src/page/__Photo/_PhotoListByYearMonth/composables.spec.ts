import {
  type PhotoPathData,
  type WorldJoinData,
  groupPhotosByWorldJoin,
} from './composables';

describe('groupPhotosByWorldJoin', () => {
  it('should group photos by world join correctly', () => {
    const worldJoinData: WorldJoinData[] = [
      {
        id: '1',
        worldId: 'world1',
        worldName: 'World 1',
        worldInstanceId: 'instance1',
        joinDateTime: new Date('2024-08-18T10:00:00Z'),
        createdAt: new Date('2024-08-18T09:00:00Z'),
        updatedAt: new Date('2024-08-18T09:00:00Z'),
      },
      {
        id: '2',
        worldId: 'world2',
        worldName: 'World 2',
        worldInstanceId: 'instance2',
        joinDateTime: new Date('2024-08-18T12:00:00Z'),
        createdAt: new Date('2024-08-18T11:00:00Z'),
        updatedAt: new Date('2024-08-18T11:00:00Z'),
      },
    ];

    const photoPathList: PhotoPathData[] = [
      {
        id: 'p1',
        photoPath: 'photo1.jpg',
        photoTakenAt: new Date('2024-08-18T10:30:00Z'),
      },
      {
        id: 'p2',
        photoPath: 'photo2.jpg',
        photoTakenAt: new Date('2024-08-18T11:30:00Z'),
      },
      {
        id: 'p3',
        photoPath: 'photo3.jpg',
        photoTakenAt: new Date('2024-08-18T13:00:00Z'),
      },
    ];

    const expected = [
      {
        worldJoin: {
          id: '2',
          worldId: 'world2',
          worldName: 'World 2',
          worldInstanceId: 'instance2',
          joinDateTime: new Date('2024-08-18T12:00:00Z'),
          createdAt: new Date('2024-08-18T11:00:00Z'),
          updatedAt: new Date('2024-08-18T11:00:00Z'),
        },
        photos: [
          {
            id: 'p3',
            photoPath: 'photo3.jpg',
            photoTakenAt: new Date('2024-08-18T13:00:00Z'),
          },
        ],
      },
      {
        worldJoin: {
          id: '1',
          worldId: 'world1',
          worldName: 'World 1',
          worldInstanceId: 'instance1',
          joinDateTime: new Date('2024-08-18T10:00:00Z'),
          createdAt: new Date('2024-08-18T09:00:00Z'),
          updatedAt: new Date('2024-08-18T09:00:00Z'),
        },
        photos: [
          {
            id: 'p1',
            photoPath: 'photo1.jpg',
            photoTakenAt: new Date('2024-08-18T10:30:00Z'),
          },
          {
            id: 'p2',
            photoPath: 'photo2.jpg',
            photoTakenAt: new Date('2024-08-18T11:30:00Z'),
          },
        ],
      },
    ];

    const result = groupPhotosByWorldJoin(worldJoinData, photoPathList);
    expect(result).toEqual(expected);
  });

  it('should return empty result when no data is provided', () => {
    const worldJoinData: WorldJoinData[] = [];
    const photoPathList: PhotoPathData[] = [];

    const result = groupPhotosByWorldJoin(worldJoinData, photoPathList);
    expect(result).toEqual([]);
  });

  it('should handle case where there are no photos', () => {
    const worldJoinData: WorldJoinData[] = [
      {
        id: '1',
        worldId: 'world1',
        worldName: 'World 1',
        worldInstanceId: 'instance1',
        joinDateTime: new Date('2024-08-18T10:00:00Z'),
        createdAt: new Date('2024-08-18T09:00:00Z'),
        updatedAt: new Date('2024-08-18T09:00:00Z'),
      },
    ];

    const photoPathList: PhotoPathData[] = [];

    const expected = [
      {
        worldJoin: {
          id: '1',
          worldId: 'world1',
          worldName: 'World 1',
          worldInstanceId: 'instance1',
          joinDateTime: new Date('2024-08-18T10:00:00Z'),
          createdAt: new Date('2024-08-18T09:00:00Z'),
          updatedAt: new Date('2024-08-18T09:00:00Z'),
        },
        photos: [],
      },
    ];

    const result = groupPhotosByWorldJoin(worldJoinData, photoPathList);
    expect(result).toEqual(expected);
  });

  it('should handle case where there are no world joins', () => {
    const worldJoinData: WorldJoinData[] = [];
    const photoPathList: PhotoPathData[] = [
      {
        id: 'p1',
        photoPath: 'photo1.jpg',
        photoTakenAt: new Date('2024-08-18T10:30:00Z'),
      },
    ];

    const expected = [
      {
        worldJoin: null,
        photos: [
          {
            id: 'p1',
            photoPath: 'photo1.jpg',
            photoTakenAt: new Date('2024-08-18T10:30:00Z'),
          },
        ],
      },
    ];

    const result = groupPhotosByWorldJoin(worldJoinData, photoPathList);
    expect(result).toEqual(expected);
  });
});
