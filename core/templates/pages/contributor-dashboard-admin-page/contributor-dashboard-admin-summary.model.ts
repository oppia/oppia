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
 * @fileoverview Frontend model for contributor admin dashboard domain objects.
 */

import { TranslationSubmitterBackendDict, TranslationReviewerBackendDict,
  QuestionSubmitterBackendDict, QuestionReviewerBackendDict
} from './services/contributor-dashboard-admin-stats-backend-api.service';

export class TranslationSubmitterStats {
  constructor(
        public contributorName: string,
        public languageCode: string,
        public topicsWithTranslationSubmissions: string[],
        public recentPerformance: number,
        public overallAccuracy: number,
        public submittedTranslationsCount: number,
        public submittedTranslationWordCount: number,
        public acceptedTranslationsCount: number,
        public acceptedTranslationsWithoutReviewerEditsCount: number,
        public acceptedTranslationWordCount: number,
        public rejectedTranslationsCount: number,
        public rejectedTranslationWordCount: number,
        public firstContributionDate: string,
        public lastContributedInDays: number) { }

  static createFromBackendDict(summaryDict: TranslationSubmitterBackendDict):
    TranslationSubmitterStats {
    return new TranslationSubmitterStats(
      summaryDict.contributor_name,
      summaryDict.language_code,
      summaryDict.topic_names,
      summaryDict.recent_performance,
      summaryDict.overall_accuracy,
      summaryDict.submitted_translations_count,
      summaryDict.submitted_translation_word_count,
      summaryDict.accepted_translations_count,
      summaryDict.accepted_translations_without_reviewer_edits_count,
      summaryDict.accepted_translation_word_count,
      summaryDict.rejected_translations_count,
      summaryDict.rejected_translation_word_count,
      summaryDict.first_contribution_date,
      summaryDict.last_contributed_in_days
    );
  }
}

export class TranslationReviewerStats {
  constructor(
        public contributorName: string,
        public languageCode: string,
        public topicsWithTranslationReviews: string[],
        public reviewedTranslationsCount: number,
        public acceptedTranslationsCount: number,
        public acceptedTranslationsWithReviewerEditsCount: number,
        public acceptedTranslationWordCount: number,
        public rejectedTranslationsCount: number,
        public firstContributionDate: string,
        public lastContributedInDays: number) { }

  static createFromBackendDict(summaryDict: TranslationReviewerBackendDict):
    TranslationReviewerStats {
    return new TranslationReviewerStats(
      summaryDict.contributor_name,
      summaryDict.language_code,
      summaryDict.topic_names,
      summaryDict.reviewed_translations_count,
      summaryDict.accepted_translations_count,
      summaryDict.accepted_translations_with_reviewer_edits_count,
      summaryDict.accepted_translation_word_count,
      summaryDict.rejected_translations_count,
      summaryDict.first_contribution_date,
      summaryDict.last_contributed_in_days
    );
  }
}

export class QuestionSubmitterStats {
  constructor(
        public contributorName: string,
        public topicsWithQuestionSubmissions: string[],
        public recentPerformance: number,
        public overallAccuracy: number,
        public submittedQuestionsCount: number,
        public acceptedQuestionsCount: number,
        public acceptedQuestionsWithoutReviewerEditsCount: number,
        public rejectedQuestionsCount: number,
        public firstContributionDate: string,
        public lastContributedInDays: number) { }

  static createFromBackendDict(summaryDict: QuestionSubmitterBackendDict):
    QuestionSubmitterStats {
    return new QuestionSubmitterStats(
      summaryDict.contributor_name,
      summaryDict.topic_names,
      summaryDict.recent_performance,
      summaryDict.overall_accuracy,
      summaryDict.submitted_questions_count,
      summaryDict.accepted_questions_count,
      summaryDict.accepted_questions_without_reviewer_edits_count,
      summaryDict.rejected_questions_count,
      summaryDict.first_contribution_date,
      summaryDict.last_contributed_in_days
    );
  }
}

export class QuestionReviewerStats {
  constructor(
        public contributorName: string,
        public topicsWithQuestionReviews: string[],
        public reviewedQuestionsCount: number,
        public acceptedQuestionsCount: number,
        public acceptedQuestionsWithReviewerEditsCount: number,
        public rejectedQuestionsCount: number,
        public firstContributionDate: string,
        public lastContributedInDays: number) { }

  static createFromBackendDict(summaryDict: QuestionReviewerBackendDict):
    QuestionReviewerStats {
    return new QuestionReviewerStats(
      summaryDict.contributor_name,
      summaryDict.topic_names,
      summaryDict.reviewed_questions_count,
      summaryDict.accepted_questions_count,
      summaryDict.accepted_questions_with_reviewer_edits_count,
      summaryDict.rejected_questions_count,
      summaryDict.first_contribution_date,
      summaryDict.last_contributed_in_days
    );
  }
}
