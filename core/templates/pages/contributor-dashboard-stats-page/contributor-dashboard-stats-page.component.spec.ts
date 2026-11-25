// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for contributor dashboard stats page component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {
  ContributorDashboardStatsBackendApiService,
  ContributorDashboardStatsData,
  TopicStat,
} from './contributor-dashboard-stats-backend-api.service';
import {ContributorDashboardStatsPageComponent} from './contributor-dashboard-stats-page.component';

describe('ContributorDashboardStatsPageComponent', () => {
  let component: ContributorDashboardStatsPageComponent;
  let fixture: ComponentFixture<ContributorDashboardStatsPageComponent>;
  let statsApiService: ContributorDashboardStatsBackendApiService;

  const mockStatsData: ContributorDashboardStatsData = {
    topic_stats: [
      {
        topic_id: 'fractions_topic',
        topic_name: 'Fractions',
        total_chapters_count: 2,
        total_cards_count: 40,
        last_progress_date: '2026-11-20',
        is_stalled: false,
        question_stats: {
          total_skills_count: 2,
          total_questions_submitted: 18,
          total_questions_reviewed: 15,
          target_questions_count: 20,
          skills_with_sufficient_questions_count: 1,
          completed_skills_count: 1,
          in_progress_skills_count: 1,
          unstarted_skills_count: 0,
          progress_percentage: 75.0,
          submission_progress_percentage: 90.0,
          is_topic_completed: false,
          skills: [],
        },
        translation_stats_by_language: {
          hi: {
            language_code: 'hi',
            language_name: 'Hindi',
            translated_cards_count: 32,
            submitted_cards_count: 36,
            total_cards_count: 40,
            completed_chapters_count: 1,
            in_progress_chapters_count: 1,
            unstarted_chapters_count: 0,
            total_chapters_count: 2,
            progress_percentage: 80.0,
            submission_progress_percentage: 90.0,
            is_topic_completed: false,
            chapters: [],
          },
        },
      },
      {
        topic_id: 'addition_topic',
        topic_name: 'Basic Addition',
        total_chapters_count: 1,
        total_cards_count: 20,
        last_progress_date: '2026-11-20',
        is_stalled: false,
        question_stats: {
          total_skills_count: 1,
          total_questions_submitted: 10,
          total_questions_reviewed: 10,
          target_questions_count: 10,
          skills_with_sufficient_questions_count: 1,
          completed_skills_count: 1,
          in_progress_skills_count: 0,
          unstarted_skills_count: 0,
          progress_percentage: 100.0,
          submission_progress_percentage: 100.0,
          is_topic_completed: true,
          skills: [],
        },
        translation_stats_by_language: {
          hi: {
            language_code: 'hi',
            language_name: 'Hindi',
            translated_cards_count: 20,
            submitted_cards_count: 20,
            total_cards_count: 20,
            completed_chapters_count: 1,
            in_progress_chapters_count: 0,
            unstarted_chapters_count: 0,
            total_chapters_count: 1,
            progress_percentage: 100.0,
            submission_progress_percentage: 100.0,
            is_topic_completed: true,
            chapters: [],
          },
        },
      },
      {
        topic_id: 'stalled_topic',
        topic_name: 'Stalled Geometry',
        total_chapters_count: 1,
        total_cards_count: 15,
        last_progress_date: '2026-10-01',
        is_stalled: true,
        question_stats: {
          total_skills_count: 1,
          total_questions_submitted: 5,
          total_questions_reviewed: 5,
          target_questions_count: 10,
          skills_with_sufficient_questions_count: 0,
          completed_skills_count: 0,
          in_progress_skills_count: 1,
          unstarted_skills_count: 0,
          progress_percentage: 50.0,
          submission_progress_percentage: 50.0,
          is_topic_completed: false,
          skills: [],
        },
        translation_stats_by_language: {
          hi: {
            language_code: 'hi',
            language_name: 'Hindi',
            translated_cards_count: 5,
            submitted_cards_count: 5,
            total_cards_count: 15,
            completed_chapters_count: 0,
            in_progress_chapters_count: 1,
            unstarted_chapters_count: 0,
            total_chapters_count: 1,
            progress_percentage: 33.3,
            submission_progress_percentage: 33.3,
            is_topic_completed: false,
            chapters: [],
          },
        },
      },
      {
        topic_id: 'unstarted_topic',
        topic_name: 'Negative Numbers',
        total_chapters_count: 1,
        total_cards_count: 25,
        last_progress_date: '2026-10-01',
        is_stalled: false,
        question_stats: {
          total_skills_count: 1,
          total_questions_submitted: 0,
          total_questions_reviewed: 0,
          target_questions_count: 10,
          skills_with_sufficient_questions_count: 0,
          completed_skills_count: 0,
          in_progress_skills_count: 0,
          unstarted_skills_count: 1,
          progress_percentage: 0.0,
          submission_progress_percentage: 0.0,
          is_topic_completed: false,
          skills: [],
        },
        translation_stats_by_language: {
          hi: {
            language_code: 'hi',
            language_name: 'Hindi',
            translated_cards_count: 0,
            submitted_cards_count: 0,
            total_cards_count: 25,
            completed_chapters_count: 0,
            in_progress_chapters_count: 0,
            unstarted_chapters_count: 1,
            total_chapters_count: 1,
            progress_percentage: 0.0,
            submission_progress_percentage: 0.0,
            is_topic_completed: false,
            chapters: [],
          },
        },
      },
    ],
    language_stats: [
      {
        language_code: 'hi',
        language_name: 'Hindi',
        completed_topics_count: 1,
        in_progress_topics_count: 2,
        not_started_topics_count: 1,
        total_topics_count: 4,
        total_translated_cards: 57,
        total_submitted_cards: 61,
        total_cards: 100,
        overall_progress_percentage: 57.0,
        overall_submission_percentage: 61.0,
      },
    ],
    summary_stats: {
      total_topics_count: 4,
      total_chapters_count: 5,
      total_skills_count: 5,
      total_questions_count: 33,
      total_languages_count: 1,
      fully_translated_topics_count: 1,
      near_completion_topics_count: 1,
      needs_review_count: 1,
      needs_contributor_count: 2,
    },
    supported_languages: [
      {language_code: 'hi', language_name: 'Hindi'},
      {language_code: 'es', language_name: 'Spanish'},
    ],
    topic_names: [
      'Fractions',
      'Basic Addition',
      'Stalled Geometry',
      'Negative Numbers',
    ],
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ContributorDashboardStatsPageComponent],
      providers: [ContributorDashboardStatsBackendApiService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContributorDashboardStatsPageComponent);
    component = fixture.componentInstance;
    statsApiService = TestBed.inject(
      ContributorDashboardStatsBackendApiService
    );
    spyOn(statsApiService, 'fetchStatsDataAsync').and.returnValue(
      Promise.resolve(mockStatsData)
    );
  });

  it('should initialize and load stats data successfully', async () => {
    await component.ngOnInit();
    expect(component.isLoading).toBeFalse();
    expect(component.topicStats.length).toBe(4);
    expect(component.selectedLanguageCode).toBe('hi');
    expect(component.getSelectedLanguageName()).toBe('Hindi');
  });

  it('should toggle active tab and reset filters and collapse states', () => {
    component.expandedTopicIds.add('fractions_topic');
    component.showCompletedAccordion = true;
    component.activeFilter = 'near-complete';

    component.setActiveTab('questions');
    expect(component.activeTab).toBe('questions');
    expect(component.activeFilter).toBe('all');
    expect(component.expandedTopicIds.size).toBe(0);
    expect(component.showCompletedAccordion).toBeFalse();

    component.setActiveTab('translations');
    expect(component.activeTab).toBe('translations');
  });

  it('should handle language change and search input changes', () => {
    component.expandedTopicIds.add('fractions_topic');
    component.showCompletedAccordion = true;

    component.onLanguageChange('es');
    expect(component.selectedLanguageCode).toBe('es');
    expect(component.expandedTopicIds.size).toBe(0);
    expect(component.showCompletedAccordion).toBeFalse();

    component.expandedTopicIds.add('fractions_topic');
    component.onSearchChange();
    expect(component.expandedTopicIds.size).toBe(0);
  });

  it('should toggle topic details breakdown accordion', () => {
    expect(component.isTopicExpanded('fractions_topic')).toBeFalse();
    component.toggleTopicDetails('fractions_topic');
    expect(component.isTopicExpanded('fractions_topic')).toBeTrue();
    component.toggleTopicDetails('fractions_topic');
    expect(component.isTopicExpanded('fractions_topic')).toBeFalse();
  });

  it('should toggle completed accordion', () => {
    expect(component.showCompletedAccordion).toBeFalse();
    component.toggleCompletedAccordion();
    expect(component.showCompletedAccordion).toBeTrue();
    component.toggleCompletedAccordion();
    expect(component.showCompletedAccordion).toBeFalse();
  });

  it('should determine correct topic status for all states', async () => {
    await component.ngOnInit();
    const fractions = component.topicStats[0];
    const addition = component.topicStats[1];
    const stalled = component.topicStats[2];
    const unstarted = component.topicStats[3];

    // Completed
    expect(component.getTopicStatus(addition)).toBe('completed');
    // Needs review (subPct 90 > revPct 80)
    expect(component.getTopicStatus(fractions)).toBe('needs-review');
    // Stalled
    expect(component.getTopicStatus(stalled)).toBe('stalled');
    // Not started
    expect(component.getTopicStatus(unstarted)).toBe('not-started');

    // In-progress test where sub == rev and not stalled
    const inProgressTopic: TopicStat = {
      ...stalled,
      is_stalled: false,
    };
    expect(component.getTopicStatus(inProgressTopic)).toBe('in-progress');
  });

  it('should filter and sort topics correctly across all filter chips', async () => {
    await component.ngOnInit();

    // Default 'all'
    let actionable = component.getActionableTopics();
    expect(actionable.length).toBe(3);
    let completed = component.getCompletedTopics();
    expect(completed.length).toBe(1);
    expect(completed[0].topic_id).toBe('addition_topic');

    // Filter 'near-complete'
    component.setFilter('near-complete');
    actionable = component.getActionableTopics();
    expect(actionable.length).toBe(1);
    expect(actionable[0].topic_id).toBe('fractions_topic');

    // Filter 'needs-review'
    component.setFilter('needs-review');
    actionable = component.getActionableTopics();
    expect(actionable.length).toBe(1);
    expect(actionable[0].topic_id).toBe('fractions_topic');

    // Filter 'needs-contributor'
    component.setFilter('needs-contributor');
    actionable = component.getActionableTopics();
    expect(actionable.length).toBe(2);

    // Filter 'completed'
    component.setFilter('completed');
    completed = component.getCompletedTopics();
    expect(completed.length).toBe(1);

    // Search query filter
    component.setFilter('all');
    component.searchQuery = 'stalled';
    actionable = component.getActionableTopics();
    expect(actionable.length).toBe(1);
    expect(actionable[0].topic_id).toBe('stalled_topic');
  });

  it('should correctly evaluate topic completion and stats in questions tab', async () => {
    await component.ngOnInit();
    component.setActiveTab('questions');

    const fractions = component.topicStats[0];
    const addition = component.topicStats[1];

    expect(component.isTopicComplete(addition)).toBeTrue();
    expect(component.isTopicComplete(fractions)).toBeFalse();

    expect(component.getTopicSubmissionPct(fractions)).toBe(90.0);
    expect(component.getTopicReviewPct(fractions)).toBe(75.0);

    const emptyTopic: TopicStat = {
      ...fractions,
      question_stats: null as unknown as TopicStat['question_stats'],
      translation_stats_by_language:
        null as unknown as TopicStat['translation_stats_by_language'],
    };
    expect(component.getTopicSubmissionPct(emptyTopic)).toBe(0);
    expect(component.getTopicReviewPct(emptyTopic)).toBe(0);
    expect(component.getTranslationStatsForTopic(emptyTopic)).toBeNull();
  });

  it('should fallback to language_code when language name is missing', async () => {
    await component.ngOnInit();
    component.selectedLanguageCode = 'unknown_code';
    expect(component.getSelectedLanguageName()).toBe('unknown_code');
  });
});
