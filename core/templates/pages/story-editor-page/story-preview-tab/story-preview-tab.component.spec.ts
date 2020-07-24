// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for story preview tab component.
 */

// TODO(#7222): Remove the following block of unnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Story Preview tab', function() {
  var $scope = null;
  var ctrl = null;
  var story = null;
  var MockStoryEditorNavigationService = null;
  var StoryEditorNavigationService = null;
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    var $rootScope = $injector.get('$rootScope');
    var StoryObjectFactory = $injector.get('StoryObjectFactory');
    var StoryEditorStateService = $injector.get('StoryEditorStateService');
    StoryEditorNavigationService = $injector.get(
      'StoryEditorNavigationService');
    $scope = $rootScope.$new();
    MockStoryEditorNavigationService = {
      activeTab: 'story_preview',
      getActiveTab: () => this.activeTab,
      getChapterId: () => 'node_1',
      getChapterIndex: () => null,
      navigateToStoryEditor: () => {
        this.activeTab = 'story';
      }
    };

    story = StoryObjectFactory.createFromBackendDict({
      id: 'storyId_0',
      title: 'Story title',
      description: 'Story Description',
      notes: '<p>Notes/p>',
      story_contents: {
        initial_node_id: 'node_1',
        next_node_id: 'node_3',
        nodes: [{
          id: 'node_1',
          prerequisite_skill_ids: [],
          acquired_skill_ids: [],
          destination_node_ids: [],
          outline: 'Outline',
          exploration_id: 'exp_1',
          outline_is_finalized: false,
          thumbnail_filename: 'img.png',
          thumbnail_bg_color: '#a33f40'
        }, {
          id: 'node_2',
          prerequisite_skill_ids: [],
          acquired_skill_ids: [],
          destination_node_ids: [],
          outline: 'Outline',
          exploration_id: 'exp_2',
          outline_is_finalized: false,
          thumbnail_filename: 'img2.png',
          thumbnail_bg_color: '#a33f40'
        }],
      },
      language_code: 'en',
      story_contents_schema_version: '1',
      version: '1',
      corresponding_topic_id: 'topic_id'
    });
    spyOn(StoryEditorStateService, 'getStory').and.returnValue(story);
    ctrl = $componentController('storyPreviewTab', {
      $scope: $scope,
      StoryEditorStateService: StoryEditorStateService,
      StoryEditorNavigationService: MockStoryEditorNavigationService,
    });
  }));

  it('should set initialize the variables', function() {
    ctrl.$onInit();
    expect(ctrl.story).toEqual(story);
    expect(ctrl.storyId).toEqual('storyId_0');
  });

  it('should return the exploration url for the story node', function() {
    ctrl.$onInit();
    let node = story.getStoryContents().getNodes()[0];
    expect(ctrl.getExplorationUrl(node)).toEqual(
      '/explore/exp_1?story_id=storyId_0&node_id=node_1');
    node = story.getStoryContents().getNodes()[1];
    expect(ctrl.getExplorationUrl(node)).toEqual(
      '/explore/exp_2?story_id=storyId_0&node_id=node_2');
  });
});
