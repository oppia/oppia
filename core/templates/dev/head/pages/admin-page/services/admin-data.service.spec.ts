// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for AdminDataService.
 */

require('pages/admin-page/services/admin-data.service.ts');

describe('Admin Data Service', function() {
  var AdminDataService = null;
  var $httpBackend = null;
  var sampleAdminData = {
    property: 'value'
  };

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    AdminDataService = $injector.get('AdminDataService');
  }));

  it('should return the correct admin data', function() {
    $httpBackend.expect('GET', '/adminhandler').respond(
      200, sampleAdminData);

    AdminDataService.getDataAsync().then(function(response) {
      expect(response).toEqual(sampleAdminData);
    });
  });

  it('should cache the response and not make a second request', function() {
    $httpBackend.expect('GET', '/adminhandler').respond(
      200, sampleAdminData);
    AdminDataService.getDataAsync();
    $httpBackend.flush();

    $httpBackend.whenGET('/adminhandler').respond(
      200, {property: 'another value'});

    AdminDataService.getDataAsync().then(function(response) {
      expect(response).toEqual(sampleAdminData);
    });

    expect($httpBackend.flush).toThrow();
  });
});
