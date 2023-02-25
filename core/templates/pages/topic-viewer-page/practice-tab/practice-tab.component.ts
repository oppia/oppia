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

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { Subtopic } from 'domain/topic/subtopic.model';
import { QuestionBackendApiService } from
  'domain/question/question-backend-api.service';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { PracticeSessionPageConstants } from
  'pages/practice-session-page/practice-session-page.constants';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { I18nLanguageCodeService, TranslationKeyType } from 'services/i18n-language-code.service';
import { PracticeSessionConfirmationModal } from 'pages/topic-viewer-page/modals/practice-session-confirmation-modal.component';
import { LoaderService } from 'services/loader.service';

import './practice-tab.component.css';
import { SiteAnalyticsService } from 'services/site-analytics.service';


@Component({
  selector: 'practice-tab',
  templateUrl: './practice-tab.component.html',
  styleUrls: ['./practice-tab.component.css']
})
export class PracticeTabComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() topicName!: string;
  @Input() subtopicsList!: Subtopic[];
  @Input() previewMode: boolean = false;
  @Input() displayArea: string = 'topicViewer';
  @Input() topicUrlFragment: string = '';
  @Input() classroomUrlFragment: string = '';
  @Input() subtopicMastery: Record<string, number> = {};
  @Input() topicId!: string;
  topicNameTranslationKey!: string;
  translatedTopicName!: string;
  selectedSubtopics: Subtopic[] = [];
  availableSubtopics: Subtopic[] = [];
  selectedSubtopicIndices: boolean[] = [];
  questionsAreAvailable: boolean = false;
  subtopicIds: number[] = [];
  clientWidth!: number;
  subtopicMasteryArray: number[] = [];
  questionsStatusCallIsComplete: boolean = true;

  constructor(
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private questionBackendApiService: QuestionBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private windowRef: WindowRef,
    private ngbModal: NgbModal,
    private translateService: TranslateService,
    private loaderService: LoaderService,
    private siteAnalyticsService: SiteAnalyticsService
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
    if (this.displayArea === 'topicViewer' && !this.previewMode) {
      this.topicUrlFragment = (
        this.urlService.getTopicUrlFragmentFromLearnerUrl());
      this.classroomUrlFragment = (
        this.urlService.getClassroomUrlFragmentFromLearnerUrl());
    }
    this.topicNameTranslationKey =
      this.i18nLanguageCodeService.getTopicTranslationKey(
        this.topicId, TranslationKeyType.TITLE
      );
    this.getTranslatedTopicName();
    this.subscribeToOnLangChange();
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  subscribeToOnLangChange(): void {
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.getTranslatedTopicName();
      })
    );
  }

  getTranslatedTopicName(): void {
    if (this.isTopicNameTranslationAvailable()) {
      this.translatedTopicName = this.translateService.instant(
        this.topicNameTranslationKey);
    } else {
      this.translatedTopicName = this.topicName;
    }
  }

  isTopicNameTranslationAvailable(): boolean {
    return (
      this.i18nLanguageCodeService.isHackyTranslationAvailable(
        this.topicNameTranslationKey
      ) && !this.i18nLanguageCodeService.isCurrentLanguageEnglish()
    );
  }

  isStartButtonDisabled(): boolean {
    if (this.previewMode) {
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

  checkSiteLanguageBeforeBeginningPracticeSession(): void {
    if (this.i18nLanguageCodeService.isCurrentLanguageEnglish()) {
      this.openNewPracticeSession();
      return;
    }
    this.ngbModal.open(PracticeSessionConfirmationModal, {
      centered: true,
      backdrop: 'static'
    }).result.then(() => {
      this.openNewPracticeSession();
    }, () => { });
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
    this.siteAnalyticsService.registerPracticeSessionStartEvent(
      this.classroomUrlFragment,
      this.topicName,
      selectedSubtopicIds.toString()
    );
    this.windowRef.nativeWindow.location.href = practiceSessionsUrl;
    this.loaderService.showLoadingScreen('Loading');
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
