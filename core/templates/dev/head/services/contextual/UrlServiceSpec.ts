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
 * @fileoverview Unit tests for the BackgroundMaskService.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('services/contextual/UrlService.ts');

describe('Url Service', function() {
  var UrlService = null;
  var sampleHash = 'sampleHash';
  var pathname = '/embed';
  var mockLocation = null;
  var origin = 'http://sample.com';

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.upgradedServices)) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function($injector) {
    mockLocation = {
      href: origin + pathname,
      origin: origin,
      pathname: pathname,
      hash: sampleHash,
      search: ''
    };

    UrlService = $injector.get('UrlService');
    spyOn(UrlService, 'getCurrentLocation').and.returnValue(mockLocation);
  }));

  it('should return correct query value list for each query field', function() {
    expect(UrlService.getQueryFieldValuesAsList('field1')).toEqual([]);

    mockLocation.search = '?field1=value1&' +
      'field2=value2&field1=value3&field1=value4&field2=value5&' +
      'field1=value6&field1=value%3F%3D%20%266';
    var expectedList1 = ['value1', 'value3', 'value4', 'value6', 'value?= &6'];
    var expectedList2 = ['value2', 'value5'];
    expect(
      UrlService.getQueryFieldValuesAsList('field1')).toEqual(expectedList1);
    expect(
      UrlService.getQueryFieldValuesAsList('field2')).toEqual(expectedList2);
  });

  it('should correctly decode special characters in query value in url',
    function() {
      var expectedObject = {
        field1: '?value=1',
        field2: '?value&1'
      };
      mockLocation.search = '?field1=%3Fvalue%3D1&field2=%3Fvalue%261';
      expect(UrlService.getUrlParams()).toEqual(expectedObject);
    });

  it('should correctly encode and add query field and value to url',
    function() {
      var queryValue = '&value=1?';
      var queryField = 'field 1';
      var baseUrl = '/sample';
      var expectedUrl1 = baseUrl + '?field%201=%26value%3D1%3F';
      expect(
        UrlService.addField(baseUrl, queryField, queryValue)).toBe(
        expectedUrl1);

      baseUrl = '/sample?field=value';
      var expectedUrl2 = baseUrl + '&field%201=%26value%3D1%3F';
      expect(
        UrlService.addField(baseUrl, queryField, queryValue)).toBe(
        expectedUrl2);
    });

  it('should correctly return true if embed present in pathname', function() {
    expect(UrlService.isIframed()).toBe(true);
  });

  it('should correctly return false if embed not in pathname', function() {
    mockLocation.pathname = '/sample.com';
    expect(UrlService.isIframed()).toBe(false);
  });

  it('should correctly return hash value of window.location', function() {
    expect(UrlService.getHash()).toBe(sampleHash);
  });

  it('should correctly return the origin of window.location', function() {
    expect(UrlService.getOrigin()).toBe('http://sample.com');
  });

  it('should correctly retrieve topic id from url', function() {
    mockLocation.pathname = '/topic_editor/abcdefgijklm';
    expect(
      UrlService.getTopicIdFromUrl()
    ).toBe('abcdefgijklm');
    mockLocation.pathname = '/topic_editor/abcdefgij';
    expect(function() {
      UrlService.getTopicIdFromUrl();
    }).toThrow();

    mockLocation.pathname = '/topiceditor/abcdefgijklm';
    expect(function() {
      UrlService.getTopicIdFromUrl();
    }).toThrow();

    mockLocation.pathname = '/topic_editor';
    expect(function() {
      UrlService.getTopicIdFromUrl();
    }).toThrow();
  });

  it('should correctly retrieve topic name from url', function() {
    mockLocation.pathname = '/topic/abcdefgijklm';
    expect(
      UrlService.getTopicNameFromLearnerUrl()
    ).toBe('abcdefgijklm');
    mockLocation.pathname = '/topic/topic%20name';
    expect(
      UrlService.getTopicNameFromLearnerUrl()
    ).toBe('topic name');
    mockLocation.pathname = '/practice_session/topic%20name';
    expect(
      UrlService.getTopicNameFromLearnerUrl()
    ).toBe('topic name');
    mockLocation.pathname = '/topc/abcdefgijklm';
    expect(function() {
      UrlService.getTopicNameFromLearnerUrl();
    }).toThrowError('Invalid URL for topic');
  });

  it('should correctly retrieve classroom name from url', function() {
    mockLocation.pathname = '/classroom/abcdefgijklm';
    expect(
      UrlService.getClassroomNameFromUrl()
    ).toBe('abcdefgijklm');
    mockLocation.pathname = '/classroom/class%20name';
    expect(
      UrlService.getClassroomNameFromUrl()
    ).toBe('class name');
    mockLocation.pathname = '/invalid/abcdefgijklm';
    expect(function() {
      UrlService.getClassroomNameFromUrl();
    }).toThrowError('Invalid URL for classroom');
  });

  it('should correctly retrieve subtopic id from url', function() {
    mockLocation.pathname = '/subtopic/abcdefgijklm/1';
    expect(
      UrlService.getSubtopicIdFromUrl()
    ).toBe('1');
    mockLocation.pathname = '/subtopic/topic%20name/20';
    expect(
      UrlService.getSubtopicIdFromUrl()
    ).toBe('20');
    mockLocation.pathname = '/subtopic/abcdefgijklm';
    expect(function() {
      UrlService.getSubtopicIdFromUrl();
    }).toThrowError('Invalid URL for subtopic');
    mockLocation.pathname = '/topic/abcdefgijklm/1';
    expect(function() {
      UrlService.getSubtopicIdFromUrl();
    }).toThrowError('Invalid URL for subtopic');
  });

  it('should correctly retrieve story id from url', function() {
    mockLocation.pathname = '/story_editor/abcdefgijklm';
    expect(
      UrlService.getStoryIdFromUrl()
    ).toBe('abcdefgijklm');
    mockLocation.pathname = '/story_editor/abcdefgij';
    expect(function() {
      UrlService.getStoryIdFromUrl();
    }).toThrow();

    mockLocation.pathname = '/storyeditor/abcdefgijklm';
    expect(function() {
      UrlService.getStoryIdFromUrl();
    }).toThrow();

    mockLocation.pathname = '/story_editor';
    expect(function() {
      UrlService.getStoryIdFromUrl();
    }).toThrow();
  });

  it('should correctly retrieve story id from story viewer url', function() {
    mockLocation.pathname = '/story_viewer/abcdefgijklm';
    expect(function() {
      UrlService.getStoryIdFromViewerUrl();
    }).toThrow();

    mockLocation.pathname = '/story/abcdefg';
    expect(function() {
      UrlService.getStoryIdFromViewerUrl();
    }).toThrow();

    mockLocation.pathname = '/story/abcdefgijklm';
    expect(
      UrlService.getStoryIdFromViewerUrl()
    ).toEqual('abcdefgijklm');
  });

  it('should correctly retrieve skill id from url', function() {
    mockLocation.pathname = '/skill_editor/abcdefghijkl';
    expect(
      UrlService.getSkillIdFromUrl()
    ).toBe('abcdefghijkl');
    mockLocation.pathname = '/skill_editor/abcdefghijk';
    expect(function() {
      UrlService.getSkillIdFromUrl();
    }).toThrow();
  });

  it('should correctly retrieve story id from url in player', function() {
    mockLocation.search = '?story_id=mnopqrstuvwx';
    expect(
      UrlService.getStoryIdInPlayer()
    ).toBe('mnopqrstuvwx');
    mockLocation.search = '?story=mnopqrstuvwx';
    expect(
      UrlService.getStoryIdInPlayer()
    ).toBe(null);
  });

  it('should correctly retrieve collection id from url in exploration player',
    function() {
      mockLocation.search = '?collection_id=abcdefghijkl';
      expect(
        UrlService.getCollectionIdFromExplorationUrl()
      ).toBe('abcdefghijkl');

      mockLocation.search = '?collection=abcdefghijkl';
      expect(
        UrlService.getCollectionIdFromExplorationUrl()
      ).toBe(null);

      mockLocation.search = '?collection_id=abcdefghijkl&parent=mnopqrst';
      expect(
        UrlService.getCollectionIdFromExplorationUrl()
      ).toBe(null);
    }
  );

  it('should correctly retrieve exploration version from the url', function() {
    mockLocation.search = '?v=1';
    expect(UrlService.getExplorationVersionFromUrl()).toBe(1);

    mockLocation.search = '?someparam=otherval&v=2';
    expect(UrlService.getExplorationVersionFromUrl()).toBe(2);

    mockLocation.search = '?v=3#version=0.0.9';
    expect(UrlService.getExplorationVersionFromUrl()).toBe(3);

    mockLocation.search = '?another=1';
    expect(UrlService.getExplorationVersionFromUrl()).toBe(null);
  });

  it('should correctly retrieve username from url', function() {
    mockLocation.pathname = '/profile/abcdefgijklm';
    expect(UrlService.getUsernameFromProfileUrl()).toBe('abcdefgijklm');

    mockLocation.pathname = '/wrong_url/abcdefgijklm';
    expect(function() {
      UrlService.getUsernameFromProfileUrl();
    }).toThrowError('Invalid profile URL');
  });

  it('should correctly retrieve collection id from url', function() {
    mockLocation.pathname = '/collection/abcdefgijklm';
    expect(UrlService.getCollectionIdFromUrl()).toBe('abcdefgijklm');

    mockLocation.pathname = '/wrong_url/abcdefgijklm';
    expect(function() {
      UrlService.getCollectionIdFromUrl();
    }).toThrowError('Invalid collection URL');
  });

  it('should correctly retrieve collection id from editor url', function() {
    mockLocation.pathname = '/collection_editor/create/abcdefgijklm';
    expect(UrlService.getCollectionIdFromEditorUrl()).toBe('abcdefgijklm');

    mockLocation.pathname = '/collection_editor/abcdefgijklm';
    expect(function() {
      UrlService.getCollectionIdFromEditorUrl();
    }).toThrowError('Invalid collection editor URL');

    mockLocation.pathname = '/collection_editor/wrong/abcdefgijklm';
    expect(function() {
      UrlService.getCollectionIdFromEditorUrl();
    }).toThrowError('Invalid collection editor URL');
  });
});
