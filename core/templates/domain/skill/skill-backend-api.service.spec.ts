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
 * @fileoverview Unit tests for SkillBackendApiService.
 */

require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/skill/skill-backend-api.service.ts');
require('services/csrf-token.service.ts');
// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.


describe('Skill backend API service', function() {
  var SkillBackendApiService = null;
  var UndoRedoService = null;
  var $httpBackend = null;
  var sampleResponse = null;
  var CsrfService = null;
  var sampleResponse2 = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $q) {
    SkillBackendApiService = $injector.get(
      'SkillBackendApiService');
    UndoRedoService = $injector.get('UndoRedoService');
    $httpBackend = $injector.get('$httpBackend');
    CsrfService = $injector.get('CsrfTokenService');

    spyOn(CsrfService, 'getTokenAsync').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve('sample-csrf-token');
      return deferred.promise;
    });

    var misconceptionDict1 = {
      id: '2',
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback',
      must_be_addressed: true
    };

    var misconceptionDict2 = {
      id: '4',
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback',
      must_be_addressed: true
    };

    var example1 = {
      question: {
        html: 'worked example question 1',
        content_id: 'worked_example_q_1'
      },
      answer: {
        html: 'worked example answer 1',
        content_id: 'worked_example_a_1'
      }
    };
    var example2 = {
      question: {
        html: 'worked example question 1',
        content_id: 'worked_example_q_1'
      },
      answer: {
        html: 'worked example answer 1',
        content_id: 'worked_example_a_1'
      }
    };

    var skillContentsDict = {
      explanation: 'test explanation',
      worked_examples: [example1, example2]
    };

    var skillDict = {
      id: '1',
      description: 'test description',
      misconceptions: [misconceptionDict1, misconceptionDict2],
      skill_contents: skillContentsDict,
      language_code: 'en',
      version: 3,
      prerequisite_skill_ids: []
    };

    var skillDict2 = {
      id: '2',
      description: 'test description 2',
      misconceptions: [misconceptionDict1],
      skill_contents: skillContentsDict,
      language_code: 'en',
      version: 2,
      prerequisite_skill_ids: []
    };

    sampleResponse = {
      skill: skillDict,
      grouped_skill_summaries: {}
    };

    sampleResponse2 = {
      skills: [skillDict, skillDict2]
    };
  }));


  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should succesfully fetch an existing skill from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/skill_editor_handler/data/1').respond(
        sampleResponse);
      SkillBackendApiService.fetchSkill('1').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith({
        skill: sampleResponse.skill,
        groupedSkillSummaries: sampleResponse.grouped_skill_summaries
      });
      expect(failHandler).not.toHaveBeenCalled();
    });

  it('should use the rejection handler if backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/skill_editor_handler/data/1').respond(
        500, 'Error loading skill 1.');
      SkillBackendApiService.fetchSkill('1').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading skill 1.');
    });

  it('should make a request to update the skill in the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/skill_editor_handler/data/1').respond(
        sampleResponse);

      var skillDict = null;
      SkillBackendApiService.fetchSkill('1').then(
        function(data) {
          skillDict = data.skill;
        });
      $httpBackend.flush();

      $httpBackend.expect('PUT', '/skill_editor_handler/data/1').respond({
        skill: skillDict
      });

      SkillBackendApiService.updateSkill(
        skillDict.id, skillDict.version, 'commit message', []
      ).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(skillDict);
      expect(failHandler).not.toHaveBeenCalled();
    });

  it('should use the rejection handler if the skill update in the backend' +
    'failed', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    $httpBackend.expect('GET', '/skill_editor_handler/data/1').respond(
      sampleResponse);
    var skillDict = null;
    SkillBackendApiService.fetchSkill('1').then(
      function(data) {
        skillDict = data.skill;
      });
    $httpBackend.flush();

    $httpBackend.expect('PUT', '/skill_editor_handler/data/1').respond(
      500, 'Error on update skill 1.');
    SkillBackendApiService.updateSkill(
      skillDict.id, skillDict.version, 'commit message', []
    ).then(successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Error on update skill 1.');
  });

  it('should succesfully fetch multiple existing skills from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      var skillDataUrl = '/skill_data_handler/' + encodeURIComponent('1,2');
      $httpBackend.expect('GET', skillDataUrl).respond(sampleResponse2);
      SkillBackendApiService.fetchMultiSkills(['1', '2']).then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(sampleResponse2.skills);
      expect(failHandler).not.toHaveBeenCalled();
    });

  it('should use the rejection handler if fetch multiple skills from the ' +
    'backend failed', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    var skillDataUrl = '/skill_data_handler/' + encodeURIComponent('1,2');
    $httpBackend.expect('GET', skillDataUrl).respond(
      500, 'Error on fetching skills 1 and 2.');
    SkillBackendApiService.fetchMultiSkills(['1', '2']).then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Error on fetching skills 1 and 2.');
  });

  it('should successfully delete a skill', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    $httpBackend.expect('DELETE', '/skill_editor_handler/data/1').respond(200);
    SkillBackendApiService.deleteSkill('1').then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(200);
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should use the rejection handler if delete a existing skill fails',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('DELETE', '/skill_editor_handler/data/1').respond(
        500, 'It is not possible to delete skill 1.');
      SkillBackendApiService.deleteSkill('1').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'It is not possible to delete skill 1.');
    }
  );
});
