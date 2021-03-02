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
    const imageFile = (
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

  it('should return null for non-image data', function() {
    let imageFile = null;
    imageFile = (
      imageUploadHelperService.convertImageDataToImageFile(
        'data:text/plain;base64,xyz'));
    expect(imageFile).toEqual(null);
  });

  it('should throw error for an invalid filename', function() {
    const height = 'height';
    const width = '2d455';
    const verticalPadding = '0d123';
    expect(() => imageUploadHelperService.generateMathExpressionImageFilename(
      height, width, verticalPadding))
      .toThrowError('The Math SVG filename format is invalid.');
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

  it('should remove custom data attribute from the SVG string', function() {
    const svgString = (
      '<svg width="1.33ex" height="1.429ex" viewBox="0 -511.5 572.5 615.4" ' +
      'focusable="false" role= "img" style="vertical-align: -0.241ex;" xmln' +
      's="http://www.w3.org/2000/svg"><g stroke="currentColor" fill="curren' +
      'tColor" stroke-width="0" transform="matrix(1 0 0 -1 0 0)"><path stro' +
      'ke-width="1" d="M52 289Q59 331 106 386T222 442Q257 442 2864Q412 404 ' +
      '406 402Q368 386 350 336Q290 115 290 78Q290 50 306 38T341 26Q378 26 4' +
      '14 59T463 140Q466 150 469 151T485 153H489Q504 153 504 145284 52 289Z' +
      '" data-custom="datacustom"/></g></svg>'
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

  it('should extract dimensions from SVG string without style', function() {
    const svgString = (
      '<svg width="1.33ex" height="1.429ex" viewBox="0 -511.5 572.5 615.4" ' +
      'focusable="false" style="" xmlns="http://www.w3.org/2000/svg"><g str' +
      'oke="currentColor" fill="currentColor" stroke-width="0" transform="m' +
      'atrix(1 0 0 -1 0 0)"><path stroke-width="1" d="M52 289Q59 331 106 38' +
      '6T222 442Q257 442 2864Q412 404 406 402Q368 386 350 336Q290 115 290 7' +
      '8Q290 50 306 38T341 26Q378 26 414 59T463 140Q466 150 469 151T485 153' +
      'H489Q504 153 504 145284 52 289Z"/></g></svg>'
    );
    const dimensions = (
      imageUploadHelperService
        .extractDimensionsFromMathExpressionSvgString(svgString));
    const expectedDimension = {
      height: '1d429',
      width: '1d33',
      verticalPadding: '0'
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

  it('should get invalid svg tags and attributes', function() {
    var dataURI = (
      'data:image/svg+xml;base64,' +
      btoa(unescape(encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" widdth="1.33ex" height="1.4' +
        '29ex" viewBox="0 -511.5 572.5 615.4" focusable="false" style="verti' +
        'cal-align: -0.241ex;"><g stroke="currentColor" fill="currentColor" ' +
        'stroke-width="0" transform="matrix(1 0 0 -1 0 0)"><path stroke-widt' +
        'h="1" d="M52289Q59 331 106 386T222 442Q257 442 2864Q412 404 406 402' +
        'Q368 386 350 336Q290 115 290 78Q290 50 306 38T341 26Q378 26 414 59T' +
        '463 140Q466 150 469 151T485 153H489Q504 153 504 145284 52 289Z"/></' +
        'g><circel></circel></svg>'
      ))));
    const invalidSvgTagsAndAttrs = (
      imageUploadHelperService.getInvalidSvgTagsAndAttrs(dataURI));
    const expectedInvalidSvgTagsAndAttrs = {
      tags: ['circel'],
      attrs: ['svg:widdth']
    };
    expect(invalidSvgTagsAndAttrs).toEqual(expectedInvalidSvgTagsAndAttrs);
  });

  it('should get trusted resource Url for thumbnail filename', function() {
    const imageFileName = 'image.svg';
    const entityType = 'logo';
    const entityId = 'id';
    const trustedResourceUrl = (
      imageUploadHelperService.getTrustedResourceUrlForThumbnailFilename(
        imageFileName, entityType, entityId
      )
    );
    expect(String(trustedResourceUrl)).toEqual(
      '/assetsdevhandler/logo/id/assets/thumbnail/image.svg'
    );
  });
});
