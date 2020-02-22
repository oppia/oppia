// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for SkillRightsBackendApiService.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.
require('App.ts');
require('domain/skill/skill-rights-backend-api.service.ts');
require('pages/skill-editor-page/skill-editor-page.controller.ts');
require('services/csrf-token.service.ts');

describe('Skill rights backend API service', function() {
  var SkillRightsBackendApiService = null;
  var $rootScope = null;
  var $scope = null;
  var $httpBackend = null;
  var CsrfService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $q) {
    SkillRightsBackendApiService = $injector.get(
      'SkillRightsBackendApiService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');
    CsrfService = $injector.get('CsrfTokenService');

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

  it('should successfully fetch a skill dict from backend', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');
    var sampleResults = {
      skill_id: '0',
      can_edit_skill_description: ''
    };

    $httpBackend.expect('GET', '/skill_editor_handler/rights/0')
      .respond(sampleResults);
    SkillRightsBackendApiService.fetchSkillRights('0').then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(sampleResults);
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should use reject handler when fetching a skill dict from backend' +
    ' fails', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    $httpBackend.expect('GET', '/skill_editor_handler/rights/0')
      .respond(500);
    SkillRightsBackendApiService.fetchSkillRights('0').then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  });

  it('should successfully fetch a skill dict from backend if it\'s not' +
    'cached', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');
    var sampleResults = {
      skill_id: '0',
      can_edit_skill_description: ''
    };

    $httpBackend.expect('GET', '/skill_editor_handler/rights/0')
      .respond(sampleResults);
    SkillRightsBackendApiService.loadSkillRights('0').then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(sampleResults);
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should report a cached skill rights after caching it', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    // The skill should not currently be cached.
    expect(SkillRightsBackendApiService.isCached('0')).toBe(false);
    // Cache a skill.
    SkillRightsBackendApiService.cacheSkillRights('0', {
      skill_id: '0',
      can_edit_skill: true
    });

    // It should now be cached.
    expect(SkillRightsBackendApiService.isCached('0')).toBe(true);

    // A new skill should not have been fetched from the backend. Also,
    // the returned skill should match the expected skill object.
    SkillRightsBackendApiService.loadSkillRights('0').then(
      successHandler, failHandler);
    $rootScope.$digest();

    expect(successHandler).toHaveBeenCalledWith({
      skill_id: '0',
      can_edit_skill: true
    });
    expect(failHandler).not.toHaveBeenCalled();
  });
});
