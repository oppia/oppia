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

describe('SubtitledHtml object factory', function() {
  beforeEach(module('oppia'));

  describe('SubtitledHtmlObjectFactory', function() {
    var scope, shof, lus, subtitledHtml;

    beforeEach(inject(function($injector, $rootScope) {
      scope = $rootScope.$new();
      shof = $injector.get('SubtitledHtmlObjectFactory');

      subtitledHtml = shof.createFromBackendDict({
        content_id: 'content_id',
        html: '<p>some html</p>'
      });
    }));

    it('should get and set HTML correctly', inject(function() {
      expect(subtitledHtml.getHtml()).toEqual('<p>some html</p>');
      subtitledHtml.setHtml('new html');
      expect(subtitledHtml.getHtml()).toEqual('new html');
    }));

    it('should get contentId correctly', inject(function() {
      expect(subtitledHtml.getContentId()).toEqual('content_id');
    }));

    it('should correctly check existence of HTML', inject(function() {
      expect(subtitledHtml.hasNoHtml()).toBe(false);
      subtitledHtml.setHtml('');
      expect(subtitledHtml.hasNoHtml()).toBe(true);
    }));

    it('should correctly check emptiness', inject(function() {
      expect(subtitledHtml.isEmpty()).toBe(false);

      subtitledHtml.setHtml('');
      expect(subtitledHtml.isEmpty()).toBe(true);

      subtitledHtml.setHtml('hello');
      expect(subtitledHtml.isEmpty()).toBe(false);
    }));

    it('should convert to backend dict correctly', inject(function() {
      expect(subtitledHtml.toBackendDict()).toEqual({
        content_id: 'content_id',
        html: '<p>some html</p>'
      });
    }));

    it('should create default object', inject(function() {
      var defaultSubtitledHtml = shof.createDefault('test html', 'content_id');
      expect(defaultSubtitledHtml.getHtml()).toEqual('test html');
      expect(defaultSubtitledHtml.getContentId()).toEqual('content_id');
    }));
  });
});
