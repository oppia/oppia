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
 * @fileoverview Unit tests for contribution and review service
 */

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ContributionAndReviewService } from './contribution-and-review.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ContributionAndReviewBackendApiService }
  from './contribution-and-review-backend-api.service';
import { SuggestionBackendDict } from 'domain/suggestion/suggestion.model';

describe('Contribution and review service', () => {
  let cars: ContributionAndReviewService;
  let carbas: ContributionAndReviewBackendApiService;

  const suggestion1 = {
    suggestion_id: 'suggestion_id_1',
    target_id: 'skill_id_1',
  } as SuggestionBackendDict;

  const opportunityDict1 = {
    skill_id: 'skill_id_1',
    skill_description: 'skill_description_1',
  };

  const suggestionsBackendObject = {
    suggestions: [
      suggestion1
    ],
    target_id_to_opportunity_dict: {
      skill_id_1: opportunityDict1,
    },
  };

  const expectedSuggestionDict = {
    suggestion: suggestion1,
    details: suggestionsBackendObject
      .target_id_to_opportunity_dict.skill_id_1
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UrlInterpolationService,
        ContributionAndReviewBackendApiService
      ]
    });
    cars = TestBed.inject(ContributionAndReviewService);
    carbas = TestBed.inject(ContributionAndReviewBackendApiService);
  });

  describe('getUserCreatedQuestionSuggestionsAsync', () => {
    it('should return available question suggestions and opportunity details',
      () => {
        spyOn(carbas, 'fetchSuggestionsAsync').and.returnValue(
          Promise.resolve(suggestionsBackendObject));

        cars.getUserCreatedQuestionSuggestionsAsync()
          .then((suggestionIdToSuggestions) => {
            expect(suggestionIdToSuggestions.suggestion_id_1)
              .toEqual(expectedSuggestionDict);
          });

        expect(carbas.fetchSuggestionsAsync).toHaveBeenCalled();
      });
  });

  describe('getReviewableQuestionSuggestionsAsync', () => {
    it('should return available question suggestions and opportunity details',
      () => {
        spyOn(carbas, 'fetchSuggestionsAsync').and.returnValue(
          Promise.resolve(suggestionsBackendObject));

        cars.getReviewableQuestionSuggestionsAsync()
          .then((suggestionIdToSuggestions) => {
            expect(suggestionIdToSuggestions.suggestion_id_1)
              .toEqual(expectedSuggestionDict);
          });

        expect(carbas.fetchSuggestionsAsync).toHaveBeenCalled();
      });
  });

  describe('getUserCreatedTranslationSuggestionsAsync', () => {
    it('should return translation suggestions and opportunity details',
      () => {
        spyOn(carbas, 'fetchSuggestionsAsync').and.returnValue(
          Promise.resolve(suggestionsBackendObject));

        cars.getUserCreatedTranslationSuggestionsAsync()
          .then((suggestionIdToSuggestions) => {
            expect(suggestionIdToSuggestions.suggestion_id_1)
              .toEqual(expectedSuggestionDict);
          });

        expect(carbas.fetchSuggestionsAsync).toHaveBeenCalled();
      });
  });

  describe('getReviewableTranslationSuggestionsAsync', () => {
    it('should return translation suggestions and opportunity details',
      () => {
        spyOn(carbas, 'fetchSuggestionsAsync').and.returnValue(
          Promise.resolve(suggestionsBackendObject));

        cars.getReviewableTranslationSuggestionsAsync()
          .then((suggestionIdToSuggestions) => {
            expect(suggestionIdToSuggestions.suggestion_id_1)
              .toEqual(expectedSuggestionDict);
          });

        expect(carbas.fetchSuggestionsAsync).toHaveBeenCalled();
      });
  });

  describe('reviewExplorationSuggestion', () => {
    const requestBody = {
      action: 'accept',
      review_message: 'review message',
      commit_message: 'commit message'
    };

    let onSuccess: jasmine.Spy<(suggestionId: string) => void>;
    let onFailure: jasmine.Spy<(error: unknown) => void>;

    beforeEach(() => {
      onSuccess = jasmine.createSpy(
        'onSuccess', (suggestionId: string) => {});
      onFailure = jasmine.createSpy('onFailure', (error) => {});
    });

    it('should call onSuccess function on' +
    'resolving suggestion to exploration correctly', fakeAsync(() => {
      spyOn(carbas, 'reviewExplorationSuggestionAsync')
        .and.returnValue(Promise.resolve());

      cars.reviewExplorationSuggestion(
        'abc', 'pqr', 'accept', 'review message', 'commit message',
        onSuccess, onFailure
      );
      tick();

      expect(carbas.reviewExplorationSuggestionAsync).toHaveBeenCalledWith(
        'abc', 'pqr', requestBody);
      expect(onSuccess).toHaveBeenCalledWith('pqr');
      expect(onFailure).not.toHaveBeenCalled();
    }));

    it('should call onFailure function when' +
    'resolving suggestion to exploration fails', fakeAsync(() => {
      spyOn(carbas, 'reviewExplorationSuggestionAsync').and
        .returnValue(Promise.reject());

      cars.reviewExplorationSuggestion(
        'abc', 'pqr', 'accept', 'review message', 'commit message',
        onSuccess, onFailure
      );
      tick();

      expect(carbas.reviewExplorationSuggestionAsync).toHaveBeenCalledWith(
        'abc', 'pqr', requestBody);
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onFailure).toHaveBeenCalled();
    }));
  });

  describe('reviewSkillSuggestion', () => {
    const requestBody = {
      action: 'accept',
      review_message: 'review message',
      skill_difficulty: 'easy'
    };

    let onSuccess: jasmine.Spy<(suggestionId: string) => void>;
    let onFailure: jasmine.Spy<() => void>;

    beforeEach(() => {
      onSuccess = jasmine.createSpy(
        'onSuccess', (suggestionId: string) => {});
      onFailure = jasmine.createSpy('onFailure', () => {});
    });

    it('should call onSuccess function on' +
    'resolving suggestion to skill correctly', fakeAsync(() => {
      spyOn(
        carbas, 'reviewSkillSuggestionAsync'
      ).and.returnValue(Promise.resolve());

      cars.reviewSkillSuggestion(
        'abc', 'pqr', 'accept', 'review message', 'easy', onSuccess, onFailure);
      tick();

      expect(carbas.reviewSkillSuggestionAsync)
        .toHaveBeenCalledWith('abc', 'pqr', requestBody);
      expect(onSuccess).toHaveBeenCalledWith('pqr');
      expect(onFailure).not.toHaveBeenCalled();
    }));

    it('should call onFailure function when' +
    'resolving suggestion to skill fails', fakeAsync(() => {
      spyOn(
        carbas, 'reviewSkillSuggestionAsync'
      ).and.returnValue(Promise.reject());

      cars.reviewSkillSuggestion(
        'abc', 'pqr', 'accept', 'review message', 'easy', onSuccess, onFailure);
      tick();

      expect(carbas.reviewSkillSuggestionAsync)
        .toHaveBeenCalledWith('abc', 'pqr', requestBody);
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onFailure).toHaveBeenCalled();
    }));
  });

  describe('updateTranslationSuggestionAsync', () => {
    const requestBody = {
      translation_html: '<p>In English</p>'
    };

    let onSuccess: jasmine.Spy<() => void>;
    let onFailure: jasmine.Spy<(error: unknown) => void>;

    beforeEach(() => {
      onSuccess = jasmine.createSpy(
        'onSuccess', () => {});
      onFailure = jasmine.createSpy('onFailure', (error) => {});
    });

    it('should call onSuccess function when' +
    'updateTranslationSuggestionAsync succeeds', fakeAsync(() => {
      spyOn(carbas, 'updateTranslationSuggestionAsync').and
        .returnValue(Promise.resolve());

      cars.updateTranslationSuggestionAsync(
        'pqr', '<p>In English</p>', onSuccess, onFailure);
      tick();

      expect(carbas.updateTranslationSuggestionAsync)
        .toHaveBeenCalledWith('pqr', requestBody);
      expect(onSuccess).toHaveBeenCalled();
      expect(onFailure).not.toHaveBeenCalled();
    }));

    it('should call onFailure function when' +
    'updateTranslationSuggestionAsync fails', fakeAsync(() => {
      spyOn(carbas, 'updateTranslationSuggestionAsync').and
        .returnValue(Promise.reject());

      cars.updateTranslationSuggestionAsync(
        'pqr', '<p>In English</p>', onSuccess, onFailure);
      tick();

      expect(carbas.updateTranslationSuggestionAsync)
        .toHaveBeenCalledWith('pqr', requestBody);
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onFailure).toHaveBeenCalled();
    }));
  });

  describe('updateQuestionSuggestionAsync', () => {
    const questionStateData = {
      classifier_model_id: null,
      content: {
        content_id: 'content',
        html: ''
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {}
        }
      },
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          placeholder: {
            value: {
              content_id: 'ca_placeholder_0',
              unicode_str: ''
            }
          },
          rows: { value: 1 }
        },
        default_outcome: {
          dest: 'new state',
          feedback: {
            content_id: 'default_outcome',
            html: ''
          },
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        },
        hints: [],
        solution: {
          answer_is_exclusive: false,
          correct_answer: 'answer',
          explanation: {
            content_id: 'solution',
            html: '<p>This is an explanation.</p>'
          }
        },
        id: 'TextInput'
      },
      linked_skill_id: null,
      next_content_id_index: 0,
      param_changes: [],
      solicit_answer_details: false,
      card_is_checkpoint: false,
      written_translations: {
        translations_mapping: {
          content: {},
          default_outcome: {}
        }
      }
    };

    const payload = {
      skill_difficulty: 'easy',
      question_state_data: questionStateData
    };

    const imagesData = [{
      filename: 'image1.png',
      imageBlob: new Blob()
    }];

    const requestBody = new FormData();
    requestBody.append('payload', JSON.stringify(payload));
    imagesData.forEach(obj => {
      if (obj.imageBlob !== null) {
        requestBody.append(obj.filename, obj.imageBlob);
      }
    });

    let onSuccess: jasmine.Spy<(suggestionId: string) => void>;
    let onFailure: jasmine.Spy<(suggestionId: string) => void>;

    beforeEach(() => {
      onSuccess = jasmine.createSpy(
        'onSuccess', (suggestionId: string) => {});
      onFailure = jasmine.createSpy(
        'onFailure', (suggestionId: string) => {});
    });

    it('should call onSuccess function when' +
    'updateQuestionSuggestionAsync succeeds', fakeAsync(() =>{
      spyOn(carbas, 'updateQuestionSuggestionAsync').and
        .returnValue(Promise.resolve());

      cars.updateQuestionSuggestionAsync(
        'pqr', 'easy', questionStateData,
        imagesData, onSuccess, onFailure);
      tick();

      expect(carbas.updateQuestionSuggestionAsync)
        .toHaveBeenCalledWith('pqr', requestBody);
      expect(onSuccess).toHaveBeenCalledWith('pqr');
      expect(onFailure).not.toHaveBeenCalled();
    }));

    it('should call onFailure function when' +
    'updateQuestionSuggestionAsync fails', fakeAsync(() =>{
      spyOn(carbas, 'updateQuestionSuggestionAsync').and
        .returnValue(Promise.reject());

      cars.updateQuestionSuggestionAsync(
        'pqr', 'easy', questionStateData,
        imagesData, onSuccess, onFailure);
      tick();

      expect(carbas.updateQuestionSuggestionAsync)
        .toHaveBeenCalledWith('pqr', requestBody);
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onFailure).toHaveBeenCalledWith('pqr');
    }));
  });
});
