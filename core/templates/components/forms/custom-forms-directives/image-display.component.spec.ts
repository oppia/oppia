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
 * @fileoverview Unit tests for Thumbnail Display component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  async,
  ComponentFixture,
  fakeAsync,
  TestBed,
} from '@angular/core/testing';
import {SvgSanitizerService} from 'services/svg-sanitizer.service';

import {ThumbnailDisplayComponent} from './thumbnail-display.component';

describe('Thumbnail Component', () => {
  let component: ThumbnailDisplayComponent;
  let fixture: ComponentFixture<ThumbnailDisplayComponent>;
  let svgSanitizerService: SvgSanitizerService;
  class MockSvgSanitizerService {
    getTrustedSvgResourceUrl(str: string): string {
      return str;
    }
  }
  /**
   * Safe SVG Decoded
   * <svg version="1.1" baseProfile="full" xmlns="http://www.w3.org/2000/svg">
   *  <polygon id="triangle"
   *           points="0,0 0,50 50,0" fill="#009900" stroke="#004400" />
   * </svg>
   */

  const safeSvg =
    'data:image/svg+xml;base64,PHN2ZyBpZD0ic291cmNlIiB2ZXJzaW9uPSIxLjEiIGJhc2' +
    'VQcm9maWxlPSJmdWxsIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogID' +
    'xwb2x5Z29uIGlkPSJ0cmlhbmdsZSIgcG9pbnRzPSIwLDAgMCw1MCA1MCwwIiBmaWxsPSIjMD' +
    'A5OTAwIiBzdHJva2U9IiMwMDQ0MDAiPjwvcG9seWdvbj4KPC9zdmc+';

  /**
   * Malicious SVG Decoded
   * <svg version="1.1" baseProfile="full" xmlns="http://www.w3.org/2000/svg">
   * <polygon id="triangle"
   *           points="0,0 0,50 50,0" fill="#009900" stroke="#004400" />
   * <script type="text/javascript">
   *   alert('This app is probably vulnerable to XSS attacks!');
   * </script>
   * </svg>
   */
  const maliciousSvg =
    'data:image/svg+xml;base64,PHN2ZyBpZD0ic291cmNlIiB2ZXJzaW9uPSIxLjEiIGJhc2' +
    'VQcm9maWxlPSJmdWxsIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogID' +
    'xwb2x5Z29uIGlkPSJ0cmlhbmdsZSIgcG9pbnRzPSIwLDAgMCw1MCA1MCwwIiBmaWxsPSIjMD' +
    'A5OTAwIiBzdHJva2U9IiMwMDQ0MDAiPjwvcG9seWdvbj4KICA8c2NyaXB0IHR5cGU9InRleH' +
    'QvamF2YXNjcmlwdCI+CiAgICBhbGVydCgnVGhpcyBhcHAgaXMgcHJvYmFibHkgdnVsbmVyYW' +
    'JsZSB0byBYU1MgYXR0YWNrcyEnKTsKICA8L3NjcmlwdD4KPC9zdmc+';

  const invalidBase64data = 'data:image/svg+xml;base64,This is invalid %3D';
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ThumbnailDisplayComponent],
      providers: [
        {
          provide: SvgSanitizerService,
          useClass: MockSvgSanitizerService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ThumbnailDisplayComponent);
    component = fixture.componentInstance;
    svgSanitizerService = TestBed.get(SvgSanitizerService);
  }));

  it("should not render malicious SVG's on Init", fakeAsync(() => {
    const sanitizerSpy = spyOn(svgSanitizerService, 'getTrustedSvgResourceUrl');
    sanitizerSpy.and.returnValue(null);
    component.imgSrc = maliciousSvg;
    component.ngOnInit();
    expect(component.imageSourceInView).toBe(null);
    sanitizerSpy.and.returnValue(safeSvg);
    component.imgSrc = safeSvg;
    component.ngOnInit();
    expect(component.imageSourceInView).toBe(safeSvg);
  }));

  it("should not render malicious SVG's on value change", fakeAsync(() => {
    const sanitizerSpy = spyOn(svgSanitizerService, 'getTrustedSvgResourceUrl');
    sanitizerSpy.and.returnValue(null);
    component.imgSrc = maliciousSvg;
    component.ngOnChanges();
    expect(component.imageSourceInView).toBe(null);
    sanitizerSpy.and.returnValue(safeSvg);
    component.imgSrc = safeSvg;
    component.ngOnChanges();
    expect(component.imageSourceInView).toBe(safeSvg);
  }));

  it('should not try to render invalid base64 images', fakeAsync(() => {
    const sanitizerSpy = spyOn(svgSanitizerService, 'getTrustedSvgResourceUrl');
    sanitizerSpy.and.returnValue(null);
    component.imgSrc = invalidBase64data;
    component.ngOnChanges();
    expect(component.imageSourceInView).toBe(null);
  }));

  it('should accept URLs as src', fakeAsync(() => {
    component.imgSrc = 'https://oppia.org/some.svg';
    component.ngOnChanges();
    expect(component.imageSourceInView).toBe('https://oppia.org/some.svg');
  }));
});
