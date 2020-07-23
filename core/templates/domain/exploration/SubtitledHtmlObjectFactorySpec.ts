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
 * @fileoverview Unit tests for the SubtitledHtml object factory.
 */

import { SubtitledHtmlObjectFactory, SubtitledHtml } from
  'domain/exploration/SubtitledHtmlObjectFactory';

describe('SubtitledHtml object factory', () => {
  let shof: SubtitledHtmlObjectFactory, subtitledHtml: SubtitledHtml;

  beforeEach(() => {
    shof = new SubtitledHtmlObjectFactory();

    subtitledHtml = shof.createFromBackendDict({
      content_id: 'content_id',
      html: '<p>some html</p>'
    });
  });

  it('should get and set HTML correctly', () => {
    expect(subtitledHtml.getHtml()).toEqual('<p>some html</p>');
    subtitledHtml.setHtml('new html');
    expect(subtitledHtml.getHtml()).toEqual('new html');
  });

  it('should get and set contentId correctly', () => {
    expect(subtitledHtml.getContentId()).toEqual('content_id');
    subtitledHtml.setContentId('new_content_id');
    expect(subtitledHtml.getContentId()).toEqual('new_content_id');
  });

  it('should correctly check emptiness', () => {
    expect(subtitledHtml.isEmpty()).toBe(false);

    subtitledHtml.setHtml('');
    expect(subtitledHtml.isEmpty()).toBe(true);

    subtitledHtml.setHtml('hello');
    expect(subtitledHtml.isEmpty()).toBe(false);
  });

  it('should convert to backend dict correctly', () => {
    expect(subtitledHtml.toBackendDict()).toEqual({
      content_id: 'content_id',
      html: '<p>some html</p>'
    });
  });

  it('should create default object', () => {
    const defaultSubtitledHtml = shof.createDefault('test html', 'content_id');
    expect(defaultSubtitledHtml.getHtml()).toEqual('test html');
    expect(defaultSubtitledHtml.getContentId()).toEqual('content_id');
  });
});
