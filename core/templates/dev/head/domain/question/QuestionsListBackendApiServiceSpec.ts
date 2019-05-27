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
 * @fileoverview Unit tests for QuestionsListBackendApiService.
 */

require('domain/question/QuestionsListBackendApiService.ts');

describe('Question list backend API service', function() {
  var QuestionsListBackendApiService = null;
  var sampleResponse = null;
  var $httpBackend = null;
  
  beforeEach(angular.mock.module('oppia'));
  
  beforeEach(angular.mock.inject(function($injector) {
    QuestionsListBackendApiService = $injector.get(
      'QuestionsListBackendApiService');
    $httpBackend = $injector.get('$httpBackend');

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

  it('should successfully fetch questions in topic editors from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect(
        'GET', '/questions_list_handler/topic/1?cursor=').respond(
          sampleResponse);
      QuestionsListBackendApiService.fetchQuestions(
      'topic', '1').then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith({
        questionSummaries: sampleResponse.question_summary_dicts,
        nextCursor: null
      });
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should successfully fetch questions in skill editors from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect(
        'GET', '/questions_list_handler/skill/1?cursor=').respond(
          sampleResponse);
      QuestionsListBackendApiService.fetchQuestions(
      'skill', '1').then(successHandler, failHandler);
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
        'GET', '/questions_list_handler/topic/1?cursor=').respond(
        500, 'Error loading questions.');
        QuestionsListBackendApiService.fetchQuestions(
        'topic', '1').then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading questions.');
    }
  );
});
