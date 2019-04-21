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
 * @fileoverview Unit tests for QuestionPlayerBackendApiService.
 */
describe('Question Player backend Api service', function() {
  var QuestionPlayerBackendApiService = null;
  var sampleDataResults = null;
  var $httpBackend = null;
  var $rootScope = null;

  beforeEach(module('oppia'));
  beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(inject(function($injector) {
    QuestionPlayerBackendApiService = $injector.get(
      'QuestionPlayerBackendApiService');
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
          content_ids_to_audio_translations: {},
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
          param_changes: []
        },
        language_code: 'en',
        version: 1
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

    $httpBackend.expect(
      'GET', '/question_player_handler?skill_ids=1&question_count=1&' +
      'start_cursor=').respond(
      sampleDataResults);
    QuestionPlayerBackendApiService.fetchQuestions(
      ['1'], 1, true).then(successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(
      sampleDataResults.question_dicts);
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should successfully fetch questions from the backend with given cursor',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      var sampleDataResultsWithCursor = sampleDataResults;
      sampleDataResultsWithCursor.next_start_cursor = '1';

      $httpBackend.expect(
        'GET', '/question_player_handler?skill_ids=1&question_count=1&' +
        'start_cursor=').respond(
        sampleDataResultsWithCursor);
      QuestionPlayerBackendApiService.fetchQuestions(
        ['1'], 1, true).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(
        sampleDataResultsWithCursor.question_dicts);
      expect(failHandler).not.toHaveBeenCalled();

      $httpBackend.expect(
        'GET', '/question_player_handler?skill_ids=1&question_count=1&' +
        'start_cursor=1').respond(
        sampleDataResults);

      // Here we don't want to reset history, thus we pass false
      QuestionPlayerBackendApiService.fetchQuestions(
        ['1'], 1, false).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(
        sampleDataResults.question_dicts);
      expect(failHandler).not.toHaveBeenCalled();
    });

  it('should successfully fetch questions with no blank start cursor if ' +
  'resetHistory flag is set as true',
  function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    var sampleDataResultsWithCursor = sampleDataResults;
    sampleDataResultsWithCursor.next_start_cursor = '1';

    $httpBackend.expect(
      'GET', '/question_player_handler?skill_ids=1&question_count=1&' +
      'start_cursor=').respond(
      sampleDataResultsWithCursor);
    QuestionPlayerBackendApiService.fetchQuestions(
      ['1'], 1, true).then(successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(
      sampleDataResultsWithCursor.question_dicts);
    expect(failHandler).not.toHaveBeenCalled();

    $httpBackend.expect(
      'GET', '/question_player_handler?skill_ids=1&question_count=1&' +
      'start_cursor=').respond(
      sampleDataResults);

    // Here we want to reset history, thus we pass true
    QuestionPlayerBackendApiService.fetchQuestions(
      ['1'], 1, true).then(successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(
      sampleDataResults.question_dicts);
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should use the fail handler if the backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect(
        'GET', '/question_player_handler?skill_ids=1&question_count=1&' +
        'start_cursor=').respond(
        500, 'Error loading questions.');
      QuestionPlayerBackendApiService.fetchQuestions(
        ['1'], 1, true).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Error loading questions.');
    }
  );

  it('should use the fail handler if question count is in invalid format',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      QuestionPlayerBackendApiService.fetchQuestions(
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
      QuestionPlayerBackendApiService.fetchQuestions(
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
      QuestionPlayerBackendApiService.fetchQuestions(
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
      QuestionPlayerBackendApiService.fetchQuestions(
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
      QuestionPlayerBackendApiService.fetchQuestions(
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
      QuestionPlayerBackendApiService.fetchQuestions(
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
      QuestionPlayerBackendApiService.fetchQuestions(
        ['1'], null, true).then(successHandler, failHandler);
      $rootScope.$digest();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Question count has to be a ' +
        'positive integer');
    }
  );
});
