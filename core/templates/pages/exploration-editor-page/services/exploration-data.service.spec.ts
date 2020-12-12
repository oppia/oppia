// Copyright 2014 The Oppia Authors. All Rights Reserved.
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

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils';
// ^^^ This block is to be removed.
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { ExplorationDataService } from 'pages/exploration-editor-page/services/exploration-data.service';
import { LocalStorageService } from 'services/local-storage.service';
import { AlertsService } from 'services/alerts.service';
import { LoggerService } from 'services/contextual/logger.service';
import { CsrfTokenService } from 'services/csrf-token.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';

class MockWindowRef {
  get nativeWindow() {
    return {
      location: {
        reload: () => {}
      }
    };
  }
}

describe('Exploration data service', function() {
  let explorationDataService : ExplorationDataService = null;
  let localStorageService : LocalStorageService = null;
  let loggerService :LoggerService = null;
  let alertService :AlertsService = null;
  let csrfService :CsrfTokenService = null;
  let httpTestingController: HttpTestingController;
  let urlService: UrlService;
  let windowRef: MockWindowRef;
  let sampleDataResults = {
    draft_change_list_id: 3,
    version: 1,
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
  };

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(() => {
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: WindowRef, useValue: windowRef }]
    }).compileComponents();

    localStorageService = TestBed.get(LocalStorageService);
    loggerService = TestBed.get(LoggerService);
    alertService = TestBed.get(AlertsService);
    csrfService = TestBed.get(CsrfTokenService);
    httpTestingController = TestBed.get(HttpTestingController);
    urlService = TestBed.get(UrlService);
    spyOn(urlService, 'getPathname').and.returnValue('/create/0');
    spyOn(localStorageService, 'saveExplorationDraft').and.callThrough();
    explorationDataService = TestBed.get(ExplorationDataService);

    spyOn(csrfService, 'getTokenAsync').and.callFake(() => {
      return Promise.resolve('sample-csrf-token');
    });
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should autosave draft changes when draft ids match -1', fakeAsync(() => {
    let errorCallback = jasmine.createSpy('error');
    spyOn(localStorageService, 'getExplorationDraft').and.returnValue({
      draftChanges: [],
      draftChangeListId: 0,
      isValid: () => {
        return true;
      },
      getChanges: () => {
        return [];
      }
    });

    explorationDataService.getData(errorCallback).then((data) => {
      expect(data).toEqual(sampleDataResults);
      expect(errorCallback).not.toHaveBeenCalled();
    });

    let req = httpTestingController.expectOne(
      '/createhandler/data/0?apply_draft=true');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);
    flushMicrotasks();

    req = httpTestingController.expectOne(
      '/createhandler/autosave_draft/0');
    expect(req.request.method).toEqual('PUT');
    req.flush(sampleDataResults);
    flushMicrotasks();
  }));

  it('should use reject handler when fetchApplyDraftExploration fails',
    fakeAsync(() => {
      let errorCallback = jasmine.createSpy('error');
      spyOn(localStorageService, 'getExplorationDraft').and.returnValue({
        draftChanges: [],
        draftChangeListId: 0,
        isValid: () => {
          return true;
        },
        getChanges: () => {
          return [];
        }
      });

      explorationDataService.getData(errorCallback).then((data) => {
        expect(errorCallback).toHaveBeenCalled();
      });

      let req = httpTestingController.expectOne(
        '/createhandler/data/0?apply_draft=true');
      expect(req.request.method).toEqual('GET');
      req.flush(
        {error: ''},
        {status: 500, statusText: 'Internal Server Error'});
      flushMicrotasks();
    }));

  it('should not autosave draft changes when draft is already cached',
    fakeAsync(() => {
      let errorCallback = jasmine.createSpy('error');
      spyOn(localStorageService, 'getExplorationDraft').and.returnValue({
        draftChanges: [],
        draftChangeListId: 0,
        isValid: () => {
          return true;
        },
        getChanges: () => {
          return [];
        }
      });
      // Save draft.
      explorationDataService.getData(errorCallback).then((data) => {
        expect(data).toEqual(sampleDataResults);
        expect(errorCallback).not.toHaveBeenCalled();
      });

      let req = httpTestingController.expectOne(
        '/createhandler/data/0?apply_draft=true');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);
      flushMicrotasks();
      req = httpTestingController.expectOne(
        '/createhandler/autosave_draft/0');
      expect(req.request.method).toEqual('PUT');
      req.flush(sampleDataResults);
      flushMicrotasks();

      let logInfoSpy = spyOn(loggerService, 'info').and.callThrough();
      // Draft is already saved and it's in cache.
      explorationDataService.getData(errorCallback).then((data) => {
        expect(logInfoSpy).toHaveBeenCalledWith(
          'Found exploration data in cache.');
        expect(data).toEqual(sampleDataResults);
        expect(errorCallback).not.toHaveBeenCalled();
      });
    }));

  it('should autosave draft changes when draft ids match -2', fakeAsync(() => {
    let errorCallback = jasmine.createSpy('error');
    spyOn(localStorageService, 'getExplorationDraft').and.returnValue({
      draftChanges: [],
      draftChangeListId: 0,
      isValid: () => {
        return true;
      },
      getChanges: () => {
        return [];
      }
    });

    let windowRefSpy = spyOn(windowRef.nativeWindow.location, 'reload');
    explorationDataService.getData(errorCallback).then((data) => {
      expect(errorCallback).toHaveBeenCalled();
      expect(windowRefSpy).toHaveBeenCalled();
    });
    let req = httpTestingController.expectOne(
      '/createhandler/data/0?apply_draft=true');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);
    flushMicrotasks();
    req = httpTestingController.expectOne(
      '/createhandler/autosave_draft/0');
    expect(req.request.method).toEqual('PUT');
    req.flush({
      error: ''},
    {status: 500, statusText: 'Internal Server Error'});
    flushMicrotasks();
  }));

  it('should call error callback when draft ids do not match', fakeAsync(() => {
    spyOn(localStorageService, 'getExplorationDraft').and.returnValue({
      draftChanges: [],
      draftChangeListId: 0,
      isValid: () => {
        return false;
      },
      getChanges: () => {
        return [];
      }
    });

    let errorCallback = jasmine.createSpy('error');
    explorationDataService.getData(errorCallback).then((data) => {
      expect(data).toEqual(sampleDataResults);
      expect(errorCallback).toHaveBeenCalled();
    });

    let req = httpTestingController.expectOne(
      '/createhandler/data/0?apply_draft=true');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);
    flushMicrotasks();
  }));

  it('should discard draft', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    explorationDataService.discardDraft(
      successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/createhandler/autosave_draft/0');
    expect(req.request.method).toEqual('POST');
    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use reject handler when discard draft fails', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('error');

    explorationDataService.discardDraft(
      successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/createhandler/autosave_draft/0');
    expect(req.request.method).toEqual('POST');
    req.flush({
      error: ''},
    {status: 500, statusText: 'Internal Server Error'});
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should get last saved data', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let logInfoSpy = spyOn(loggerService, 'info').and.callThrough();

    explorationDataService.getLastSavedData().then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/explorehandler/init/0');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(
      sampleDataResults.exploration);
    expect(logInfoSpy).toHaveBeenCalledTimes(1);
  }));

  it('should resolve answers', fakeAsync(() => {
    let stateName = 'First State';
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let clearWarningsSpy = spyOn(
      alertService, 'clearWarnings').and.callThrough();

    explorationDataService.resolveAnswers(
      stateName, [], successHandler, failHandler);
    expect(clearWarningsSpy).toHaveBeenCalled();
    let req = httpTestingController.expectOne(
      '/createhandler/resolved_answers/0/' + encodeURIComponent(stateName));
    expect(req.request.method).toEqual('PUT');
    req.flush(200);
    flushMicrotasks();
    expect(successHandler).toHaveBeenCalled();
  }));

  it('should use reject handler when resolve answers fails', fakeAsync(() => {
    let stateName = 'First State';
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let clearWarningsSpy = spyOn(
      alertService, 'clearWarnings').and.callThrough();

    explorationDataService.resolveAnswers(
      stateName, [], successHandler, failHandler);
    expect(clearWarningsSpy).toHaveBeenCalled();
    let req = httpTestingController.expectOne(
      '/createhandler/resolved_answers/0/' + encodeURIComponent(stateName));
    expect(req.request.method).toEqual('PUT');
    req.flush({
      error: ''},
    {status: 500, statusText: 'Internal Server Error'});
    flushMicrotasks();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should save an exploration to the backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let errorCallback = jasmine.createSpy('error');
    spyOn(localStorageService, 'getExplorationDraft').and.returnValue({
      draftChanges: [],
      draftChangeListId: 0,
      isValid: () => {
        return true;
      },
      getChanges: () => {
        return [];
      }
    });
    let changeList = [];
    let response = {
      is_version_of_draft_valid: true,
      draft_changes: ''
    };

    explorationDataService.getData(errorCallback).then((data) => {
      expect(data).toEqual(sampleDataResults);
      expect(errorCallback).not.toHaveBeenCalled();
    });

    let req = httpTestingController.expectOne(
      '/createhandler/data/0?apply_draft=true');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);
    flushMicrotasks();

    req = httpTestingController.expectOne('/createhandler/autosave_draft/0');
    expect(req.request.method).toEqual('PUT');
    req.flush(sampleDataResults);
    flushMicrotasks();

    explorationDataService.save(
      changeList, 'Commit Message', successHandler, failHandler);
    req = httpTestingController.expectOne('/createhandler/data/0');
    expect(req.request.method).toEqual('PUT');
    req.flush(response);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(
      response);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should save an exploration to the backend even when ' +
    'data.exploration is not defined', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let errorCallback = jasmine.createSpy('error');
    spyOn(localStorageService, 'getExplorationDraft').and.returnValue({
      draftChanges: [],
      draftChangeListId: 0,
      isValid: () => {
        return false;
      },
      getChanges: () => {
        return [];
      }
    });
    let changeList = [];
    let response = {
      is_version_of_draft_valid: true,
      draft_changes: ''
    };

    // The data.exploration won't receive a value.
    explorationDataService.getData(errorCallback).then(() => {
      expect(errorCallback).toHaveBeenCalled();
    });
    let req = httpTestingController.expectOne(
      '/createhandler/data/0?apply_draft=true');
    expect(req.request.method).toEqual('GET');
    req.flush(500);
    flushMicrotasks();

    explorationDataService.save(
      changeList, 'Commit Message', successHandler, failHandler);
    req = httpTestingController.expectOne(
      '/createhandler/data/0');
    expect(req.request.method).toEqual('PUT');
    req.flush(response);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(response);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use reject handler when save an exploration to the backend fails',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      let errorCallback = jasmine.createSpy('error');
      spyOn(localStorageService, 'getExplorationDraft').and.returnValue({
        draftChanges: [],
        draftChangeListId: 0,
        isValid: () => {
          return true;
        },
        getChanges: () => {
          return [];
        }
      });
      let changeList = [];
      explorationDataService.getData(errorCallback).then((data) => {
        expect(data).toEqual(sampleDataResults);
        expect(errorCallback).not.toHaveBeenCalled();
      });

      let req = httpTestingController.expectOne(
        '/createhandler/data/0?apply_draft=true');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);
      flushMicrotasks();

      req = httpTestingController.expectOne('/createhandler/autosave_draft/0');
      expect(req.request.method).toEqual('PUT');
      req.flush(sampleDataResults);
      flushMicrotasks();
      explorationDataService.save(
        changeList, 'Commit Message', successHandler, failHandler);
      req = httpTestingController.expectOne('/createhandler/data/0');
      expect(req.request.method).toEqual('PUT');
      req.flush({
        error: ''},
      {status: 500, statusText: 'Internal Server Error'});
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }));
});

describe('Exploration data service', function() {
  let explorationDataService :ExplorationDataService = null;
  let loggerService :LoggerService = null;
  let logErrorSpy;
  let pathname = '/exploration/0';
  let urlService :UrlService;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    loggerService = TestBed.get(LoggerService);
    urlService = TestBed.get(UrlService);
    spyOn(urlService, 'getPathname').and.returnValue(pathname);
    logErrorSpy = spyOn(loggerService, 'error').and.callThrough();
    explorationDataService = TestBed.get(ExplorationDataService);
  });

  it('should throw error when pathname is not valid', fakeAsync(() => {
    expect(logErrorSpy).toHaveBeenCalledWith(
      'Unexpected call to ExplorationDataService for pathname ' + pathname);

    let errorCallback = jasmine.createSpy('error');
    expect(() => {
      explorationDataService.getData(errorCallback);
    }).toThrowError('explorationDataService.getData is not a function');
  }));
});
