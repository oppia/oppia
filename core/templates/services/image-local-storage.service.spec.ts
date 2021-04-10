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

import { TestBed } from '@angular/core/testing';
import { AlertsService } from 'services/alerts.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { ImageUploadHelperService } from 'services/image-upload-helper.service';

describe('ImageLocalStorageService', () => {
  let alertsService: AlertsService = null;
  let imageLocalStorageService: ImageLocalStorageService;
  const sampleImageData = 'data:image/png;base64,xyz';
  const imageFilename = 'filename';
  const mockImageUploadHelperService = {
    convertImageDataToImageFile: (imageData) => {}
  };

  beforeEach(() => {
    spyOn(mockImageUploadHelperService, 'convertImageDataToImageFile');
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ImageUploadHelperService,
          useValue: mockImageUploadHelperService
        }
      ]
    });
    imageLocalStorageService = TestBed.inject(ImageLocalStorageService);
    alertsService = TestBed.inject(AlertsService);
  });

  it(
    'should call helper service function correctly when getting' +
    ' object url', () => {
      spyOn(URL, 'createObjectURL').and.returnValue('objectUrl');
      imageLocalStorageService.saveImage(imageFilename, sampleImageData);
      expect(
        imageLocalStorageService.getObjectUrlForImage(imageFilename)
      ).toBe('objectUrl');
      expect(
        mockImageUploadHelperService.convertImageDataToImageFile
      ).toHaveBeenCalledWith(sampleImageData);
    }
  );

  it('should delete images from localStorage correctly', () => {
    imageLocalStorageService.saveImage(imageFilename, sampleImageData);
    imageLocalStorageService.saveImage('filename 2', sampleImageData);
    imageLocalStorageService.saveImage('filename 3', sampleImageData);
    imageLocalStorageService.deleteImage('filename 2');
    expect(
      imageLocalStorageService.getStoredImagesData().length).toEqual(2);
    imageLocalStorageService.flushStoredImagesData();
    expect(
      imageLocalStorageService.getStoredImagesData().length).toEqual(0);
  });

  it('should return correctly check whether file exist in storage', () => {
    expect(imageLocalStorageService.isInStorage(imageFilename)).toBeFalse();
    imageLocalStorageService.saveImage(imageFilename, sampleImageData);
    expect(imageLocalStorageService.isInStorage(imageFilename)).toBeTrue();
  });

  it(
    'should show error message if number of stored images crosses ' +
    'limit', () => {
      for (var i = 0; i <= 50; i++) {
        imageLocalStorageService.saveImage('filename' + i, sampleImageData);
      }
      expect(alertsService.messages.length).toEqual(0);
      imageLocalStorageService.saveImage('filename51', sampleImageData);
      expect(alertsService.messages.length).toEqual(1);
    }
  );

  it('should set and clear the thumbnail background color', () => {
    expect(imageLocalStorageService.getThumbnailBgColor()).toEqual(null);
    let bgColor = '#e34d43';
    imageLocalStorageService.setThumbnailBgColor(bgColor);
    expect(imageLocalStorageService.getThumbnailBgColor()).toEqual(bgColor);
  });
});
