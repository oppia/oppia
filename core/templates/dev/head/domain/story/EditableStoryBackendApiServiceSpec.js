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
 * @fileoverview Unit tests for EditableStoryBackendApiService.
 */

describe('Editable story backend API service', function() {
  var EditableStoryBackendApiService = null;
  var sampleDataResults = null;
  var $rootScope = null;
  var $scope = null;
  var $httpBackend = null;
  var UndoRedoService = null;

  beforeEach(module('oppia'));
  beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(inject(function($injector) {
    EditableStoryBackendApiService = $injector.get(
      'EditableStoryBackendApiService');
    UndoRedoService = $injector.get('UndoRedoService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');

    // Sample story object returnable from the backend
    sampleDataResults = {
      story: {
        id: '1',
        title: 'Story title',
        description: 'Story description',
        notes: 'Notes',
        version: 1,
        story_contents: {
          initial_node_id: 'node_1',
          nodes: [{
            id: 'node_1',
            prerequisite_skill_ids: [],
            acquired_skill_ids: [],
            destination_node_ids: [],
            outline: 'Outline',
            exploration_id: null,
            outline_is_finalized: false
          }],
          next_node_id: 'node_3'
        },
        language_code: 'en'
      }
    };
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch an existing story from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/story_editor_handler/data/0/1').respond(
        sampleDataResults);
      EditableStoryBackendApiService.fetchStory('0', '1').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults.story);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should successfully delete a story from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('DELETE', '/story_editor_handler/data/0/1').respond(
        200);
      EditableStoryBackendApiService.deleteStory('0', '1').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should use the rejection handler if the backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/story_editor_handler/data/0/2').respond(
        500, 'Error loading story 2.');
      EditableStoryBackendApiService.fetchStory('0', '2').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading story 2.');
    }
  );

  it('should update a story after fetching it from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      // Loading a story the first time should fetch it from the backend.
      $httpBackend.expect('GET', '/story_editor_handler/data/0/1').respond(
        sampleDataResults);

      EditableStoryBackendApiService.fetchStory('0', '1').then(
        function(data) {
          story = data;
        });
      $httpBackend.flush();

      story.title = 'New Title';
      story.version = '2';
      var storyWrapper = {
        story: story
      };

      $httpBackend.expect('PUT', '/story_editor_handler/data/0/1').respond(
        storyWrapper);

      // Send a request to update story
      EditableStoryBackendApiService.updateStory(
        '0', story.id, story.version, 'Title is updated', []
      ).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(story);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should use the rejection handler if the story to update doesn\'t exist',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      // Loading a story the first time should fetch it from the backend.
      $httpBackend.expect('PUT', '/story_editor_handler/data/0/2').respond(
        404, 'Story with given id doesn\'t exist.');

      EditableStoryBackendApiService.updateStory(
        '0', '2', '1', 'Update an invalid Story.', []
      ).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Story with given id doesn\'t exist.');
    }
  );
});
