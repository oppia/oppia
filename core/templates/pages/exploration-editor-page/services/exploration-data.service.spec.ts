// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Exploration data service.
 */

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';
import { EditableExplorationBackendApiService } from 'domain/exploration/editable-exploration-backend-api.service';
import { ExplorationDataService } from './exploration-data.service';
import { LocalStorageService } from 'services/local-storage.service';
import { LoggerService } from 'services/contextual/logger.service';
import { CsrfTokenService } from 'services/csrf-token.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { ExplorationDraft } from 'domain/exploration/exploration-draft.model';
import { ExplorationBackendDict } from 'domain/exploration/ExplorationObjectFactory';
import { FetchExplorationBackendResponse } from 'domain/exploration/read-only-exploration-backend-api.service';

describe('Exploration data service', function() {
  let eds: ExplorationDataService = null;
  let eebas: EditableExplorationBackendApiService = null;
  let lss: LocalStorageService = null;
  let ls: LoggerService = null;
  let httpTestingController: HttpTestingController;
  let csrfService: CsrfTokenService = null;
  let sampleDataResults: ExplorationBackendDict = {
    draft_change_list_id: 3,
    version: '1',
    draft_changes: [],
    is_version_of_draft_valid: true,
    init_state_name: 'init',
    param_changes: [],
    param_specs: {randomProp: {obj_type: 'randomVal'}},
    states: {},
    title: 'Test Exploration',
    language_code: 'en'
  };
  let sampleExploration: FetchExplorationBackendResponse = {
    can_edit: true,
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
            default_outcome: {},
            confirmed_unclassified_answers: [],
            id: null
          }
        }
      }
    },
    exploration_id: '1',
    is_logged_in: true,
    session_id: '1',
    version: 1,
    preferred_audio_language_code: 'en',
    auto_tts_enabled: true,
    correctness_feedback_enabled: false,
    record_playthrough_probability: 1,
  } as unknown as FetchExplorationBackendResponse;
  class MockEditableExplorationBackendApiService {
    resolve: boolean = true;
    fetchApplyDraftExploration() {
      return new Promise((resolve, reject) => {
        if (this.resolve) {
          resolve(sampleDataResults);
        } else {
          reject();
        }
      });
    }
    updateExploration() {
      return new Promise((resolve, reject) => {
        if (this.resolve) {
          resolve(sampleDataResults);
        } else {
          reject();
        }
      });
    }
  }
  const windowMock = {
    nativeWindow: {
      location: {
        reload: function() {}
      }
    }
  };
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: UrlService,
          useValue: {getPathname: () => '/create/0'}
        },
        {
          provide: EditableExplorationBackendApiService,
          useClass: MockEditableExplorationBackendApiService
        },
        {provide: WindowRef, useValue: windowMock }
      ]
    });
  });
  beforeEach(() => {
    eds = TestBed.inject(ExplorationDataService);
    lss = TestBed.inject(LocalStorageService);
    ls = TestBed.inject(LoggerService);
    eebas = TestBed.inject(EditableExplorationBackendApiService);
    csrfService = TestBed.inject(CsrfTokenService);
    httpTestingController = TestBed.inject(HttpTestingController);
    spyOn(csrfService, 'getTokenAsync').and.callFake(() => {
      return Promise.resolve('sample-csrf-token');
    });
  });

  afterEach(function() {
    httpTestingController.verify();
  });

  it('should trigger success handler when auto saved successfully', fakeAsync(
    () => {
      eds.data = sampleDataResults;
      const errorCallback = jasmine.createSpy('error');
      const successCallback = jasmine.createSpy('success');
      eds.autosaveChangeList([], successCallback, errorCallback);
      const req = httpTestingController.expectOne(
        '/createhandler/autosave_draft/0');
      expect(req.request.method).toBe('PUT');
      req.flush(sampleDataResults);
      flushMicrotasks();
      expect(successCallback).toHaveBeenCalledWith(sampleDataResults);
      expect(errorCallback).not.toHaveBeenCalled();
    }
  ));

  it('should trigger errorcallback handler when auto save fails', fakeAsync(
    () => {
      eds.data = sampleDataResults;
      const errorCallback = jasmine.createSpy('error');
      const successCallback = jasmine.createSpy('success');
      eds.autosaveChangeList([], successCallback, errorCallback);
      const req = httpTestingController.expectOne(
        '/createhandler/autosave_draft/0');
      expect(req.request.method).toBe('PUT');
      req.error(new ErrorEvent('Server error'));
      flushMicrotasks();
      expect(successCallback).not.toHaveBeenCalled();
      expect(errorCallback).toHaveBeenCalled();
    }
  ));

  it('should autosave draft changes when draft ids match', fakeAsync(() => {
    const errorCallback = jasmine.createSpy('error');
    const successCallback = jasmine.createSpy('success');
    const explorationDraft: ExplorationDraft = new ExplorationDraft([], 1);
    spyOn(explorationDraft, 'isValid').and.callFake(() => true);
    spyOn(lss, 'getExplorationDraft').and.returnValue(explorationDraft);
    eds.getData(errorCallback).then(successCallback);
    flushMicrotasks();
    const req = httpTestingController.expectOne(
      '/createhandler/autosave_draft/0');
    expect(req.request.method).toBe('PUT');
    req.flush(sampleDataResults);
    flushMicrotasks();
    expect(successCallback).toHaveBeenCalledWith(sampleDataResults);
  }));

  it('should not autosave draft changes when draft is already cached',
    fakeAsync(() => {
      const errorCallback = jasmine.createSpy('error');
      const explorationDraft: ExplorationDraft = new ExplorationDraft([], 1);
      spyOn(explorationDraft, 'isValid').and.callFake(() => true);
      spyOn(lss, 'getExplorationDraft').and.returnValue(explorationDraft);
      // Save draft.
      eds.getData(errorCallback).then(data => {
        expect(data).toEqual(sampleDataResults);
        expect(errorCallback).not.toHaveBeenCalled();
      });
      flushMicrotasks();
      const req = httpTestingController.expectOne(
        '/createhandler/autosave_draft/0');
      expect(req.request.method).toBe('PUT');
      req.flush(sampleDataResults);
      flushMicrotasks();
      httpTestingController.verify();

      const logInfoSpy = spyOn(ls, 'info').and.callThrough();
      // Draft is already saved and it's in cache.
      eds.getData(errorCallback).then(data => {
        expect(logInfoSpy).toHaveBeenCalledWith(
          'Found exploration data in cache.');
        expect(data).toEqual(sampleDataResults);
        expect(errorCallback).not.toHaveBeenCalled();
      });
      flushMicrotasks();
    }));

  it('should autosave draft changes when draft ids match', fakeAsync(() => {
    const errorCallback = jasmine.createSpy('error');
    const explorationDraft: ExplorationDraft = new ExplorationDraft([], 1);
    spyOn(explorationDraft, 'isValid').and.callFake(() => true);
    spyOn(lss, 'getExplorationDraft').and.returnValue(explorationDraft);
    const windowRefSpy = spyOn(windowMock.nativeWindow.location, 'reload')
      .and.callThrough();
    eds.getData(errorCallback).then(data => {
      expect(data).toEqual(sampleDataResults);
      expect(errorCallback).not.toHaveBeenCalled();
      expect(windowRefSpy).not.toHaveBeenCalled();
    });
    flushMicrotasks();
    const req = httpTestingController.expectOne(
      '/createhandler/autosave_draft/0');
    expect(req.request.method).toBe('PUT');
    req.flush('Whoops!', { status: 500, statusText: 'Internal Server error' });
    flushMicrotasks();
  }));

  it('should call error callback when draft ids do not match', fakeAsync(() => {
    const explorationDraft: ExplorationDraft = new ExplorationDraft([], 1);
    spyOn(explorationDraft, 'isValid').and.callFake(() => false);
    spyOn(lss, 'getExplorationDraft').and.returnValue(explorationDraft);
    const errorCallback = jasmine.createSpy('error');
    eds.getData(errorCallback).then(data => {
      expect(data).toEqual(sampleDataResults);
      expect(errorCallback).toHaveBeenCalled();
    });
    flushMicrotasks();
  }));

  it('should discard draft', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');
    eds.discardDraft().then(successHandler, failHandler);
    const req = httpTestingController.expectOne(
      '/createhandler/autosave_draft/0');
    req.flush({});
    flushMicrotasks();
    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use reject handler when discard draft fails', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');
    eds.discardDraft().then(successHandler, failHandler);
    const req = httpTestingController.expectOne(
      '/createhandler/autosave_draft/0');
    req.error(new ErrorEvent('Internal server error'));
    flushMicrotasks();
    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should get last saved data', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');
    const logInfoSpy = spyOn(ls, 'info').and.callThrough();

    eds.getLastSavedData().then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/explorehandler/init/0');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleExploration);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(
      sampleExploration.exploration);
    expect(logInfoSpy).toHaveBeenCalledTimes(2);
  }));

  it('should save an exploration to the backend', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    const errorCallback = jasmine.createSpy('error');
    const explorationDraft: ExplorationDraft = new ExplorationDraft([], 1);
    spyOn(explorationDraft, 'isValid').and.callFake(() => true);
    spyOn(lss, 'getExplorationDraft').and.returnValue(explorationDraft);
    const changeList = [];
    eds.getData(errorCallback).then(data => {
      expect(data).toEqual(sampleDataResults);
      expect(errorCallback).not.toHaveBeenCalled();
    });
    flushMicrotasks();
    const req = httpTestingController.expectOne(
      '/createhandler/autosave_draft/0');
    req.flush(sampleDataResults);
    flushMicrotasks();
    eds.save(changeList, 'Commit Message', successHandler, failHandler);
    flushMicrotasks();
    expect(successHandler).toHaveBeenCalledWith(
      sampleDataResults.is_version_of_draft_valid,
      sampleDataResults.draft_changes);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should save an exploration to the backend even when ' +
    'data.exploration is not defined', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    const errorCallback = jasmine.createSpy('error');
    const explorationDraft: ExplorationDraft = new ExplorationDraft([], 1);
    spyOn(explorationDraft, 'isValid').and.callFake(() => false);
    spyOn(lss, 'getExplorationDraft').and.returnValue(explorationDraft);
    const changeList = [];
    let toBeResolved = false;
    // The data.exploration won't receive a value.
    spyOn(eebas, 'updateExploration').and.callFake(
      () => {
        return new Promise((resolve, reject) => {
          if (toBeResolved) {
            resolve(sampleDataResults);
          } else {
            reject();
          }
        });
      }
    );
    eds.getData(errorCallback);
    flushMicrotasks();
    expect(errorCallback).toHaveBeenCalled();
    toBeResolved = true;
    eds.save(changeList, 'Commit Message', successHandler, failHandler);
    flushMicrotasks();
    expect(successHandler).toHaveBeenCalledWith(
      sampleDataResults.is_version_of_draft_valid,
      sampleDataResults.draft_changes);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use reject handler when save an exploration to the backend fails',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      const errorCallback = jasmine.createSpy('error');
      const explorationDraft: ExplorationDraft = new ExplorationDraft([], 1);
      spyOn(explorationDraft, 'isValid').and.callFake(() => true);
      spyOn(lss, 'getExplorationDraft').and.returnValue(explorationDraft);
      const changeList = [];
      eds.getData(errorCallback).then(function(data) {
        expect(data).toEqual(sampleDataResults);
        expect(errorCallback).not.toHaveBeenCalled();
      });
      flushMicrotasks();
      const req = httpTestingController.expectOne(
        '/createhandler/autosave_draft/0');
      req.flush(sampleDataResults);
      spyOn(eebas, 'updateExploration').and.callFake(
        () => {
          return new Promise((resolve, reject) => {
            reject();
          });
        }
      );
      flushMicrotasks();
      eds.save(changeList, 'Commit Message', successHandler, failHandler);
      flushMicrotasks();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }));
});

describe('Exploration data service', function() {
  var eds = null;
  var ls = null;
  var logErrorSpy;
  var pathname = '/exploration/0';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: UrlService,
          useValue: {getPathname: () => '/exploration/0'}
        }
      ]
    });
  });

  beforeEach(() => {
    ls = TestBed.inject(LoggerService);
    logErrorSpy = spyOn(ls, 'error').and.callThrough();
    eds = TestBed.inject(ExplorationDataService);
  });

  it('should throw error when pathname is not valid', () => {
    expect(logErrorSpy).toHaveBeenCalledWith(
      'Unexpected call to ExplorationDataService for pathname: ' + pathname);

    var errorCallback = jasmine.createSpy('error');
    expect(function() {
      eds.getData(errorCallback);
    }).toThrowError('eds.getData is not a function');
  });
});
