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
 * @fileoverview Tests for StoryPlaythroughObjectFactory.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('domain/story_viewer/StoryPlaythroughObjectFactory.ts');

describe('Story playthrough object factory', function() {
  var StoryPlaythroughObjectFactory = null;
  var _sampleSubtopic = null;
  var _sampleStoryNode = null;
  var _samplePlaythroughObject = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector) {
    StoryPlaythroughObjectFactory = $injector.get(
      'StoryPlaythroughObjectFactory');

    var firstSampleReadOnlyStoryNodeBackendDict = {
      id: 'node_1',
      title: 'Title 1',
      prerequisite_skill_ids: [],
      acquired_skill_ids: [],
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
    var secondSampleReadOnlyStoryNodeBackendDict = {
      id: 'node_2',
      title: 'Title 2',
      prerequisite_skill_ids: [],
      acquired_skill_ids: [],
      destination_node_ids: ['node_3'],
      outline: 'Outline',
      exploration_id: 'exp_id',
      outline_is_finalized: false,
      exp_summary_dict: {
        title: 'Title',
        status: 'private'
      },
      completed: false
    };
    var storyPlaythroughBackendObject = {
      story_nodes: [
        firstSampleReadOnlyStoryNodeBackendDict,
        secondSampleReadOnlyStoryNodeBackendDict]
    };
    _samplePlaythroughObject =
      StoryPlaythroughObjectFactory.createFromBackendDict(
        storyPlaythroughBackendObject);
  }));

  it('should correctly return all the values', function() {
    expect(_samplePlaythroughObject.getInitialNode().getId()).toEqual('node_1');
    expect(_samplePlaythroughObject.getStoryNodeCount()).toEqual(2);
    expect(
      _samplePlaythroughObject.getStoryNodes()[0].getId()).toEqual('node_1');
    expect(
      _samplePlaythroughObject.getStoryNodes()[1].getId()).toEqual('node_2');
    expect(_samplePlaythroughObject.hasFinishedStory()).toEqual(false);
    expect(_samplePlaythroughObject.getNextPendingNodeId()).toEqual('node_2');
    expect(_samplePlaythroughObject.hasStartedStory()).toEqual(true);
  });
});
