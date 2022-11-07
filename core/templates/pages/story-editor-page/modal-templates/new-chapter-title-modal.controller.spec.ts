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
 * @fileoverview Unit tests for CreateNewChapterModalController.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';

import { AlertsService } from 'services/alerts.service';
import { EditableStoryBackendApiService } from
  'domain/story/editable-story-backend-api.service';
import { LoggerService } from 'services/contextual/logger.service';
import { StoryObjectFactory } from 'domain/story/StoryObjectFactory';
import { CuratedExplorationValidationService } from
  'domain/exploration/curated-exploration-validation.service';
import { ExplorationSummaryBackendApiService } from
  'domain/summary/exploration-summary-backend-api.service';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('Create New Chapter Modal Controller', function() {
  var $scope = null;
  var $rootScope = null;
  var $uibModalInstance = null;
  var StoryEditorStateService = null;
  var StoryUpdateService = null;
  var storyObjectFactory = null;
  var curatedExplorationValidationService = null;
  var nodeTitles = ['title 1', 'title 2', 'title 3'];
  var editableStoryBackendApiService = null;

  importAllAngularServices();

  beforeEach(angular.mock.module('oppia'));
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  });
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'CuratedExplorationValidationService',
      TestBed.get(CuratedExplorationValidationService));
    $provide.value(
      'ExplorationSummaryBackendApiService',
      TestBed.get(ExplorationSummaryBackendApiService));
  }));

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'EditableStoryBackendApiService',
      TestBed.get(
        EditableStoryBackendApiService));
    $provide.value(
      'StoryObjectFactory',
      new StoryObjectFactory());
    $provide.value('AlertsService', new AlertsService(new LoggerService()));
  }));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    $rootScope = $injector.get('$rootScope');
    StoryUpdateService = $injector.get('StoryUpdateService');
    storyObjectFactory = $injector.get('StoryObjectFactory');
    StoryEditorStateService = $injector.get('StoryEditorStateService');
    editableStoryBackendApiService = $injector.get(
      'EditableStoryBackendApiService');
    curatedExplorationValidationService = $injector.get(
      'CuratedExplorationValidationService');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    $scope = $rootScope.$new();

    var sampleStoryBackendObject = {
      id: 'sample_story_id',
      title: 'Story title',
      description: 'Story description',
      notes: 'Story notes',
      version: 1,
      corresponding_topic_id: 'topic_id',
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
    var story = storyObjectFactory.createFromBackendDict(
      sampleStoryBackendObject);
    spyOn(StoryEditorStateService, 'getStory').and.returnValue(story);

    $controller('CreateNewChapterModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      nodeTitles: nodeTitles,
      StoryUpdateService: StoryUpdateService,
      StoryEditorStateService: StoryEditorStateService,
      curatedExplorationValidationService: curatedExplorationValidationService
    });
    $scope.init();
  }));

  it('should initialize $scope properties after controller is initialized',
    function() {
      expect($scope.nodeTitles).toEqual(nodeTitles);
      expect($scope.errorMsg).toBe(null);
      expect($scope.correctnessFeedbackDisabled).toBe(false);
      expect($scope.categoryIsDefault).toBe(true);
    });

  it('should validate explorationId correctly',
    function() {
      $scope.explorationId = 'validId';
      expect($scope.validateExplorationId()).toBeTrue();
      $scope.explorationId = 'oppia.org/validId';
      expect($scope.validateExplorationId()).toBeFalse();
    });

  it('should update thumbnail filename when changing thumbnail file',
    function() {
      var storyUpdateSpy = spyOn(
        StoryUpdateService, 'setStoryNodeThumbnailFilename');
      $scope.updateThumbnailFilename('abc');
      expect(storyUpdateSpy).toHaveBeenCalled();
      expect($scope.editableThumbnailFilename).toEqual('abc');
    });

  it('should update thumbnail bg color when changing thumbnail color',
    function() {
      var storyUpdateSpy = spyOn(
        StoryUpdateService, 'setStoryNodeThumbnailBgColor');
      $scope.updateThumbnailBgColor('abc');
      expect(storyUpdateSpy).toHaveBeenCalled();
      expect($scope.editableThumbnailBgColor).toEqual('abc');
    });

  it('should delete the story node when closing the modal',
    function() {
      var storyUpdateSpy = spyOn(StoryUpdateService, 'deleteStoryNode');
      $scope.cancel();
      expect(storyUpdateSpy).toHaveBeenCalled();
    });

  it('should update the title', function() {
    var storyUpdateSpy = spyOn(StoryUpdateService, 'setStoryNodeTitle');
    $scope.updateTitle();
    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should check if chapter is valid when it has title, exploration id and' +
    ' thumbnail file', function() {
    expect($scope.isValid()).toEqual(false);
    $scope.title = 'title';
    $scope.explorationId = '1';
    expect($scope.isValid()).toEqual(false);
    $scope.editableThumbnailFilename = '1';
    expect($scope.isValid()).toEqual(true);
    $scope.explorationId = '';
    expect($scope.isValid()).toEqual(false);
  });

  it('should show warning message when exploration cannot be curated',
    fakeAsync(() => {
      spyOn(StoryEditorStateService, 'isStoryPublished').and.returnValue(true);
      spyOn(curatedExplorationValidationService, 'isExpPublishedAsync')
        .and.resolveTo(true);
      spyOn(curatedExplorationValidationService, 'isCorrectnessFeedbackEnabled')
        .and.resolveTo(true);
      spyOn(curatedExplorationValidationService, 'isDefaultCategoryAsync')
        .and.resolveTo(true);
      spyOn(
        curatedExplorationValidationService,
        'getStatesWithRestrictedInteractions').and.resolveTo([]);
      spyOn(
        curatedExplorationValidationService,
        'getStatesWithInvalidMultipleChoices').and.resolveTo([]);
      spyOn(
        editableStoryBackendApiService, 'validateExplorationsAsync'
      ).and.resolveTo([
        'Explorations in a story are not expected to contain ' +
        'training data for any answer group. State Introduction of ' +
        'exploration with ID 1 contains training data in one of ' +
        'its answer groups.'
      ]);
      $scope.saveAsync();
      flushMicrotasks();
      $rootScope.$apply();

      expect($scope.invalidExpId).toEqual(true);
      expect($scope.invalidExpErrorStrings).toEqual([
        'Explorations in a story are not expected to contain ' +
        'training data for any answer group. State Introduction of ' +
        'exploration with ID 1 contains training data in one of ' +
        'its answer groups.'
      ]);
    }));

  it('should warn that the exploration is not published when trying to save' +
    ' a chapter with an invalid exploration id', fakeAsync(function() {
    spyOn(StoryEditorStateService, 'isStoryPublished').and.returnValue(true);
    spyOn(curatedExplorationValidationService, 'isExpPublishedAsync')
      .and.resolveTo(false);
    spyOn(
      editableStoryBackendApiService, 'validateExplorationsAsync'
    ).and.resolveTo([]);
    $scope.saveAsync();
    flushMicrotasks();
    $rootScope.$apply();

    expect($scope.invalidExpId).toEqual(true);
  }));

  it('should warn that the exploration already exists in the story when' +
    ' trying to save a chapter with an already used exploration id',
  function() {
    $scope.explorationId = 'exp_1';
    $scope.updateExplorationId();
    expect($scope.invalidExpErrorStrings).toEqual([
      'The given exploration already exists in the story.'
    ]);
    expect($scope.invalidExpId).toEqual(true);
  });

  it('should close the modal when saving a chapter with a valid exploration id',
    function() {
      $scope.updateExplorationId();
      $rootScope.$apply();
      expect($uibModalInstance.close).toHaveBeenCalled();
    });

  it('should set story node exploration id when updating exploration id',
    function() {
      var storyUpdateSpy = spyOn(
        StoryUpdateService, 'setStoryNodeExplorationId');
      $scope.updateExplorationId();
      expect(storyUpdateSpy).toHaveBeenCalled();
    });

  it('should not save when the chapter title is already used', function() {
    $scope.title = nodeTitles[0];
    $scope.saveAsync();
    expect($scope.errorMsg).toBe('A chapter with this title already exists');
    expect($uibModalInstance.close).not.toHaveBeenCalled();
  });

  it('should prevent exploration from being added if it doesn\'t exist ' +
    'or isn\'t published yet', fakeAsync(function() {
    $scope.title = 'dummy_title';
    spyOn(
      editableStoryBackendApiService, 'validateExplorationsAsync'
    ).and.resolveTo([]);
    spyOn(curatedExplorationValidationService, 'isExpPublishedAsync')
      .and.returnValue(false);
    const correctnessFeedbackSpy = spyOn(
      curatedExplorationValidationService, 'isCorrectnessFeedbackEnabled');
    const categorySpy = spyOn(
      curatedExplorationValidationService, 'isDefaultCategoryAsync');
    $scope.saveAsync();
    flushMicrotasks();
    $rootScope.$apply();
    expect($scope.invalidExpId).toEqual(true);
    expect(correctnessFeedbackSpy).not.toHaveBeenCalled();
    expect(categorySpy).not.toHaveBeenCalled();
    expect($uibModalInstance.close).not.toHaveBeenCalled();
  }));

  it('should prevent exploration from being added if its correctness ' +
  'feedback is disabled', fakeAsync(function() {
    $scope.title = 'dummy_title';
    spyOn(
      editableStoryBackendApiService, 'validateExplorationsAsync'
    ).and.resolveTo([]);
    spyOn(curatedExplorationValidationService, 'isExpPublishedAsync')
      .and.resolveTo(true);
    spyOn(curatedExplorationValidationService, 'isCorrectnessFeedbackEnabled')
      .and.resolveTo(false);
    $scope.saveAsync();
    flushMicrotasks();
    $rootScope.$apply();
    expect($scope.correctnessFeedbackDisabled).toBe(true);
    expect($uibModalInstance.close).not.toHaveBeenCalled();
  }));

  it('should prevent exploration from being added if its category ' +
  'is not default', fakeAsync(function() {
    $scope.title = 'dummy_title';

    spyOn(
      editableStoryBackendApiService, 'validateExplorationsAsync'
    ).and.resolveTo([]);
    spyOn(curatedExplorationValidationService, 'isExpPublishedAsync')
      .and.resolveTo(true);
    spyOn(curatedExplorationValidationService, 'isCorrectnessFeedbackEnabled')
      .and.resolveTo(true);
    spyOn(curatedExplorationValidationService, 'isDefaultCategoryAsync')
      .and.resolveTo(false);

    $scope.saveAsync();
    flushMicrotasks();
    $rootScope.$apply();

    expect($scope.categoryIsDefault).toBe(false);
    expect($uibModalInstance.close).not.toHaveBeenCalled();
  }));

  it('should prevent exploration from being added if it contains restricted ' +
  'interaction types', fakeAsync(function() {
    $scope.title = 'dummy_title';
    const invalidStates = ['some_invalid_state'];

    spyOn(
      editableStoryBackendApiService, 'validateExplorationsAsync'
    ).and.resolveTo([]);
    spyOn(curatedExplorationValidationService, 'isExpPublishedAsync')
      .and.resolveTo(true);
    spyOn(curatedExplorationValidationService, 'isCorrectnessFeedbackEnabled')
      .and.resolveTo(true);
    spyOn(curatedExplorationValidationService, 'isDefaultCategoryAsync')
      .and.resolveTo(true);
    spyOn(
      curatedExplorationValidationService,
      'getStatesWithRestrictedInteractions').and.resolveTo(invalidStates);

    $scope.saveAsync();
    flushMicrotasks();
    $rootScope.$apply();

    expect($scope.statesWithRestrictedInteractions).toBe(invalidStates);
    expect($uibModalInstance.close).not.toHaveBeenCalled();
  }));

  it('should prevent exploration from being added if it contains an invalid ' +
  'multiple choice input', fakeAsync(function() {
    $scope.title = 'dummy_title';
    const invalidStates = ['some_invalid_state'];

    spyOn(
      editableStoryBackendApiService, 'validateExplorationsAsync'
    ).and.resolveTo([]);
    spyOn(curatedExplorationValidationService, 'isExpPublishedAsync')
      .and.resolveTo(true);
    spyOn(curatedExplorationValidationService, 'isCorrectnessFeedbackEnabled')
      .and.resolveTo(true);
    spyOn(curatedExplorationValidationService, 'isDefaultCategoryAsync')
      .and.resolveTo(true);
    spyOn(
      curatedExplorationValidationService,
      'getStatesWithRestrictedInteractions').and.resolveTo([]);
    spyOn(
      curatedExplorationValidationService,
      'getStatesWithInvalidMultipleChoices').and.resolveTo(invalidStates);

    $scope.saveAsync();
    flushMicrotasks();
    $rootScope.$apply();

    expect($scope.statesWithTooFewMultipleChoiceOptions).toBe(invalidStates);
    expect($uibModalInstance.close).not.toHaveBeenCalled();
  }));

  it('should attempt to save exploration when all validation checks pass',
    fakeAsync(function() {
      $scope.title = 'dummy_title';
      spyOn(
        editableStoryBackendApiService, 'validateExplorationsAsync'
      ).and.resolveTo([]);
      spyOn(curatedExplorationValidationService, 'isExpPublishedAsync')
        .and.resolveTo(true);
      spyOn(
        curatedExplorationValidationService,
        'isCorrectnessFeedbackEnabled').and.resolveTo(true);
      spyOn(curatedExplorationValidationService, 'isDefaultCategoryAsync')
        .and.resolveTo(true);
      spyOn(
        curatedExplorationValidationService,
        'getStatesWithRestrictedInteractions').and.resolveTo([]);
      spyOn(
        curatedExplorationValidationService,
        'getStatesWithInvalidMultipleChoices').and.resolveTo([]);
      const updateExplorationIdSpy = spyOn($scope, 'updateExplorationId');
      const updateTitleSpy = spyOn($scope, 'updateTitle');
      $scope.saveAsync();
      flushMicrotasks();
      $rootScope.$apply();

      expect(updateTitleSpy).toHaveBeenCalled();
      expect(updateExplorationIdSpy).toHaveBeenCalled();
    }));

  it('should clear error message when changing exploration id', function() {
    $scope.title = nodeTitles[0];
    $scope.saveAsync();
    expect($scope.errorMsg).toBe('A chapter with this title already exists');
    expect($uibModalInstance.close).not.toHaveBeenCalled();

    $scope.resetErrorMsg();
    expect($scope.errorMsg).toBe(null);
    expect($scope.invalidExpId).toBe(false);
    expect($scope.invalidExpErrorStrings).toEqual([
      'Please enter a valid exploration id.'
    ]);
  });
});
