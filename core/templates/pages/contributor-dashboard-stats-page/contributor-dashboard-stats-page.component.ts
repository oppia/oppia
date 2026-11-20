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
 * @fileoverview Component for the contributor dashboard stats page.
 */

import {Component, OnInit} from '@angular/core';
import {
  ContributorDashboardStatsBackendApiService,
  ContributorDashboardStatsData,
  LanguageOverallStat,
  SummaryStats,
  SupportedLanguage,
  TopicStat,
  TranslationTopicLanguageStat,
} from './contributor-dashboard-stats-backend-api.service';

type ActiveTab = 'translations' | 'questions';
type FilterStatus =
  | 'all'
  | 'near-complete'
  | 'needs-review'
  | 'needs-contributor'
  | 'completed';

@Component({
  selector: 'oppia-contributor-dashboard-stats-page',
  templateUrl: './contributor-dashboard-stats-page.component.html',
  styleUrls: ['./contributor-dashboard-stats-page.component.css'],
})
export class ContributorDashboardStatsPageComponent implements OnInit {
  isLoading: boolean = true;
  activeTab: ActiveTab = 'translations';
  activeFilter: FilterStatus = 'all';

  topicStats: TopicStat[] = [];
  languageStats: LanguageOverallStat[] = [];
  summaryStats: SummaryStats | null = null;
  supportedLanguages: SupportedLanguage[] = [];

  selectedLanguageCode: string = '';
  searchQuery: string = '';

  expandedTopicIds: Set<string> = new Set<string>();
  showCompletedAccordion: boolean = false;

  constructor(
    private statsApiService: ContributorDashboardStatsBackendApiService
  ) {}

  ngOnInit(): void {
    this.loadStatsData();
  }

  async loadStatsData(): Promise<void> {
    this.isLoading = true;
    try {
      const data: ContributorDashboardStatsData =
        await this.statsApiService.fetchStatsDataAsync();
      this.topicStats = data.topic_stats || [];
      this.languageStats = data.language_stats || [];
      this.summaryStats = data.summary_stats || null;
      this.supportedLanguages = data.supported_languages || [];

      // Default to Hindi or the first language with progress, or the first supported language.
      const preferredLanguage = this.supportedLanguages.find(
        l => l.language_code === 'hi'
      );
      if (preferredLanguage) {
        this.selectedLanguageCode = preferredLanguage.language_code;
      } else if (this.supportedLanguages.length > 0) {
        this.selectedLanguageCode = this.supportedLanguages[0].language_code;
      }
    } catch (error) {
      // In local demo environments without pre-seeded data, initialize clean defaults.
      this.topicStats = [];
      this.supportedLanguages = [];
    } finally {
      this.isLoading = false;
    }
  }

  setActiveTab(tab: ActiveTab): void {
    this.activeTab = tab;
  }

  setFilter(filter: FilterStatus): void {
    this.activeFilter = filter;
  }

  toggleTopicDetails(topicId: string): void {
    if (this.expandedTopicIds.has(topicId)) {
      this.expandedTopicIds.delete(topicId);
    } else {
      this.expandedTopicIds.add(topicId);
    }
  }

  isTopicExpanded(topicId: string): boolean {
    return this.expandedTopicIds.has(topicId);
  }

  toggleCompletedAccordion(): void {
    this.showCompletedAccordion = !this.showCompletedAccordion;
  }

  getSelectedLanguageName(): string {
    const lang = this.supportedLanguages.find(
      l => l.language_code === this.selectedLanguageCode
    );
    return lang ? lang.language_name : this.selectedLanguageCode;
  }

  getTranslationStatsForTopic(
    topic: TopicStat
  ): TranslationTopicLanguageStat | null {
    if (!topic || !topic.translation_stats_by_language) {
      return null;
    }
    return topic.translation_stats_by_language[this.selectedLanguageCode] || null;
  }

  // Filters topics based on active tab, search query, and filter status.
  getActionableTopics(): TopicStat[] {
    return this.getFilteredTopics().filter(t => !this.isTopicComplete(t));
  }

  getCompletedTopics(): TopicStat[] {
    return this.getFilteredTopics().filter(t => this.isTopicComplete(t));
  }

  isTopicComplete(topic: TopicStat): boolean {
    if (this.activeTab === 'translations') {
      const stats = this.getTranslationStatsForTopic(topic);
      return stats ? stats.is_topic_completed : false;
    } else {
      return topic.question_stats ? topic.question_stats.is_topic_completed : false;
    }
  }

  private getFilteredTopics(): TopicStat[] {
    let topics = [...this.topicStats];

    // Filter by topic search query.
    if (this.searchQuery.trim().length > 0) {
      const query = this.searchQuery.toLowerCase().trim();
      topics = topics.filter(t => t.topic_name.toLowerCase().includes(query));
    }

    // Filter by status chip.
    if (this.activeFilter === 'near-complete') {
      topics = topics.filter(t => {
        const subPct = this.getTopicSubmissionPct(t);
        const revPct = this.getTopicReviewPct(t);
        return (subPct >= 70 && subPct < 100) || (revPct >= 70 && revPct < 100);
      });
    } else if (this.activeFilter === 'needs-review') {
      topics = topics.filter(t => {
        const subPct = this.getTopicSubmissionPct(t);
        const revPct = this.getTopicReviewPct(t);
        return subPct > revPct;
      });
    } else if (this.activeFilter === 'needs-contributor') {
      topics = topics.filter(t => {
        const subPct = this.getTopicSubmissionPct(t);
        return subPct < 70;
      });
    } else if (this.activeFilter === 'completed') {
      topics = topics.filter(t => this.isTopicComplete(t));
    }

    // Smart sort: Prioritize near-complete first (70% - 99%), followed by lower in-progress, then 0%, then completed.
    topics.sort((a, b) => {
      const aComplete = this.isTopicComplete(a);
      const bComplete = this.isTopicComplete(b);
      if (aComplete !== bComplete) {
        return aComplete ? 1 : -1;
      }

      const aSub = this.getTopicSubmissionPct(a);
      const bSub = this.getTopicSubmissionPct(b);

      const aNear = aSub >= 70 && aSub < 100;
      const bNear = bSub >= 70 && bSub < 100;

      if (aNear && !bNear) {
        return -1;
      }
      if (!aNear && bNear) {
        return 1;
      }

      return bSub - aSub;
    });

    return topics;
  }

  getTopicSubmissionPct(topic: TopicStat): number {
    if (this.activeTab === 'translations') {
      const stats = this.getTranslationStatsForTopic(topic);
      return stats ? stats.submission_progress_percentage : 0;
    } else {
      return topic.question_stats
        ? topic.question_stats.submission_progress_percentage
        : 0;
    }
  }

  getTopicReviewPct(topic: TopicStat): number {
    if (this.activeTab === 'translations') {
      const stats = this.getTranslationStatsForTopic(topic);
      return stats ? stats.progress_percentage : 0;
    } else {
      return topic.question_stats ? topic.question_stats.progress_percentage : 0;
    }
  }
}
