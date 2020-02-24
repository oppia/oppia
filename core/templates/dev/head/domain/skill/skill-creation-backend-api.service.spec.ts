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
 * @fileoverview Unit test for SkillCreationBackendApiService.
 */

import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController }
  from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { CsrfTokenService } from 'services/csrf-token.service';
import { SkillCreationBackendApiService } from
  'domain/skill/skill-creation-backend-api.service.ts';

fdescribe('Topic creation backend api service', () => {
  let csrfService: CsrfTokenService = null;
  let httpTestingController: HttpTestingController = null;
  let skillCreationBackendApiService:SkillCreationBackendApiService = null;
  let rubricDict = null;
  let postData = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    csrfService = TestBed.get(CsrfTokenService);
    httpTestingController = TestBed.get(HttpTestingController);
    skillCreationBackendApiService = TestBed.get(
      SkillCreationBackendApiService);
    spyOn(csrfService, 'getTokenAsync').and.callFake(() => {
      return new Promise((resolve) => {
        resolve('sample-csrf-token');
      });
    });
    rubricDict = {
      explanation: 'test-explanation',
      difficulty:'test-difficulty'
    }
    postData = {
      description: 'test-description',
      linked_topic_ids: ['test_id'],
      explanation_dict: 'test_dictionary',
      rubrics: rubricDict
    };
  });

  afterEach(()=> {
    httpTestingController.verify();
  });

  it('should successfully create a new skill and obtain the skill ID',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      skillCreationBackendApiService.createSkill(
        'test-description', rubricDict, 'test_dictionary', ['test_id_11']).then(
        successHandler);
      let req = httpTestingController.expectOne(
        '/skill_editor_handler/create_new');
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual(postData);
      req.flush(postData);
      flushMicrotasks();
      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it('should fail to create a new skill and call the fail handler',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      skillCreationBackendApiService.createSkill(
        'test-description', rubricDict, 'test_dictionary', ['test_id_11']).then(
        successHandler);
      const errorResponse = new HttpErrorResponse({
        error: 'test 404 error',
        status: 404,
        statusText: 'Not Found'
      });
      let req = httpTestingController.expectOne(
        '/skill_editor_handler/create_new');
      req.error(new ErrorEvent('Error'), errorResponse);
      flushMicrotasks();
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual(postData);
      expect(failHandler).toHaveBeenCalled();
      expect(successHandler).not.toHaveBeenCalled();
    }));
});
// require('domain/skill/skill-creation-backend-api.service.ts');
// require('services/csrf-token.service.ts');
// import { UpgradedServices } from 'services/UpgradedServices';

// describe('Skill Creation backend api service', function() {
//   var SkillCreationBackendApiService = null;
//   var $httpBackend = null;
//   var rubricDict = null;
//   var CsrfService = null;

//   beforeEach(angular.mock.module('oppia'));

//   beforeEach(angular.mock.module('oppia', function($provide) {
//     var ugs = new UpgradedServices();
//     for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
//       $provide.value(key, value);
//     }
//   }));

//   beforeEach(angular.mock.inject(function($injector, $q) {
//     SkillCreationBackendApiService = $injector.get(
//       'SkillCreationBackendApiService');
//     $httpBackend = $injector.get('$httpBackend');
//     CsrfService = $injector.get('CsrfTokenService');

//     spyOn(CsrfService, 'getTokenAsync').and.callFake(function() {
//       var deferred = $q.defer();
//       deferred.resolve('sample-csrf-token');
//       return deferred.promise;
//     });

//     rubricDict = {
//       difficulty: 'Easy',
//       explanation: 'test explanation'
//     };
//   }));

//   afterEach(function() {
//     $httpBackend.verifyNoOutstandingExpectation();
//     $httpBackend.verifyNoOutstandingRequest();
//   });

//   it('should successfully create a new skill and obtain the skill ID',
//     () => {
//       var successHandler = jasmine.createSpy('success');
//       var failHandler = jasmine.createSpy('fail');

//       $httpBackend.expectPOST('/skill_editor_handler/create_new').respond(
//         200, {skill_id: 'hyuy4GUlvTqJ'});
//       SkillCreationBackendApiService.createSkill(
//         'test_des_1', rubricDict, 'explaination', ['test_id_11']).then(
//         successHandler, failHandler);
//       $httpBackend.flush();
//       expect(successHandler).toHaveBeenCalledWith({skill_id: 'hyuy4GUlvTqJ'});
//       expect(failHandler).not.toHaveBeenCalled();
//     });

//   it('should fail to create a new skill and call the fail handler',
//     () => {
//       var successHandler = jasmine.createSpy('success');
//       var failHandler = jasmine.createSpy('fail');

//       $httpBackend.expectPOST('/skill_editor_handler/create_new').respond(
//         500, 'Error creating a new skill.');
//       SkillCreationBackendApiService.createSkill(
//         'test_des_1', rubricDict, 'explaination', ['test_id_11']).then(
//         successHandler, failHandler);
//       $httpBackend.flush();
//       expect(successHandler).not.toHaveBeenCalled();
//       expect(failHandler).toHaveBeenCalledWith(
//         'Error creating a new skill.');
//     });
// });
