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
 * @fileoverview Component for the topic viewer practice tab.
 */

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { Subtopic } from 'domain/topic/subtopic.model';
import { QuestionBackendApiService } from
  'domain/question/question-backend-api.service';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { PracticeSessionPageConstants } from
  'pages/practice-session-page/practice-session-page.constants';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';

@Component({
  selector: 'practice-tab',
  templateUrl: './practice-tab.component.html',
  styleUrls: []
})
export class PracticeTabComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion, for more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() topicName!: string;
  @Input() subtopicsList!: Subtopic[];
  @Input() startButtonIsDisabled: boolean = false;
  @Input() displayArea: string = 'topicViewer';
  @Input() topicUrlFragment: string = '';
  @Input() classroomUrlFragment: string = '';
  @Input() subtopicMastery: Record<string, number> = {};
  selectedSubtopics: Subtopic[] = [];
  availableSubtopics: Subtopic[] = [];
  selectedSubtopicIndices: boolean[] = [];
  questionsAreAvailable: boolean = false;
  subtopicIds: number[] = [];
  clientWidth!: number;
  subtopicMasteryArray: number[] = [];
  questionsStatusCallIsComplete: boolean = true;

  constructor(
    private questionBackendApiService: QuestionBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private windowRef: WindowRef
  ) {}

  ngOnInit(): void {
    this.selectedSubtopics = [];
    this.availableSubtopics = this.subtopicsList.filter(
      (subtopic: Subtopic) => {
        return subtopic.getSkillSummaries().length > 0;
      }
    );
    for (var subtopic of this.subtopicsList) {
      this.subtopicIds.push(subtopic.getId());
    }
    for (let item of this.subtopicIds) {
      if (this.subtopicMastery[item] !== undefined) {
        this.subtopicMasteryArray.push(Math.floor(
          this.subtopicMastery[item] * 100));
      } else {
        this.subtopicMasteryArray.push(0);
      }
    }
    this.selectedSubtopicIndices = Array(
      this.availableSubtopics.length).fill(false);
    this.clientWidth = window.innerWidth;
    if (this.displayArea === 'topicViewer') {
      this.topicUrlFragment = (
        this.urlService.getTopicUrlFragmentFromLearnerUrl());
      this.classroomUrlFragment = (
        this.urlService.getClassroomUrlFragmentFromLearnerUrl());
    }
  }

  isStartButtonDisabled(): boolean {
    if (this.startButtonIsDisabled) {
      return true;
    }
    for (var idx in this.selectedSubtopicIndices) {
      if (this.selectedSubtopicIndices[idx]) {
        return !this.questionsAreAvailable;
      }
    }
    return true;
  }

  checkIfQuestionsExist(subtopicIndices: boolean[]): void {
    const skillIds: string[] = [];
    this.questionsStatusCallIsComplete = false;
    for (let idx in subtopicIndices) {
      if (subtopicIndices[idx]) {
        skillIds.push(...this.availableSubtopics[idx].getSkillIds());
      }
    }
    if (skillIds.length > 0) {
      this.questionBackendApiService.fetchTotalQuestionCountForSkillIdsAsync(
        skillIds).then(questionCount => {
        this.questionsAreAvailable = questionCount > 0;
        this.questionsStatusCallIsComplete = true;
      });
    } else {
      this.questionsAreAvailable = false;
      this.questionsStatusCallIsComplete = true;
    }
  }

  openNewPracticeSession(): void {
    const selectedSubtopicIds = [];
    for (let idx in this.selectedSubtopicIndices) {
      if (this.selectedSubtopicIndices[idx]) {
        selectedSubtopicIds.push(
          this.availableSubtopics[idx].getId());
      }
    }
    let practiceSessionsUrl = this.urlInterpolationService.interpolateUrl(
      PracticeSessionPageConstants.PRACTICE_SESSIONS_URL, {
        topic_url_fragment: this.topicUrlFragment,
        classroom_url_fragment: this.classroomUrlFragment,
        stringified_subtopic_ids: JSON.stringify(selectedSubtopicIds)
      });
    this.windowRef.nativeWindow.location.href = practiceSessionsUrl;
  }

  isAtLeastOneSubtopicSelected(): boolean {
    return this.selectedSubtopicIndices.some(item => item);
  }

  getBackgroundForProgress(i: number): number {
    return this.subtopicMasteryArray[i];
  }

  // This function is used to calculate the position of subtopic mastery
  // percent in the capsule shaped progress bar.
  subtopicMasteryPosition(i: number): number {
    if (this.clientWidth > 510) {
      if (this.subtopicMasteryArray[i] <= 89) {
        return 225 - this.subtopicMasteryArray[i] * 2.5;
      }
      return 225 - (this.subtopicMasteryArray[i] * 2) - 15;
    } else {
      if (this.subtopicMasteryArray[i] <= 89) {
        return 215 - (this.subtopicMasteryArray[i] * 2) - 25;
      }
      return 215 - (this.subtopicMasteryArray[i] * 2) - 10;
    }
  }

  masteryTextColor(i: number): string {
    if (this.subtopicMasteryArray[i] <= 89) {
      return 'black';
    }
    return 'white';
  }
}

angular.module('oppia').directive(
  'practiceTab', downgradeComponent(
    {component: PracticeTabComponent}));
