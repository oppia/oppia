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
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('pages/exploration-editor-page/services/exploration-data.service.ts');
require('services/local-storage.service');
require('services/alerts.service');
require('services/contextual/logger.service');

describe('Exploration data service', function() {
  var eds = null;
  var lss = null;
  var ls = null;
  var als = null;
  var $q = null;
  var $httpBackend = null;
  var CsrfService = null;
  var sampleDataResults = {
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
  var windowMock = {
    nativeWindow: {
      location: {
        reload: function() {}
      }
    }
  };

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('UrlService', {
      getPathname: function() {
        return '/create/0';
      }
    });
    $provide.value('WindowRef', windowMock);
  }));

  beforeEach(angular.mock.inject(function($injector) {
    eds = $injector.get('ExplorationDataService');
    lss = $injector.get('LocalStorageService');
    ls = $injector.get('LoggerService');
    als = $injector.get('AlertsService');
    $q = $injector.get('$q');
    $httpBackend = $injector.get('$httpBackend');
    CsrfService = $injector.get('CsrfTokenService');

    spyOn(CsrfService, 'getTokenAsync').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve('sample-csrf-token');
      return deferred.promise;
    });
  }));

  it('should autosave draft changes when draft ids match', function() {
    var errorCallback = jasmine.createSpy('error');
    spyOn(lss, 'getExplorationDraft').and.returnValue({
      isValid: function() {
        return true;
      },
      getChanges: function() {
        return [];
      }
    });
    $httpBackend.expect('GET', '/createhandler/data/0?apply_draft=true')
      .respond(sampleDataResults);
    $httpBackend.expectPUT('/createhandler/autosave_draft/0').respond({
      sampleDataResults
    });
    eds.getData(errorCallback).then(function(data) {
      expect(data).toEqual(sampleDataResults);
      expect(errorCallback).not.toHaveBeenCalled();
    });
    $httpBackend.flush(2);
  });

  it('should not autosave draft changes when draft is already cached',
    function() {
      var errorCallback = jasmine.createSpy('error');
      spyOn(lss, 'getExplorationDraft').and.returnValue({
        isValid: function() {
          return true;
        },
        getChanges: function() {
          return [];
        }
      });

      $httpBackend.expect('GET', '/createhandler/data/0?apply_draft=true')
        .respond(sampleDataResults);
      $httpBackend.expectPUT('/createhandler/autosave_draft/0').respond({
        sampleDataResults
      });
      // Save draft.
      eds.getData(errorCallback).then(function(data) {
        expect(data).toEqual(sampleDataResults);
        expect(errorCallback).not.toHaveBeenCalled();
      });
      $httpBackend.flush(2);
      $httpBackend.verifyNoOutstandingExpectation();

      var logInfoSpy = spyOn(ls, 'info').and.callThrough();
      // Draft is already saved and it's in cache.
      eds.getData(errorCallback).then(function(data) {
        expect(logInfoSpy).toHaveBeenCalledWith(
          'Found exploration data in cache.');
        expect(data).toEqual(sampleDataResults);
        expect(errorCallback).not.toHaveBeenCalled();
      });
      $httpBackend.verifyNoOutstandingRequest();
    });

  it('should autosave draft changes when draft ids match', function() {
    var errorCallback = jasmine.createSpy('error');
    spyOn(lss, 'getExplorationDraft').and.returnValue({
      isValid: function() {
        return true;
      },
      getChanges: function() {
        return [];
      }
    });
    var windowRefSpy = spyOn(windowMock.nativeWindow.location, 'reload')
      .and.callThrough();
    $httpBackend.expect('GET', '/createhandler/data/0?apply_draft=true')
      .respond(sampleDataResults);
    $httpBackend.expectPUT('/createhandler/autosave_draft/0')
      .respond(500);
    eds.getData(errorCallback).then(function(data) {
      expect(data).toEqual(sampleDataResults);
      expect(errorCallback).not.toHaveBeenCalled();
      expect(windowRefSpy).not.toHaveBeenCalled();
    });
    $httpBackend.flush(2);
  });

  it('should call error callback when draft ids do not match', function() {
    spyOn(lss, 'getExplorationDraft').and.returnValue({
      isValid: function() {
        return false;
      },
      getChanges: function() {
        return [];
      }
    });
    $httpBackend.expect(
      'GET', '/createhandler/data/0?apply_draft=true').respond(
      sampleDataResults);
    var errorCallback = jasmine.createSpy('error');
    eds.getData(errorCallback).then(function(data) {
      expect(data).toEqual(sampleDataResults);
      expect(errorCallback).toHaveBeenCalled();
    });
    $httpBackend.flush();
  });

  it('should discard draft', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');
    $httpBackend.expectPOST('/createhandler/autosave_draft/0')
      .respond(200);
    eds.discardDraft(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should use reject handler when discard draft fails', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');
    $httpBackend.expectPOST('/createhandler/autosave_draft/0')
      .respond(500);
    eds.discardDraft(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  });

  it('should get last saved data', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');
    var logInfoSpy = spyOn(ls, 'info').and.callThrough();

    $httpBackend.expect('GET', '/explorehandler/init/0').respond(
      sampleDataResults);
    eds.getLastSavedData().then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(
      sampleDataResults.exploration);
    expect(logInfoSpy).toHaveBeenCalledTimes(2);
  });

  it('should resolve answers', function() {
    var stateName = 'First State';
    var clearWarningsSpy = spyOn(als, 'clearWarnings').and.callThrough();

    $httpBackend.expectPUT('/createhandler/resolved_answers/0/' +
      encodeURIComponent(stateName)).respond(200);
    eds.resolveAnswers(stateName, []);
    $httpBackend.flush();

    expect(clearWarningsSpy).toHaveBeenCalled();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should save an exploration to the backend', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    var errorCallback = jasmine.createSpy('error');
    spyOn(lss, 'getExplorationDraft').and.returnValue({
      isValid: function() {
        return true;
      },
      getChanges: function() {
        return [];
      }
    });
    var changeList = [];
    var response = {
      is_version_of_draft_valid: true,
      draft_changes: ''
    };

    $httpBackend.expect('GET', '/createhandler/data/0?apply_draft=true')
      .respond(sampleDataResults);
    $httpBackend.expectPUT('/createhandler/autosave_draft/0').respond({
      sampleDataResults
    });
    eds.getData(errorCallback).then(function(data) {
      expect(data).toEqual(sampleDataResults);
      expect(errorCallback).not.toHaveBeenCalled();
    });
    $httpBackend.flush(2);

    $httpBackend.expectPUT('/createhandler/data/0').respond(response);
    eds.save(changeList, 'Commit Message', successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(
      response.is_version_of_draft_valid, response.draft_changes);
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should save an exploration to the backend even when ' +
    'data.exploration is not defined', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    var errorCallback = jasmine.createSpy('error');
    spyOn(lss, 'getExplorationDraft').and.returnValue({
      isValid: function() {
        return false;
      }
    });
    var changeList = [];
    var response = {
      is_version_of_draft_valid: true,
      draft_changes: ''
    };

    // data.exploration won't receive a value.
    $httpBackend.expect('GET', '/createhandler/data/0?apply_draft=true')
      .respond(500);
    eds.getData(errorCallback).then(function() {
      expect(errorCallback).toHaveBeenCalled();
    });
    $httpBackend.flush();

    $httpBackend.expectPUT('/createhandler/data/0').respond(response);
    eds.save(changeList, 'Commit Message', successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(
      response.is_version_of_draft_valid, response.draft_changes);
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should use reject handler when save an exploration to the backend fails',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      var errorCallback = jasmine.createSpy('error');
      spyOn(lss, 'getExplorationDraft').and.returnValue({
        isValid: function() {
          return true;
        },
        getChanges: function() {
          return [];
        }
      });
      var changeList = [];

      $httpBackend.expect('GET', '/createhandler/data/0?apply_draft=true')
        .respond(sampleDataResults);
      $httpBackend.expectPUT('/createhandler/autosave_draft/0').respond({
        sampleDataResults
      });
      eds.getData(errorCallback).then(function(data) {
        expect(data).toEqual(sampleDataResults);
        expect(errorCallback).not.toHaveBeenCalled();
      });
      $httpBackend.flush(2);

      $httpBackend.expectPUT('/createhandler/data/0').respond(500);
      eds.save(changeList, 'Commit Message', successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    });
});

describe('Exploration data service', function() {
  var eds = null;
  var ls = null;
  var logErrorSpy;
  var pathname = '/exploration/0';

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('UrlService', {
      getPathname: function() {
        return pathname;
      }
    });
  }));

  beforeEach(angular.mock.inject(function($injector) {
    ls = $injector.get('LoggerService');
    logErrorSpy = spyOn(ls, 'error').and.callThrough();
    eds = $injector.get('ExplorationDataService');
  }));

  it('should throw error when pathname is not valid', function() {
    expect(logErrorSpy).toHaveBeenCalledWith(
      'Unexpected call to ExplorationDataService for pathname ', pathname);

    var errorCallback = jasmine.createSpy('error');
    expect(function() {
      eds.getData(errorCallback);
    }).toThrow(TypeError('eds.getData is not a function'));
  });
});
