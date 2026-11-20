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
    ],
    language_stats: [
      {
        language_code: 'hi',
        language_name: 'Hindi',
        completed_topics_count: 0,
        in_progress_topics_count: 1,
        not_started_topics_count: 0,
        total_topics_count: 1,
        total_translated_cards: 32,
        total_submitted_cards: 36,
        total_cards: 40,
        overall_progress_percentage: 80.0,
        overall_submission_percentage: 90.0,
      },
    ],
    summary_stats: {
      total_topics_count: 1,
      total_chapters_count: 2,
      total_skills_count: 2,
      total_questions_count: 15,
      total_languages_count: 1,
      fully_translated_topics_count: 0,
      near_completion_topics_count: 1,
      needs_review_count: 1,
      needs_contributor_count: 0,
    },
    supported_languages: [{language_code: 'hi', language_name: 'Hindi'}],
    topic_names: ['Fractions'],
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
    expect(component.topicStats.length).toBe(1);
    expect(component.selectedLanguageCode).toBe('hi');
  });

  it('should toggle active tab between translations and questions', () => {
    expect(component.activeTab).toBe('translations');
    component.setActiveTab('questions');
    expect(component.activeTab).toBe('questions');
  });

  it('should toggle topic details breakdown accordion', () => {
    expect(component.isTopicExpanded('fractions_topic')).toBeFalse();
    component.toggleTopicDetails('fractions_topic');
    expect(component.isTopicExpanded('fractions_topic')).toBeTrue();
    component.toggleTopicDetails('fractions_topic');
    expect(component.isTopicExpanded('fractions_topic')).toBeFalse();
  });

  it('should filter near-complete topics properly', async () => {
    await component.ngOnInit();
    component.setFilter('near-complete');
    const filtered = component.getActionableTopics();
    expect(filtered.length).toBe(1);
    expect(filtered[0].topic_name).toBe('Fractions');
  });
});
