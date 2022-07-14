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
 * @fileoverview Component for the subtopic viewer.
 */

import { Clipboard } from '@angular/cdk/clipboard';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { ContextService } from 'services/context.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { LoaderService } from 'services/loader.service';
import { PageTitleService } from 'services/page-title.service';
import { LearnerGroupPagesConstants } from '../learner-group-pages.constants';
import { LearnerGroupData } from 'domain/learner_group/learner-group.model';
import { LearnerGroupBackendApiService } from
  'domain/learner_group/learner-group-backend-api.service';
import { LearnerGroupSubtopicSummary } from
  'domain/learner_group/learner-group-subtopic-summary.model';
import { StorySummary } from 'domain/story/story-summary.model';
import { LearnerGroupInvitedUserInfo } from
  'domain/learner_group/learner-group-user-progress.model';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { WindowRef } from 'services/contextual/window-ref.service';

@Component({
  selector: 'oppia-create-learner-group-page',
  templateUrl: './create-learner-group-page.component.html'
})
export class CreateLearnerGroupPageComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();
  LEARNER_GROUP_CREATION_SECTION_I18N_IDS = (
    LearnerGroupPagesConstants.LEARNER_GROUP_CREATION_SECTION_I18N_IDS);

  activeSection: string;
  furthestReachedSectionNumber: number = 1;
  learnerGroupTitle: string = '';
  learnerGroupDescription: string = '';
  learnerGroupSubtopicPageIds: string[] = [];
  syllabusSubtopicSummaries: LearnerGroupSubtopicSummary[] = [];
  learnerGroupStoryIds: string[] = [];
  syllabusStorySummaries: StorySummary[] = [];
  learnerGroupInvitedStudents: string[] = [];
  learnerGroupInvitedStudentsInfo: LearnerGroupInvitedUserInfo[] = [];
  learnerGroup!: LearnerGroupData;
  learnerGroupUrl: string = '';

  constructor(
    private contextService: ContextService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private loaderService: LoaderService,
    private pageTitleService: PageTitleService,
    private translateService: TranslateService,
    private learnerGroupBackendApiService: LearnerGroupBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef,
    private clipboard: Clipboard
  ) {}

  ngOnInit(): void {
    this.activeSection = (
      this.LEARNER_GROUP_CREATION_SECTION_I18N_IDS.GROUP_DETAILS
    );
    this.subscribeToOnLangChange();
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }

  subscribeToOnLangChange(): void {
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPageTitle();
      })
    );
  }

  setPageTitle(): void {
    let translatedTitle = this.translateService.instant(
      'I18N_CREATE_LEARNER_GROUP_PAGE_TITLE');
    this.pageTitleService.setDocumentTitle(translatedTitle);
  }

  setActiveSection(newActiveSectionName: string, sectionNumber: number): void {
    this.activeSection = newActiveSectionName;
    if (this.furthestReachedSectionNumber < sectionNumber) {
      this.furthestReachedSectionNumber = sectionNumber;
    }
  }

  isGroupDetailsNextButtonDisabled(): boolean {
    return (
      !this.learnerGroupTitle ||
      !this.learnerGroupDescription
    );
  }

  updateLearnerGroupTitle(title: string): void {
    this.learnerGroupTitle = title;
  }

  updateLearnerGroupDesc(description: string): void {
    this.learnerGroupDescription = description;
  }

  updateLearnerGroupSubtopics(
      subtopicSummaries: LearnerGroupSubtopicSummary[]
  ): void {
    this.syllabusSubtopicSummaries = subtopicSummaries;
  }

  updateLearnerGroupSubtopicIds(subtopicPageIds: string[]): void {
    this.learnerGroupSubtopicPageIds = subtopicPageIds;
  }

  updateLearnerGroupStories(storySummaries: StorySummary[]): void {
    this.syllabusStorySummaries = storySummaries;
  }

  updateLearnerGroupStoryIds(storyIds: string[]): void {
    this.learnerGroupStoryIds = storyIds;
  }

  updateLearnerGroupInvitedStudents(invitedUsernames: string[]): void {
    this.learnerGroupInvitedStudents = invitedUsernames;
  }

  updateLearnerGroupInvitedStudentsInfo(
      invitedUsersInfo: LearnerGroupInvitedUserInfo[]
  ): void {
    this.learnerGroupInvitedStudentsInfo = invitedUsersInfo;
  }

  isAddSyllabusNextButtonDisabled(): boolean {
    return (
      !this.learnerGroupStoryIds.length &&
      !this.learnerGroupSubtopicPageIds.length
    );
  }

  getProgressTabStatusClass(sectionNumber: number): string {
    if (sectionNumber < this.furthestReachedSectionNumber) {
      return 'completed';
    }
    if (sectionNumber === this.furthestReachedSectionNumber) {
      return 'active';
    }
    return 'incomplete';
  }

  getOppiaLargeAvatarUrl(): string {
    return this.urlInterpolationService.getStaticImageUrl(
      '/avatar/oppia_avatar_large_100px.svg'
    );
  }

  createLearnerGroup(): void {
    this.loaderService.showLoadingScreen('Creating learner group');
    this.learnerGroupBackendApiService.createNewLearnerGroupAsync(
      this.learnerGroupTitle,
      this.learnerGroupDescription,
      this.learnerGroupInvitedStudents,
      this.learnerGroupSubtopicPageIds,
      this.learnerGroupStoryIds
    ).then((responseLearnerGroup: LearnerGroupData) => {
      this.learnerGroup = responseLearnerGroup;
      this.learnerGroupUrl = (
        this.windowRef.nativeWindow.location.protocol + '//' +
         this.windowRef.nativeWindow.location.host +
          '/learner-group/' + this.learnerGroup.id
      );
      this.loaderService.hideLoadingScreen();
    });
  }

  copyCreatedGroupUrl(): void {
    this.clipboard.copy(this.learnerGroupUrl);
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
    this.contextService.removeCustomEntityContext();
  }
}

angular.module('oppia').directive(
  'oppiaCreateLearnerGroupPage',
  downgradeComponent({component: CreateLearnerGroupPageComponent}));
