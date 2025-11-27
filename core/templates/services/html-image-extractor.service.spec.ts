// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for HtmlImageExtractorService.
 */

import {TestBed} from '@angular/core/testing';
import {HtmlImageExtractorService} from './html-image-extractor.service';

describe('HtmlImageExtractorService', () => {
  let service: HtmlImageExtractorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HtmlImageExtractorService],
    });
    service = TestBed.inject(HtmlImageExtractorService);
  });

  it('should extract image filenames from simple HTML', () => {
    const html =
      '<oppia-noninteractive-image ' +
      'filepath-with-value="&quot;img1.svg&quot;" ' +
      'caption-with-value="&quot;&quot;" ' +
      'alt-with-value="&quot;Alt&quot;"></oppia-noninteractive-image>';

    const filenames = service.getAllImageFilenamesFromHtml(html);
    expect(filenames).toContain('img1.svg');
  });

  it('should extract image filenames from nested collapsible', () => {
    const html =
      '<oppia-noninteractive-collapsible ' +
      'heading-with-value="&quot;Header&quot;" ' +
      'content-with-value="&quot;' +
      '<p>Text before.</p>' +
      '<oppia-noninteractive-image ' +
      'filepath-with-value=\\&quot;nested_img.svg\\&quot; ' +
      'caption-with-value=\\&quot;\\&quot; ' +
      'alt-with-value=\\&quot;Nested Alt\\&quot;></oppia-noninteractive-image>' +
      '<p>Text after.</p>' +
      '&quot;"></oppia-noninteractive-collapsible>';

    const filenames = service.getAllImageFilenamesFromHtml(html);
    expect(filenames).toContain('nested_img.svg');
  });

  it('should extract math SVG filenames', () => {
    const html =
      '<oppia-noninteractive-math ' +
      'math_content-with-value="{&amp;quot;raw_latex&amp;quot;:' +
      '&amp;quot;x^2&amp;quot;,&amp;quot;svg_filename&amp;quot;:' +
      '&amp;quot;math1.svg&amp;quot;}"></oppia-noninteractive-math>';

    const filenames = service.getAllImageFilenamesFromHtml(html);
    expect(filenames).toContain('math1.svg');
  });

  it('should deduplicate image filenames', () => {
    const html =
      '<oppia-noninteractive-image ' +
      'filepath-with-value="&quot;img1.svg&quot;" ' +
      'caption-with-value="&quot;&quot;" ' +
      'alt-with-value="&quot;Alt&quot;"></oppia-noninteractive-image>' +
      '<oppia-noninteractive-image ' +
      'filepath-with-value="&quot;img1.svg&quot;" ' +
      'caption-with-value="&quot;&quot;" ' +
      'alt-with-value="&quot;Alt&quot;"></oppia-noninteractive-image>';

    const filenames = service.getAllImageFilenamesFromHtml(html);
    expect(filenames.length).toBe(1);
    expect(filenames).toContain('img1.svg');
  });

  it('should return empty array for HTML with no images', () => {
    const html = '<p>Just some text with no images.</p>';
    const filenames = service.getAllImageFilenamesFromHtml(html);
    expect(filenames.length).toBe(0);
  });
});
