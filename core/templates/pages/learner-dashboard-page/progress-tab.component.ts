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
 * @fileoverview Component for progress tab in the Learner Dashboard
 * page.
 */

import {Component, Input, OnInit} from '@angular/core';
import {LearnerTopicSummary} from 'domain/topic/learner-topic-summary.model';
import {SubtopicMasterySummaryBackendDict} from 'domain/learner_dashboard/learner-dashboard-backend-api.service';
import {Subtopic} from 'domain/topic/subtopic.model';

@Component({
  selector: 'oppia-progress-tab',
  templateUrl: './progress-tab.component.html',
  styleUrls: ['./progress-tab.component.css'],
})
export class ProgressTabComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() partiallyLearntTopicsList!: LearnerTopicSummary[];
  @Input() learntTopicsList!: LearnerTopicSummary[];
  @Input() currentGoals!: LearnerTopicSummary[];
  @Input() subtopicMasteries!: Record<
    string,
    SubtopicMasterySummaryBackendDict
  >;

  partialTopicMastery: {topic: LearnerTopicSummary; progress: number[]}[] = [];
  learntTopicMastery: {topic: LearnerTopicSummary; progress: number[]}[] = [];
  currentGoalIds: Set<string> = new Set();
  completedGoalIds: Set<string> = new Set();

  ngOnInit(): void {
    this.currentGoalIds = new Set(this.currentGoals.map(g => g.id));
    this.completedGoalIds = new Set(this.learntTopicsList.map(t => t.id));

    this.setTopicMastery();
  }

  isLearnerStateEmpty(): boolean {
    return (
      this.partiallyLearntTopicsList.length === 0 &&
      this.learntTopicsList.length === 0
    );
  }

  setTopicMastery(): void {
    for (const partialTopic of this.partiallyLearntTopicsList) {
      this.partialTopicMastery.push({
        topic: partialTopic,
        progress: this.getSubtopicProgress(
          partialTopic.subtopics,
          this.subtopicMasteries[partialTopic.id]
        ),
      });
    }

    for (const learntTopic of this.learntTopicsList) {
      this.learntTopicMastery.push({
        topic: learntTopic,
        progress: this.getSubtopicProgress(
          learntTopic.subtopics,
          this.subtopicMasteries[learntTopic.id]
        ),
      });
    }
  }

  getSubtopicProgress(
    allSubtopics: Subtopic[],
    mastery: Record<string, number>
  ): number[] {
    const allProgress = [];
    for (const subtopic of allSubtopics) {
      if (mastery[subtopic.getId()] === undefined) {
        allProgress.push(0);
      } else {
        allProgress.push(mastery[subtopic.getId()] * 100);
      }
    }
    return allProgress;
  }
}
