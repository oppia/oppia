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
 * @fileoverview Unit tests for EditableSkillBackendApiService.
 */

describe('Editable skill backend API service', function() {
  var EditableSkillBackendApiService = null;
  var UndoRedoService = null;
  var $httpBackend = null;
  var sampleResponse = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    EditableSkillBackendApiService = $injector.get(
      'EditableSkillBackendApiService');
    UndoRedoService = $injector.get('UndoRedoService');
    $httpBackend = $injector.get('$httpBackend');

    var misconceptionDict1 = {
      id: '2',
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback'
    };

    var misconceptionDict2 = {
      id: '4',
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback'
    };

    var skillContentsDict = {
      explanation: 'test explanation',
      worked_examples: ['test worked example 1', 'test worked example 2']
    };

    var skillDict = {
      id: '1',
      description: 'test description',
      misconceptions: [misconceptionDict1, misconceptionDict2],
      skill_contents: skillContentsDict,
      language_code: 'en',
      version: 3
    };

    sampleResponse = {
      skill: skillDict
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
      EditableSkillBackendApiService.fetchSkill('1').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(sampleResponse.skill);
      expect(failHandler).not.toHaveBeenCalled();
    });

  it('should use the rejection handler if backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/skill_editor_handler/data/1').respond(
        500, 'Error loading skill 1.');
      EditableSkillBackendApiService.fetchSkill('1').then(
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
      EditableSkillBackendApiService.fetchSkill('1').then(
        function(data) {
          skillDict = data;
        });
      $httpBackend.flush();

      $httpBackend.expect('PUT', '/skill_editor_handler/data/1')
        .respond({
          skill: skillDict
        });

      EditableSkillBackendApiService.updateSkill(
        skillDict.id, skillDict.version, 'commit message', []
      ).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(skillDict);
      expect(failHandler).not.toHaveBeenCalled();
    });
});
