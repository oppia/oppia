// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ReadOnlyExplorationBackendApiService.
 */

describe('Read only exploration backend API service', function() {
  var ReadOnlyExplorationBackendApiService = null;
  var sampleDataResults = null;
  var $rootScope = null;
  var $scope = null;
  var $httpBackend = null;

  beforeEach(module('oppia'));
  beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(inject(function($injector) {
    ReadOnlyExplorationBackendApiService = $injector.get(
      'ReadOnlyExplorationBackendApiService');
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

    $httpBackend.expect('GET', '/createhandler/data/0').respond(
      sampleDataResults);
    ReadOnlyExplorationBackendApiService.fetchExploration('0').then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should load a cached exploration after fetching it from the backend',
      function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    // Loading a exploration the first time should fetch it from the backend.
    $httpBackend.expect('GET', '/createhandler/data/0').respond(
      sampleDataResults);
    ReadOnlyExplorationBackendApiService.loadExploration('0').then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
    expect(failHandler).not.toHaveBeenCalled();

    // Loading a exploration the second time should not fetch it.
    ReadOnlyExplorationBackendApiService.loadExploration('0').then(
      successHandler, failHandler);

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should use the rejection handler if the backend request failed',
      function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    // Loading a exploration the first time should fetch it from the backend.
    $httpBackend.expect('GET', '/createhandler/data/0').respond(
      500, 'Error loading exploration 0.');
    ReadOnlyExplorationBackendApiService.loadExploration('0').then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Error loading exploration 0.');
  });

  it('should report caching and support clearing the cache', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    // The exploration should not currently be cached.
    expect(ReadOnlyExplorationBackendApiService.isCached('0')).toBeFalsy();

    // Loading a exploration the first time should fetch it from the backend.
    $httpBackend.expect('GET', '/createhandler/data/0').respond(
      sampleDataResults);
    ReadOnlyExplorationBackendApiService.loadExploration('0').then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
    expect(failHandler).not.toHaveBeenCalled();

    // The exploration should now be cached.
    expect(ReadOnlyExplorationBackendApiService.isCached('0')).toBeTruthy();

    // The exploration should be loadable from the cache.
    ReadOnlyExplorationBackendApiService.loadExploration('0').then(
      successHandler, failHandler);
    expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
    expect(failHandler).not.toHaveBeenCalled();

    // Resetting the cache will cause another fetch from the backend.
    ReadOnlyExplorationBackendApiService.clearExplorationCache();
    expect(ReadOnlyExplorationBackendApiService.isCached('0')).toBeFalsy();

    $httpBackend.expect('GET', '/createhandler/data/0').respond(
      sampleDataResults);
    ReadOnlyExplorationBackendApiService.loadExploration('0').then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should report a cached exploration after caching it', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    // The exploration should not currently be cached.
    expect(ReadOnlyExplorationBackendApiService.isCached('0')).toBeFalsy();

    // Cache a exploration.
    ReadOnlyExplorationBackendApiService.cacheExploration('0', {
      id: '0',
      nodes: []
    });

    // It should now be cached.
    expect(ReadOnlyExplorationBackendApiService.isCached('0')).toBeTruthy();

    // A new exploration should not have been fetched from the backend. Also,
    // the returned exploration should match the expected exploration object.
    ReadOnlyExplorationBackendApiService.loadExploration('0').then(
      successHandler, failHandler);

    // http://brianmcd.com/2014/03/27/
    // a-tip-for-angular-unit-tests-with-promises.html
    $rootScope.$digest();

    expect(successHandler).toHaveBeenCalledWith({
      id: '0',
      nodes: []
    });
    expect(failHandler).not.toHaveBeenCalled();
  });
});
