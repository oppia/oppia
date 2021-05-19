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

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AlertsService } from './alerts.service';
import { ImageLocalStorageService } from './image-local-storage.service';
import { ImageUploadHelperService } from './image-upload-helper.service';


describe('ImageLocalStorageService', () => {
  let alertsService: AlertsService = null;
  let imageLocalStorageService: ImageLocalStorageService = null;
  let sampleImageData = 'data:image/png;base64,xyz';
  let imageFilename = 'filename';
  let imageUploadHelperService: ImageUploadHelperService;
  class MockImageUploadHelperService {
    convertImageDataToImageFile(imageData) {
      return imageData;
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{
        provide: ImageUploadHelperService,
        useClass: MockImageUploadHelperService
      }]
    });
  });

  beforeEach(() => {
    imageLocalStorageService = TestBed.inject(ImageLocalStorageService);
    alertsService = TestBed.inject(AlertsService);
    imageUploadHelperService = TestBed.inject(ImageUploadHelperService);
  });

  it(
    'should call helper service function correctly when getting' +
    ' object url', () => {
      const imageUploaderSpy = spyOn(
        imageUploadHelperService, 'convertImageDataToImageFile');
      spyOn(URL, 'createObjectURL').and.returnValue('objectUrl');
      imageLocalStorageService.saveImage(imageFilename, sampleImageData);
      expect(
        imageLocalStorageService.getObjectUrlForImage(imageFilename)
      ).toBe('objectUrl');
      expect(imageUploaderSpy).toHaveBeenCalledWith(sampleImageData);
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

  it('should get raw image data correctly', () => {
    imageLocalStorageService.saveImage(imageFilename, sampleImageData);
    expect(
      imageLocalStorageService.getRawImageData(imageFilename)).toEqual(
      sampleImageData);
    expect(
      imageLocalStorageService.getRawImageData('invalidFilename')).toEqual(
      null);
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
