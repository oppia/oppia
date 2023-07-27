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
import { ContributorAdminDashboardFilter } from '../contributor-admin-dashboard-filter.model';
import { AppConstants } from 'app.constants';
import { QuestionReviewerStats, QuestionSubmitterStats, TranslationReviewerStats, TranslationSubmitterStats } from '../contributor-dashboard-admin-summary.model';

@Component({
  selector: 'contributor-admin-stats-table',
  templateUrl: './contributor-admin-stats-table.component.html',
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
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

  constructor(
    private windowRef: WindowRef,
    private ContributorDashboardAdminStatsBackendApiService:
      ContributorDashboardAdminStatsBackendApiService
  ) {}

  ngOnInit(): void {
    this.loadingMessage = 'Loading';
    this.updateColumnsToDisplay();
  }

  checkMobileView(): boolean {
    return (this.windowRef.nativeWindow.innerWidth < 800);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.activeTab) {
      this.loadingMessage = 'Loading';
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
          'chevron'
        ];
      }
      this.ContributorDashboardAdminStatsBackendApiService
        .fetchContributorAdminStats(
          ContributorAdminDashboardFilter.createDefault(),
          20,
          0,
          AppConstants.CONTRIBUTION_STATS_TYPE_TRANSLATION,
          AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION).then(
          (response) => {
            this.dataSource = response.stats;
            this.nextOffset = response.nextOffset;
            this.more = response.more;
            this.loadingMessage = '';
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
          'chevron'
        ];
      }
      this.ContributorDashboardAdminStatsBackendApiService
        .fetchContributorAdminStats(
          ContributorAdminDashboardFilter.createDefault(),
          20,
          0,
          AppConstants.CONTRIBUTION_STATS_TYPE_TRANSLATION,
          AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW).then(
          (response) => {
            this.dataSource = response.stats;
            this.nextOffset = response.nextOffset;
            this.more = response.more;
            this.loadingMessage = '';
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
          'chevron'
        ];
      }
      this.ContributorDashboardAdminStatsBackendApiService
        .fetchContributorAdminStats(
          ContributorAdminDashboardFilter.createDefault(),
          20,
          0,
          AppConstants.CONTRIBUTION_STATS_TYPE_QUESTION,
          AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION).then(
          (response) => {
            this.dataSource = response.stats;
            this.nextOffset = response.nextOffset;
            this.more = response.more;
            this.loadingMessage = '';
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
          'chevron'
        ];
      }
      this.ContributorDashboardAdminStatsBackendApiService
        .fetchContributorAdminStats(
          ContributorAdminDashboardFilter.createDefault(),
          20,
          0,
          AppConstants.CONTRIBUTION_STATS_TYPE_QUESTION,
          AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW).then(
          (response) => {
            this.dataSource = response.stats;
            this.nextOffset = response.nextOffset;
            this.more = response.more;
            this.loadingMessage = '';
          });
    }
  }
}


angular.module('oppia').directive('contributorAdminDashboardPage',
  downgradeComponent({
    component: ContributorAdminStatsTable
  }) as angular.IDirectiveFactory);
