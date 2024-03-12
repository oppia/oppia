// Copyright 2020 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit test for ImageLocalStorageService.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {AlertsService} from './alerts.service';
import {ImageLocalStorageService} from './image-local-storage.service';

describe('ImageLocalStorageService', () => {
  let alertsService: AlertsService;
  let imageLocalStorageService: ImageLocalStorageService;
  let sampleImageData = 'data:image/png;base64,JUMzJTg3JTJD';
  let imageFilename = 'filename';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
  });

  beforeEach(() => {
    imageLocalStorageService = TestBed.inject(ImageLocalStorageService);
    alertsService = TestBed.inject(AlertsService);
  });

  it('should delete images from localStorage correctly', () => {
    imageLocalStorageService.saveImage(imageFilename, sampleImageData);
    imageLocalStorageService.saveImage('filename 2', sampleImageData);
    imageLocalStorageService.saveImage('filename 3', sampleImageData);
    imageLocalStorageService.deleteImage('filename 2');
    expect(imageLocalStorageService.getStoredImagesData().length).toEqual(2);
    imageLocalStorageService.flushStoredImagesData();
    expect(imageLocalStorageService.getStoredImagesData().length).toEqual(0);
  });

  it('should get raw image data correctly', () => {
    imageLocalStorageService.saveImage(imageFilename, sampleImageData);
    expect(imageLocalStorageService.getRawImageData(imageFilename)).toEqual(
      sampleImageData
    );
    expect(imageLocalStorageService.getRawImageData('invalidFilename')).toEqual(
      null
    );
  });

  it('should return correctly check whether file exist in storage', () => {
    expect(imageLocalStorageService.isInStorage(imageFilename)).toBeFalse();
    imageLocalStorageService.saveImage(imageFilename, sampleImageData);
    expect(imageLocalStorageService.isInStorage(imageFilename)).toBeTrue();
  });

  it(
    'should show error message if number of stored images crosses ' + 'limit',
    () => {
      for (let i = 0; i <= 50; i++) {
        imageLocalStorageService.saveImage('filename' + i, sampleImageData);
      }
      expect(alertsService.messages.length).toEqual(0);
      imageLocalStorageService.saveImage('filename51', sampleImageData);
      expect(alertsService.messages.length).toEqual(1);
    }
  );

  it('should set and clear the thumbnail background color', () => {
    expect(imageLocalStorageService.getThumbnailBgColor()).toBeNull();
    let bgColor = '#e34d43';
    imageLocalStorageService.setThumbnailBgColor(bgColor);
    expect(imageLocalStorageService.getThumbnailBgColor()).toEqual(bgColor);
  });

  it('should map image filenames to base64 string', async () => {
    const sampleImageData = [
      {
        filename: 'image1.png',
        imageBlob: new Blob(['image1'], {type: 'image/png'}),
      },
      {
        filename: 'image2.png',
        imageBlob: new Blob(['image2'], {type: 'image/png'}),
      },
    ];
    const imageFilenameTob64Mapping =
      await imageLocalStorageService.getFilenameToBase64MappingAsync(
        sampleImageData
      );
    expect(Object.keys(imageFilenameTob64Mapping).sort()).toEqual([
      'image1.png',
      'image2.png',
    ]);
    expect(imageFilenameTob64Mapping['image1.png']).toEqual('aW1hZ2Ux');
    expect(imageFilenameTob64Mapping['image2.png']).toEqual('aW1hZ2Uy');
  });

  it('should handle mapping scenario when image data is empty', async () => {
    const imageFilenameTob64Mapping =
      await imageLocalStorageService.getFilenameToBase64MappingAsync([]);
    expect(imageFilenameTob64Mapping).toEqual({});
  });

  it('should throw error if image blob is null', async () => {
    const sampleImageData = [
      {
        filename: 'imageFilename1',
        imageBlob: null,
      },
    ];
    await expectAsync(
      imageLocalStorageService.getFilenameToBase64MappingAsync(sampleImageData)
    ).toBeRejectedWithError('No image data found');
  });

  it('should throw error if prefix is invalid', async () => {
    const sampleImageData = [
      {
        filename: 'imageFilename1',
        imageBlob: new Blob(['data:random/xyz;base64,Blob1'], {type: 'image'}),
      },
    ];
    await expectAsync(
      imageLocalStorageService.getFilenameToBase64MappingAsync(sampleImageData)
    ).toBeRejectedWithError('No valid prefix found in data url');
  });
});
