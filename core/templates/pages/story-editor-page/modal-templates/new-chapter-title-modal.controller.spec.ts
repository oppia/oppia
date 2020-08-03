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


import { AlertsService } from 'services/alerts.service';
import { ChangeObjectFactory } from
  'domain/editor/undo_redo/ChangeObjectFactory';
import { LoggerService } from 'services/contextual/logger.service';
import { StoryContentsObjectFactory } from
  'domain/story/StoryContentsObjectFactory';
import { StoryNodeObjectFactory } from 'domain/story/StoryNodeObjectFactory';
import { StoryObjectFactory } from 'domain/story/StoryObjectFactory';

describe('Create New Chapter Modal Controller', function() {
  var $scope = null;
  var $q = null;
  var $rootScope = null;
  var $uibModalInstance = null;
  var StoryEditorStateService = null;
  var ExplorationIdValidationService = null;
  var StoryUpdateService = null;
  var storyObjectFactory = null;
  var nodeTitles = ['title 1', 'title 2', 'title 3'];

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('StoryObjectFactory',
      new StoryObjectFactory(new StoryContentsObjectFactory(
        new StoryNodeObjectFactory())));
    $provide.value('AlertsService', new AlertsService(new LoggerService()));
    $provide.value('ChangeObjectFactory', new ChangeObjectFactory());
  }));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    $rootScope = $injector.get('$rootScope');
    $q = $injector.get('$q');
    StoryUpdateService = $injector.get('StoryUpdateService');
    storyObjectFactory = $injector.get('StoryObjectFactory');
    StoryEditorStateService = $injector.get('StoryEditorStateService');
    ExplorationIdValidationService = $injector.get(
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
      ExplorationIdValidationService: ExplorationIdValidationService
    });
    $scope.init();
  }));

  it('should init the variables', function() {
    expect($scope.nodeTitles).toEqual(nodeTitles);
    expect($scope.errorMsg).toBe(null);
  });

  it('should call the StoryUpdateService to update thumbnail filename',
    function() {
      var storyUpdateSpy = spyOn(
        StoryUpdateService, 'setStoryNodeThumbnailFilename');
      $scope.updateThumbnailFilename('abc');
      expect(storyUpdateSpy).toHaveBeenCalled();
      expect($scope.editableThumbnailFilename).toEqual('abc');
    });

  it('should call the StoryUpdateService to update thumbnail bg color',
    function() {
      var storyUpdateSpy = spyOn(
        StoryUpdateService, 'setStoryNodeThumbnailBgColor');
      $scope.updateThumbnailBgColor('abc');
      expect(storyUpdateSpy).toHaveBeenCalled();
      expect($scope.editableThumbnailBgColor).toEqual('abc');
    });

  it('should call the StoryUpdateService to delete the story node', function() {
    var storyUpdateSpy = spyOn(StoryUpdateService, 'deleteStoryNode');
    $scope.cancel();
    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should call the StoryUpdateService to update the title', function() {
    var storyUpdateSpy = spyOn(StoryUpdateService, 'setStoryNodeTitle');
    $scope.updateTitle();
    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should reset the error message', function() {
    $scope.errorMsg = 'Error message';
    $scope.resetErrorMsg();
    expect($scope.errorMsg).toBe(null);
  });

  it('should return if the chapter is valid', function() {
    expect($scope.isValid()).toEqual(false);
    $scope.title = 'title';
    $scope.explorationId = '1';
    expect($scope.isValid()).toEqual(false);
    $scope.editableThumbnailFilename = '1';
    expect($scope.isValid()).toEqual(true);
    $scope.explorationId = '';
    expect($scope.isValid()).toEqual(false);
  });

  it('should show the exploration invalid error message', function() {
    spyOn(StoryEditorStateService, 'isStoryPublished').and.returnValue(true);
    var deferred = $q.defer();
    deferred.resolve(false);
    spyOn(ExplorationIdValidationService, 'isExpPublished').and.returnValue(
      deferred.promise);
    $scope.save();
    $rootScope.$apply();
    expect($scope.invalidExpId).toEqual(true);
  });

  it('should show the error message if explorationId is already present',
    function() {
      $scope.explorationId = 'exp_1';
      $scope.updateExplorationId();
      expect($scope.invalidExpErrorString).toEqual(
        'The given exploration already exists in the story.');
      expect($scope.invalidExpId).toEqual(true);
    });

  it('should show the close the modal if expId is valid', function() {
    spyOn(StoryEditorStateService, 'isStoryPublished').and.returnValue(true);
    var deferred = $q.defer();
    deferred.resolve(true);
    spyOn(ExplorationIdValidationService, 'isExpPublished').and.returnValue(
      deferred.promise);
    $scope.save();
    $rootScope.$apply();
    expect($uibModalInstance.close).toHaveBeenCalled();
  });

  it('should show call the StoryUpdateService on closing', function() {
    spyOn(StoryEditorStateService, 'isStoryPublished').and.returnValue(false);
    var storyUpdateSpy = spyOn(StoryUpdateService, 'setStoryNodeExplorationId');
    $scope.updateExplorationId();
    expect(storyUpdateSpy).toHaveBeenCalled();
  });

  it('should not save if the title is already present', function() {
    $scope.title = nodeTitles[0];
    $scope.save();
    expect($uibModalInstance.close).not.toHaveBeenCalled();
  });
});
