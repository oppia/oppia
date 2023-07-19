// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Frontend model for skill summary domain objects.
 */

import { AppConstants } from 'app.constants';
import { TranslationSubmitterBackendDict } from './services/contributor-dashboard-admin-stats.service'
import { TranslationReviewerBackendDict } from './services/contributor-dashboard-admin-stats.service'
import { QuestionSubmitterBackendDict } from './services/contributor-dashboard-admin-stats.service'
import { QuestionReviewerBackendDict } from './services/contributor-dashboard-admin-stats.service'

export class ContributorSubmitterStats {
  constructor(
        public contributorName: string,
        public languageCode?: string,
        public topicIdsWithTranslationSubmissions?: string[],
        public recentReviewOutcomes?: string[],
        public recentPerformance?: number,
        public overallAccuracy?: number,
        public submittedTranslationsCount?: number,
        public submittedTranslationWordCount?: number,
        public acceptedTranslationsCount?: number,
        public acceptedTranslationsWithoutReviewerEditsCount?: number,
        public acceptedTranslationWordCount?: number,
        public rejectedTranslationsCount?: number,
        public rejectedTranslationWordCount?: number,
        public firstContributionDate?: string,
        public lastContributedInDays?: number) { }

  static createFromBackendDict(summaryDict: TranslationSubmitterBackendDict):
      ContributorSubmitterStats {
            return new ContributorSubmitterStats(
              summaryDict.contributor_name,
              summaryDict.language_code
            )
            'language_code': string;
            'contributor_name': string;
            'topic_names': string[];
            'recent_performance': number;
            'overall_accuracy': number;
            'submitted_translations_count': number;
            'submitted_translation_word_count': number;
            'accepted_translations_count': number;
            'accepted_translations_without_reviewer_edits_count': number;
            'accepted_translation_word_count': number;
            'rejected_translations_count': number;
            'rejected_translation_word_count': number;
            'first_contribution_date': string;
            'last_contributed_in_days': number;
    }
  }
}
