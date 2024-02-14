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

import { TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AppConstants } from 'app.constants';
import { ContributionAndReviewService, FetchSuggestionsResponse } from './contribution-and-review.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ContributionAndReviewBackendApiService }
  from './contribution-and-review-backend-api.service';
import { SuggestionBackendDict } from 'domain/suggestion/suggestion.model';
import { ReadOnlyExplorationBackendApiService }
  from 'domain/exploration/read-only-exploration-backend-api.service';
import { ExplorationObjectFactory, Exploration}
  from 'domain/exploration/ExplorationObjectFactory';
import { StateObjectsBackendDict } from 'domain/exploration/StatesObjectFactory';
import { StatesObjectFactory, States } from 'domain/exploration/StatesObjectFactory';
import { FetchExplorationBackendResponse } from '../../../domain/exploration/read-only-exploration-backend-api.service';
import { LoggerService } from 'services/contextual/logger.service';
import { ParamSpecs } from '../../../domain/exploration/ParamSpecsObjectFactory';

describe('Contribution and review service', () => {
  let cars: ContributionAndReviewService;
  let carbas: ContributionAndReviewBackendApiService;
  let fetchSuggestionsAsyncSpy: jasmine.Spy;
  let downloadContributorCertificateAsyncSpy: jasmine.Spy;
  let statesObjectFactory: StatesObjectFactory;
  let readOnlyExplorationBackendApiService:
    ReadOnlyExplorationBackendApiService;
  let urlInterpolationService: UrlInterpolationService;
  let loggerService: LoggerService;

  const suggestion1 = {
    suggestion_id: 'suggestion_id_1',
    target_id: 'skill_id_1',
  } as SuggestionBackendDict;
  const suggestion2 = {
    suggestion_id: 'suggestion_id_2',
    target_id: 'skill_id_2',
  } as SuggestionBackendDict;
  const suggestion3 = {
    suggestion_id: 'suggestion_id_3',
    target_id: 'skill_id_3',
  } as SuggestionBackendDict;

  const opportunityDict1 = {
    skill_id: 'skill_id_1',
    skill_description: 'skill_description_1',
  };
  const opportunityDict2 = {
    skill_id: 'skill_id_2',
    skill_description: 'skill_description_2',
  };
  const opportunityDict3 = {
    skill_id: 'skill_id_3',
    skill_description: 'skill_description_3',
  };

  const backendFetchResponse = {
    suggestions: [
      suggestion1
    ],
    target_id_to_opportunity_dict: {
      skill_id_1: opportunityDict1,
    },
    next_offset: 1
  };

  const multiplePageBackendFetchResponse = {
    suggestions: [
      suggestion1,
      suggestion2,
      suggestion3
    ],
    target_id_to_opportunity_dict: {
      skill_id_1: opportunityDict1,
      skill_id_2: opportunityDict2,
      skill_id_3: opportunityDict3
    },
    next_offset: 3
  };

  const expectedSuggestionDict = {
    suggestion: suggestion1,
    details: backendFetchResponse.target_id_to_opportunity_dict.skill_id_1
  };
  const expectedSuggestion2Dict = {
    suggestion: suggestion2,
    details: multiplePageBackendFetchResponse
      .target_id_to_opportunity_dict.skill_id_2
  };
  const expectedSuggestion3Dict = {
    suggestion: suggestion3,
    details: multiplePageBackendFetchResponse
      .target_id_to_opportunity_dict.skill_id_3
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UrlInterpolationService,
        ContributionAndReviewBackendApiService,
        ReadOnlyExplorationBackendApiService,
        ExplorationObjectFactory,
        StatesObjectFactory,
        LoggerService
      ]
    });
    cars = TestBed.inject(ContributionAndReviewService);
    carbas = TestBed.inject(ContributionAndReviewBackendApiService);
    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService);
    loggerService = TestBed.inject(LoggerService);
    urlInterpolationService = TestBed.inject(
      UrlInterpolationService);
    statesObjectFactory = TestBed.inject(StatesObjectFactory);
    fetchSuggestionsAsyncSpy = spyOn(carbas, 'fetchSuggestionsAsync');
    downloadContributorCertificateAsyncSpy = spyOn(
      carbas, 'downloadContributorCertificateAsync');
  });

  describe('getUserCreatedQuestionSuggestionsAsync', () => {
    const defaultOpportunitiesPageSize = AppConstants.OPPORTUNITIES_PAGE_SIZE;
    afterAll(() => {
      // This throws "Cannot assign to 'OPPORTUNITIES_PAGE_SIZE' because it
      // is a read-only property.". We need to suppress this error because
      // we need to change the value of 'OPPORTUNITIES_PAGE_SIZE' for testing
      // purposes.
      // @ts-expect-error
      AppConstants.OPPORTUNITIES_PAGE_SIZE = defaultOpportunitiesPageSize;
    });

    it('should return available question suggestions and opportunity details',
      () => {
        fetchSuggestionsAsyncSpy.and.returnValue(
          Promise.resolve(backendFetchResponse));

        cars.getUserCreatedQuestionSuggestionsAsync(true, 'sort_key')
          .then((response) => {
            expect(response.suggestionIdToDetails.suggestion_id_1)
              .toEqual(expectedSuggestionDict);
          });

        expect(fetchSuggestionsAsyncSpy).toHaveBeenCalled();
      });

    it('should fetch one page ahead and cache extra results', fakeAsync(() => {
      // This throws "Cannot assign to 'OPPORTUNITIES_PAGE_SIZE' because it
      // is a read-only property.". We need to suppress this error because
      // we need to change the value of 'OPPORTUNITIES_PAGE_SIZE' for testing
      // purposes.
      // @ts-expect-error
      AppConstants.OPPORTUNITIES_PAGE_SIZE = 2;

      // Return more than a page's worth of results (3 results for a page size
      // of 2).
      fetchSuggestionsAsyncSpy.and.returnValue(
        Promise.resolve(multiplePageBackendFetchResponse));

      // Only the first 2 results should be returned and the extra result
      // should be cached.
      cars.getUserCreatedQuestionSuggestionsAsync(true, 'sort_key')
        .then((response) => {
          expect(response.suggestionIdToDetails.suggestion_id_1)
            .toEqual(expectedSuggestionDict);
          expect(response.suggestionIdToDetails.suggestion_id_2)
            .toEqual(expectedSuggestion2Dict);
          expect(Object.keys(response.suggestionIdToDetails).length)
            .toEqual(2);
          expect(response.more).toBeTrue();
        });

      flushMicrotasks();

      const suggestion4 = {
        suggestion_id: 'suggestion_id_4',
        target_id: 'skill_id_4',
      } as SuggestionBackendDict;
      const opportunityDict4 = {
        skill_id: 'skill_id_4',
        skill_description: 'skill_description_4',
      };
      const suggestion4BackendFetchResponse = {
        suggestions: [
          suggestion4
        ],
        target_id_to_opportunity_dict: {
          skill_id_4: opportunityDict4,
        },
        next_offset: 4
      };
      const expectedSuggestion4Dict = {
        suggestion: suggestion4,
        details: suggestion4BackendFetchResponse
          .target_id_to_opportunity_dict.skill_id_4
      };

      // Return a 4th suggestion from the backend that was not available in the
      // first fetch.
      fetchSuggestionsAsyncSpy.and.returnValue(
        Promise.resolve(suggestion4BackendFetchResponse));

      // Return both the cached 3rd suggestion and the new 4th suggestion to the
      // caller.
      cars.getUserCreatedQuestionSuggestionsAsync(false, 'sort_key')
        .then((response) => {
          expect(response.suggestionIdToDetails.suggestion_id_3)
            .toEqual(expectedSuggestion3Dict);
          expect(response.suggestionIdToDetails.suggestion_id_4)
            .toEqual(expectedSuggestion4Dict);
          expect(Object.keys(response.suggestionIdToDetails).length)
            .toEqual(2);
          expect(response.more).toBeFalse();
        });
    }));

    it('should reset offset', fakeAsync(() => {
      // This throws "Cannot assign to 'OPPORTUNITIES_PAGE_SIZE' because it
      // is a read-only property.". We need to suppress this error because
      // we need to change the value of 'OPPORTUNITIES_PAGE_SIZE' for testing
      // purposes.
      // @ts-expect-error
      AppConstants.OPPORTUNITIES_PAGE_SIZE = 2;

      // Return more than a page's worth of results (3 results for a page size
      // of 2).
      fetchSuggestionsAsyncSpy.and.returnValue(
        Promise.resolve(multiplePageBackendFetchResponse));

      // Only the first 2 results should be returned and the extra result
      // should be cached.
      cars.getUserCreatedQuestionSuggestionsAsync(true, 'sort_key')
        .then((response) => {
          expect(response.suggestionIdToDetails.suggestion_id_1)
            .toEqual(expectedSuggestionDict);
          expect(response.suggestionIdToDetails.suggestion_id_2)
            .toEqual(expectedSuggestion2Dict);
          expect(Object.keys(response.suggestionIdToDetails).length)
            .toEqual(2);
          expect(response.more).toBeTrue();
        });

      flushMicrotasks();

      // Fetch again from offset 0.
      fetchSuggestionsAsyncSpy.and.returnValue(
        Promise.resolve(multiplePageBackendFetchResponse));

      // Return the first 2 results from offset 0 again.
      cars.getUserCreatedQuestionSuggestionsAsync(true, 'sort_key')
        .then((response) => {
          expect(response.suggestionIdToDetails.suggestion_id_1)
            .toEqual(expectedSuggestionDict);
          expect(response.suggestionIdToDetails.suggestion_id_2)
            .toEqual(expectedSuggestion2Dict);
          expect(Object.keys(response.suggestionIdToDetails).length)
            .toEqual(2);
          expect(response.more).toBeTrue();
        });
    }));
  });

  describe('downloadContributorCertificateAsync', () => {
    it('should download the contributor certificate',
      () => {
        downloadContributorCertificateAsyncSpy.and.returnValue(
          Promise.resolve({
            from_date: '1 Nov 2022',
            to_date: '1 Dec 2022',
            contribution_hours: 1.0,
            team_lead: 'Test User',
            language: 'Hindi'
          }));

        cars.downloadContributorCertificateAsync(
          'user', 'translate_content', 'hi', '2022-01-01', '2022-01-02'
        ).then((response) => {
          expect(response.from_date).toEqual('1 Nov 2022');
          expect(response.to_date).toEqual('1 Dec 2022');
          expect(response.contribution_hours).toEqual(1.0);
          expect(response.team_lead).toEqual('Test User');
          expect(response.language).toEqual('Hindi');
        });

        expect(downloadContributorCertificateAsyncSpy).toHaveBeenCalled();
      });
  });

  describe('getReviewableQuestionSuggestionsAsync', () => {
    it('should return available question suggestions and opportunity details',
      () => {
        fetchSuggestionsAsyncSpy.and.returnValue(
          Promise.resolve(backendFetchResponse));

        cars.getReviewableQuestionSuggestionsAsync(
          true,
          'sort_key',
          'topicName')
          .then((response) => {
            expect(response.suggestionIdToDetails.suggestion_id_1)
              .toEqual(expectedSuggestionDict);
          });

        expect(fetchSuggestionsAsyncSpy).toHaveBeenCalledWith(
          'REVIEWABLE_QUESTION_SUGGESTIONS',
          20,
          0,
          'sort_key',
          null,
          'topicName',
        );
      });
  });

  describe('getUserCreatedTranslationSuggestionsAsync', () => {
    it('should return translation suggestions and opportunity details',
      () => {
        fetchSuggestionsAsyncSpy.and.returnValue(
          Promise.resolve(backendFetchResponse));

        cars.getUserCreatedTranslationSuggestionsAsync(true, 'sort_key')
          .then((response) => {
            expect(response.suggestionIdToDetails.suggestion_id_1)
              .toEqual(expectedSuggestionDict);
          });

        expect(fetchSuggestionsAsyncSpy).toHaveBeenCalled();
      });
  });

  describe('getReviewableTranslationSuggestionsAsync', () => {
    let explorationObjectFactory: ExplorationObjectFactory;
    let explorationObjectFactorySpy: jasmine.Spy;
    let fetchExplorationSpy: jasmine.Spy;
    let mockSortTranslationSpy: jasmine.Spy;

    beforeEach(() => {
      explorationObjectFactory = TestBed.inject(ExplorationObjectFactory);
      explorationObjectFactorySpy = spyOn(
        explorationObjectFactory, 'createFromBackendDict');
      fetchExplorationSpy = spyOn(
        readOnlyExplorationBackendApiService, 'fetchExplorationAsync');
      mockSortTranslationSpy = spyOn(
        cars, 'sortTranslationSuggestionsByState');
    });
    it('should return translation suggestions and opportunity details',
      () => {
        fetchSuggestionsAsyncSpy.and.returnValue(
          Promise.resolve(backendFetchResponse));

        cars.getReviewableTranslationSuggestionsAsync(
          /* ShouldResetOffset= */ true, 'skill_id_1')
          .then((response) => {
            expect(response.suggestionIdToDetails.suggestion_id_1)
              .toEqual(expectedSuggestionDict);
          });

        expect(fetchSuggestionsAsyncSpy).toHaveBeenCalled();
      });

    it('should return translation suggestions for given ' +
    'exploration', async() => {
      fetchSuggestionsAsyncSpy.and.returnValue(
        Promise.resolve(backendFetchResponse));
      const fetchTranslationSuggestionsAsyncSpy = spyOn(
        cars, 'fetchTranslationSuggestionsAsync').and.returnValue(
        Promise.resolve({
          suggestionIdToDetails: {
            skill_id_1: {
              suggestions: suggestion1,
              details: opportunityDict1
            }
          },
          more: false
        } as unknown as FetchSuggestionsResponse));

      cars.getReviewableTranslationSuggestionsAsync(
        true, 'skill_id_1', '1')
        .then((response) => {
          expect(response.suggestionIdToDetails.skill_id_1)
            .toEqual({
              suggestions: suggestion1,
              details: opportunityDict1
            });
          expect(fetchTranslationSuggestionsAsyncSpy).toHaveBeenCalled();
        });
    });

    it('should correctly fetch translation suggestions and return ' +
    'the transformed result', async() => {
      const mockStates = {
        Introduction: {
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
              buttonText: {
                value: 'Continue'
              }
            },
            default_outcome: {
              dest: 'End State',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'default_outcome',
                html: ''
              },
              param_changes: [],
              labelled_as_correct: true,
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null
            },
            hints: [],
            solution: null,
            id: 'Continue'
          },
          linked_skill_id: null,
          param_changes: [],
          solicit_answer_details: false,
          card_is_checkpoint: true
        },
        'End State': {
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
              recommendedExplorationIds: {
                value: []
              }
            },
            default_outcome: null,
            hints: [],
            solution: null,
            id: 'EndExploration'
          },
          linked_skill_id: null,
          param_changes: [],
          solicit_answer_details: false,
          card_is_checkpoint: false
        }
      } as StateObjectsBackendDict;
      const states = statesObjectFactory.createFromBackendDict(
        mockStates);
      const mockReadOnlyExplorationData: FetchExplorationBackendResponse = {
        can_edit: true,
        exploration: {
          init_state_name: 'Introduction',
          param_changes: [],
          param_specs: {},
          states: mockStates,
          title: 'Dummy Title',
          language_code: 'en',
          objective: 'Dummy Objective',
          next_content_id_index: 4,
        },
        exploration_metadata: {
          title: 'Dummy Title',
          category: 'Dummy Category',
          objective: 'Dummy Objective',
          language_code: 'en',
          tags: [],
          blurb: 'Dummy Blurb',
          author_notes: 'Dummy Notes',
          states_schema_version: 0,
          init_state_name: 'Introduction',
          param_specs: {},
          param_changes: [],
          auto_tts_enabled: true,
          edits_allowed: true,
        },
        exploration_id: '1',
        is_logged_in: true,
        session_id: '0',
        version: 0,
        preferred_audio_language_code: 'en',
        preferred_language_codes: [],
        auto_tts_enabled: true,
        record_playthrough_probability: 1,
        draft_change_list_id: 1,
        has_viewed_lesson_info_modal_once: false,
        furthest_reached_checkpoint_exp_version: 0,
        furthest_reached_checkpoint_state_name: '',
        most_recently_reached_checkpoint_state_name: '',
        most_recently_reached_checkpoint_exp_version: 1,
        displayable_language_codes: ['en'],
      };
      const exploration: Exploration = new Exploration(
        mockReadOnlyExplorationData.exploration.init_state_name,
        [],
        {} as unknown as ParamSpecs,
        mockReadOnlyExplorationData.exploration.states as unknown as States,
        mockReadOnlyExplorationData.exploration.title,
        mockReadOnlyExplorationData.exploration.next_content_id_index,
        mockReadOnlyExplorationData.exploration.language_code,
        loggerService,
        urlInterpolationService
      );
      const getStatesSpy = spyOn(exploration, 'getStates');

      fetchExplorationSpy.and.returnValue(
        Promise.resolve(mockReadOnlyExplorationData));
      fetchSuggestionsAsyncSpy.and.returnValue(
        Promise.resolve(backendFetchResponse));
      explorationObjectFactorySpy.and.returnValue(
        exploration);
      mockSortTranslationSpy.and.returnValue([
        {
          suggestion_type: 'suggestion',
          suggestion_id: 'id',
          target_type: 'exploration',
          target_id: '1',
          status: 'review',
          author_name: 'author',
          change_cmd: {
            state_name: 'First State',
            content_id: 'content_1'
          },
          last_updated_msecs: 0,
        },
        {
          suggestion_type: 'suggestion',
          suggestion_id: 'id',
          target_type: 'exploration',
          target_id: '1',
          status: 'review',
          author_name: 'author',
          change_cmd: {
            state_name: 'First State',
            content_id: 'content_3'
          },
          last_updated_msecs: 0,
        },
        {
          suggestion_type: 'suggestion',
          suggestion_id: 'id',
          target_type: 'exploration',
          target_id: '1',
          status: 'review',
          author_name: 'author',
          change_cmd: {
            state_name: 'First State',
            content_id: 'feedback_2'
          },
          last_updated_msecs: 0,
        },
        {
          suggestion_type: 'suggestion',
          suggestion_id: 'id',
          target_type: 'exploration',
          target_id: '1',
          status: 'review',
          author_name: 'author',
          change_cmd: {
            state_name: 'End State',
            content_id: 'content_2'
          },
          last_updated_msecs: 0,
        },
        {
          suggestion_type: 'suggestion',
          suggestion_id: 'id',
          target_type: 'exploration',
          target_id: '1',
          status: 'review',
          author_name: 'author',
          change_cmd: {
            state_name: 'End State',
            content_id: 'interaction_1'
          },
          last_updated_msecs: 0,
        },
        {
          suggestion_type: 'suggestion',
          suggestion_id: 'id',
          target_type: 'exploration',
          target_id: '1',
          status: 'review',
          author_name: 'author',
          change_cmd: {
            state_name: 'End State',
            content_id: 'hints_1'
          },
          last_updated_msecs: 0,
        }
      ]);
      getStatesSpy.and.returnValue(states);

      await cars.fetchTranslationSuggestionsAsync(
        '1').then((response)=>{
        expect(response).toEqual({
          suggestionIdToDetails: {
            id: {
              suggestion: {
                suggestion_type: 'suggestion',
                suggestion_id: 'id',
                target_type: 'exploration',
                target_id: '1',
                status: 'review',
                author_name: 'author',
                change_cmd: {
                  state_name: 'End State',
                  content_id: 'hints_1',
                },
                last_updated_msecs: 0
              },
              details: undefined,
            },
          },
          more: false
        });
        expect(explorationObjectFactorySpy).toHaveBeenCalled();
        expect(getStatesSpy).toHaveBeenCalled();
        expect(fetchSuggestionsAsyncSpy).toHaveBeenCalled();
        expect(fetchExplorationSpy).toHaveBeenCalled();
      });
    });
  });

  describe('reviewExplorationSuggestion', () => {
    const requestBody = {
      action: 'accept',
      review_message: 'review message',
      commit_message: 'commit message'
    };

    let onSuccess: jasmine.Spy<(suggestionId: string) => void>;
    let onFailure: jasmine.Spy<(errorMessage: string) => void>;

    beforeEach(() => {
      onSuccess = jasmine.createSpy(
        'onSuccess', (suggestionId: string) => {});
      onFailure = jasmine.createSpy('onFailure', (errorMessage: string) => {});
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
        .returnValue(Promise.reject({
          error: {error: 'Backend error'}
        }));

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
          rows: { value: 1 },
          catchMisspellings: {
            value: false
          }
        },
        default_outcome: {
          dest: 'new state',
          dest_if_really_stuck: null,
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
      param_changes: [],
      solicit_answer_details: false,
      card_is_checkpoint: false,
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
        'pqr', 2, questionStateData, 10, imagesData, onSuccess, onFailure);
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
        'pqr', 2, questionStateData, 10, imagesData, onSuccess, onFailure);
      tick();

      expect(carbas.updateQuestionSuggestionAsync)
        .toHaveBeenCalledWith('pqr', requestBody);
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onFailure).toHaveBeenCalledWith('pqr');
    }));
  });

  describe('sortTranslationSuggestionsByState', () => {
    const translationSuggestions = [
      {
        suggestion_type: 'suggestion',
        suggestion_id: 'id',
        target_type: 'exploration',
        target_id: '1',
        status: 'review',
        author_name: 'author',
        change_cmd: {
          state_name: 'First State',
          content_id: 'feedback_2',
          new_value: {
            html: 'new_val'
          },
          old_value: {
            html: 'old_val'
          },
          skill_id: 'skill_id_1'
        },
        last_updated_msecs: 0,
      },
      {
        suggestion_type: 'suggestion',
        suggestion_id: 'id',
        target_type: 'exploration',
        target_id: '1',
        status: 'review',
        author_name: 'author',
        change_cmd: {
          state_name: 'End State',
          content_id: 'hints_1',
          new_value: {
            html: 'new_val'
          },
          old_value: {
            html: 'old_val'
          },
          skill_id: 'skill_id_1'
        },
        last_updated_msecs: 0,
      },
      {
        suggestion_type: 'suggestion',
        suggestion_id: 'id',
        target_type: 'exploration',
        target_id: '1',
        status: 'review',
        author_name: 'author',
        change_cmd: {
          state_name: 'First State',
          content_id: 'content_3',
          new_value: {
            html: 'new_val'
          },
          old_value: {
            html: 'old_val'
          },
          skill_id: 'skill_id_1'
        },
        last_updated_msecs: 0,
      },
      {
        suggestion_type: 'suggestion',
        suggestion_id: 'id',
        target_type: 'exploration',
        target_id: '1',
        status: 'review',
        author_name: 'author',
        change_cmd: {
          state_name: 'End State',
          content_id: 'interaction_1',
          new_value: {
            html: 'new_val'
          },
          old_value: {
            html: 'old_val'
          },
          skill_id: 'skill_id_1'
        },
        last_updated_msecs: 0,
      },
      {
        suggestion_type: 'suggestion',
        suggestion_id: 'id',
        target_type: 'exploration',
        target_id: '1',
        status: 'review',
        author_name: 'author',
        change_cmd: {
          state_name: 'First State',
          content_id: 'content_1',
          new_value: {
            html: 'new_val'
          },
          old_value: {
            html: 'old_val'
          },
          skill_id: 'skill_id_1'
        },
        last_updated_msecs: 0,
      },
      {
        suggestion_type: 'suggestion',
        suggestion_id: 'id',
        target_type: 'exploration',
        target_id: '1',
        status: 'review',
        author_name: 'author',
        change_cmd: {
          state_name: 'End State',
          content_id: 'content_2',
          new_value: {
            html: 'new_val'
          },
          old_value: {
            html: 'old_val'
          },
          skill_id: 'skill_id_1'
        },
        last_updated_msecs: 0,
      }
    ] as unknown as SuggestionBackendDict[];
    const statesBackendDict: StateObjectsBackendDict = {
      'First State': {
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
            buttonText: {
              value: 'Continue'
            }
          },
          default_outcome: {
            dest: 'End State',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'default_outcome',
              html: ''
            },
            param_changes: [],
            labelled_as_correct: true,
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null
          },
          hints: [],
          solution: null,
          id: 'Continue'
        },
        linked_skill_id: null,
        param_changes: [],
        solicit_answer_details: false,
        card_is_checkpoint: true
      },
      'End State': {
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
            recommendedExplorationIds: {
              value: []
            }
          },
          default_outcome: null,
          hints: [],
          solution: null,
          id: 'EndExploration'
        },
        linked_skill_id: null,
        param_changes: [],
        solicit_answer_details: false,
        card_is_checkpoint: false
      }
    };

    it('should sort translation cards within each state based ' +
    'on type and index', () => {
      const states = statesObjectFactory.createFromBackendDict(
        statesBackendDict);
      const sortedTranslationSuggestions = cars.
        sortTranslationSuggestionsByState(
          translationSuggestions, states,
          'First State') as unknown as SuggestionBackendDict[];

      expect(sortedTranslationSuggestions).toEqual([
        {
          suggestion_type: 'suggestion',
          suggestion_id: 'id',
          target_type: 'exploration',
          target_id: '1',
          status: 'review',
          author_name: 'author',
          change_cmd: {
            state_name: 'First State',
            content_id: 'content_1',
            new_value: {
              html: 'new_val'
            },
            old_value: {
              html: 'old_val'
            },
            skill_id: 'skill_id_1'
          },
          last_updated_msecs: 0,
        },
        {
          suggestion_type: 'suggestion',
          suggestion_id: 'id',
          target_type: 'exploration',
          target_id: '1',
          status: 'review',
          author_name: 'author',
          change_cmd: {
            state_name: 'First State',
            content_id: 'content_3',
            new_value: {
              html: 'new_val'
            },
            old_value: {
              html: 'old_val'
            },
            skill_id: 'skill_id_1'
          },
          last_updated_msecs: 0,
        },
        {
          suggestion_type: 'suggestion',
          suggestion_id: 'id',
          target_type: 'exploration',
          target_id: '1',
          status: 'review',
          author_name: 'author',
          change_cmd: {
            state_name: 'First State',
            content_id: 'feedback_2',
            new_value: {
              html: 'new_val'
            },
            old_value: {
              html: 'old_val'
            },
            skill_id: 'skill_id_1'
          },
          last_updated_msecs: 0,
        },
        {
          suggestion_type: 'suggestion',
          suggestion_id: 'id',
          target_type: 'exploration',
          target_id: '1',
          status: 'review',
          author_name: 'author',
          change_cmd: {
            state_name: 'End State',
            content_id: 'content_2',
            new_value: {
              html: 'new_val'
            },
            old_value: {
              html: 'old_val'
            },
            skill_id: 'skill_id_1'
          },
          last_updated_msecs: 0,
        },
        {
          suggestion_type: 'suggestion',
          suggestion_id: 'id',
          target_type: 'exploration',
          target_id: '1',
          status: 'review',
          author_name: 'author',
          change_cmd: {
            state_name: 'End State',
            content_id: 'interaction_1',
            new_value: {
              html: 'new_val'
            },
            old_value: {
              html: 'old_val'
            },
            skill_id: 'skill_id_1'
          },
          last_updated_msecs: 0,
        },
        {
          suggestion_type: 'suggestion',
          suggestion_id: 'id',
          target_type: 'exploration',
          target_id: '1',
          status: 'review',
          author_name: 'author',
          change_cmd: {
            state_name: 'End State',
            content_id: 'hints_1',
            new_value: {
              html: 'new_val'
            },
            old_value: {
              html: 'old_val'
            },
            skill_id: 'skill_id_1'
          },
          last_updated_msecs: 0,
        }
      ]);
    });

    it('should return suggestions as it is when initStateName is not defined',
      () => {
        const states = statesObjectFactory.createFromBackendDict(
          statesBackendDict);
        const sortedTranslationCards = cars.sortTranslationSuggestionsByState(
          translationSuggestions, states, null);

        expect(sortedTranslationCards).toEqual(translationSuggestions);
      });
  });
});
