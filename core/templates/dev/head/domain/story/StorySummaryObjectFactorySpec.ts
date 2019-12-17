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
 * @fileoverview Tests for StorySummaryObjectFactory.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('domain/story/StorySummaryObjectFactory.ts');

describe('Story summary object factory', function() {
  var StorySummaryObjectFactory = null;
  var _sampleStorySummary = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector) {
    StorySummaryObjectFactory = $injector.get('StorySummaryObjectFactory');

    var sampleStorySummaryBackendDict = {
      id: 'sample_story_id',
      title: 'Story title',
      node_count: 5,
      story_is_published: true
    };
    _sampleStorySummary = StorySummaryObjectFactory.createFromBackendDict(
      sampleStorySummaryBackendDict);
  }));

  it('should be able to get all the values', function() {
    expect(_sampleStorySummary.getId()).toEqual('sample_story_id');
    expect(_sampleStorySummary.getTitle()).toEqual('Story title');
    expect(_sampleStorySummary.getNodeCount()).toEqual(5);
    expect(_sampleStorySummary.isStoryPublished()).toBe(true);
  });
});
