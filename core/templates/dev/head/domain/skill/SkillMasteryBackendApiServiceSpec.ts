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
 * @fileoverview Unit tests for SkillMasteryBackendApiService.
 */

require('domain/skill/SkillMasteryBackendApiService.ts');

describe('Skill mastery backend API service', function() {
  var SkillMasteryBackendApiService = null;
  var $httpBackend = null;
  var CsrfService = null;
  var masteryPerSkillMapping = null;
  var sampleResponse = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector, $q) {
    SkillMasteryBackendApiService = $injector.get(
      'SkillMasteryBackendApiService');
    $httpBackend = $injector.get('$httpBackend');
    CsrfService = $injector.get('CsrfTokenService');

    spyOn(CsrfService, 'getTokenAsync').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve('sample-csrf-token');
      return deferred.promise;
    });

    var masteryPerSkillMapping = {
      skillId1: 0.3,
      skillId2: 0.5
    };

    sampleResponse = {
      degrees_of_mastery: masteryPerSkillMapping
    };
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should succesfully fetch the skill mastery degrees from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      var requestUrl = '/skill_mastery_handler/data' +
        '?comma_separated_skill_ids=skillId1,skillId2';

      $httpBackend.expect('GET', requestUrl).respond(
        sampleResponse);
      SkillMasteryBackendApiService.fetchSkillMasteryDegrees(
        ['skillId1', 'skillId2']).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(
        sampleResponse.degrees_of_mastery);
      expect(failHandler).not.toHaveBeenCalled();
    });

  it('should use the rejection handler if backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      var requestUrl = '/skill_mastery_handler/data' +
        '?comma_separated_skill_ids=skillId1,skillId2';

      $httpBackend.expect('GET', requestUrl).respond(
        500, 'Error fetching skill mastery.');
      SkillMasteryBackendApiService.fetchSkillMasteryDegrees(
        ['skillId1', 'skillId2']).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error fetching skill mastery.');
    });

  it('should succesfully update the skill mastery degrees in the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('PUT', '/skill_mastery_handler/data').respond();
      SkillMasteryBackendApiService.updateSkillMasteryDegrees(
        masteryPerSkillMapping).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    });

  it('should use the rejection handler if backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('PUT', '/skill_mastery_handler/data').respond(
        500, 'Error updating skill mastery.');
      SkillMasteryBackendApiService.updateSkillMasteryDegrees(
        masteryPerSkillMapping).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error updating skill mastery.');
    });
});
