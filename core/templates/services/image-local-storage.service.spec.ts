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

import { UpgradedServices } from 'services/UpgradedServices';

require('services/image-local-storage.service.ts');

describe('ImageLocalStorageService', function() {
  var AlertsService = null;
  var ImageLocalStorageService = null;
  var sampleImageData = 'data:image/png;base64,xyz';
  var imageFilename = 'filename';
  var mockImageUploadHelperService = {
    convertImageDataToImageFile: function(imageData) {}
  };

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'ImageUploadHelperService', [mockImageUploadHelperService][0]);
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector) {
    ImageLocalStorageService = $injector.get('ImageLocalStorageService');
    AlertsService = $injector.get('AlertsService');
  }));

  it(
    'should call helper service function correctly when getting' +
    ' object url', function() {
      spyOn(mockImageUploadHelperService, 'convertImageDataToImageFile');
      spyOn(URL, 'createObjectURL').and.returnValue('objectUrl');
      ImageLocalStorageService.saveImage(imageFilename, sampleImageData);
      expect(
        ImageLocalStorageService.getObjectUrlForImage(imageFilename)
      ).toBe('objectUrl');
      expect(
        mockImageUploadHelperService.convertImageDataToImageFile
      ).toHaveBeenCalledWith(sampleImageData);
    }
  );

  it('should delete images from localStorage correctly', function() {
    ImageLocalStorageService.saveImage(imageFilename, sampleImageData);
    ImageLocalStorageService.saveImage('filename 2', sampleImageData);
    ImageLocalStorageService.saveImage('filename 3', sampleImageData);
    ImageLocalStorageService.deleteImage('filename 2');
    expect(
      ImageLocalStorageService.getStoredImagesData().length).toEqual(2);
    ImageLocalStorageService.flushStoredImagesData();
    expect(
      ImageLocalStorageService.getStoredImagesData().length).toEqual(0);
  });

  it(
    'should show error message if number of stored images crosses ' +
    'limit', function() {
      for (var i = 0; i <= 50; i++) {
        ImageLocalStorageService.saveImage('filename' + i, sampleImageData);
      }
      expect(AlertsService.messages.length).toEqual(0);
      ImageLocalStorageService.saveImage('filename51', sampleImageData);
      expect(AlertsService.messages.length).toEqual(1);
    }
  );

  it('should set and clear the thumbnail background color', function() {
    expect(ImageLocalStorageService.getImageBgColor()).toEqual(null);
    let bgColor = '#e34d43';
    ImageLocalStorageService.setImageBgColor(bgColor);
    expect(ImageLocalStorageService.getImageBgColor()).toEqual(bgColor);
  });
});
