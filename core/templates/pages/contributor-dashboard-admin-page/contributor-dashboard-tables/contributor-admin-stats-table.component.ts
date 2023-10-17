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
  @Input() activeTab: string = 'Translation Submitter';
  @Input() filter: ContributorAdminDashboardFilter = (
    ContributorAdminDashboardFilter.createDefault());

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
  more: boolean = false;

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
    if (this.filter) {
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
                  constants.CONTRIBUTION_RIGHT_CATEGORY_SUBMIT_QUESTION,
                  username,
                  null
                );
            } else {
              this.contributorDashboardAdminBackendApiService
                .removeContributionReviewerAsync(
                  username,
                  constants.CONTRIBUTION_RIGHT_CATEGORY_SUBMIT_QUESTION,
                  null
                );
            }
          }
          if (results.isQuestionReviewer !== response.can_review_questions) {
            if (results.isQuestionReviewer) {
              this.contributorDashboardAdminBackendApiService
                .addContributionReviewerAsync(
                  constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_QUESTION,
                  username,
                  null
                );
            } else {
              this.contributorDashboardAdminBackendApiService
                .removeContributionReviewerAsync(
                  username,
                  constants.CONTRIBUTION_RIGHT_CATEGORY_REVIEW_QUESTION,
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

  openRoleEditor(username: string): void {
    this.expandedElement = null;
    if (this.activeTab === this.TAB_NAME_TRANSLATION_REVIEWER ||
      this.activeTab === this.TAB_NAME_TRANSLATION_SUBMITTER) {
      this.openCdAdminTranslationRoleEditorModal(username);
    } else if (this.activeTab === this.TAB_NAME_QUESTION_SUBMITTER ||
      this.activeTab === this.TAB_NAME_QUESTION_REVIEWER) {
      this.openCdAdminQuestionRoleEditorModal(username);
    }
  }

  checkMobileView(): boolean {
    return (this.windowRef.nativeWindow.innerWidth < 800);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes) {
      this.loadingMessage = 'Loading';
      this.noDataMessage = '';
      this.updateColumnsToDisplay();
    }
  }

  updateColumnsToDisplay(): void {
    if (this.activeTab === this.TAB_NAME_TRANSLATION_SUBMITTER) {
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
          this.filter,
          20,
          0,
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
    } else if (this.activeTab === this.TAB_NAME_TRANSLATION_REVIEWER) {
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
          this.filter,
          20,
          0,
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
    } else if (this.activeTab === this.TAB_NAME_QUESTION_SUBMITTER) {
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
          this.filter,
          20,
          0,
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
    } else if (this.activeTab === this.TAB_NAME_QUESTION_REVIEWER) {
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
          this.filter,
          20,
          0,
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
}


angular.module('oppia').directive('contributorAdminDashboardPage',
  downgradeComponent({
    component: ContributorAdminStatsTable
  }) as angular.IDirectiveFactory);
