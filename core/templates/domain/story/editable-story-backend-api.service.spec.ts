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

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

import { TranslatorProviderForTests } from 'tests/test.extras';

require('domain/story/editable-story-backend-api.service.ts');
require('services/csrf-token.service.ts');

describe('Editable story backend API service', function() {
  var EditableStoryBackendApiService = null;
  var sampleDataResults = null;
  var $httpBackend = null;
  var CsrfService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(
    angular.mock.module('oppia', TranslatorProviderForTests));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $q) {
    EditableStoryBackendApiService = $injector.get(
      'EditableStoryBackendApiService');
    $httpBackend = $injector.get('$httpBackend');
    CsrfService = $injector.get('CsrfTokenService');

    spyOn(CsrfService, 'getTokenAsync').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve('sample-csrf-token');
      return deferred.promise;
    });

    // Sample story object returnable from the backend.
    sampleDataResults = {
      story: {
        id: 'storyId',
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
      },
      topic_name: 'Topic Name',
      story_is_published: true,
      skill_summaries: [{
        id: 'skill_1',
        description: 'Skill Description'
      }],
      topic_url_fragment: 'topic-frag',
      classroom_url_fragment: 'math'
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

      $httpBackend.expect(
        'GET', '/story_editor_handler/data/storyId').respond(
        sampleDataResults);
      EditableStoryBackendApiService.fetchStory('storyId').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith({
        story: sampleDataResults.story,
        topicName: sampleDataResults.topic_name,
        storyIsPublished: true,
        skillSummaries: sampleDataResults.skill_summaries,
        topicUrlFragment: sampleDataResults.topic_url_fragment,
        classroomUrlFragment: sampleDataResults.classroom_url_fragment
      });
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should successfully delete a story from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect(
        'DELETE', '/story_editor_handler/data/storyId').respond(200);
      EditableStoryBackendApiService.deleteStory('storyId').then(
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

      $httpBackend.expect(
        'GET', '/story_editor_handler/data/2').respond(
        500, 'Error loading story 2.');
      EditableStoryBackendApiService.fetchStory('2').then(
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
      var story = null;

      // Loading a story the first time should fetch it from the backend.
      $httpBackend.expect(
        'GET', '/story_editor_handler/data/storyId').respond(
        sampleDataResults);

      EditableStoryBackendApiService.fetchStory('storyId').then(
        function(data) {
          story = data.story;
        });
      $httpBackend.flush();

      story.title = 'New Title';
      story.version = '2';
      var storyWrapper = {
        story: story
      };

      $httpBackend.expect(
        'PUT', '/story_editor_handler/data/storyId').respond(
        storyWrapper);

      // Send a request to update story.
      EditableStoryBackendApiService.updateStory(
        story.id, story.version, 'Title is updated', []
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
      $httpBackend.expect(
        'PUT', '/story_editor_handler/data/storyId_1').respond(
        404, 'Story with given id doesn\'t exist.');

      EditableStoryBackendApiService.updateStory(
        'storyId_1', '1', 'Update an invalid Story.', []
      ).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Story with given id doesn\'t exist.');
    }
  );

  it('should publish a story', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    $httpBackend.expect(
      'PUT', '/story_publish_handler/storyId').respond();

    // Send a request to update story.
    EditableStoryBackendApiService.changeStoryPublicationStatus(
      'storyId', true
    ).then(successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should use the rejection handler if the story to publish doesn\'t exist',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      // Loading a story the first time should fetch it from the backend.
      $httpBackend.expect(
        'PUT', '/story_publish_handler/storyId_1').respond(
        404, 'Story with given id doesn\'t exist.');

      EditableStoryBackendApiService.changeStoryPublicationStatus(
        'storyId_1', true).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Story with given id doesn\'t exist.');
    }
  );
});
