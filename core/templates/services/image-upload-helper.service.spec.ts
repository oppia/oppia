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
 * @fileoverview Unit test for ImageUploadHelperService.
 */

import { HttpClientTestingModule } from
  '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ImageUploadHelperService } from './image-upload-helper.service';

describe('ImageUploadHelperService', () => {
  let imageUploadHelperService: ImageUploadHelperService = null;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    imageUploadHelperService =
      TestBed.get(ImageUploadHelperService);
  });

  it('should convert image data to image file', () => {
    let imageFile = null;
    imageFile = (
      imageUploadHelperService.convertImageDataToImageFile(
        'data:image/png;base64,xyz'));
    expect(imageFile instanceof Blob).toBe(true);
  });

  it('should generate a filename for a math SVG', () => {
    let height = '1d345';
    let width = '2d455';
    let verticalPadding = '0d123';
    let generatedFilename = (
      imageUploadHelperService.generateMathExpressionImageFilename(
        height, width, verticalPadding));
    expect(generatedFilename.endsWith(
      '_height_1d345_width_2d455_vertical_0d123.svg')).toBe(true);
  });

  it('should generate a filename for a normal image', () => {
    let height = 720;
    let width = 180;
    let format = 'png';
    let generatedFilename = (
      imageUploadHelperService.generateImageFilename(height, width, format));
    expect(generatedFilename.endsWith('_height_720_width_180.png')).toBe(true);
  });
});
