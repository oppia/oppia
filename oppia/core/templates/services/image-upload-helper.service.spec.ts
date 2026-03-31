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
 * @fileoverview Unit test for imageUploadHelperService.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {ImageUploadHelperService} from './image-upload-helper.service';

describe('imageUploadHelperService', () => {
  let imageUploadHelperService: ImageUploadHelperService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    imageUploadHelperService = TestBed.inject(ImageUploadHelperService);
  });

  it('should convert image data to image file', () => {
    const imageFile = imageUploadHelperService.convertImageDataToImageFile(
      'data:image/png;base64,JUMzJTg3JTJD'
    );
    expect(imageFile instanceof Blob).toBe(true);
  });

  it('should return null for non-image data', function () {
    const imageFile = imageUploadHelperService.convertImageDataToImageFile(
      'data:text/plain;base64,JUMzJTg3JTJD'
    );
    expect(imageFile).toEqual(null);
  });

  it('should generate a filename for a math SVG', function () {
    const height = '1d345';
    const width = '2d455';
    const verticalPadding = '0d123';
    const generatedFilename =
      imageUploadHelperService.generateMathExpressionImageFilename(
        height,
        width,
        verticalPadding
      );
    expect(
      generatedFilename.endsWith('_height_1d345_width_2d455_vertical_0d123.svg')
    ).toBe(true);
  });

  it('should throw error for an invalid filename', function () {
    const height = 'height';
    const width = '2d455';
    const verticalPadding = '0d123';
    expect(() =>
      imageUploadHelperService.generateMathExpressionImageFilename(
        height,
        width,
        verticalPadding
      )
    ).toThrowError('The Math SVG filename format is invalid.');
  });

  it('should generate a filename for a normal image', function () {
    const height = 720;
    const width = 180;
    const format = 'png';
    const generatedFilename = imageUploadHelperService.generateImageFilename(
      height,
      width,
      format
    );
    expect(generatedFilename.endsWith('_height_720_width_180.png')).toBe(true);
  });

  it('should get trusted resource Url for thumbnail filename', function () {
    const imageFileName = 'image.svg';
    const entityType = 'logo';
    const entityId = 'id';
    const trustedResourceUrl =
      imageUploadHelperService.getTrustedResourceUrlForThumbnailFilename(
        imageFileName,
        entityType,
        entityId
      );
    expect(String(trustedResourceUrl)).toEqual(
      '/assetsdevhandler/logo/id/assets/thumbnail/image.svg'
    );
  });
});
