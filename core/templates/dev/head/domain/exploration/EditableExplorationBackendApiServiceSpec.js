// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for EditableExplorationBackendApiService.
 */

describe('Editable exploration backend API service', function() {
  var EditableExplorationBackendApiService = null;
  var ReadOnlyExplorationBackendApiService = null;
  var sampleDataResults = null;
  var $rootScope = null;
  var $scope = null;
  var $httpBackend = null;
  var UndoRedoService = null;

  beforeEach(module('oppia'));
  beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(inject(function($injector) {
    EditableExplorationBackendApiService = $injector.get(
      'EditableExplorationBackendApiService');
    ReadOnlyExplorationBackendApiService = $injector.get(
      'ReadOnlyExplorationBackendApiService');
    UndoRedoService = $injector.get('UndoRedoService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');

    // Sample exploration object returnable from the backend
    sampleDataResults = {
      param_specs: {},
      param_changes: [],
      is_super_admin: false,
      category: '',
      rights: {
        viewable_if_private: false,
        status: 'private',
        editor_names: [],
        viewer_names: [],
        cloned_from: null,
        community_owned: false,
        owner_names: ['jeaske']
      },
      is_admin: false,
      objective: '',
      states: {
        Introduction: {
          param_changes: [],
          content: [{
            type: 'text',
            value: ''
          }],
          unresolved_answers: {},
          interaction: {
            customization_args: {},
            fallbacks: [],
            answer_groups: [],
            default_outcome: {
              param_changes: [],
              dest: 'Introduction',
              feedback: []
            },
            confirmed_unclassified_answers: [],
            id: null
          }
        }
      },
      is_version_of_draft_valid: null,
      version: 1,
      user_email: 'test@example.com',
      is_moderator: false,
      language_code: 'en',
      init_state_name: 'Introduction',
      username: 'test',
      tags: [],
      title: '',
      exploration_id: '0',
      draft_changes: null,
      profile_picture_data_url: '',
      email_preferences: {
        mute_feedback_notifications: false,
        mute_suggestion_notifications: false
      },
      skin_customizations: {
        panels_contents: {
          bottom: []
        }
      },
      show_state_editor_tutorial_on_load: true
    };
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch an existing exploration from the backend',
      function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    $httpBackend.expect('GET', '/editable_createhandler/data/0').respond(
      sampleDataResults);
    EditableExplorationBackendApiService.fetchExploration('0').then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should use the rejection handler if the backend request failed',
      function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    // Loading a exploration the first time should fetch it from the backend.
    $httpBackend.expect('GET', '/editable_createhandler/data/1').respond(
      500, 'Error loading exploration 1.');
    EditableExplorationBackendApiService.fetchExploration('1').then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Error loading exploration 1.');
  });

  it('should update a exploration after fetching it from the backend',
      function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    // Loading a exploration the first time should fetch it from the backend.
    $httpBackend.expect('GET', '/editable_createhandler/data/0').respond(
      sampleDataResults);

    EditableExplorationBackendApiService.fetchExploration('0').then(
      function(data) {
        exploration = data;
      });
    $httpBackend.flush();

    exploration.title = 'New Title';
    exploration.version = '2';

    $httpBackend.expect('PUT', '/editable_createhandler/data/0').respond(
      exploration);

    // Send a request to update exploration
    EditableExplorationBackendApiService.updateExploration(
      exploration.exploration_id, exploration.version,
      exploration.title, []).then(
        successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(exploration);
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should cache exploration from the backend into read only service',
      function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    $httpBackend.expect('GET', '/editable_createhandler/data/0').respond(
      sampleDataResults);

    EditableExplorationBackendApiService.fetchExploration('0').then(
      function(data) {
        exploration = data;
      });
    $httpBackend.flush();

    exploration.title = 'New Title';
    exploration.version = '2';

    $httpBackend.expect('PUT', '/editable_createhandler/data/0').respond(
      exploration);

    // Send a request to update exploration
    EditableExplorationBackendApiService.updateExploration(
      exploration.exploration_id, exploration.version,
      exploration.title, []).then(
        successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(exploration);
    expect(failHandler).not.toHaveBeenCalled();

    expect(ReadOnlyExplorationBackendApiService.isCached('0')).toBeTruthy();
  });

  it('should delete exploration from the backend',
      function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    $httpBackend.expect('GET', '/editable_createhandler/data/0').respond(
      sampleDataResults);

    EditableExplorationBackendApiService.fetchExploration('0').then(
      function(data) {
        exploration = data;
      });
    $httpBackend.flush();

    exploration.title = 'New Title';
    exploration.version = '2';

    $httpBackend.expect('PUT', '/editable_createhandler/data/0').respond(
      exploration);

    // Send a request to update exploration
    EditableExplorationBackendApiService.updateExploration(
      exploration.exploration_id, exploration.version,
      exploration.title, []).then(
        successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(exploration);
    expect(failHandler).not.toHaveBeenCalled();

    $httpBackend.expect('DELETE', '/editable_createhandler/data/0').respond(
      {});
    EditableExplorationBackendApiService.deleteExploration(
      exploration.exploration_id, null).then(
        successHandler, failHandler);
    
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith({});
    expect(failHandler).not.toHaveBeenCalled();

    expect(ReadOnlyExplorationBackendApiService.isCached('0')).toBeFalsy();
  });
});
