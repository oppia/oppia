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
 * @fileoverview Unit tests for chapter editor tab controller.
 */

// TODO(#7222): Remove the following block of unnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Chapter Editor tab', function() {
  var $scope = null;
  var ctrl = null;
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
    var storyObjectFactory = $injector.get('StoryObjectFactory');
    var StoryEditorStateService = $injector.get('StoryEditorStateService');
    StoryEditorNavigationService = $injector.get(
      'StoryEditorNavigationService');
    $scope = $rootScope.$new();
    MockStoryEditorNavigationService = {
      activeTab: 'chapter',
      getActiveTab: () => this.activeTab,
      getChapterId: () => 'node_1',
      getChapterIndex: () => null,
      navigateToStoryEditor: () => {
        this.activeTab = 'story';
      }
    };

    var newStory = storyObjectFactory.createFromBackendDict({
      id: 'storyId_0',
      title: 'Story title',
      description: 'Story Description',
      notes: '<p>Notes/p>',
      story_contents: {
        initial_node_id: 'node_1',
        next_node_id: 'node_2',
        nodes: [{
          id: 'node_1',
          prerequisite_skill_ids: [],
          acquired_skill_ids: [],
          destination_node_ids: [],
          outline: 'Outline',
          exploration_id: null,
          outline_is_finalized: false
        }],
      },
      language_code: 'en',
      story_contents_schema_version: '1',
      version: '1',
      corresponding_topic_id: 'topic_id'
    });
    StoryEditorStateService.setStory(newStory);
    ctrl = $componentController('chapterEditorTab', {
      $scope: $scope,
      StoryEditorStateService: StoryEditorStateService,
      StoryEditorNavigationService: MockStoryEditorNavigationService,
    });
  }));

  it('should set initialize chapter index from the story', function() {
    ctrl.$onInit();
    expect(ctrl.chapterId).toEqual('node_1');
    expect(ctrl.chapterIndex).toEqual(0);
  });

  it('should call StoryEditorNavigationService to navigate to story editor',
    function() {
      ctrl.$onInit();
      ctrl.navigateToStoryEditor();
      expect(MockStoryEditorNavigationService.getActiveTab()).toEqual('story');
    });
});
