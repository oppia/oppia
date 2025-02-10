// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for contribution and review backend api service.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';
import {AppConstants} from 'app.constants';
import {ContributionAndReviewBackendApiService} from './contribution-and-review-backend-api.service';

describe('Contribution and review backend API service', () => {
  let carbas: ContributionAndReviewBackendApiService;
  let http: HttpTestingController;

  const explorationId = 'exp1';
  const suggestion1 = {
    suggestion_id: 'suggestion_id_1',
    target_id: 'skill_id_1',
  };
  const opportunityDict1 = {
    skill_id: 'skill_id_1',
    skill_description: 'skill_description_1',
  };
  const suggestionsBackendObject = {
    suggestions: [suggestion1],
    target_id_to_opportunity_dict: {
      skill_id_1: opportunityDict1,
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    carbas = TestBed.inject(ContributionAndReviewBackendApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  describe('fetching suggestions from the backend', () => {
    let successHandler: jasmine.Spy<jasmine.Func>;
    let failureHandler: jasmine.Spy<jasmine.Func>;

    beforeEach(() => {
      successHandler = jasmine.createSpy('success');
      failureHandler = jasmine.createSpy('failure');
    });

    it('should fetch submitted question suggestions', fakeAsync(() => {
      spyOn(carbas, 'fetchSubmittedSuggestionsAsync').and.callThrough();
      const url =
        '/getsubmittedsuggestions/skill/add_question' +
        '?limit=10&offset=0&sort_key=Date';

      carbas
        .fetchSuggestionsAsync(
          'SUBMITTED_QUESTION_SUGGESTIONS',
          AppConstants.OPPORTUNITIES_PAGE_SIZE,
          0,
          AppConstants.SUGGESTIONS_SORT_KEY_DATE,
          'All',
          null
        )
        .then(successHandler, failureHandler);
      const req = http.expectOne(url);
      expect(req.request.method).toEqual('GET');
      req.flush(suggestionsBackendObject);
      flushMicrotasks();

      expect(carbas.fetchSubmittedSuggestionsAsync).toHaveBeenCalledWith(
        'skill',
        'add_question',
        AppConstants.OPPORTUNITIES_PAGE_SIZE,
        0,
        AppConstants.SUGGESTIONS_SORT_KEY_DATE
      );
      expect(successHandler).toHaveBeenCalled();
      expect(failureHandler).not.toHaveBeenCalled();
    }));

    it('should fetch submitted translation suggestions', fakeAsync(() => {
      spyOn(carbas, 'fetchSubmittedSuggestionsAsync').and.callThrough();
      const url =
        '/getsubmittedsuggestions/exploration/translate_content' +
        '?limit=10&offset=0&sort_key=Date';

      carbas
        .fetchSuggestionsAsync(
          'SUBMITTED_TRANSLATION_SUGGESTIONS',
          AppConstants.OPPORTUNITIES_PAGE_SIZE,
          0,
          AppConstants.SUGGESTIONS_SORT_KEY_DATE,
          'All',
          null
        )
        .then(successHandler, failureHandler);
      const req = http.expectOne(url);
      expect(req.request.method).toEqual('GET');
      req.flush(suggestionsBackendObject);
      flushMicrotasks();

      expect(carbas.fetchSubmittedSuggestionsAsync).toHaveBeenCalledWith(
        'exploration',
        'translate_content',
        AppConstants.OPPORTUNITIES_PAGE_SIZE,
        0,
        AppConstants.SUGGESTIONS_SORT_KEY_DATE
      );
      expect(successHandler).toHaveBeenCalled();
      expect(failureHandler).not.toHaveBeenCalled();
    }));

    it('should fetch reviewable question suggestions', fakeAsync(() => {
      spyOn(carbas, 'fetchReviewableSuggestionsAsync').and.callThrough();
      const url =
        '/getreviewablesuggestions/skill/add_question' +
        '?offset=0&sort_key=Date&limit=10&topic_name=specifiedTopic';

      carbas
        .fetchSuggestionsAsync(
          'REVIEWABLE_QUESTION_SUGGESTIONS',
          AppConstants.OPPORTUNITIES_PAGE_SIZE,
          0,
          AppConstants.SUGGESTIONS_SORT_KEY_DATE,
          null,
          'specifiedTopic'
        )
        .then(successHandler, failureHandler);
      const req = http.expectOne(url);
      expect(req.request.method).toEqual('GET');
      req.flush(suggestionsBackendObject);
      flushMicrotasks();

      expect(carbas.fetchReviewableSuggestionsAsync).toHaveBeenCalledWith(
        'skill',
        'add_question',
        AppConstants.OPPORTUNITIES_PAGE_SIZE,
        0,
        'Date',
        null,
        'specifiedTopic'
      );
      expect(successHandler).toHaveBeenCalled();
      expect(failureHandler).not.toHaveBeenCalled();
    }));

    it('should fetch reviewable suggestions from exp1', fakeAsync(() => {
      spyOn(carbas, 'fetchReviewableSuggestionsAsync').and.callThrough();
      const url =
        '/getreviewablesuggestions/exploration/translate_content' +
        '?offset=0&sort_key=Date&exploration_id=exp1';

      carbas
        .fetchSuggestionsAsync(
          'REVIEWABLE_TRANSLATION_SUGGESTIONS',
          null,
          0,
          AppConstants.SUGGESTIONS_SORT_KEY_DATE,
          explorationId,
          null
        )
        .then(successHandler, failureHandler);
      const req = http.expectOne(url);
      expect(req.request.method).toEqual('GET');
      req.flush(suggestionsBackendObject);
      flushMicrotasks();

      expect(carbas.fetchReviewableSuggestionsAsync).toHaveBeenCalledWith(
        'exploration',
        'translate_content',
        null,
        0,
        'Date',
        explorationId,
        null
      );
      expect(successHandler).toHaveBeenCalled();
      expect(failureHandler).not.toHaveBeenCalled();
    }));

    it('should throw error if fetch type is invalid', fakeAsync(() => {
      carbas
        .fetchSuggestionsAsync(
          'INVALID_SUGGESTION_TYPE',
          AppConstants.OPPORTUNITIES_PAGE_SIZE,
          0,
          AppConstants.SUGGESTIONS_SORT_KEY_DATE,
          'All',
          null
        )
        .then(successHandler, failureHandler);
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failureHandler).toHaveBeenCalled();
    }));
  });

  it('should correctly review exploration suggestion', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failureHandler = jasmine.createSpy('failure');
    const url = '/suggestionactionhandler/exploration/abc/pqr';
    const putBody = {
      action: 'accept',
      review_message: 'test review message',
      commit_message: 'test commit message',
    };

    carbas
      .reviewExplorationSuggestionAsync('abc', 'pqr', putBody)
      .then(successHandler, failureHandler);
    const req = http.expectOne(url);
    expect(req.request.method).toEqual('PUT');
    req.flush({});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failureHandler).not.toHaveBeenCalled();
  }));

  it('should correctly review skill suggestion', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failureHandler = jasmine.createSpy('failure');
    const url = '/suggestionactionhandler/skill/abc/pqr';
    const putBody = {
      action: 'accept',
      review_message: 'test review message',
      skill_difficulty: 'easy',
    };

    carbas
      .reviewSkillSuggestionAsync('abc', 'pqr', putBody)
      .then(successHandler, failureHandler);
    const req = http.expectOne(url);
    expect(req.request.method).toEqual('PUT');
    req.flush({});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failureHandler).not.toHaveBeenCalled();
  }));

  it('should correctly update translation suggestion', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failureHandler = jasmine.createSpy('failure');
    const url = '/updatetranslationsuggestionhandler/abc';
    const putBody = {
      translation_html: '<p>In English</p>',
    };

    carbas
      .updateTranslationSuggestionAsync('abc', putBody)
      .then(successHandler, failureHandler);
    const req = http.expectOne(url);
    expect(req.request.method).toEqual('PUT');
    req.flush({});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failureHandler).not.toHaveBeenCalled();
  }));

  it('should correctly update question suggestion', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failureHandler = jasmine.createSpy('failure');
    const url = '/updatequestionsuggestionhandler/abc';
    const questionStateData = {
      classifier_model_id: null,
      content: {
        content_id: 'content',
        html: '',
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {},
        },
      },
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          placeholder: {
            value: {
              content_id: 'ca_placeholder_0',
              unicode_str: '',
            },
          },
          rows: {value: 1},
          catchMisspellings: {
            value: false,
          },
        },
        default_outcome: {
          dest: 'new state',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome',
            html: '',
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
            html: '<p>This is an explanation.</p>',
          },
        },
        id: 'TextInput',
      },
      linked_skill_id: null,
      param_changes: [],
      solicit_answer_details: false,
      card_is_checkpoint: false,
    };
    const payload = {
      skill_difficulty: 'easy',
      question_state_data: questionStateData,
    };
    const postBody = new FormData();
    postBody.append('payload', JSON.stringify(payload));

    carbas
      .updateQuestionSuggestionAsync('abc', postBody)
      .then(successHandler, failureHandler);
    const req = http.expectOne(url);
    expect(req.request.method).toEqual('POST');
    req.flush({});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failureHandler).not.toHaveBeenCalled();
  }));

  it('should fetch contributor certificate', fakeAsync(() => {
    spyOn(carbas, 'downloadContributorCertificateAsync').and.callThrough();
    const successHandler = jasmine.createSpy('success');
    const failureHandler = jasmine.createSpy('failure');
    const url =
      '/contributorcertificate/user/translate_content?' +
      'from_date=2022-01-01&to_date=2022-01-02&language=hi';
    const response = {
      from_date: '1 Nov 2022',
      to_date: '1 Dec 2022',
      contribution_hours: 1.0,
      team_lead: 'Test User',
      language: 'Hindi',
    };

    carbas
      .downloadContributorCertificateAsync(
        'user',
        'translate_content',
        'hi',
        '2022-01-01',
        '2022-01-02'
      )
      .then(successHandler, failureHandler);
    const req = http.expectOne(url);
    expect(req.request.method).toEqual('GET');
    req.flush(response);
    flushMicrotasks();

    expect(carbas.downloadContributorCertificateAsync).toHaveBeenCalledWith(
      'user',
      'translate_content',
      'hi',
      '2022-01-01',
      '2022-01-02'
    );
    expect(successHandler).toHaveBeenCalled();
    expect(failureHandler).not.toHaveBeenCalled();
  }));
});
