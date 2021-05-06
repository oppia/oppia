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
  @Input() topicName: string;
  @Input() startButtonIsDisabled: boolean = false;
  @Input() subtopicsList: Subtopic[];
  selectedSubtopics: Subtopic[] = [];
  availableSubtopics: Subtopic[] = [];
  selectedSubtopicIndices: boolean[] = [];
  questionsAreAvailable: boolean = false;
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
    this.selectedSubtopicIndices = Array(
      this.availableSubtopics.length).fill(false);
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
    const skillIds = [];
    this.questionsStatusCallIsComplete = false;
    for (let idx in subtopicIndices) {
      if (subtopicIndices[idx]) {
        skillIds.push(this.availableSubtopics[idx].getSkillIds());
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
    const practiceSessionsUrl = this.urlInterpolationService.interpolateUrl(
      PracticeSessionPageConstants.PRACTICE_SESSIONS_URL, {
        topic_url_fragment: (
          this.urlService.getTopicUrlFragmentFromLearnerUrl()),
        classroom_url_fragment: (
          this.urlService.getClassroomUrlFragmentFromLearnerUrl()),
        comma_separated_subtopic_ids: selectedSubtopicIds.join(',')
      });
    this.windowRef.nativeWindow.location.href = practiceSessionsUrl;
  }

  isAtLeastOneSubtopicSelected(): boolean {
    return this.selectedSubtopicIndices.some(item => item);
  }
}

angular.module('oppia').directive(
  'practiceTab', downgradeComponent(
    {component: PracticeTabComponent}));
