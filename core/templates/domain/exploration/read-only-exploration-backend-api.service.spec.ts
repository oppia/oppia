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
 * @fileoverview Unit tests for ReadOnlyExplorationBackendApiService.
 */

import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { importAllAngularServices } from 'tests/unit-test-utils';

import { CsrfTokenService } from 'services/csrf-token.service.ts';
import { ReadOnlyExplorationBackendApiService } from
  'domain/exploration/read-only-exploration-backend-api.service';

describe('Read only exploration backend API service', function() {
  let readOnlyExplorationBackendApiService
    : ReadOnlyExplorationBackendApiService = null;
  let sampleDataResults = null;
  let httpTestingController: HttpTestingController = null;
  let csrfService = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReadOnlyExplorationBackendApiService]
    });
    readOnlyExplorationBackendApiService = TestBed.get(
      ReadOnlyExplorationBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
    csrfService = TestBed.get(CsrfTokenService);
    spyOn(csrfService, 'getTokenAsync').and.callFake(() => {
      return Promise.resolve('sample-csrf-token');
    });

    // Sample exploration object returnable from the backend.
    sampleDataResults = {
      explorationId: '0',
      isLoggedIn: true,
      sessionId: 'KERH',
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
      stateClassifierMapping: {}
    };
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch an existing exploration from the backend',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      readOnlyExplorationBackendApiService.fetchExploration(
        '0', null).then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/explorehandler/init/0');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it('should successfully fetch an existing exploration with version from' +
    ' the backend', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    readOnlyExplorationBackendApiService.fetchExploration(
      '0', 1).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/explorehandler/init/0?v=1');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use the rejection handler if the backend request failed',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      // Loading a exploration the first time should fetch it from the backend.
      readOnlyExplorationBackendApiService.loadExploration(
        '0', null).then(successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/explorehandler/init/0');
      expect(req.request.method).toEqual('GET');
      req.flush({
        error: 'Error loading exploration 0.'
      }, {
        status: 500, statusText: 'Internal Server Error'
      });
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading exploration 0.');
    }));

  it('should report caching and support clearing the cache', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    // The exploration should not currently be cached.
    expect(readOnlyExplorationBackendApiService.isCached('0')).toBe(false);

    // Loading a exploration the first time should fetch it from the backend.
    readOnlyExplorationBackendApiService.loadLatestExploration('0').then(
      successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/explorehandler/init/0');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
    expect(failHandler).not.toHaveBeenCalled();

    // The exploration should now be cached.
    expect(readOnlyExplorationBackendApiService.isCached('0')).toBe(true);

    // The exploration should be loadable from the cache.
    readOnlyExplorationBackendApiService.loadLatestExploration('0').then(
      successHandler, failHandler);
    expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
    expect(failHandler).not.toHaveBeenCalled();

    // Resetting the cache will cause another fetch from the backend.
    readOnlyExplorationBackendApiService.clearExplorationCache();
    expect(readOnlyExplorationBackendApiService.isCached('0')).toBe(false);


    readOnlyExplorationBackendApiService.loadLatestExploration('0').then(
      successHandler, failHandler);
    req = httpTestingController.expectOne(
      '/explorehandler/init/0');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should report a cached exploration after caching it', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    // The exploration should not currently be cached.
    expect(readOnlyExplorationBackendApiService.isCached('0')).toBe(false);

    // Cache a exploration.
    readOnlyExplorationBackendApiService.cacheExploration(
      '0', sampleDataResults);

    // It should now be cached.
    expect(readOnlyExplorationBackendApiService.isCached('0')).toBe(true);

    // A new exploration should not have been fetched from the backend. Also,
    // the returned exploration should match the expected exploration object.
    readOnlyExplorationBackendApiService.loadLatestExploration('0').then(
      successHandler, failHandler);
    flushMicrotasks();


    expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should delete a exploration from cache', fakeAsync(() => {
    expect(readOnlyExplorationBackendApiService.isCached('0')).toBe(false);

    readOnlyExplorationBackendApiService.cacheExploration(
      '0', sampleDataResults);
    expect(readOnlyExplorationBackendApiService.isCached('0')).toBe(true);

    readOnlyExplorationBackendApiService.deleteExplorationFromCache('0');
    expect(readOnlyExplorationBackendApiService.isCached('0')).toBe(false);
  }));
});
