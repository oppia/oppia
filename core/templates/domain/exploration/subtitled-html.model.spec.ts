// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the subtitled-html model.
 */

import { SubtitledHtml } from
  'domain/exploration/subtitled-html.model';

describe('SubtitledHtml model', () => {
  let subtitledHtml: SubtitledHtml;

  beforeEach(() => {
    subtitledHtml = SubtitledHtml.createFromBackendDict({
      content_id: 'content_id',
      html: '<p>some html</p>'
    });
  });

  it('should get and set HTML correctly', () => {
    expect(subtitledHtml.html).toEqual('<p>some html</p>');
    subtitledHtml.html = 'new html';
    expect(subtitledHtml.html).toEqual('new html');
  });

  it('should get and set contentId correctly', () => {
    expect(subtitledHtml.contentId).toEqual('content_id');
    subtitledHtml.contentId = 'new_content_id';
    expect(subtitledHtml.contentId).toEqual('new_content_id');
  });

  it('should correctly check emptiness', () => {
    expect(subtitledHtml.isEmpty()).toBe(false);

    subtitledHtml.html = '';
    expect(subtitledHtml.isEmpty()).toBe(true);

    subtitledHtml.html = 'hello';
    expect(subtitledHtml.isEmpty()).toBe(false);
  });

  it('should convert to backend dict correctly', () => {
    expect(subtitledHtml.toBackendDict()).toEqual({
      content_id: 'content_id',
      html: '<p>some html</p>'
    });
  });

  it('should create default object', () => {
    const defaultSubtitledHtml =
     SubtitledHtml.createDefault('test html', 'content_id');
    expect(defaultSubtitledHtml.html).toEqual('test html');
    expect(defaultSubtitledHtml.contentId).toEqual('content_id');
  });
});
