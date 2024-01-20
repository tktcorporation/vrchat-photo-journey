import { sortPhotoList, usePhotoItems } from './composable';

describe('composable', () => {
  describe('sortPhotoList', () => {
    it('returns undefined for null or undefined photoList', () => {
      expect(sortPhotoList(undefined)).toBeUndefined();
      expect(sortPhotoList(null)).toBeUndefined();
    });

    it('returns original list if no JOIN items are present', () => {
      const photoList = [{ type: 'PHOTO', date: '2023-12-15' }];
      expect(sortPhotoList(photoList)).toEqual(photoList);
    });

    const createPhotoList = ({
      type,
      datetime,
    }: { type: 'PHOTO' | 'JOIN'; datetime: string }): ReturnType<
      typeof usePhotoItems
    >['photoItemList'] => {
      return {
        type,
        datetime: {
          date: {
            year: datetime.slice(0, 4),
            month: datetime.slice(5, 7),
            day: datetime.slice(8, 10),
          },
          time: {
            hour: datetime.slice(11, 13),
            minute: datetime.slice(14, 16),
            second: 0,
            millisecond: 0,
          },
        },
      };
    };

    it('correctly rearranges list with JOIN items', () => {
      const photoList = [
        createPhotoList({ type: 'PHOTO', datetime: '2023-12-17T00:00' }),
        createPhotoList({ type: 'JOIN', datetime: '2023-12-16T00:00' }),
        createPhotoList({ type: 'JOIN', datetime: '2023-12-15T00:00' }),
      ];
      console.log(photoList);
      const expectedResult = [
        createPhotoList({ type: 'JOIN', datetime: '2023-12-16T00:00' }),
        createPhotoList({ type: 'PHOTO', datetime: '2023-12-17T00:00' }),
        createPhotoList({ type: 'JOIN', datetime: '2023-12-15T00:00' }),
      ];
      expect(sortPhotoList(photoList)).toEqual(expectedResult);
    });
  });
});
