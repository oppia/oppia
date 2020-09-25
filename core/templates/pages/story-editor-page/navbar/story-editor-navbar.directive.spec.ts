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
 * @fileoverview Unit tests for the story editor navbar directive.
 */

import { importAllAngularServices } from 'tests/unit-test-utils';

describe('Story editor navbar directive', function() {
  beforeEach(angular.mock.module('oppia'));

  importAllAngularServices();
  var $uibModal = null;
  var $scope = null;
  var ctrl = null;
  var $rootScope = null;
  var directive = null;
  var story = null;
  var WindowDimensionsService = null;
  var StoryEditorStateService = null;
  var StoryObjectFactory = null;
  var UndoRedoService = null;

  beforeEach(angular.mock.inject(function($injector) {
    $uibModal = $injector.get('$uibModal');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    WindowDimensionsService = $injector.get('WindowDimensionsService');
    UndoRedoService = $injector.get('UndoRedoService');
    StoryObjectFactory = $injector.get('StoryObjectFactory');
    StoryEditorStateService = $injector.get('StoryEditorStateService');

    var sampleStoryBackendObject = {
      id: 'sample_story_id',
      title: 'Story title',
      description: 'Story description',
      notes: 'Story notes',
      version: 1,
      corresponding_topic_id: 'topic_id',
      url_fragment: 'story_title',
      story_contents: {
        initial_node_id: 'node_2',
        nodes: [
          {
            id: 'node_1',
            title: 'Title 1',
            description: 'Description 1',
            prerequisite_skill_ids: ['skill_1'],
            acquired_skill_ids: ['skill_2'],
            destination_node_ids: [],
            outline: 'Outline',
            exploration_id: null,
            outline_is_finalized: false
          }, {
            id: 'node_2',
            title: 'Title 2',
            description: 'Description 2',
            prerequisite_skill_ids: ['skill_3'],
            acquired_skill_ids: ['skill_4'],
            destination_node_ids: ['node_1'],
            outline: 'Outline 2',
            exploration_id: 'exp_1',
            outline_is_finalized: true
          }],
        next_node_id: 'node_3'
      },
      language_code: 'en'
    };
    story = StoryObjectFactory.createFromBackendDict(sampleStoryBackendObject);
    directive = $injector.get('storyEditorNavbarDirective')[0];

    spyOn(WindowDimensionsService, 'isWindowNarrow').and.returnValue(true);
    spyOn(StoryEditorStateService, 'getSkillSummaries').and.returnValue(
      [{id: '1', description: 'Skill description'}]);
    spyOn(StoryEditorStateService, 'getStory').and.returnValue(story);
    spyOn(StoryEditorStateService, 'getClassroomUrlFragment').and.returnValue(
      'math');
    spyOn(StoryEditorStateService, 'getTopicUrlFragment').and.returnValue(
      'fractions');
    spyOn(StoryEditorStateService, 'getTopicName').and.returnValue('addition');

    ctrl = $injector.instantiate(directive.controller, {
      $scope: $scope,
      $uibModal
    });
    ctrl.$onInit();
  }));

  it('should init the controller', function() {
    expect($scope.warningsAreShown).toEqual(false);
    expect($scope.forceValidateExplorations).toEqual(true);
    expect($scope.showNavigationOptions).toEqual(false);
    expect($scope.showStoryEditOptions).toEqual(false);
  });

  it('should return change list length', function() {
    spyOn(UndoRedoService, 'getChangeCount').and.returnValue(10);
    expect($scope.getChangeListLength()).toEqual(10);
  });
});
