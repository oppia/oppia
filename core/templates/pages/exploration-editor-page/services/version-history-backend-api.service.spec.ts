// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for version history backend api service.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {fakeAsync, flushMicrotasks, TestBed} from '@angular/core/testing';
import {ExplorationMetadataObjectFactory} from 'domain/exploration/ExplorationMetadataObjectFactory';
import {StateObjectFactory} from 'domain/state/StateObjectFactory';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {VersionHistoryBackendApiService} from './version-history-backend-api.service';

describe('Version history backend api service', () => {
  let versionHistoryBackendApiService: VersionHistoryBackendApiService;
  let http: HttpTestingController;
  let stateObjectFactory: StateObjectFactory;
  let explorationMetadataObjectFactory: ExplorationMetadataObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ExplorationMetadataObjectFactory,
        StateObjectFactory,
        UrlInterpolationService,
      ],
    });

    versionHistoryBackendApiService = TestBed.inject(
      VersionHistoryBackendApiService
    );
    http = TestBed.inject(HttpTestingController);
    stateObjectFactory = TestBed.inject(StateObjectFactory);
    explorationMetadataObjectFactory = TestBed.inject(
      ExplorationMetadataObjectFactory
    );
  });

  it('should correctly fetch the version history of a state', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failureHandler = jasmine.createSpy('failure');
    const sampleStateVersionHistoryDict = {
      last_edited_version_number: 1,
      state_name_in_previous_version: 'Introduction',
      state_dict_in_previous_version: stateObjectFactory
        .createDefaultState('Introduction', 'content_0', 'default_outcome_1')
        .toBackendDict(),
      last_edited_committer_username: 'user1',
    };
    const sampleStateVersionHistory = {
      lastEditedVersionNumber: 1,
      stateNameInPreviousVersion: 'Introduction',
      stateInPreviousVersion: stateObjectFactory.createDefaultState(
        'Introduction',
        'content_0',
        'default_outcome_1'
      ),
      lastEditedCommitterUsername: 'user1',
    };
    versionHistoryBackendApiService
      .fetchStateVersionHistoryAsync('1', 'Introduction', 2)
      .then(successHandler, failureHandler);

    const req = http.expectOne(
      '/version_history_handler/state/1/Introduction/2'
    );
    expect(req.request.method).toEqual('GET');
    req.flush(sampleStateVersionHistoryDict);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(sampleStateVersionHistory);
    expect(failureHandler).not.toHaveBeenCalled();
  }));

  it('should fail to fetch the version history of a state', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failureHandler = jasmine.createSpy('failure');
    versionHistoryBackendApiService
      .fetchStateVersionHistoryAsync('1', 'Introduction', 2)
      .then(successHandler, failureHandler);

    const req = http.expectOne(
      '/version_history_handler/state/1/Introduction/2'
    );
    expect(req.request.method).toEqual('GET');
    req.flush(
      {
        error: 'could not find the version history data',
      },
      {
        status: 404,
        statusText: 'Page not found',
      }
    );
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(null);
    expect(failureHandler).not.toHaveBeenCalled();
  }));

  it('should correctly fetch the version history of the exploration metadata', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failureHandler = jasmine.createSpy('failure');
    const sampleMetadataVersionHistoryDict = {
      last_edited_version_number: 1,
      last_edited_committer_username: 'user1',
      metadata_dict_in_previous_version: {
        title: 'Exploration',
        category: 'Algebra',
        objective: 'To learn',
        language_code: 'en',
        tags: [],
        blurb: '',
        author_notes: '',
        states_schema_version: 50,
        init_state_name: 'Introduction',
        param_changes: [],
        param_specs: {},
        auto_tts_enabled: false,
        edits_allowed: true,
      },
    };
    const sampleMetadataVersionHistory = {
      lastEditedVersionNumber: 1,
      lastEditedCommitterUsername: 'user1',
      metadataInPreviousVersion:
        explorationMetadataObjectFactory.createFromBackendDict(
          sampleMetadataVersionHistoryDict.metadata_dict_in_previous_version
        ),
    };
    versionHistoryBackendApiService
      .fetchMetadataVersionHistoryAsync('1', 2)
      .then(successHandler, failureHandler);

    const req = http.expectOne('/version_history_handler/metadata/1/2');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleMetadataVersionHistoryDict);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(sampleMetadataVersionHistory);
    expect(failureHandler).not.toHaveBeenCalled();
  }));

  it('should fail to fetch version history for exploration metadata', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failureHandler = jasmine.createSpy('failure');
    versionHistoryBackendApiService
      .fetchMetadataVersionHistoryAsync('1', 2)
      .then(successHandler, failureHandler);

    const req = http.expectOne('/version_history_handler/metadata/1/2');
    expect(req.request.method).toEqual('GET');
    req.flush(
      {
        error: 'could not find the version history data',
      },
      {
        status: 404,
        statusText: 'Page not found',
      }
    );
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(null);
    expect(failureHandler).not.toHaveBeenCalled();
  }));
});
