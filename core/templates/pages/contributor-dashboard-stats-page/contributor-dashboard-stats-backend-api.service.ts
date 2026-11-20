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
 * @fileoverview Backend API service for contributor dashboard stats page.
 */

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

export interface ChapterStat {
  chapter_title: string;
  content_count: number;
  submitted_count: number;
  reviewed_count: number;
  submission_percentage: number;
  review_percentage: number;
  status: string;
  last_activity_date: string;
}

export interface TranslationTopicLanguageStat {
  language_code: string;
  language_name: string;
  translated_cards_count: number;
  submitted_cards_count: number;
  total_cards_count: number;
  completed_chapters_count: number;
  in_progress_chapters_count: number;
  unstarted_chapters_count: number;
  total_chapters_count: number;
  progress_percentage: number;
  submission_progress_percentage: number;
  is_topic_completed: boolean;
  chapters: ChapterStat[];
}

export interface SkillStat {
  skill_id: string;
  skill_description: string;
  submitted_questions_count: number;
  reviewed_questions_count: number;
  target_questions_count: number;
  submission_percentage: number;
  review_percentage: number;
  status: string;
  last_activity_date: string;
}

export interface QuestionTopicStat {
  total_skills_count: number;
  total_questions_submitted: number;
  total_questions_reviewed: number;
  target_questions_count: number;
  skills_with_sufficient_questions_count: number;
  completed_skills_count: number;
  in_progress_skills_count: number;
  unstarted_skills_count: number;
  progress_percentage: number;
  submission_progress_percentage: number;
  is_topic_completed: boolean;
  skills: SkillStat[];
}

export interface TopicStat {
  topic_id: string;
  topic_name: string;
  total_chapters_count: number;
  total_cards_count: number;
  question_stats: QuestionTopicStat;
  translation_stats_by_language: Record<string, TranslationTopicLanguageStat>;
  last_progress_date: string;
  is_stalled: boolean;
}

export interface LanguageOverallStat {
  language_code: string;
  language_name: string;
  completed_topics_count: number;
  in_progress_topics_count: number;
  not_started_topics_count: number;
  total_topics_count: number;
  total_translated_cards: number;
  total_submitted_cards: number;
  total_cards: number;
  overall_progress_percentage: number;
  overall_submission_percentage: number;
}

export interface SummaryStats {
  total_topics_count: number;
  total_chapters_count: number;
  total_skills_count: number;
  total_questions_count: number;
  total_languages_count: number;
  fully_translated_topics_count: number;
  near_completion_topics_count: number;
  needs_review_count: number;
  needs_contributor_count: number;
}

export interface SupportedLanguage {
  language_code: string;
  language_name: string;
}

export interface ContributorDashboardStatsData {
  topic_stats: TopicStat[];
  language_stats: LanguageOverallStat[];
  summary_stats: SummaryStats;
  supported_languages: SupportedLanguage[];
  topic_names: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ContributorDashboardStatsBackendApiService {
  constructor(private http: HttpClient) {}

  async fetchStatsDataAsync(): Promise<ContributorDashboardStatsData> {
    return this.http
      .get<ContributorDashboardStatsData>(
        '/contributordashboardstatshandler/data'
      )
      .toPromise();
  }
}
