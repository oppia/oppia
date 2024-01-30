// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for contributor admin dashboard backend service
 */

import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ContributorDashboardAdminStatsBackendApiService } from './contributor-dashboard-admin-stats-backend-api.service';
import { ContributorAdminDashboardFilter } from '../contributor-admin-dashboard-filter.model';
import { AppConstants } from 'app.constants';
import { CsrfTokenService } from 'services/csrf-token.service';
import { ClassroomBackendApiService } from 'domain/classroom/classroom-backend-api.service';
import { ClassroomData } from 'domain/classroom/classroom-data.model';
import { CreatorTopicSummaryBackendDict } from 'domain/topic/creator-topic-summary.model';


describe('Contribution Admin dashboard stats service', () => {
  let cdasbas: ContributorDashboardAdminStatsBackendApiService;
  let http: HttpTestingController;
  let crbas: ClassroomBackendApiService;
  let csrfService: CsrfTokenService;
  let successHandler: jasmine.Spy<jasmine.Func>;
  let failHandler: jasmine.Spy<jasmine.Func>;

  let firstTopicSummaryDict: CreatorTopicSummaryBackendDict = {
    id: 'topic1',
    name: 'Topic name',
    canonical_story_count: 4,
    subtopic_count: 5,
    total_skill_count: 20,
    total_published_node_count: 3,
    uncategorized_skill_count: 5,
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#C6DCDA',
    language_code: 'en',
    description: 'Topic description',
    version: 2,
    additional_story_count: 0,
    topic_model_created_on: 231241343,
    topic_model_last_updated: 3454354354,
    url_fragment: 'topic-name-one',
    can_edit_topic: false,
    is_published: false,
    total_upcoming_chapters_count: 1,
    total_overdue_chapters_count: 1,
    total_chapter_counts_for_each_story: [5, 4],
    published_chapter_counts_for_each_story: [3, 4]
  };
  let secondTopicSummaryDict: CreatorTopicSummaryBackendDict = {
    id: 'topic2',
    name: 'Topic name 2',
    canonical_story_count: 3,
    subtopic_count: 2,
    total_skill_count: 10,
    total_published_node_count: 3,
    uncategorized_skill_count: 3,
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#C6DCDA',
    language_code: 'en',
    description: 'Topic description',
    version: 2,
    additional_story_count: 0,
    topic_model_created_on: 231241343,
    topic_model_last_updated: 3454354354,
    url_fragment: 'topic-name-two',
    can_edit_topic: false,
    is_published: false,
    total_upcoming_chapters_count: 1,
    total_overdue_chapters_count: 1,
    total_chapter_counts_for_each_story: [5, 4],
    published_chapter_counts_for_each_story: [3, 4]
  };

  let responseDictionaries = {
    name: 'Math',
    topic_summary_dicts: [firstTopicSummaryDict, secondTopicSummaryDict],
    course_details: 'Course Details',
    topic_list_intro: 'Topics Covered'
  };

  let sampleClassroomDataObject: ClassroomData;

  const translationSubmitterStat = {
    language_code: 'en',
    contributor_name: 'user1',
    topic_names: ['topic1', 'topic2'],
    recent_performance: 2,
    overall_accuracy: 1.0,
    submitted_translations_count: 2,
    submitted_translation_word_count: 2,
    accepted_translations_count: 2,
    accepted_translations_without_reviewer_edits_count: 2,
    accepted_translation_word_count: 2,
    rejected_translations_count: 2,
    rejected_translation_word_count: 2,
    first_contribution_date: 'firstcontributiondate',
    last_contributed_in_days: 2
  };
  const translationReviewerStat = {
    language_code: 'en',
    contributor_name: 'user1',
    topic_names: ['topic1', 'topic2'],
    reviewed_translations_count: 2,
    accepted_translations_count: 2,
    accepted_translations_with_reviewer_edits_count: 2,
    accepted_translation_word_count: 2,
    rejected_translations_count: 2,
    first_contribution_date: 'firstcontributiondate',
    last_contributed_in_days: 2
  };
  const questionSubmitterStat = {
    contributor_name: 'user1',
    topic_names: ['topic1', 'topic2'],
    recent_performance: 2,
    overall_accuracy: 1.0,
    submitted_questions_count: 2,
    accepted_questions_count: 2,
    accepted_questions_without_reviewer_edits_count: 2,
    rejected_questions_count: 2,
    first_contribution_date: 'firstcontributiondate',
    last_contributed_in_days: 2
  };
  const questionReviewerStat = {
    contributor_name: 'user1',
    topic_names: ['topic1', 'topic2'],
    reviewed_questions_count: 2,
    accepted_questions_count: 2,
    accepted_questions_with_reviewer_edits_count: 2,
    rejected_questions_count: 2,
    first_contribution_date: 'firstcontributiondate',
    last_contributed_in_days: 2
  };

  const fetchTranslationSubmitterStatResponse = {
    stats: [translationSubmitterStat],
    nextOffset: 1,
    more: false
  };
  const fetchTranslationReviewerStatResponse = {
    stats: [translationReviewerStat],
    nextOffset: 1,
    more: false
  };
  const fetchQuestionSubmitterStatResponse = {
    stats: [questionSubmitterStat],
    nextOffset: 1,
    more: false
  };
  const fetchQuestionReviewerStatResponse = {
    stats: [questionReviewerStat],
    nextOffset: 1,
    more: false
  };
  const fetchCommunityStatsResponse = {
    translation_reviewers_count: 1,
    question_reviewers_count: 1
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    cdasbas = TestBed.inject(ContributorDashboardAdminStatsBackendApiService);
    http = TestBed.inject(HttpTestingController);
    crbas = TestBed.inject(ClassroomBackendApiService);
    csrfService = TestBed.get(CsrfTokenService);
    successHandler = jasmine.createSpy('success');
    failHandler = jasmine.createSpy('fail');

    // Sample topic object returnable from the backend.
    sampleClassroomDataObject = (
      ClassroomData.createFromBackendData(
        responseDictionaries.name,
        responseDictionaries.topic_summary_dicts,
        responseDictionaries.course_details,
        responseDictionaries.topic_list_intro));

    spyOn(csrfService, 'getTokenAsync').and.callFake(async() => {
      return Promise.resolve('sample-csrf-token');
    });
  });

  afterEach(() => {
    http.verify();
  });

  it('should return available translation submitter stats', fakeAsync(
    () => {
      spyOn(cdasbas, 'fetchContributorAdminStats').and.callThrough();
      const url = (
        '/contributor-dashboard-admin-stats/translation/submission' +
            '?page_size=20&offset=0&language_code=en');

      cdasbas.fetchContributorAdminStats(
        ContributorAdminDashboardFilter.createDefault(),
        20,
        0,
        AppConstants.CONTRIBUTION_STATS_TYPE_TRANSLATION,
        AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION
      ).then(successHandler, failHandler);
      let req = http.expectOne(url);
      expect(req.request.method).toEqual('GET');
      req.flush(
        fetchTranslationSubmitterStatResponse,
        { status: 200, statusText: 'Success.'});
      flushMicrotasks();

      expect(cdasbas.fetchContributorAdminStats)
        .toHaveBeenCalledWith(
          ContributorAdminDashboardFilter.createDefault(),
          20,
          0,
          AppConstants.CONTRIBUTION_STATS_TYPE_TRANSLATION,
          AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION);
      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it('should not return available translation submitter stats when' +
    'language code is invalid', fakeAsync(
    () => {
      spyOn(cdasbas, 'fetchContributorAdminStats').and.callThrough();
      const url = (
        '/contributor-dashboard-admin-stats/translation/' +
          'submission?page_size=20&offset=0&language_code=invalid');

      cdasbas.fetchContributorAdminStats(
        new ContributorAdminDashboardFilter(
          [], 'invalid'),
        20,
        0,
        AppConstants.CONTRIBUTION_STATS_TYPE_TRANSLATION,
        AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION
      ).then(successHandler, failHandler);
      let req = http.expectOne(url);
      expect(req.request.method).toEqual('GET');
      req.flush(
        { error: 'invalid'},
        { status: 500, statusText: 'Internal Server Error'});
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }));

  it('should return available translation reviewer stats', fakeAsync(
    () => {
      spyOn(cdasbas, 'fetchContributorAdminStats').and.callThrough();
      const url = (
        '/contributor-dashboard-admin-stats/translation/review' +
            '?page_size=20&offset=0&language_code=en');

      cdasbas.fetchContributorAdminStats(
        ContributorAdminDashboardFilter.createDefault(),
        20,
        0,
        AppConstants.CONTRIBUTION_STATS_TYPE_TRANSLATION,
        AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW
      ).then(successHandler, failHandler);
      let req = http.expectOne(url);
      expect(req.request.method).toEqual('GET');
      req.flush(
        fetchTranslationReviewerStatResponse,
        { status: 200, statusText: 'Success.'});
      flushMicrotasks();

      expect(cdasbas.fetchContributorAdminStats)
        .toHaveBeenCalledWith(
          ContributorAdminDashboardFilter.createDefault(),
          20,
          0,
          AppConstants.CONTRIBUTION_STATS_TYPE_TRANSLATION,
          AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW);
      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it('should not return available translation reviewer stats when' +
    'language code is invalid', fakeAsync(
    () => {
      spyOn(cdasbas, 'fetchContributorAdminStats').and.callThrough();
      const url = (
        '/contributor-dashboard-admin-stats/translation/' +
          'review?page_size=20&offset=0&language_code=invalid');

      cdasbas.fetchContributorAdminStats(
        new ContributorAdminDashboardFilter(
          [], 'invalid'),
        20,
        0,
        AppConstants.CONTRIBUTION_STATS_TYPE_TRANSLATION,
        AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW
      ).then(successHandler, failHandler);
      let req = http.expectOne(url);
      expect(req.request.method).toEqual('GET');
      req.flush(
        { error: 'invalid'},
        { status: 500, statusText: 'Internal Server Error'});
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }));

  it('should return available question submitter stats', fakeAsync(
    () => {
      spyOn(cdasbas, 'fetchContributorAdminStats').and.callThrough();
      const url = (
        '/contributor-dashboard-admin-stats/question/submission' +
            '?page_size=20&offset=0&language_code=en');

      cdasbas.fetchContributorAdminStats(
        ContributorAdminDashboardFilter.createDefault(),
        20,
        0,
        AppConstants.CONTRIBUTION_STATS_TYPE_QUESTION,
        AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION
      ).then(successHandler, failHandler);
      let req = http.expectOne(url);
      expect(req.request.method).toEqual('GET');
      req.flush(
        fetchQuestionSubmitterStatResponse,
        { status: 200, statusText: 'Success.'});
      flushMicrotasks();

      expect(cdasbas.fetchContributorAdminStats)
        .toHaveBeenCalledWith(
          ContributorAdminDashboardFilter.createDefault(),
          20,
          0,
          AppConstants.CONTRIBUTION_STATS_TYPE_QUESTION,
          AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION);
      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it('should not return available question submitter stats when' +
    'language code is invalid', fakeAsync(
    () => {
      spyOn(cdasbas, 'fetchContributorAdminStats').and.callThrough();
      const url = (
        '/contributor-dashboard-admin-stats/question/' +
          'submission?page_size=20&offset=0&language_code=invalid');

      cdasbas.fetchContributorAdminStats(
        new ContributorAdminDashboardFilter(
          [], 'invalid'),
        20,
        0,
        AppConstants.CONTRIBUTION_STATS_TYPE_QUESTION,
        AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION
      ).then(successHandler, failHandler);
      let req = http.expectOne(url);
      expect(req.request.method).toEqual('GET');
      req.flush(
        { error: 'invalid'},
        { status: 500, statusText: 'Internal Server Error'});
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }));

  it('should return available question reviewer stats', fakeAsync(
    () => {
      spyOn(cdasbas, 'fetchContributorAdminStats').and.callThrough();
      const url = (
        '/contributor-dashboard-admin-stats/question/review' +
                '?page_size=20&offset=0&language_code=en');

      cdasbas.fetchContributorAdminStats(
        ContributorAdminDashboardFilter.createDefault(),
        20,
        0,
        AppConstants.CONTRIBUTION_STATS_TYPE_QUESTION,
        AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW
      ).then(successHandler, failHandler);
      let req = http.expectOne(url);
      expect(req.request.method).toEqual('GET');
      req.flush(
        fetchQuestionReviewerStatResponse,
        { status: 200, statusText: 'Success.'});
      flushMicrotasks();

      expect(cdasbas.fetchContributorAdminStats)
        .toHaveBeenCalledWith(
          ContributorAdminDashboardFilter.createDefault(),
          20,
          0,
          AppConstants.CONTRIBUTION_STATS_TYPE_QUESTION,
          AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW);
      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it('should not return available question reviewer stats when' +
    'language code is invalid', fakeAsync(
    () => {
      spyOn(cdasbas, 'fetchContributorAdminStats').and.callThrough();
      const url = (
        '/contributor-dashboard-admin-stats/question/' +
          'review?page_size=20&offset=0&language_code=invalid');

      cdasbas.fetchContributorAdminStats(
        new ContributorAdminDashboardFilter(
          [], 'invalid'),
        20,
        0,
        AppConstants.CONTRIBUTION_STATS_TYPE_QUESTION,
        AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW
      ).then(successHandler, failHandler);
      let req = http.expectOne(url);
      expect(req.request.method).toEqual('GET');
      req.flush(
        { error: 'invalid'},
        { status: 500, statusText: 'Internal Server Error'});
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }));

  it('should return community contribution stats', fakeAsync(
    () => {
      spyOn(cdasbas, 'fetchCommunityStats').and.callThrough();
      const url = '/community-contribution-stats';

      cdasbas.fetchCommunityStats().then(successHandler, failHandler);
      let req = http.expectOne(url);
      expect(req.request.method).toEqual('GET');
      req.flush(
        fetchCommunityStatsResponse,
        { status: 200, statusText: 'Success.'});
      flushMicrotasks();

      expect(cdasbas.fetchCommunityStats).toHaveBeenCalled();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it('should return assigned languages to the user', fakeAsync(
    () => {
      spyOn(cdasbas, 'fetchAssignedLanguageIds').and.callThrough();
      const url = '/adminrolehandler?filter_criterion=username&username=user';

      cdasbas.fetchAssignedLanguageIds('user').then(
        successHandler, failHandler);
      let req = http.expectOne(url);
      expect(req.request.method).toEqual('GET');
      req.flush(
        ['en', 'hi'],
        { status: 200, statusText: 'Success.'});
      flushMicrotasks();

      expect(cdasbas.fetchAssignedLanguageIds).toHaveBeenCalled();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it('should return classroom data for a classroom id', fakeAsync(
    () => {
      let response = {
        classroomDict: {
          classroomId: 'mathClassroomId',
          name: 'math',
          urlFragment: 'mat',
          courseDetails: '',
          topicListIntro: '',
          topicIdToPrerequisiteTopicIds: {}
        }
      };
      let classroomId = '0';

      spyOn(crbas, 'getClassroomDataAsync')
        .and.returnValue(Promise.resolve(response));

      spyOn(crbas, 'fetchClassroomDataAsync')
        .and.returnValue(Promise.resolve(sampleClassroomDataObject));

      cdasbas.fetchTopics(classroomId).then(
        successHandler, failHandler
      );
      flushMicrotasks();

      expect(crbas.getClassroomDataAsync).
        toHaveBeenCalledWith('0');
      expect(crbas.fetchClassroomDataAsync).
        toHaveBeenCalledWith('mat');
      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it('should return data for all classrooms', fakeAsync(
    () => {
      spyOn(crbas, 'getAllClassroomIdToClassroomNameDictAsync')
        .and.returnValue(Promise.resolve({mathClassroomId: 'math'}));
      spyOn(cdasbas, 'fetchTopics')
        .and.returnValue(Promise.resolve([
          { id: '1', topic: 'Science' },
          { id: '2', topic: 'Technology' },
        ]));

      cdasbas.fetchTopicChoices().then(
        successHandler, failHandler
      );
      flushMicrotasks();

      expect(crbas.getAllClassroomIdToClassroomNameDictAsync).
        toHaveBeenCalled();
      expect(cdasbas.fetchTopics).
        toHaveBeenCalledWith('mathClassroomId');

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it('should return empty stats if contribution type is invalid', fakeAsync(
    () => {
      cdasbas.fetchContributorAdminStats(
        ContributorAdminDashboardFilter.createDefault(),
        20,
        0,
        'invalid',
        'invalid_subtype'
      ).then(result => {
        expect(result).toEqual({
          stats: [],
          nextOffset: 0,
          more: false
        });
      });
    }));
});
