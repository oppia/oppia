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

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

import { TranslatorProviderForTests } from 'tests/test.extras';

import { SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory';

require('domain/exploration/read-only-exploration-backend-api.service.ts');
require('domain/exploration/SubtitledHtmlObjectFactory.ts');

describe('Read only exploration backend API service', function() {
  let ReadOnlyExplorationBackendApiService = null;
  let sampleDataResults = null;
  let $rootScope = null;
  let $scope = null;
  let $httpBackend = null;
  let shof;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'SubtitledHtmlObjectFactory', new SubtitledHtmlObjectFactory());
  }));
  beforeEach(angular.mock.module('oppia', function($provide) {
    const ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.module(
    'oppia', TranslatorProviderForTests));

  beforeEach(angular.mock.inject(function($injector) {
    ReadOnlyExplorationBackendApiService = $injector.get(
      'ReadOnlyExplorationBackendApiService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');
    shof = $injector.get('SubtitledHtmlObjectFactory');

    // Sample exploration object returnable from the backend
    sampleDataResults = {
      exploration_id: '0',
      is_logged_in: true,
      session_id: 'KERH',
      exploration: {
        init_state_name: 'Introduction',
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
        }
      },
      version: 1,
      state_classifier_mapping: {}
    };
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch an existing exploration from the backend',
    function() {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/explorehandler/init/0').respond(
        sampleDataResults);
      ReadOnlyExplorationBackendApiService.fetchExploration(
        '0', null).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should successfully fetch an existing exploration with version from' +
    ' the backend', function() {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    $httpBackend.expect('GET', '/explorehandler/init/0?v=1').respond(
      sampleDataResults);
    ReadOnlyExplorationBackendApiService.fetchExploration(
      '0', 1).then(successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should load a cached exploration after fetching it from the backend',
    function() {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      // Loading a exploration the first time should fetch it from the backend.
      $httpBackend.expect('GET', '/explorehandler/init/0').respond(
        sampleDataResults);
      ReadOnlyExplorationBackendApiService.loadExploration(
        '0', null).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
      expect(failHandler).not.toHaveBeenCalled();

      // Loading a exploration the second time should not fetch it.
      ReadOnlyExplorationBackendApiService.loadExploration(
        '0', null).then(successHandler, failHandler);

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should use the rejection handler if the backend request failed',
    function() {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      // Loading a exploration the first time should fetch it from the backend.
      $httpBackend.expect('GET', '/explorehandler/init/0').respond(
        500, 'Error loading exploration 0.');
      ReadOnlyExplorationBackendApiService.loadExploration(
        '0', null).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading exploration 0.');
    }
  );

  it('should report caching and support clearing the cache', function() {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    // The exploration should not currently be cached.
    expect(ReadOnlyExplorationBackendApiService.isCached('0')).toBe(false);

    // Loading a exploration the first time should fetch it from the backend.
    $httpBackend.expect('GET', '/explorehandler/init/0').respond(
      sampleDataResults);
    ReadOnlyExplorationBackendApiService.loadLatestExploration('0').then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
    expect(failHandler).not.toHaveBeenCalled();

    // The exploration should now be cached.
    expect(ReadOnlyExplorationBackendApiService.isCached('0')).toBe(true);

    // The exploration should be loadable from the cache.
    ReadOnlyExplorationBackendApiService.loadLatestExploration('0').then(
      successHandler, failHandler);
    expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
    expect(failHandler).not.toHaveBeenCalled();

    // Resetting the cache will cause another fetch from the backend.
    ReadOnlyExplorationBackendApiService.clearExplorationCache();
    expect(ReadOnlyExplorationBackendApiService.isCached('0')).toBe(false);

    $httpBackend.expect('GET', '/explorehandler/init/0').respond(
      sampleDataResults);
    ReadOnlyExplorationBackendApiService.loadLatestExploration('0').then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should report a cached exploration after caching it', function() {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    // The exploration should not currently be cached.
    expect(ReadOnlyExplorationBackendApiService.isCached('0')).toBe(false);

    // Cache a exploration.
    ReadOnlyExplorationBackendApiService.cacheExploration('0', {
      id: '0',
      nodes: []
    });

    // It should now be cached.
    expect(ReadOnlyExplorationBackendApiService.isCached('0')).toBe(true);

    // A new exploration should not have been fetched from the backend. Also,
    // the returned exploration should match the expected exploration object.
    ReadOnlyExplorationBackendApiService.loadLatestExploration('0').then(
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

  it('should delete a exploration from cache', function() {
    expect(ReadOnlyExplorationBackendApiService.isCached('0')).toBe(false);

    ReadOnlyExplorationBackendApiService.cacheExploration('0', {
      id: '0',
      nodes: []
    });
    expect(ReadOnlyExplorationBackendApiService.isCached('0')).toBe(true);

    ReadOnlyExplorationBackendApiService.deleteExplorationFromCache('0');
    expect(ReadOnlyExplorationBackendApiService.isCached('0')).toBe(false);
  });
});
