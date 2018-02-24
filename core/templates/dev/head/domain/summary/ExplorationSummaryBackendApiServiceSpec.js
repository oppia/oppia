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
 * @fileoverview Service to retrieve information about exploration summaries
 * from the backend.
 */
describe('ExplorationSummaryBackendApiService', function() {
  var Exploration = null;
  var $httpBackend = null;
  var $q = null;
  var ValidatorsService = null;
  var AlertsService = null;
 

  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    Exploration = $injector.get('ExplorationSummaryBackendApiService');
    $httpBackend = $injector.get('$httpBackend');
    $q = $injector.get('$q');
    AlertsService = $injector.get('AlertsService');
    ValidatorsService = $injector.get('ValidatorsService');
  }));
  

  it('loadPublicAndPrivateExplorationSummaries',function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');
    var result = Exploration.loadPublicAndPrivateExplorationSummaries(['']);
    expect(result).not.toBe();
  }  
  );
  
  it('HTTP GET',function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');
    var t = $httpBackend.expectGET('/explorationsummarieshandler/data/')
            .respond(function (status, data, headers, statusText){
              return [200,
                      Exploration
                        .loadPublicAndPrivateExplorationSummaries([1,2,3])];
            });
    Exploration.loadPublicAndPrivateExplorationSummaries([1,2,3]);
  }  
  );
});
