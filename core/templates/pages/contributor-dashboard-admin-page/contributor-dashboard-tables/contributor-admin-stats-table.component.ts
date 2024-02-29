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
 * @fileoverview Component for the Contributor Admin Dashboard table.
 */

import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { WindowRef } from 'services/contextual/window-ref.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ContributorDashboardAdminStatsBackendApiService } from '../services/contributor-dashboard-admin-stats-backend-api.service';
import { ContributorDashboardAdminBackendApiService } from '../services/contributor-dashboard-admin-backend-api.service';
import { ContributorAdminDashboardFilter } from '../contributor-admin-dashboard-filter.model';
import { AppConstants } from 'app.constants';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { QuestionReviewerStats, QuestionSubmitterStats, TranslationReviewerStats, TranslationSubmitterStats } from '../contributor-dashboard-admin-summary.model';
import { CdAdminQuestionRoleEditorModal } from '../question-role-editor-modal/cd-admin-question-role-editor-modal.component';
import { CdAdminTranslationRoleEditorModal } from '../translation-role-editor-modal/cd-admin-translation-role-editor-modal.component';
import constants from 'assets/constants';
import isEqual from 'lodash/isEqual';

@Component({
  selector: 'contributor-admin-stats-table',
  templateUrl: './contributor-admin-stats-table.component.html',
  animations: [
    trigger('detailExpand', [
      state('collapsed', style(
        {height: '0px', minHeight: '0', paddingBottom: '0'})),
      state('expanded', style({height: '*'})),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
    trigger('chevronExpand', [
      state('expanded', style({ transform: 'rotate(90deg)' })),
      state('collapsed', style({ transform: 'rotate(0)' })),
      transition('expanded => collapsed', animate('200ms ease-out')),
      transition('collapsed => expanded', animate('200ms ease-in')),
    ]),
    trigger('mobileChevronExpand', [
      state('expanded', style({ transform: 'rotate(-90deg)' })),
      state('collapsed', style({ transform: 'rotate(90deg)' })),
      transition('expanded => collapsed', animate('200ms ease-out')),
      transition('collapsed => expanded', animate('200ms ease-in')),
    ]),
  ],
})
export class ContributorAdminStatsTable implements OnInit {
  @Input() inputs: { activeTab: string;
                     filter: ContributorAdminDashboardFilter; } =
      {
        activeTab: 'Translation Submitter',
        filter: ContributorAdminDashboardFilter.createDefault()
      };

  columnsToDisplay = [
    'chevron',
    'contributorName',
    'recentPerformance',
    'overallAccuracy',
    'submittedTranslationsCount',
    'lastContributedInDays',
    'role'
  ];

  dataSource: TranslationSubmitterStats[] |
    TranslationReviewerStats[] |
    QuestionSubmitterStats[] |
    QuestionReviewerStats[] = [];

  nextOffset: number = 0;
  more: boolean = true;

  expandedElement: TranslationSubmitterStats[] |
    TranslationReviewerStats[] |
    QuestionSubmitterStats[] |
    QuestionReviewerStats[] | null | [] = null;

  TAB_NAME_TRANSLATION_SUBMITTER: string = 'Translation Submitter';
  TAB_NAME_TRANSLATION_REVIEWER: string = 'Translation Reviewer';
  TAB_NAME_QUESTION_SUBMITTER: string = 'Question Submitter';
  TAB_NAME_QUESTION_REVIEWER: string = 'Question Reviewer';
  TAB_NAME_LANGUAGE_COORDINATOR: string = 'Language Coordinator';
  TAB_NAME_QUESTION_COORDINATOR: string = 'Question Coordinator';
  loadingMessage!: string;
  noDataMessage!: string;
  itemsPerPageChoice: number[] = [20, 50, 100];
  itemsPerPage: number = 20;
  statsPageNumber: number = 0;
  MOVE_TO_NEXT_PAGE: string = 'next_page';
  MOVE_TO_PREV_PAGE: string = 'prev_page';
  firstTimeFetchingData: boolean = true;

  constructor(
    private windowRef: WindowRef,
    private ContributorDashboardAdminStatsBackendApiService:
      ContributorDashboardAdminStatsBackendApiService,
    private contributorDashboardAdminBackendApiService:
      ContributorDashboardAdminBackendApiService,
    private modalService: NgbModal,
  ) {}

  ngOnInit(): void {
    this.loadingMessage = 'Loading';
    if (this.inputs.filter) {
      this.updateColumnsToDisplay();
    }
  }

  openCdAdminQuestionRoleEditorModal(username: string): void {
    this.contributorDashboardAdminBackendApiService
      .contributionReviewerRightsAsync(username).then(response => {
        const modelRef = this.modalService.open(
          CdAdminQuestionRoleEditorModal);
        modelRef.componentInstance.username = username;
        modelRef.componentInstance.rights = {
          isQuestionSubmitter: response.can_submit_questions,
          isQuestionReviewer: response.can_review_questions
        };
        modelRef.result.then(results => {
          if (results.isQuestionSubmitter !== response.can_submit_questions) {
            if (results.isQuestionSubmitter) {
              this.contributorDashboardAdminBackendApiService
                .addContributionReviewerAsync(
                  constants.CD_USER_RIGHTS_CATEGORY_SUBMIT_QUESTION,
                  username,
                  null
                );
            } else {
              this.contributorDashboardAdminBackendApiService
                .removeContributionReviewerAsync(
                  username,
                  constants.CD_USER_RIGHTS_CATEGORY_SUBMIT_QUESTION,
                  null
                );
            }
          }
          if (results.isQuestionReviewer !== response.can_review_questions) {
            if (results.isQuestionReviewer) {
              this.contributorDashboardAdminBackendApiService
                .addContributionReviewerAsync(
                  constants.CD_USER_RIGHTS_CATEGORY_REVIEW_QUESTION,
                  username,
                  null
                );
            } else {
              this.contributorDashboardAdminBackendApiService
                .removeContributionReviewerAsync(
                  username,
                  constants.CD_USER_RIGHTS_CATEGORY_REVIEW_QUESTION,
                  null
                );
            }
          }
        }, () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        });
      });
  }

  openCdAdminTranslationRoleEditorModal(username: string): void {
    this.contributorDashboardAdminBackendApiService
      .contributionReviewerRightsAsync(username).then(response => {
        const modalRef = this.modalService.open(
          CdAdminTranslationRoleEditorModal);
        modalRef.componentInstance.username = username;
        modalRef.componentInstance.assignedLanguageIds = (
          response.can_review_translation_for_language_codes);
        const languageIdToName: Record<string, string> = {};
        constants.SUPPORTED_AUDIO_LANGUAGES.forEach(
          language => languageIdToName[language.id] = language.description);
        modalRef.componentInstance.languageIdToName = languageIdToName;
      });
  }

  getUpperLimitValueForPagination(): number {
    return (
      Math.min((
        (this.statsPageNumber * this.itemsPerPage) +
          this.itemsPerPage), (this.statsPageNumber * this.itemsPerPage) +
          this.dataSource.length));
  }

  openRoleEditor(username: string): void {
    this.expandedElement = null;
    if (this.inputs.activeTab === this.TAB_NAME_TRANSLATION_REVIEWER ||
      this.inputs.activeTab === this.TAB_NAME_TRANSLATION_SUBMITTER) {
      this.openCdAdminTranslationRoleEditorModal(username);
    } else if (this.inputs.activeTab === this.TAB_NAME_QUESTION_SUBMITTER ||
      this.inputs.activeTab === this.TAB_NAME_QUESTION_REVIEWER) {
      this.openCdAdminQuestionRoleEditorModal(username);
    }
  }

  checkMobileView(): boolean {
    return (this.windowRef.nativeWindow.innerWidth < 800);
  }

  changesExist(changes: SimpleChanges): boolean {
    let changesExist = false;
    for (let propName in changes) {
      if (!isEqual(changes[propName].currentValue,
        changes[propName].previousValue)) {
        changesExist = true;
        break;
      }
    }
    return changesExist;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.changesExist(changes)) {
      this.loadingMessage = 'Loading';
      this.noDataMessage = '';
      this.refreshPagination();
    }
  }

  updateColumnsToDisplay(): void {
    if (this.inputs.activeTab === this.TAB_NAME_TRANSLATION_SUBMITTER) {
      this.columnsToDisplay = [
        'chevron',
        'contributorName',
        'recentPerformance',
        'overallAccuracy',
        'submittedTranslationsCount',
        'lastContributedInDays',
        'role'
      ];
      if (this.checkMobileView()) {
        this.columnsToDisplay = [
          'contributorName',
          'recentPerformance',
          'overallAccuracy',
          'submittedTranslationsCount',
          'lastContributedInDays',
          'role',
          'chevron'
        ];
      }
      this.ContributorDashboardAdminStatsBackendApiService
        .fetchContributorAdminStats(
          this.inputs.filter,
          this.itemsPerPage,
          this.nextOffset,
          AppConstants.CONTRIBUTION_STATS_TYPE_TRANSLATION,
          AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION).then(
          (response) => {
            this.dataSource = response.stats;
            this.nextOffset = response.nextOffset;
            this.more = response.more;
            this.loadingMessage = '';
            this.noDataMessage = '';
            if (this.dataSource.length === 0) {
              this.noDataMessage = 'No statistics to display';
            }
          });
    } else if (this.inputs.activeTab === this.TAB_NAME_TRANSLATION_REVIEWER) {
      this.columnsToDisplay = [
        'chevron',
        'contributorName',
        'reviewedTranslationsCount',
        'lastContributedInDays',
        'role'
      ];
      if (this.checkMobileView()) {
        this.columnsToDisplay = [
          'contributorName',
          'reviewedTranslationsCount',
          'lastContributedInDays',
          'role',
          'chevron'
        ];
      }
      this.ContributorDashboardAdminStatsBackendApiService
        .fetchContributorAdminStats(
          this.inputs.filter,
          this.itemsPerPage,
          this.nextOffset,
          AppConstants.CONTRIBUTION_STATS_TYPE_TRANSLATION,
          AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW).then(
          (response) => {
            this.dataSource = response.stats;
            this.nextOffset = response.nextOffset;
            this.more = response.more;
            this.loadingMessage = '';
            this.noDataMessage = '';
            if (this.dataSource.length === 0) {
              this.noDataMessage = 'No statistics to display';
            }
          });
    } else if (this.inputs.activeTab === this.TAB_NAME_QUESTION_SUBMITTER) {
      this.columnsToDisplay = [
        'chevron',
        'contributorName',
        'recentPerformance',
        'overallAccuracy',
        'submittedQuestionsCount',
        'lastContributedInDays',
        'role'
      ];
      if (this.checkMobileView()) {
        this.columnsToDisplay = [
          'contributorName',
          'recentPerformance',
          'overallAccuracy',
          'submittedQuestionsCount',
          'lastContributedInDays',
          'role',
          'chevron'
        ];
      }
      this.ContributorDashboardAdminStatsBackendApiService
        .fetchContributorAdminStats(
          this.inputs.filter,
          this.itemsPerPage,
          this.nextOffset,
          AppConstants.CONTRIBUTION_STATS_TYPE_QUESTION,
          AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION).then(
          (response) => {
            this.dataSource = response.stats;
            this.nextOffset = response.nextOffset;
            this.more = response.more;
            this.loadingMessage = '';
            this.noDataMessage = '';
            if (this.dataSource.length === 0) {
              this.noDataMessage = 'No statistics to display';
            }
          });
    } else if (this.inputs.activeTab === this.TAB_NAME_QUESTION_REVIEWER) {
      this.columnsToDisplay = [
        'chevron',
        'contributorName',
        'reviewedQuestionsCount',
        'lastContributedInDays',
        'role'
      ];
      if (this.checkMobileView()) {
        this.columnsToDisplay = [
          'contributorName',
          'reviewedQuestionsCount',
          'lastContributedInDays',
          'role',
          'chevron'
        ];
      }
      this.ContributorDashboardAdminStatsBackendApiService
        .fetchContributorAdminStats(
          this.inputs.filter,
          this.itemsPerPage,
          this.nextOffset,
          AppConstants.CONTRIBUTION_STATS_TYPE_QUESTION,
          AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW).then(
          (response) => {
            this.dataSource = response.stats;
            this.nextOffset = response.nextOffset;
            this.more = response.more;
            this.loadingMessage = '';
            this.noDataMessage = '';
            if (this.dataSource.length === 0) {
              this.noDataMessage = 'No statistics to display';
            }
          });
    }
  }

  refreshPagination(): void {
    this.loadingMessage = 'Loading';
    this.nextOffset = 0;
    this.dataSource = [];
    this.more = true;
    this.firstTimeFetchingData = true;
    this.goToPageNumber(0);
  }

  goToPageNumber(pageNumber: number): void {
    this.statsPageNumber = pageNumber;
    this.nextOffset = (pageNumber * this.itemsPerPage);
    this.updateColumnsToDisplay();
  }

  navigatePage(direction: string): void {
    if (direction === this.MOVE_TO_NEXT_PAGE) {
      this.loadingMessage = 'Loading';
      this.goToPageNumber(this.statsPageNumber + 1);
    } else {
      this.loadingMessage = 'Loading';
      this.goToPageNumber(this.statsPageNumber - 1);
    }
  }
}


angular.module('oppia').directive('contributorAdminDashboardPage',
  downgradeComponent({
    component: ContributorAdminStatsTable
  }) as angular.IDirectiveFactory);
