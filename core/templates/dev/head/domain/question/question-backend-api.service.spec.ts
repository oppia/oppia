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
 * @fileoverview Unit tests for QuestionBackendApiService.
 */

require('domain/question/question-backend-api.service.ts');
// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Question backend Api service', function() {
  var QuestionBackendApiService = null;
  var sampleDataResults = null;
  var sampleResponse = null;
  var $httpBackend = null;
  var $rootScope = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(
    angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector) {
    QuestionBackendApiService = $injector.get(
      'QuestionBackendApiService');
    $httpBackend = $injector.get('$httpBackend');
    $rootScope = $injector.get('$rootScope');

    // Sample question object returnable from the backend
    sampleDataResults = {
      question_dicts: [{
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
            hints: [{
              hint_content: {
                html: 'Hint 1'
              }
            }],
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
          solicit_answer_details: false
        },
        language_code: 'en',
        version: 1
      }]
    };

    sampleResponse = {
      question_summary_dicts: [{
        skill_descriptions: [],
        summary: {
          creator_id: '1',
          created_on_msec: 0,
          last_updated_msec: 0,
          id: '0',
          question_content: ''
        }
      }],
      next_start_cursor: null
    };
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch questions from the backend', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    var questionPlayerHandlerUrl =
      '/question_player_handler?skill_ids=1&question_count=1' +
      '&fetch_by_difficulty=true';
    $httpBackend.expect('GET', questionPlayerHandlerUrl).respond(
      sampleDataResults);
    QuestionBackendApiService.fetchQuestions(
      ['1'], 1, true).then(successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(
      sampleDataResults.question_dicts);
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should successfully fetch questions from the backend when' +
      'sortedByDifficulty is false', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    var questionPlayerHandlerUrl =
      '/question_player_handler?skill_ids=1&question_count=1' +
      '&fetch_by_difficulty=false';
    $httpBackend.expect('GET', questionPlayerHandlerUrl).respond(
      sampleDataResults);
    QuestionBackendApiService.fetchQuestions(
      ['1'], 1, false).then(successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(
      sampleDataResults.question_dicts);
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should use the fail handler if the backend request failed', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    var questionPlayerHandlerUrl =
      '/question_player_handler?skill_ids=1&question_count=1' +
      '&fetch_by_difficulty=true';
    $httpBackend.expect('GET', questionPlayerHandlerUrl).respond(
      500, 'Error loading questions.');
    QuestionBackendApiService.fetchQuestions(
      ['1'], 1, true).then(successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Error loading questions.');
  });

  it('should use the fail handler if question count is in invalid format',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      QuestionBackendApiService.fetchQuestions(
        ['1'], 'abc', true).then(successHandler, failHandler);
      $rootScope.$digest();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Question count has to be a ' +
        'positive integer');
    }
  );

  it('should use the fail handler if question count is negative',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      QuestionBackendApiService.fetchQuestions(
        ['1'], -1, true).then(successHandler, failHandler);
      $rootScope.$digest();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Question count has to be a ' +
        'positive integer');
    }
  );

  it('should use the fail handler if question count is not an integer',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      QuestionBackendApiService.fetchQuestions(
        ['1'], 1.5, true).then(successHandler, failHandler);
      $rootScope.$digest();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Question count has to be a ' +
        'positive integer');
    }
  );

  it('should use the fail handler if skill ids is not a list',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      QuestionBackendApiService.fetchQuestions(
        'x', 1, true).then(successHandler, failHandler);
      $rootScope.$digest();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Skill ids should be a list of' +
      ' strings');
    }
  );

  it('should use the fail handler if skill ids is not a list of strings',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      QuestionBackendApiService.fetchQuestions(
        [1, 2], 1, true).then(successHandler, failHandler);
      $rootScope.$digest();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Skill ids should be a list of' +
      ' strings');
    }
  );

  it('should use the fail handler if skill ids is sent as null',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      QuestionBackendApiService.fetchQuestions(
        null, 1, true).then(successHandler, failHandler);
      $rootScope.$digest();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Skill ids should be a list of' +
      ' strings');
    }
  );

  it('should use the fail handler if question count is sent as null',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      QuestionBackendApiService.fetchQuestions(
        ['1'], null, true).then(successHandler, failHandler);
      $rootScope.$digest();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Question count has to be a ' +
        'positive integer');
    }
  );

  it('should successfully fetch questions for editors from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect(
        'GET', '/questions_list_handler/1?cursor=').respond(
        sampleResponse);
      QuestionBackendApiService.fetchQuestionSummaries(
        ['1']).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith({
        questionSummaries: sampleResponse.question_summary_dicts,
        nextCursor: null
      });
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should use the rejection handler if the backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect(
        'GET', '/questions_list_handler/1?cursor=').respond(
        500, 'Error loading questions.');
      QuestionBackendApiService.fetchQuestionSummaries(
        ['1']).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading questions.');
    }
  );

  it('should successfully fetch questions from the backend with cursor',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect(
        'GET', '/questions_list_handler/1?cursor=1').respond(
        sampleResponse);

      QuestionBackendApiService.fetchQuestionSummaries(
        ['1'], '1').then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith({
        questionSummaries: sampleResponse.question_summary_dicts,
        nextCursor: null
      });
      expect(failHandler).not.toHaveBeenCalled();
    });
});
