// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ImageUploadHelperService } from 'services/image-upload-helper.service';


describe('ImageUploadHelperService', () => {
  let imageUploadHelperService: ImageUploadHelperService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    imageUploadHelperService = TestBed.inject(ImageUploadHelperService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should convert image data to image file', () => {
    let imageFile = null;
    imageFile = (
      imageUploadHelperService.convertImageDataToImageFile(
        'data:image/png;base64,xyz'));
    expect(imageFile instanceof Blob).toBe(true);
  });

  it('should generate a filename for a math SVG', () => {
    const height = '1d345';
    const width = '2d455';
    const verticalPadding = '0d123';
    const generatedFilename = (
      imageUploadHelperService.generateMathExpressionImageFilename(
        height, width, verticalPadding));
    expect(generatedFilename.endsWith(
      '_height_1d345_width_2d455_vertical_0d123.svg')).toBe(true);
  });

  it('should remove the role attribute from the Math SVG string', () => {
    const svgString = (
      '<svg width="1.33ex" height="1.429ex" viewBox="0 -511.5 572.5 615.4" ' +
      'focusable="false" role= "img" style="vertical-align: -0.241ex;" xmln' +
      's="http://www.w3.org/2000/svg"><g stroke="currentColor" fill="curren' +
      'tColor" stroke-width="0" transform="matrix(1 0 0 -1 0 0)"><path stro' +
      'ke-width="1" d="M52 289Q59 331 106 386T222 442Q257 442 2864Q412 404 ' +
      '406 402Q368 386 350 336Q290 115 290 78Q290 50 306 38T341 26Q378 26 4' +
      '14 59T463 140Q466 150 469 151T485 153H489Q504 153 504 145284 52 289Z' +
      '"/></g></svg>'
    );
    const cleanedSvgString = (
      imageUploadHelperService.cleanMathExpressionSvgString(svgString));
    const expectedCleanSvgString = (
      '<svg xmlns="http://www.w3.org/2000/svg" width="1.33ex" height="1.429e' +
      'x" viewBox="0 -511.5 572.5 615.4" focusable="false" style="vertical-a' +
      'lign: -0.241ex;"><g stroke="currentColor" fill="currentColor" stro' +
      'ke-width="0" transform="matrix(1 0 0 -1 0 0)"><path stroke-width="1"' +
      ' d="M52 289Q59 331 106 386T222 442Q257 442 2864Q412 404 406 402Q368 ' +
      '386 350 336Q290 115 290 78Q290 50 306 38T341 26Q378 26 414 59T463 14' +
      '0Q466 150 469 151T485 153H489Q504 153 504 145284 52 289Z"/></g></svg>'
    );
    expect(cleanedSvgString).toEqual(expectedCleanSvgString);
  });

  it('should replace xmlns:xlink with xmlns in a Math SVG string', () => {
    const svgString = (
      '<svg xmlns:xlink="http://www.w3.org/1999/xlink" width="1.33ex" height' +
      '="1.429ex" viewBox="0 -511.5 572.5 615.4" focusable="false" style="ve' +
      'rtical-align: -0.241ex;"><g stroke="currentColor" fill="currentColor"' +
      ' stroke-width="0" transform="matrix(1 0 0 -1 0 0)"><path stroke-width' +
      '="1" d="M52 289Q59 331 106 386T222 442Q257 442 2864Q412 404 406 402Q3' +
      '68 386 350 336Q290 115 290 78Q290 50 306 38T341 26Q378 26 414 59T463 ' +
      '140Q466 150 469 151T485 153H489Q504 153 504 145284 52 289Z"></path></' +
      'g></svg>'
    );
    const cleanedSvgString = (
      imageUploadHelperService.cleanMathExpressionSvgString(svgString));
    const expectedCleanSvgString = (
      '<svg width="1.33ex" height="1.429ex" viewBox="0 -511.5 572.5 615.4" ' +
      'focusable="false" style="vertical-align: -0.241ex;" xmlns="http://ww' +
      'w.w3.org/2000/svg"><g stroke="currentColor" fill="currentColor" stro' +
      'ke-width="0" transform="matrix(1 0 0 -1 0 0)"><path stroke-width="1"' +
      ' d="M52 289Q59 331 106 386T222 442Q257 442 2864Q412 404 406 402Q368 ' +
      '386 350 336Q290 115 290 78Q290 50 306 38T341 26Q378 26 414 59T463 14' +
      '0Q466 150 469 151T485 153H489Q504 153 504 145284 52 289Z"/></g></svg>'
    );
    expect(cleanedSvgString).toEqual(expectedCleanSvgString);
  });

  it('should extract dimensions from an math SVG string', () => {
    const svgString = (
      '<svg width="1.33ex" height="1.429ex" viewBox="0 -511.5 572.5 615.4" ' +
      'focusable="false" style="vertical-align: -0.241ex;" xmlns="http://ww' +
      'w.w3.org/2000/svg"><g stroke="currentColor" fill="currentColor" stro' +
      'ke-width="0" transform="matrix(1 0 0 -1 0 0)"><path stroke-width="1"' +
      ' d="M52 289Q59 331 106 386T222 442Q257 442 2864Q412 404 406 402Q368 ' +
      '386 350 336Q290 115 290 78Q290 50 306 38T341 26Q378 26 414 59T463 14' +
      '0Q466 150 469 151T485 153H489Q504 153 504 145284 52 289Z"/></g></svg>'
    );
    const dimensions = (
      imageUploadHelperService.extractDimensionsFromMathExpressionSvgString(
        svgString));
    const expectedDimension = {
      height: '1d429',
      width: '1d33',
      verticalPadding: '0d241'
    };
    expect(dimensions).toEqual(expectedDimension);
  });

  it('should generate a filename for a normal image', () => {
    const height = 720;
    const width = 180;
    const format = 'png';
    const generatedFilename = (
      imageUploadHelperService.generateImageFilename(height, width, format));
    expect(generatedFilename.endsWith('_height_720_width_180.png')).toBe(true);
  });
});
