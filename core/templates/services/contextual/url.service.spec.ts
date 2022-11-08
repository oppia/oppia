// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for UrlService.
 */

import { TestBed } from '@angular/core/testing';

import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from './window-ref.service';

describe('Url Service', () => {
  let urlService: UrlService;
  let windowRef: WindowRef;
  let sampleHash = 'sampleHash';
  let pathname = '/embed';
  // Check https://www.typescriptlang.org/docs/handbook/utility-types.html#picktype-keys
  let mockLocation:
    Pick<Location, 'href' | 'origin' | 'pathname' | 'hash' | 'search'>;
  let origin = 'http://sample.com';

  beforeEach(() => {
    mockLocation = {
      href: origin + pathname,
      origin: origin,
      pathname: pathname,
      hash: sampleHash,
      search: ''
    };

    urlService = TestBed.get(UrlService);
    windowRef = TestBed.get(WindowRef);
    spyOnProperty(windowRef, 'nativeWindow').and.callFake(() => ({
      location: mockLocation}));
  });

  it('should return correct query value list for each query field', () => {
    expect(urlService.getQueryFieldValuesAsList('field1')).toEqual([]);

    mockLocation.search = '?field1=value1&' +
      'field2=value2&field1=value3&field1=value4&field2=value5&' +
      'field1=value6&field1=value%3F%3D%20%266';
    let expectedList1 = ['value1', 'value3', 'value4', 'value6', 'value?= &6'];
    let expectedList2 = ['value2', 'value5'];
    expect(
      urlService.getQueryFieldValuesAsList('field1')).toEqual(expectedList1);
    expect(
      urlService.getQueryFieldValuesAsList('field2')).toEqual(expectedList2);
  });

  it('should correctly decode special characters in query value in url',
    () => {
      let expectedObject = {
        field1: '?value=1',
        field2: '?value&1'
      };
      mockLocation.search = '?field1=%3Fvalue%3D1&field2=%3Fvalue%261';
      expect(urlService.getUrlParams()).toEqual(expectedObject);
    });

  it('should correctly encode and add query field and value to url',
    () => {
      let queryValue = '&value=1?';
      let queryField = 'field 1';
      let baseUrl = '/sample';
      let expectedUrl1 = baseUrl + '?field%201=%26value%3D1%3F';
      expect(
        urlService.addField(baseUrl, queryField, queryValue)).toBe(
        expectedUrl1);

      baseUrl = '/sample?field=value';
      let expectedUrl2 = baseUrl + '&field%201=%26value%3D1%3F';
      expect(
        urlService.addField(baseUrl, queryField, queryValue)).toBe(
        expectedUrl2);
    });

  it('should correctly return true if embed present in pathname', () => {
    expect(urlService.isIframed()).toBe(true);
  });

  it('should correctly return false if embed not in pathname', () => {
    mockLocation.pathname = '/sample.com';
    expect(urlService.isIframed()).toBe(false);
  });

  it('should correctly return hash value of window.location', () => {
    expect(urlService.getHash()).toBe(sampleHash);
  });

  it('should correctly return the origin of window.location', () => {
    expect(urlService.getOrigin()).toBe('http://sample.com');
  });

  it('should correctly retrieve topic id from url', () => {
    mockLocation.pathname = '/topic_editor/abcdefgijklm';
    expect(
      urlService.getTopicIdFromUrl()
    ).toBe('abcdefgijklm');
    mockLocation.pathname = '/topic_editor/abcdefgij';
    expect(function() {
      urlService.getTopicIdFromUrl();
    }).toThrowError('Invalid topic id url');

    mockLocation.pathname = '/topiceditor/abcdefgijklm';
    expect(function() {
      urlService.getTopicIdFromUrl();
    }).toThrowError('Invalid topic id url');

    mockLocation.pathname = '/topic_editor';
    expect(function() {
      urlService.getTopicIdFromUrl();
    }).toThrowError('Invalid topic id url');
  });

  it('should correctly retrieve blog post id from url', () => {
    mockLocation.pathname = '/blog-dashboard';
    mockLocation.hash = '/blog_post_editor/abcdefgijklm';
    expect(
      urlService.getBlogPostIdFromUrl()
    ).toBe('abcdefgijklm');

    mockLocation.pathname = '/blog-dashboard';
    mockLocation.hash = '/blog_post_editor/abcdefgij';
    expect(function() {
      urlService.getBlogPostIdFromUrl();
    }).toThrowError('Invalid Blog Post Id.');
  });

  it('should correctly retrieve blog post url from url', () => {
    mockLocation.pathname = '/blog/sample-blog-post-123';
    expect(urlService.getBlogPostUrlFromUrl()).toBe('sample-blog-post-123');

    mockLocation.pathname = '/blog/invalid/blog-post-1234';
    expect(function() {
      urlService.getBlogPostUrlFromUrl();
    }).toThrowError('Invalid Blog Post Url.');

    mockLocation.pathname = '/invalid/blog-post-1234';
    expect(function() {
      urlService.getBlogPostUrlFromUrl();
    }).toThrowError('Invalid Blog Post Url.');
  });

  it('should correctly retrieve author username from url', () => {
    // Checking with valid blog author profile page url.
    mockLocation.pathname = '/blog/author/username';
    expect(urlService.getBlogAuthorUsernameFromUrl()).toBe('username');

    // Checking with invalid blog author profile page url. The url has extra an
    // url segment.
    mockLocation.pathname = '/blog/author/invalid/username';
    expect(function() {
      urlService.getBlogAuthorUsernameFromUrl();
    }).toThrowError('Invalid Blog Author Profile Page Url.');

    // Checking with invalid blog author profile page url. The url does not
    // start with 'blog/author'.
    mockLocation.pathname = 'blog/invalid/username';
    expect(function() {
      urlService.getBlogAuthorUsernameFromUrl();
    }).toThrowError('Invalid Blog Author Profile Page Url.');
  });

  it('should correctly retrieve story url fragment from url', () => {
    mockLocation.pathname = '/learn/math/abcdefgijklm/story/bakery';
    expect(
      urlService.getStoryUrlFragmentFromLearnerUrl()
    ).toBe('bakery');
    mockLocation.pathname = '/learn/math/topic-name/review-test/bakery';
    expect(
      urlService.getStoryUrlFragmentFromLearnerUrl()
    ).toBe('bakery');
    mockLocation.pathname = '/topc/abcdefgijklm';
    expect(
      urlService.getStoryUrlFragmentFromLearnerUrl()
    ).toBe(null);

    mockLocation.pathname = '/explore/16';
    mockLocation.search = (
      '?topic_url_fragment=topic&story_url_fragment=story-one');
    expect(
      urlService.getStoryUrlFragmentFromLearnerUrl()
    ).toBe('story-one');
    mockLocation.search = (
      '?topic_url_fragment=topic&story_url_fragment=story_one');
    expect(
      urlService.getStoryUrlFragmentFromLearnerUrl()
    ).toBe(null);
  });

  it('should correctly retrieve subtopic url fragment from url', () => {
    mockLocation.pathname = '/learn/math/fractions/revision/xyz';
    expect(
      urlService.getSubtopicUrlFragmentFromLearnerUrl()
    ).toBe('xyz');
    mockLocation.pathname = '/learn/math/topic-name/revision/negative-numbers';
    expect(
      urlService.getSubtopicUrlFragmentFromLearnerUrl()
    ).toBe('negative-numbers');
    mockLocation.pathname = '/sub/abcdefgijklm';
    expect(function() {
      urlService.getSubtopicUrlFragmentFromLearnerUrl();
    }).toThrowError('Invalid URL for subtopic');
  });

  it('should correctly retrieve topic url fragment from url', () => {
    mockLocation.pathname = '/learn/math/abcdefgijklm';
    expect(
      urlService.getTopicUrlFragmentFromLearnerUrl()
    ).toBe('abcdefgijklm');
    mockLocation.pathname = '/learn/math/topic-name';
    expect(
      urlService.getTopicUrlFragmentFromLearnerUrl()
    ).toBe('topic-name');
    mockLocation.pathname = '/learn/math/topic-name/practice';
    expect(
      urlService.getTopicUrlFragmentFromLearnerUrl()
    ).toBe('topic-name');
    mockLocation.pathname = '/explore/16';
    mockLocation.search = (
      '?topic_url_fragment=topic');
    expect(
      urlService.getTopicUrlFragmentFromLearnerUrl()
    ).toBe('topic');
    mockLocation.pathname = '/topc/abcdefgijklm';
    expect(function() {
      urlService.getTopicUrlFragmentFromLearnerUrl();
    }).toThrowError('Invalid URL for topic');
  });

  it('should correctly retrieve classroom name from url', () => {
    mockLocation.pathname = '/learn/math/abcdefgijklm';
    expect(
      urlService.getClassroomUrlFragmentFromLearnerUrl()
    ).toBe('math');
    mockLocation.pathname = '/explore/16';
    mockLocation.search = (
      '&classroom_url_fragment=math');
    expect(
      urlService.getClassroomUrlFragmentFromLearnerUrl()
    ).toBe('math');
    mockLocation.pathname = '/english/topic-name';
    expect(function() {
      urlService.getClassroomUrlFragmentFromLearnerUrl();
    }).toThrowError('Invalid URL for classroom');
  });

  it('should correctly retrieve selected subtopics from url', () => {
    mockLocation.pathname = '/practice_session/topicName';
    mockLocation.search = '?selected_subtopic_ids=abcdefgijklm';
    expect(
      urlService.getSelectedSubtopicsFromUrl()
    ).toBe('abcdefgijklm');
    mockLocation.pathname = '/topic/abcdefgijklm';
    expect(function() {
      urlService.getSelectedSubtopicsFromUrl();
    }).toThrowError('Invalid URL for practice session');
    mockLocation.pathname = '/practice_session/topicName';
    mockLocation.search = '?selected_subtopic_idsabcdefgijklm';
    expect(function() {
      urlService.getSelectedSubtopicsFromUrl();
    }).toThrowError('Invalid URL for practice session');
  });

  it('should correctly retrieve classroom url fragment from url', () => {
    mockLocation.pathname = '/learn/abcdefgijklm';
    expect(
      urlService.getClassroomUrlFragmentFromUrl()
    ).toBe('abcdefgijklm');
    mockLocation.pathname = '/learn/class%20name';
    expect(
      urlService.getClassroomUrlFragmentFromUrl()
    ).toBe('class name');
    mockLocation.pathname = '/invalid/abcdefgijklm';
    expect(function() {
      urlService.getClassroomUrlFragmentFromUrl();
    }).toThrowError('Invalid URL for classroom');
  });

  it('should correctly retrieve subtopic id from url', () => {
    mockLocation.pathname = '/learn/math/abcdefgijklm/revision/1';
    expect(
      urlService.getSubtopicIdFromUrl()
    ).toBe('1');
    mockLocation.pathname = '/learn/math/topic%20name/revision/20';
    expect(
      urlService.getSubtopicIdFromUrl()
    ).toBe('20');
    mockLocation.pathname = '/subtopic/abcdefgijklm';
    expect(function() {
      urlService.getSubtopicIdFromUrl();
    }).toThrowError('Invalid URL for subtopic');
    mockLocation.pathname = '/topic/abcdefgijklm/1';
    expect(function() {
      urlService.getSubtopicIdFromUrl();
    }).toThrowError('Invalid URL for subtopic');
  });

  it('should correctly retrieve story id from url', () => {
    mockLocation.pathname = '/story_editor/abcdefgijklm';
    expect(
      urlService.getStoryIdFromUrl()
    ).toBe('abcdefgijklm');
    mockLocation.pathname = '/story_editor/abcdefgij';
    expect(function() {
      urlService.getStoryIdFromUrl();
    }).toThrowError('Invalid story id url');

    mockLocation.pathname = '/storyeditor/abcdefgijklm';
    expect(function() {
      urlService.getStoryIdFromUrl();
    }).toThrowError('Invalid story id url');

    mockLocation.pathname = '/story_editor';
    expect(function() {
      urlService.getStoryIdFromUrl();
    }).toThrowError('Invalid story id url');
  });

  it('should correctly retrieve story id from story viewer url', () => {
    mockLocation.pathname = '/story_viewer/abcdefgijklm';
    expect(function() {
      urlService.getStoryIdFromViewerUrl();
    }).toThrowError('Invalid story id url');

    mockLocation.pathname = '/learn/math/abcdefgijklm/story/abcdefg';
    expect(function() {
      urlService.getStoryIdFromViewerUrl();
    }).toThrowError('Invalid story id url');

    mockLocation.pathname = '/learn/math/abcdefgijklm/story/abcdefgijklm';
    expect(
      urlService.getStoryIdFromViewerUrl()
    ).toEqual('abcdefgijklm');
  });

  it('should correctly retrieve skill id from url', () => {
    mockLocation.pathname = '/skill_editor/abcdefghijkl';
    expect(
      urlService.getSkillIdFromUrl()
    ).toBe('abcdefghijkl');
    mockLocation.pathname = '/skill_editor/abcdefghijk';
    expect(function() {
      urlService.getSkillIdFromUrl();
    }).toThrowError('Invalid Skill Id');
  });

  it('should correctly retrieve collection id from url in exploration player',
    function() {
      mockLocation.search = '?collection_id=abcdefghijkl';
      expect(
        urlService.getCollectionIdFromExplorationUrl()
      ).toBe('abcdefghijkl');

      mockLocation.search = '?collection=abcdefghijkl';
      expect(
        urlService.getCollectionIdFromExplorationUrl()
      ).toBe(null);

      mockLocation.search = '?collection_id=abcdefghijkl&parent=mnopqrst';
      expect(
        urlService.getCollectionIdFromExplorationUrl()
      ).toBe(null);
    }
  );

  it('should correctly retrieve exploration version from the url', () => {
    mockLocation.search = '?v=1';
    expect(urlService.getExplorationVersionFromUrl()).toBe(1);

    mockLocation.search = '?someparam=otherval&v=2';
    expect(urlService.getExplorationVersionFromUrl()).toBe(2);

    mockLocation.search = '?v=3#version=0.0.9';
    expect(urlService.getExplorationVersionFromUrl()).toBe(3);

    mockLocation.search = '?another=1';
    expect(urlService.getExplorationVersionFromUrl()).toBe(null);
  });

  it('should correctly retrieve unique progress ID from the URL', () => {
    mockLocation.search = '?pid=123456';
    expect(urlService.getPidFromUrl()).toBe('123456');

    mockLocation.search = '?someparam=otherval&pid=123456';
    expect(urlService.getPidFromUrl()).toBe('123456');

    mockLocation.search = '?another=1';
    expect(urlService.getPidFromUrl()).toBe(null);
  });

  it('should correctly retrieve username from url', () => {
    mockLocation.pathname = '/profile/abcdefgijklm';
    expect(urlService.getUsernameFromProfileUrl()).toBe('abcdefgijklm');

    mockLocation.pathname = '/wrong_url/abcdefgijklm';
    expect(function() {
      urlService.getUsernameFromProfileUrl();
    }).toThrowError('Invalid profile URL');
  });

  it('should correctly retrieve collection id from url', () => {
    mockLocation.pathname = '/collection/abcdefgijklm';
    expect(urlService.getCollectionIdFromUrl()).toBe('abcdefgijklm');

    mockLocation.pathname = '/wrong_url/abcdefgijklm';
    expect(function() {
      urlService.getCollectionIdFromUrl();
    }).toThrowError('Invalid collection URL');
  });

  it('should correctly retrieve collection id from editor url', () => {
    mockLocation.pathname = '/collection_editor/create/abcdefgijklm';
    expect(urlService.getCollectionIdFromEditorUrl()).toBe('abcdefgijklm');

    mockLocation.pathname = '/collection_editor/abcdefgijklm';
    expect(function() {
      urlService.getCollectionIdFromEditorUrl();
    }).toThrowError('Invalid collection editor URL');

    mockLocation.pathname = '/collection_editor/wrong/abcdefgijklm';
    expect(function() {
      urlService.getCollectionIdFromEditorUrl();
    }).toThrowError('Invalid collection editor URL');
  });
});
