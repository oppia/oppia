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
import { TestBed } from '@angular/core/testing';

import { AlertsService } from 'services/alerts.service';
import { EditableStoryBackendApiService } from
  'domain/story/editable-story-backend-api.service';
import { LoggerService } from 'services/contextual/logger.service';
import { StoryContentsObjectFactory } from
  'domain/story/StoryContentsObjectFactory';
import { StoryObjectFactory } from 'domain/story/StoryObjectFactory';
import { ExplorationIdValidationService } from
  'domain/exploration/exploration-id-validation.service';
import { ExplorationSummaryBackendApiService } from
  'domain/summary/exploration-summary-backend-api.service';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('Create New Chapter Modal Controller', function() {
  var $scope = null;
  var $q = null;
  var $rootScope = null;
  var $uibModalInstance = null;
  var StoryEditorStateService = null;
  var StoryUpdateService = null;
  var storyObjectFactory = null;
  var explorationIdValidationService = null;
  var nodeTitles = ['title 1', 'title 2', 'title 3'];

  importAllAngularServices();

  beforeEach(angular.mock.module('oppia'));
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  });
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'ExplorationIdValidationService',
      TestBed.get(ExplorationIdValidationService));
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
      new StoryObjectFactory(new StoryContentsObjectFactory()));
    $provide.value('AlertsService', new AlertsService(new LoggerService()));
  }));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    $rootScope = $injector.get('$rootScope');
    $q = $injector.get('$q');
    StoryUpdateService = $injector.get('StoryUpdateService');
    storyObjectFactory = $injector.get('StoryObjectFactory');
    StoryEditorStateService = $injector.get('StoryEditorStateService');
    explorationIdValidationService = $injector.get(
      'ExplorationIdValidationService');

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
      explorationIdValidationService: explorationIdValidationService
    });
    $scope.init();
  }));

  it('should initialize $scope properties after controller is initialized',
    function() {
      expect($scope.nodeTitles).toEqual(nodeTitles);
      expect($scope.errorMsg).toBe(null);
      expect($scope.correctnessFeedbackDisabled).toBe(false);
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

  it('should warn that the exploration is not published when trying to save' +
    ' a chapter with an invalid exploration id', function() {
    spyOn(StoryEditorStateService, 'isStoryPublished').and.returnValue(true);
    var deferred = $q.defer();
    deferred.resolve(false);
    spyOn(explorationIdValidationService, 'isExpPublishedAsync')
      .and.returnValue(deferred.promise);
    $scope.save();
    $rootScope.$apply();
    expect($scope.invalidExpId).toEqual(true);
  });

  it('should warn that the exploration already exists in the story when' +
    ' trying to save a chapter with an already used exploration id',
  function() {
    $scope.explorationId = 'exp_1';
    $scope.updateExplorationId();
    expect($scope.invalidExpErrorString).toEqual(
      'The given exploration already exists in the story.');
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
    $scope.save();
    expect($scope.errorMsg).toBe('A chapter with this title already exists');
    expect($uibModalInstance.close).not.toHaveBeenCalled();
  });

  it('should prevent exploration from being added if it doesn\'t exist ' +
    'or isn\'t published yet', function() {
    $scope.title = 'dummy_title';
    var deferred = $q.defer();
    deferred.resolve(false);
    spyOn(explorationIdValidationService, 'isExpPublishedAsync')
      .and.returnValue(deferred.promise);
    const correctnessFeedbackSpy =
      spyOn(explorationIdValidationService, 'isCorrectnessFeedbackEnabled');
    $scope.save();
    $rootScope.$apply();
    expect($scope.invalidExpId).toEqual(true);
    expect(correctnessFeedbackSpy).not.toHaveBeenCalled();
    expect($uibModalInstance.close).not.toHaveBeenCalled();
  });

  it('should prevent exploration from being added if its correctness ' +
  'feedback is disabled', function() {
    $scope.title = 'dummy_title';
    var deferred = $q.defer();
    deferred.resolve(true);
    spyOn(explorationIdValidationService, 'isExpPublishedAsync')
      .and.returnValue(deferred.promise);
    var deferred2 = $q.defer();
    deferred2.resolve(false);
    spyOn(explorationIdValidationService, 'isCorrectnessFeedbackEnabled')
      .and.returnValue(deferred2.promise);
    $scope.save();
    $rootScope.$apply();
    expect($scope.correctnessFeedbackDisabled).toBe(true);
    expect($uibModalInstance.close).not.toHaveBeenCalled();
  });

  it('should attempt to save exploration when all validation checks pass',
    function() {
      $scope.title = 'dummy_title';
      var deferred = $q.defer();
      deferred.resolve(true);
      spyOn(explorationIdValidationService, 'isExpPublishedAsync')
        .and.returnValue(deferred.promise);
      var deferred2 = $q.defer();
      deferred2.resolve(true);
      spyOn(explorationIdValidationService, 'isCorrectnessFeedbackEnabled')
        .and.returnValue(deferred2.promise);
      const updateExplorationIdSpy = spyOn($scope, 'updateExplorationId');
      const updateTitleSpy = spyOn($scope, 'updateTitle');
      $scope.save();
      $rootScope.$apply();
      expect(updateTitleSpy).toHaveBeenCalled();
      expect(updateExplorationIdSpy).toHaveBeenCalled();
    });

  it('should clear error message when changing exploration id', function() {
    $scope.title = nodeTitles[0];
    $scope.save();
    expect($scope.errorMsg).toBe('A chapter with this title already exists');
    expect($uibModalInstance.close).not.toHaveBeenCalled();

    $scope.resetErrorMsg();
    expect($scope.errorMsg).toBe(null);
    expect($scope.invalidExpId).toBe(false);
    expect($scope.invalidExpErrorString).toBe(
      'Please enter a valid exploration id.');
  });
});
