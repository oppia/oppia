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

  beforeEach(module('oppia'));
  beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(inject(function($injector) {
    EditableExplorationBackendApiService = $injector.get(
      'EditableExplorationBackendApiService');
    ReadOnlyExplorationBackendApiService = $injector.get(
      'ReadOnlyExplorationBackendApiService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');

    // Sample exploration object returnable from the backend
    sampleDataResults = {
      exploration_id: '0',
      init_state_name: 'Introduction',
      language_code: 'en',
      states: {
        Introduction: {
          param_changes: [],
          content: {
            html: '',
            audio_translations: {}
          },
          unresolved_answers: {},
          interaction: {
            customization_args: {},
            answer_groups: [],
            default_outcome: {
              param_changes: [],
              dest: 'Introduction',
              feedback: {
                html: '',
                audio_translations: {}
              }
            },
            confirmed_unclassified_answers: [],
            id: null
          }
        }
      },
      username: 'test',
      user_email: 'test@example.com',
      version: 1
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

      $httpBackend.expect('GET', '/createhandler/data/0').respond(
        sampleDataResults);
      EditableExplorationBackendApiService.fetchExploration('0').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should fetch and apply the draft of an exploration',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      // Loading a exploration the first time should fetch it from the backend.
      $httpBackend.expect(
        'GET', '/createhandler/data/0?apply_draft=true').respond(
        sampleDataResults);

      EditableExplorationBackendApiService.fetchApplyDraftExploration(
        '0').then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should use the rejection handler if the backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      // Loading a exploration the first time should fetch it from the backend.
      $httpBackend.expect('GET', '/createhandler/data/1').respond(
        500, 'Error loading exploration 1.');
      EditableExplorationBackendApiService.fetchExploration('1').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading exploration 1.');
    }
  );

  it('should update a exploration after fetching it from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      // Loading a exploration the first time should fetch it from the backend.
      $httpBackend.expect('GET', '/createhandler/data/0').respond(
        sampleDataResults);

      EditableExplorationBackendApiService.fetchExploration('0').then(
        function(data) {
          exploration = data;
        });
      $httpBackend.flush();

      exploration.title = 'New Title';
      exploration.version = '2';

      $httpBackend.expect('PUT', '/createhandler/data/0').respond(
        exploration);

      // Send a request to update exploration
      EditableExplorationBackendApiService.updateExploration(
        exploration.exploration_id, exploration.version,
        exploration.title, []).then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(exploration);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should not cache exploration from backend into read only service',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/explorehandler/init/0').respond(
        sampleDataResults);

      ReadOnlyExplorationBackendApiService.loadLatestExploration('0').then(
        function(data) {
          exploration = data;
        });
      $httpBackend.flush();

      expect(ReadOnlyExplorationBackendApiService.isCached('0')).toBe(true);

      exploration.title = 'New Title';
      exploration.version = '2';

      $httpBackend.expect('PUT', '/createhandler/data/0').respond(
        exploration);

      // Send a request to update exploration
      EditableExplorationBackendApiService.updateExploration(
        exploration.exploration_id, exploration.version,
        exploration.title, []).then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(exploration);
      expect(failHandler).not.toHaveBeenCalled();

      expect(ReadOnlyExplorationBackendApiService.isCached('0')).toBe(false);
    }
  );

  it('should delete exploration from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/createhandler/data/0').respond(
        sampleDataResults);

      EditableExplorationBackendApiService.fetchExploration('0').then(
        function(data) {
          exploration = data;
        });
      $httpBackend.flush();

      exploration.title = 'New Title';
      exploration.version = '2';

      $httpBackend.expect('PUT', '/createhandler/data/0').respond(
        exploration);

      // Send a request to update exploration
      EditableExplorationBackendApiService.updateExploration(
        exploration.exploration_id, exploration.version,
        'Minor edits', []).then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(exploration);
      expect(failHandler).not.toHaveBeenCalled();

      $httpBackend.expect('DELETE', '/createhandler/data/0').respond({});
      EditableExplorationBackendApiService.deleteExploration(
        exploration.exploration_id).then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith({});
      expect(failHandler).not.toHaveBeenCalled();

      expect(ReadOnlyExplorationBackendApiService.isCached('0')).toBe(false);
    }
  );
});
