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
 * @fileoverview Unit tests for ExplorationSummaryBackendApiService.
 */
import { UpgradedServices } from 'services/UpgradedServices';

require('domain/summary/exploration-summary-backend-api.service.ts');
require('services/csrf-token.service.ts');

describe('Exploration Summary Backend Api Service', function() {
  var ExplorationSummaryBackendApiService = null;
  var $httpBackend = null;
  var $rootScope = null;
  var CsrfService = null;
  var AlertsService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function($injector, $q) {
    ExplorationSummaryBackendApiService = $injector.get(
      'ExplorationSummaryBackendApiService');
    $httpBackend = $injector.get('$httpBackend');
    CsrfService = $injector.get('CsrfTokenService');
    $rootScope = $injector.get('$rootScope');
    AlertsService = $injector.get('AlertsService');

    spyOn(CsrfService, 'getTokenAsync').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve('sample-csrf-token');
      return deferred.promise;
    });
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should not load public exploration summaries from backend when' +
    ' exploration id is not valid', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');
    var explorationIds = ['#', null, '1'];
    var alertSpy = spyOn(AlertsService, 'addWarning').and.callThrough();

    ExplorationSummaryBackendApiService.loadPublicExplorationSummaries(
      explorationIds).then(successHandler, failHandler);
    $rootScope.$apply();

    expect(alertSpy).toHaveBeenCalledWith(
      'Please enter a valid exploration ID.');
    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith([null, null, null]);
  });

  it('should load public exploration summaries from backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      var explorationIds = ['0', '1', '2'];
      var sampleResults = [{
        title: 'Title 1',
        category: 'Category 1',
        status: 'public',
        language_code: 'en'
      }];

      var requestUrl = '/explorationsummarieshandler/data?' +
        'stringified_exp_ids=' + encodeURI(JSON.stringify(explorationIds)) +
        '&' + 'include_private_explorations=false';

      $httpBackend.expect('GET', requestUrl).respond({
        summaries: sampleResults
      });
      ExplorationSummaryBackendApiService
        .loadPublicExplorationSummaries(explorationIds)
        .then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(sampleResults);
      expect(failHandler).not.toHaveBeenCalled();
    });

  it('should load public and private exploration summaries from backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      var explorationIds = ['0', '1', '2'];
      var sampleResults = [{
        title: 'Title 1',
        category: 'Category 1',
        status: 'public',
        language_code: 'en'
      }, {
        title: 'Title 2',
        category: 'Category 2',
        status: 'private',
        language_code: 'en'
      }];

      var requestUrl = '/explorationsummarieshandler/data?' +
        'stringified_exp_ids=' + encodeURI(JSON.stringify(explorationIds)) +
        '&' + 'include_private_explorations=true';

      $httpBackend.expect('GET', requestUrl).respond({
        summaries: sampleResults
      });
      ExplorationSummaryBackendApiService
        .loadPublicAndPrivateExplorationSummaries(explorationIds).then(
          successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(sampleResults);
      expect(failHandler).not.toHaveBeenCalled();
    });

  it('should use reject handler when loading public exploration summaries' +
    ' from backend returns null', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');
    var explorationIds = ['0', '1', '2'];

    var requestUrl = '/explorationsummarieshandler/data?' +
      'stringified_exp_ids=' + encodeURI(JSON.stringify(explorationIds)) +
      '&' + 'include_private_explorations=false';

    $httpBackend.expect('GET', requestUrl).respond({
      summaries: null
    });
    ExplorationSummaryBackendApiService
      .loadPublicExplorationSummaries(explorationIds)
      .then(successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      Error('Summaries fetched are null for explorationIds: ' +
      explorationIds));
  });

  it('should use reject handler when loading public exploration summaries' +
    ' from backend fails', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');
    var explorationIds = ['0', '1', '2'];
    var errorMessage = 'Error on loading public exploration summaries.';

    var requestUrl = '/explorationsummarieshandler/data?' +
      'stringified_exp_ids=' + encodeURI(JSON.stringify(explorationIds)) +
      '&' + 'include_private_explorations=false';

    $httpBackend.expect('GET', requestUrl).respond(
      500, errorMessage);
    ExplorationSummaryBackendApiService
      .loadPublicExplorationSummaries(explorationIds)
      .then(successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(errorMessage);
  });
});
