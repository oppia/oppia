// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for SubtopicPageObjectFactory.
 */

describe('Subtopic page object factory', function() {
  var SubtopicPageObjectFactory = null;
  var _sampleSubtopic = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    SubtopicPageObjectFactory = $injector.get('SubtopicPageObjectFactory');
  }));

  it('should be able to create a subtopic page object with given topic and ' +
    'subtopic id', function() {
    var subtopicPage = SubtopicPageObjectFactory.createDefault(
      'topic_id', 2);
    expect(subtopicPage.getId()).toBe('topic_id-2');
    expect(subtopicPage.getTopicId()).toBe('topic_id');
    expect(subtopicPage.getHtmlData()).toEqual('');
    expect(subtopicPage.getLanguageCode()).toEqual('en');
  });

  it('should be able to create an interstitial subtopic page object',
    function() {
      var subtopicPage =
        SubtopicPageObjectFactory.createInterstitialSubtopicPage();
      expect(subtopicPage.getId()).toEqual(null);
      expect(subtopicPage.getTopicId()).toEqual(null);
      expect(subtopicPage.getHtmlData()).toEqual(null);
      expect(subtopicPage.getLanguageCode()).toBe('en');
    });

  it('should be able to copy from another subtopic page', function() {
    var firstSubtopicPage = SubtopicPageObjectFactory.createFromBackendDict({
      id: 'topic_id-1',
      topic_id: 'topic_id',
      html_data: '<p>Data</p>',
      language_code: 'en'
    });

    var secondSubtopicPage = SubtopicPageObjectFactory.createFromBackendDict({
      id: 'topic_id2-2',
      topic_id: 'topic_id2',
      html_data: '<p>Data2</p>',
      language_code: 'en'
    });

    expect(firstSubtopicPage).not.toBe(secondSubtopicPage);
    expect(firstSubtopicPage).not.toEqual(secondSubtopicPage);

    firstSubtopicPage.copyFromSubtopicPage(secondSubtopicPage);
    expect(firstSubtopicPage).not.toBe(secondSubtopicPage);
    expect(firstSubtopicPage).toEqual(secondSubtopicPage);
  });
});
