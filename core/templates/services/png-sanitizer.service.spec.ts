// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for PngSanitizationService.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { PngSanitizerService } from './png-sanitizer.service';



describe('PngSanitizerService', () => {
  let pngSanitizerService: PngSanitizerService;
  class MockDomSanitizer {
    bypassSecurityTrustResourceUrl(str: string): string {
      return str;
    }
  }

  const safePng = (
    'data:image/png;base64,PHN2ZyBpZD0ic291cmNlIiB2ZXJzaW9uPSIxLjEiIGJhc2' +
    'VQcm9maWxlPSJmdWxsIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogID' +
    'xwb2x5Z29uIGlkPSJ0cmlhbmdsZSIgcG9pbnRzPSIwLDAgMCw1MCA1MCwwIiBmaWxsPSIjMD' +
    'A5OTAwIiBzdHJva2U9IiMwMDQ0MDAiPjwvcG9seWdvbj4KPC9zdmc+'
  );

  const invalidBase64data = 'data:image/svg+xml;base64,This is invalid %3D';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: DomSanitizer,
          useClass: MockDomSanitizer
        }
      ]
    });
    pngSanitizerService = TestBed.inject(PngSanitizerService);
  });

  it('should check for invalid base64 images', () => {
    expect(pngSanitizerService.isValidBase64Png(invalidBase64data)).toBe(false);
  });

  it('should return SafeResourceUrl when a safe PNG is requested as' +
    'SafeResourceUrl', () => {
    expect(pngSanitizerService.getTrustedPngResourceUrl(safePng))
      .toBe(safePng);
  });

  it('should return null when a invalid PNG is requested as' +
    'SafeResourceUrl', () => {
    expect(pngSanitizerService.getTrustedPngResourceUrl(invalidBase64data))
      .toBe(null);
  });
});
