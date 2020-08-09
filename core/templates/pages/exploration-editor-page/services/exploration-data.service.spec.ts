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
import { HttpClientTestingModule, HttpTestingController } from
   '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { ExplorationDataService } from
  'pages/exploration-editor-page/services/exploration-data.service';
import { AlertsService } from 'services/alerts.service';
import { LocalStorageService } from 'services/local-storage.service';
import { LoggerService } from 'services/contextual/logger.service';
import { CsrfTokenService } from 'services/csrf-token.service';

describe('Exploration data service', () => {
  let eds: ExplorationDataService = null;
  let httpTestingController: HttpTestingController;
  let lss: LocalStorageService = null;
  let ls = null;
  let als = null;
  let $q = null;
  let CsrfService = null;
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
  let windowMock = {
    nativeWindow: {
      location: {
        reload: function() {}
      }
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ExplorationDataService, LocalStorageService, 
        LoggerService, AlertsService, CsrfTokenService]
    });
    httpTestingController = TestBed.get(HttpTestingController);
    eds = TestBed.get(ExplorationDataService);
    lss = TestBed.get(LocalStorageService);
    ls = TestBed.get(LoggerService);
    als = TestBed.get(LocalStorageService);
    CsrfService = TestBed.get(CsrfTokenService);

    spyOn(CsrfService, 'getTokenAsync').and.callFake(() => {
      return new Promise((resolve) => {
        resolve('sample-csrf-token');
      })
    });
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  beforeEach(angular.mock.module('oppia', ($provide) => {
    $provide.value('UrlService', {
      getPathname: () => '/create/0'
    });
    $provide.value('WindowRef', windowMock);
  }));

  it('should autosave draft changes when draft ids match', fakeAsync(() => {
    let errorCallback = jasmine.createSpy('error');
    spyOn(lss, 'getExplorationDraft').and.returnValue({
      draftChanges: [],
      draftChangeListId:  0,
      isValid: () => {
        return true;
      },
      getChanges: () => {
        return [];
      }
    });

    eds.getData(errorCallback).then((data) => {
      expect(data).toEqual(sampleDataResults);
      expect(errorCallback).not.toHaveBeenCalled();
    });
    let req = httpTestingController.expectOne('/createhandler/data/0?apply_draft=true');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);
    req = httpTestingController.expectOne('/createhandler/autosave_draft/0');
    expect(req.request.method).toEqual('PUT');
    req.flush(sampleDataResults);

    flushMicrotasks();
  }));

  it('should not autosave draft changes when draft is already cached',
    fakeAsync(() => {
      let errorCallback = jasmine.createSpy('error');
      spyOn(lss, 'getExplorationDraft').and.returnValue({
        draftChanges: [],
        draftChangeListId:  0,
        isValid: () => true,
        getChanges: () => []
        });

      // Save draft.
      eds.getData(errorCallback).then((data) => {
        expect(data).toEqual(sampleDataResults);
        expect(errorCallback).not.toHaveBeenCalled();
      });
      let req = httpTestingController.expectOne(
        '/createhandler/data/0?apply_draft=true');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);
      req = httpTestingController.expectOne(
        '/createhandler/autosave_draft/0');
      expect(req.request.method).toEqual('PUT');
      req.flush(sampleDataResults);
      
      flushMicrotasks();
      httpTestingController.verify()

      let logInfoSpy = spyOn(ls, 'info').and.callThrough();
      // Draft is already saved and it's in cache.
      eds.getData(errorCallback).then((data) => {
        expect(logInfoSpy).toHaveBeenCalledWith(
          'Found exploration data in cache.');
        expect(data).toEqual(sampleDataResults);
        expect(errorCallback).not.toHaveBeenCalled();
      });
      httpTestingController.verify()
    }));

  it('should autosave draft changes when draft ids match', fakeAsync(() => {
    let errorCallback = jasmine.createSpy('error');
    spyOn(lss, 'getExplorationDraft').and.returnValue({
      draftChanges: [],
      draftChangeListId:  0,
      isValid: () => true,
      getChanges: () => []
    });
    let windowRefSpy = spyOn(windowMock.nativeWindow.location, 'reload')
      .and.callThrough();
    eds.getData(errorCallback).then((data) => {
      expect(data).toEqual(sampleDataResults);
      expect(errorCallback).not.toHaveBeenCalled();
      expect(windowRefSpy).not.toHaveBeenCalled();
    });
    let req = httpTestingController.expectOne(
      '/createhandler/data/0?apply_draft=true');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);
    req = httpTestingController.expectOne(
      '/createhandler/autosave_draft/0');
    expect(req.request.method).toEqual('PUT');
    req.flush(500);
    
    flushMicrotasks();
  }));

  it('should call error callback when draft ids do not match', fakeAsync(() => {
    spyOn(lss, 'getExplorationDraft').and.returnValue({
      draftChanges: [],
      draftChangeListId:  0,
      isValid: () => true,
      getChanges: () => []
    });
    let errorCallback = jasmine.createSpy('error');
    eds.getData(errorCallback).then((data) => {
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
    eds.discardDraft(
      successHandler, failHandler);
    var req = httpTestingController.expectOne(
      '/createhandler/autosave_draft/0');
    expect(req.request.method).toEqual('POST');
    req.flush(200);
    
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use reject handler when discard draft fails', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    eds.discardDraft(
      successHandler, failHandler);
    var req = httpTestingController.expectOne(
      '/createhandler/autosave_draft/0');
    expect(req.request.method).toEqual('POST');
    req.flush(500);
    
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should get last saved data', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let logInfoSpy = spyOn(ls, 'info').and.callThrough();

    eds.getLastSavedData().then(
      successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/explorehandler/init/0');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);
    
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(
      sampleDataResults.exploration);
    expect(logInfoSpy).toHaveBeenCalledTimes(2);
  }));

  it('should resolve answers', fakeAsync(() => {
    let stateName = 'First State';
    let clearWarningsSpy = spyOn(als, 'clearWarnings').and.callThrough();

    eds.resolveAnswers(stateName, []);
    let req = httpTestingController.expectOne(
      '/createhandler/resolved_answers/0/' +
      encodeURIComponent(stateName));
    expect(req.request.method).toEqual('PUT');
    req.flush(200);
    
    flushMicrotasks();

    expect(clearWarningsSpy).toHaveBeenCalled();
    httpTestingController.verify();
  }));

  it('should save an exploration to the backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let errorCallback = jasmine.createSpy('error');
    spyOn(lss, 'getExplorationDraft').and.returnValue({
      draftChanges: [],
      draftChangeListId:  0,
      isValid: () => true,
      getChanges: () => []
    });
    let changeList = [];
    let response = {
      is_version_of_draft_valid: true,
      draft_changes: ''
    };

    eds.getData(errorCallback).then((data) => {
      expect(data).toEqual(sampleDataResults);
      expect(errorCallback).not.toHaveBeenCalled();
    });
    let req = httpTestingController.expectOne(
      '/createhandler/data/0?apply_draft=true');
    expect(req.request.method).toEqual('PUT');
    req.flush(sampleDataResults);
    req = httpTestingController.expectOne(
      '/createhandler/autosave_draft/0');
    expect(req.request.method).toEqual('PUT');
    req.flush(sampleDataResults);
    
    flushMicrotasks();

    eds.save(changeList, 'Commit Message', successHandler, failHandler);
    req = httpTestingController.expectOne(
      '/createhandler/autosave_draft/0');
    expect(req.request.method).toEqual('PUT');
    req.flush(response);
    
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(
      response.is_version_of_draft_valid, response.draft_changes);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should save an exploration to the backend even when ' +
    'data.exploration is not defined', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let errorCallback = jasmine.createSpy('error');
    spyOn(lss, 'getExplorationDraft').and.returnValue({
      draftChanges: [],
      draftChangeListId:  0,
      isValid: () => true,
      getChanges: () => []
    });
    let changeList = [];
    let response = {
      is_version_of_draft_valid: true,
      draft_changes: ''
    };

    // The data.exploration won't receive a value.
    eds.getData(errorCallback).then(() => {
      expect(errorCallback).toHaveBeenCalled();
    });
    let req = httpTestingController.expectOne(
      '/createhandler/data/0?apply_draft=true');
    expect(req.request.method).toEqual('GET');
    req.flush(500);
    
    flushMicrotasks();

    eds.save(changeList, 'Commit Message', successHandler, failHandler);
    req = httpTestingController.expectOne(
      '/createhandler/data/0');
    expect(req.request.method).toEqual('PUT');
    req.flush(response);
    
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(
      response.is_version_of_draft_valid, response.draft_changes);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use reject handler when save an exploration to the backend fails',
  fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      let errorCallback = jasmine.createSpy('error');
      spyOn(lss, 'getExplorationDraft').and.returnValue({
        draftChanges: [],
        draftChangeListId:  0,
        isValid: () => true,
        getChanges: () => []
        });
      let changeList = [];

      eds.getData(errorCallback).then((data) => {
        expect(data).toEqual(sampleDataResults);
        expect(errorCallback).not.toHaveBeenCalled();
      });

      let req = httpTestingController.expectOne(
        '/createhandler/data/0?apply_draft=true');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);

      req = httpTestingController.expectOne(
        '/createhandler/autosave_draft/0');
      expect(req.request.method).toEqual('PUT');
      req.flush(sampleDataResults);

      flushMicrotasks();

      eds.save(changeList, 'Commit Message', successHandler, failHandler);
      req = httpTestingController.expectOne(
        '/createHandler/data/0');
      expect(req.request.method).toEqual('PUT');
      req.flush(500);

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }));
});

describe('Exploration data service', () => {
  let eds = null;
  let logErrorSpy;
  let pathname = '/exploration/0';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExplorationDataService]
    });
    eds = TestBed.get(ExplorationDataService)
  });

  it('should throw error when pathname is not valid', () => {
    expect(logErrorSpy).toHaveBeenCalledWith(
      'Unexpected call to ExplorationDataService for pathname ', pathname);

    let errorCallback = jasmine.createSpy('error');
    expect(() => {
      eds.getData(errorCallback);
    }).toThrowError('eds.getData is not a function');
  });
});
