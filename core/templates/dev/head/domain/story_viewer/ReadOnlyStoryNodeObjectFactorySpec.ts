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
 * @fileoverview Tests for ReadOnlyStoryNodeObjectFactory.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('domain/story_viewer/ReadOnlyStoryNodeObjectFactory.ts');

describe('Read only story node object factory', function() {
  var ReadOnlyStoryNodeObjectFactory = null;
  var _sampleSubtopic = null;
  var _sampleStoryNode = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.upgradedServices)) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector) {
    ReadOnlyStoryNodeObjectFactory = $injector.get(
      'ReadOnlyStoryNodeObjectFactory');

    var sampleReadOnlyStoryNodeBackendDict = {
      id: 'node_1',
      title: 'Title 1',
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2'],
      destination_node_ids: ['node_2'],
      outline: 'Outline',
      exploration_id: 'exp_id',
      outline_is_finalized: false,
      exp_summary_dict: {
        title: 'Title',
        status: 'private'
      },
      completed: true
    };
    _sampleStoryNode = ReadOnlyStoryNodeObjectFactory.createFromBackendDict(
      sampleReadOnlyStoryNodeBackendDict);
  }));

  it('should correctly return all the values', function() {
    expect(_sampleStoryNode.getId()).toEqual('node_1');
    expect(_sampleStoryNode.getTitle()).toEqual('Title 1');
    expect(_sampleStoryNode.getExplorationId()).toEqual('exp_id');
    expect(_sampleStoryNode.isCompleted()).toEqual(true);
    expect(_sampleStoryNode.getExplorationSummaryObject()).toEqual({
      title: 'Title',
      status: 'private'
    });
    expect(_sampleStoryNode.getOutline()).toEqual('Outline');
    expect(_sampleStoryNode.getOutlineStatus()).toEqual(false);
    expect(_sampleStoryNode.getOutlineStatus()).toEqual(false);
  });
});
