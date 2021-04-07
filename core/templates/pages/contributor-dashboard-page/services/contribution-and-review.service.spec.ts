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
 * @fileoverview Tests that the contribution-and-review service is working as
 * expected.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// UserService.ts is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require(
  'pages/contributor-dashboard-page/services/' +
  'contribution-and-review.service.ts');

describe('ContributionAndReviewService', function() {
  var ContributionAndReviewService, $httpBackend;
  var suggestion1;
  var opportunityDict1;
  var mockSuggestionsBackendObject;
  var expectedSuggestionDict;
  var onSuccess;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (const [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector) {
    ContributionAndReviewService = $injector.get(
      'ContributionAndReviewService');
    $httpBackend = $injector.get('$httpBackend');

    suggestion1 = {
      suggestion_id: 'suggestion_id_1',
      target_id: 'skill_id_1',
    };
    opportunityDict1 = {
      skill_id: 'skill_id_1',
      skill_description: 'skill_description_1',
    };
    mockSuggestionsBackendObject = {
      suggestions: [
        suggestion1
      ],
      target_id_to_opportunity_dict: {
        skill_id_1: opportunityDict1,
      },
    };
    expectedSuggestionDict = {
      suggestion: suggestion1,
      details: opportunityDict1,
    };
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('getUserCreatedQuestionSuggestionsAsync', function() {
    it('should return available question suggestions and opportunity details',
      function() {
        $httpBackend.expect(
          'GET', '/getsubmittedsuggestions/skill/add_question').respond(
          200, mockSuggestionsBackendObject);

        ContributionAndReviewService.getUserCreatedQuestionSuggestionsAsync(
        ).then(function(suggestionIdToSuggestions) {
          expect(suggestionIdToSuggestions.suggestion_id_1).toEqual(
            expectedSuggestionDict);
        });
        $httpBackend.flush();
      });
  });

  describe('getReviewableQuestionSuggestionsAsync', function() {
    it('should return available question suggestions and opportunity details',
      function() {
        $httpBackend.expect(
          'GET', '/getreviewablesuggestions/skill/add_question').respond(
          200, mockSuggestionsBackendObject);

        ContributionAndReviewService.getReviewableQuestionSuggestionsAsync(
          onSuccess).then(function(suggestionIdToSuggestions) {
          expect(suggestionIdToSuggestions.suggestion_id_1).toEqual(
            expectedSuggestionDict);
        });
        $httpBackend.flush();
      });
  });
});
