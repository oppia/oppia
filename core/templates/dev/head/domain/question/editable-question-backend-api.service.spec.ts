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
 * @fileoverview Unit tests for EditableQuestionBackendApiService.
 */

require('domain/question/QuestionObjectFactory');
require('domain/question/editable-question-backend-api.service.ts');
require('services/csrf-token.service.ts');

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

import { TranslatorProviderForTests } from 'tests/test.extras';

describe('Editable question backend API service', function() {
  var EditableQuestionBackendApiService = null;
  var QuestionObjectFactory;
  var sampleDataResults = null;
  var $rootScope = null;
  var $scope = null;
  var $httpBackend = null;
  var CsrfService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module(
    'oppia', TranslatorProviderForTests));

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $q) {
    EditableQuestionBackendApiService = $injector.get(
      'EditableQuestionBackendApiService');
    QuestionObjectFactory = $injector.get('QuestionObjectFactory');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');
    CsrfService = $injector.get('CsrfTokenService');

    spyOn(CsrfService, 'getTokenAsync').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve('sample-csrf-token');
      return deferred.promise;
    });

    // Sample question object returnable from the backend
    sampleDataResults = {
      question_dict: {
        id: '0',
        question_state_data: {
          content: {
            html: 'Question 1'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {}
          },
          interaction: {
            answer_groups: [],
            confirmed_unclassified_answers: [],
            customization_args: {},
            default_outcome: {
              dest: null,
              feedback: {
                html: 'Correct Answer'
              },
              param_changes: [],
              labelled_as_correct: true
            },
            hints: [
              {
                hint_content: {
                  html: 'Hint 1'
                }
              }
            ],
            solution: {
              correct_answer: 'This is the correct answer',
              answer_is_exclusive: false,
              explanation: {
                html: 'Solution explanation'
              }
            },
            id: 'TextInput'
          },
          param_changes: [],
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {}
          },
        },
        language_code: 'en',
        version: 1
      },
      associated_skill_dicts: []
    };
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully create a new question', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    var skillsId = ['0', '01', '02'];
    var skillDifficulties = [1, 1, 2];
    var questionDict = QuestionObjectFactory.createFromBackendDict(
      sampleDataResults.question_dict);

    $httpBackend.expectPOST('/question_editor_handler/create_new').respond(
      200, {question_id: '0'});
    EditableQuestionBackendApiService.createQuestion(
      skillsId, skillDifficulties, questionDict).then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith('0');
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should use the rejection handler when create question fails',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      var skillsId = ['0', '01', '02'];
      var skillDifficulties = [1, 1, 2];
      var questionDict = QuestionObjectFactory.createFromBackendDict(
        sampleDataResults.question_dict);

      $httpBackend.expectPOST('/question_editor_handler/create_new').respond(
        500, 'Error creating a new question.');
      EditableQuestionBackendApiService.createQuestion(
        skillsId, skillDifficulties, questionDict).then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Error creating a new question.');
    });

  it('should successfully fetch an existing question from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/question_editor_handler/data/0').respond(
        sampleDataResults);
      EditableQuestionBackendApiService.fetchQuestion('0').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(
        sampleDataResults);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should use the rejection handler if the backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/question_editor_handler/data/1').respond(
        500, 'Error loading question 1.');
      EditableQuestionBackendApiService.fetchQuestion('1').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading question 1.');
    }
  );

  it('should update a question after fetching it from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      var question = null;

      // Loading a question the first time should fetch it from the backend.
      $httpBackend.expect('GET', '/question_editor_handler/data/0').respond(
        sampleDataResults);

      EditableQuestionBackendApiService.fetchQuestion('0').then(
        function(data) {
          question = data.question_dict;
        });
      $httpBackend.flush();
      question.question_state_data.content.html = 'New Question Content';
      question.version = '2';
      var questionWrapper = {
        question_dict: question
      };

      $httpBackend.expect('PUT', '/question_editor_handler/data/0').respond(
        questionWrapper);

      // Send a request to update question
      EditableQuestionBackendApiService.updateQuestion(
        question.id, question.version, 'Question Data is updated', []
      ).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(question);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should use the rejection handler if the question to update ' +
     'doesn\'t exist', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    // Loading a question the first time should fetch it from the backend.
    $httpBackend.expect('PUT', '/question_editor_handler/data/1').respond(
      404, 'Question with given id doesn\'t exist.');

    EditableQuestionBackendApiService.updateQuestion(
      '1', '1', 'Update an invalid question.', []
    ).then(successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Question with given id doesn\'t exist.');
  });

  it('should edit an existing question', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    var questionId = '0';
    var skillIdsTaskArray = ['1', '2', 1];
    var difficulty = 1;

    $httpBackend.expectPUT('/manage_question_skill_link/' + questionId)
      .respond(200);
    EditableQuestionBackendApiService.editQuestionSkillLinks(
      questionId, skillIdsTaskArray, difficulty).then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should use the rejection handler when editing an existing' +
    ' question fails', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    var questionId = '0';
    var skillIdsTaskArray = ['1', '2', 1];
    var difficulty = 1;

    $httpBackend.expectPUT('/manage_question_skill_link/' + questionId)
      .respond(500, 'Error loading question 0.');
    EditableQuestionBackendApiService.editQuestionSkillLinks(
      questionId, skillIdsTaskArray, difficulty).then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Error loading question 0.');
  });

  it('should change difficulty from an existing question', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    var questionId = '0';
    var skillId = '1';
    var difficulty = 1;

    $httpBackend.expectPUT('/manage_question_skill_link/' + questionId)
      .respond(200);
    EditableQuestionBackendApiService.changeDifficulty(
      questionId, skillId, difficulty).then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should use the rejection handler when changing the difficulty of ' +
    'an existing question fails', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    var questionId = '0';
    var skillId = '1';
    var difficulty = 1;

    $httpBackend.expectPUT('/manage_question_skill_link/' + questionId)
      .respond(500, 'Error changing difficulty.');
    EditableQuestionBackendApiService.changeDifficulty(
      questionId, skillId, difficulty).then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Error changing difficulty.');
  });
});
