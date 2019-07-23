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
 * @fileoverview Unit tests for the exploration rights data service
 * of the exploration editor page.
 */

require(
  'pages/exploration-editor-page/services/exploration-rights-data.service.ts');
require('services/ContextService.ts');

describe('Exploration rights data service', function() {
  var erds, ContextService, $httpBackend;
  var sampleExplorationId = 'sample-exploration';
  var sampleRightsData = {
    canEdit: false,
    canVoiceOver: true,
  };
  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    erds = $injector.get('ExplorationRightsDataService');
    $httpBackend = $injector.get('$httpBackend');

    ContextService = $injector.get('ContextService');
    spyOn(ContextService, 'getExplorationId').and.returnValue(
      sampleExplorationId);
  }));

  it('should fetch the correct data', function() {
    $httpBackend.expect(
      'GET', '/createhandler/rights/' + sampleExplorationId).respond(
      200, sampleRightsData);

    erds.getRightsAsync().then(function(response) {
      expect(response.canEdit).toBe(sampleRightsData.canEdit);
      expect(response.canVoiceOver).toBe(sampleRightsData.canVoiceOver);
    });
  });

  it('should cache rights data', function() {
    $httpBackend.expect(
      'GET', '/createhandler/rights/' + sampleExplorationId).respond(
      200, sampleRightsData);
    erds.getRightsAsync();
    $httpBackend.flush();

    $httpBackend.when(
      'GET', '/createhandler/rights/' + sampleExplorationId).respond(
      200, {canEdit: true, canVoiceOver: false});
    erds.getRightsAsync();

    expect($httpBackend.flush).toThrow();
  });
});
