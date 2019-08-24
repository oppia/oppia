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
 * @fileoverview Unit tests for the UserExplorationPermissionsService.
 */

require(
  'pages/exploration-editor-page/services/' +
  'user-exploration-permissions.service.ts');
require('services/ContextService.ts');
require('services/contextual/UrlService.ts');

describe('User Exploration Permissions Service', function() {
  var ueps, ContextService, UrlService, $httpBackend;
  var sampleExplorationId = 'sample-exploration';
  var samplePermissionsData = {
    canEdit: false,
    canVoiceOver: true,
  };
  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    ueps = $injector.get('UserExplorationPermissionsService');
    $httpBackend = $injector.get('$httpBackend');

    ContextService = $injector.get('ContextService');
    UrlService = $injector.get('UrlService');
    spyOn(ContextService, 'getExplorationId').and.returnValue(
      sampleExplorationId);
  }));

  it('should fetch the correct data', function() {
    $httpBackend.expect(
      'GET', '/createhandler/permissions/' + sampleExplorationId).respond(
      200, samplePermissionsData);

    ueps.getPermissionsAsync().then(function(response) {
      expect(response).toEqual(samplePermissionsData);
    });
  });

  it('should cache rights data', function() {
    $httpBackend.expect(
      'GET', '/createhandler/permissions/' + sampleExplorationId).respond(
      200, samplePermissionsData);
    ueps.getPermissionsAsync();
    $httpBackend.flush();

    $httpBackend.when(
      'GET', '/createhandler/permissions/' + sampleExplorationId).respond(
      200, {canEdit: true, canVoiceOver: false});
    ueps.getPermissionsAsync();

    expect($httpBackend.flush).toThrow();
  });
});
