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

import {Component, Input, OnInit, SimpleChanges} from '@angular/core';

import {WindowRef} from 'services/contextual/window-ref.service';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {ContributorDashboardAdminStatsBackendApiService} from '../services/contributor-dashboard-admin-stats-backend-api.service';
import {ContributorDashboardAdminBackendApiService} from '../services/contributor-dashboard-admin-backend-api.service';
import {ContributorAttribute} from '../services/format-contributor-attributes.service';
import {ContributorAdminDashboardFilter} from '../contributor-admin-dashboard-filter.model';
import {AppConstants} from 'app.constants';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ContributorStats} from '../contributor-dashboard-admin-summary.model';
import {CdAdminQuestionRoleEditorModal} from '../question-role-editor-modal/cd-admin-question-role-editor-modal.component';
import {CdAdminTranslationRoleEditorModal} from '../translation-role-editor-modal/cd-admin-translation-role-editor-modal.component';
import constants from 'assets/constants';
import isEqual from 'lodash/isEqual';
@Component({
  selector: 'contributor-admin-stats-table',
  templateUrl: './contributor-admin-stats-table.component.html',
  animations: [
    trigger('detailExpand', [
      state(
        'collapsed',
        style({height: '0px', minHeight: '0', paddingBottom: '0'})
      ),
      state('expanded', style({height: '*'})),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
    trigger('chevronExpand', [
      state('expanded', style({transform: 'rotate(90deg)'})),
      state('collapsed', style({transform: 'rotate(0)'})),
      transition('expanded => collapsed', animate('200ms ease-out')),
      transition('collapsed => expanded', animate('200ms ease-in')),
    ]),
    trigger('mobileChevronExpand', [
      state('expanded', style({transform: 'rotate(-90deg)'})),
      state('collapsed', style({transform: 'rotate(90deg)'})),
      transition('expanded => collapsed', animate('200ms ease-out')),
      transition('collapsed => expanded', animate('200ms ease-in')),
    ]),
  ],
})
export class ContributorAdminStatsTable implements OnInit {
  @Input() inputs: {
    activeTab: string;
    filter: ContributorAdminDashboardFilter;
  } = {
    activeTab: 'Translation Submitter',
    filter: ContributorAdminDashboardFilter.createDefault(),
  };

  columnsToDisplay: string[] = [];
  allStats: ContributorStats[] = [];
  tableCanShowMoreItems: boolean = true;

  expandedElement: ContributorStats[] | null = null;

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
  // The maximumExpectedItems readony variable is used while fetching data from the datastore. We don't expect to ever exceed
  // this number of items, so when we fetch the data, we retrieve all the items at once, and then handle the pagination within the component.
  // If the number of items does happen to be exceeded, we will display a '+' sign next to the total number of items.
  readonly maximumExpectedItems: number = 1000;
  tableHasMoreThanMaximumExpectedItems: boolean = false;
  MOVE_TO_NEXT_PAGE: string = 'next_page';
  MOVE_TO_PREV_PAGE: string = 'prev_page';

  constructor(
    private windowRef: WindowRef,
    private contributorDashboardAdminStatsBackendApiService: ContributorDashboardAdminStatsBackendApiService,
    private contributorDashboardAdminBackendApiService: ContributorDashboardAdminBackendApiService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.allStats = [];
    this.loadingMessage = 'Loading';
    if (this.inputs.filter) {
      this.displayContributorAdminStats();
    }
  }

  getLastContributedType(activeTab: string): string {
    let lastContributedType: string = '';
    switch (activeTab) {
      case this.TAB_NAME_TRANSLATION_SUBMITTER:
        lastContributedType = 'Last Translated';
        break;
      case this.TAB_NAME_TRANSLATION_REVIEWER:
        lastContributedType = 'Last Reviewed';
        break;
      case this.TAB_NAME_QUESTION_SUBMITTER:
        lastContributedType = 'Last Submitted';
        break;
      case this.TAB_NAME_QUESTION_REVIEWER:
        lastContributedType = 'Last Reviewed';
        break;
    }

    return lastContributedType;
  }

  getContributionCountLabel(activeTab: string): string {
    let contributionCountLabel: string = '';

    switch (activeTab) {
      case this.TAB_NAME_TRANSLATION_SUBMITTER:
        contributionCountLabel = 'Translated Cards';
        break;
      case this.TAB_NAME_TRANSLATION_REVIEWER:
        contributionCountLabel = 'Reviewed Cards';
        break;
      case this.TAB_NAME_QUESTION_SUBMITTER:
        contributionCountLabel = 'Questions Submitted';
        break;
      case this.TAB_NAME_QUESTION_REVIEWER:
        contributionCountLabel = 'Questions Reviewed';
        break;
    }

    return contributionCountLabel;
  }

  getContributionCount(
    activeTab: string,
    submittedTranslationCount: number,
    reviewedTranslationsCount: number,
    submittedQuestionsCount: number,
    reviewedQuestionsCount: number
  ): number {
    let contributionCount: number = 0;

    switch (activeTab) {
      case this.TAB_NAME_TRANSLATION_SUBMITTER:
        contributionCount = submittedTranslationCount;
        break;
      case this.TAB_NAME_TRANSLATION_REVIEWER:
        contributionCount = reviewedTranslationsCount;
        break;
      case this.TAB_NAME_QUESTION_SUBMITTER:
        contributionCount = submittedQuestionsCount;
        break;
      case this.TAB_NAME_QUESTION_REVIEWER:
        contributionCount = reviewedQuestionsCount;
        break;
    }

    return contributionCount;
  }

  getFormattedContributorAttributes(
    contributorStats: ContributorStats
  ): ContributorAttribute[] {
    return contributorStats.getContributorAttributes(contributorStats);
  }

  openCdAdminQuestionRoleEditorModal(username: string): void {
    this.contributorDashboardAdminBackendApiService
      .contributionReviewerRightsAsync(username)
      .then(response => {
        const modelRef = this.modalService.open(CdAdminQuestionRoleEditorModal);
        modelRef.componentInstance.username = username;
        modelRef.componentInstance.rights = {
          isQuestionSubmitter: response.can_submit_questions,
          isQuestionReviewer: response.can_review_questions,
        };
        modelRef.result.then(
          results => {
            this.contributorDashboardAdminBackendApiService.updateQuestionRightsAsync(
              username,
              results.isQuestionSubmitter,
              results.isQuestionReviewer,
              response.can_submit_questions,
              response.can_review_questions
            );
          },
          () => {
            // Note to developers:
            // This callback is triggered when the Cancel button is clicked.
            // No further action is needed.
          }
        );
      });
  }

  openCdAdminTranslationRoleEditorModal(username: string): void {
    this.contributorDashboardAdminBackendApiService
      .contributionReviewerRightsAsync(username)
      .then(response => {
        const modalRef = this.modalService.open(
          CdAdminTranslationRoleEditorModal
        );
        modalRef.componentInstance.username = username;
        modalRef.componentInstance.assignedLanguageIds =
          response.can_review_translation_for_language_codes;
        const languageIdToName: Record<string, string> = {};
        constants.SUPPORTED_AUDIO_LANGUAGES.forEach(
          language => (languageIdToName[language.id] = language.description)
        );
        modalRef.componentInstance.languageIdToName = languageIdToName;
      });
  }

  getIndexOfLastItemOnPage(): number {
    return Math.min(
      this.statsPageNumber * this.itemsPerPage + this.itemsPerPage,
      this.allStats.length
    );
  }

  getDisplayedIndexOfFirstItemOnPage(): number {
    return this.getIndexOfFirstItemOnPage() + 1;
  }

  private getIndexOfFirstItemOnPage(): number {
    return this.statsPageNumber * this.itemsPerPage;
  }

  getOverallItemCount(): string {
    return (
      this.allStats.length.toString() +
      (this.tableHasMoreThanMaximumExpectedItems ? '+' : '')
    );
  }

  openRoleEditor(username: string): void {
    this.expandedElement = null;
    if (
      this.inputs.activeTab === this.TAB_NAME_TRANSLATION_REVIEWER ||
      this.inputs.activeTab === this.TAB_NAME_TRANSLATION_SUBMITTER
    ) {
      this.openCdAdminTranslationRoleEditorModal(username);
    } else if (
      this.inputs.activeTab === this.TAB_NAME_QUESTION_SUBMITTER ||
      this.inputs.activeTab === this.TAB_NAME_QUESTION_REVIEWER
    ) {
      this.openCdAdminQuestionRoleEditorModal(username);
    }
  }

  isMobileView(): boolean {
    return this.windowRef.nativeWindow.innerWidth < 800;
  }

  changesExist(changes: SimpleChanges): boolean {
    let changesExist = false;
    for (let propName in changes) {
      if (
        !isEqual(
          changes[propName].currentValue,
          changes[propName].previousValue
        )
      ) {
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

  getContributionType(activeTab: string): string {
    let contributionType: string = '';

    switch (activeTab) {
      case this.TAB_NAME_TRANSLATION_SUBMITTER:
      case this.TAB_NAME_TRANSLATION_REVIEWER:
        contributionType = AppConstants.CONTRIBUTION_STATS_TYPE_TRANSLATION;
        break;
      case this.TAB_NAME_QUESTION_SUBMITTER:
      case this.TAB_NAME_QUESTION_REVIEWER:
        contributionType = AppConstants.CONTRIBUTION_STATS_TYPE_QUESTION;
        break;
    }

    return contributionType;
  }

  getContributionSubType(activeTab: string): string {
    let contributionSubType: string = '';

    switch (activeTab) {
      case this.TAB_NAME_TRANSLATION_SUBMITTER:
      case this.TAB_NAME_QUESTION_SUBMITTER:
        contributionSubType =
          AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION;
        break;
      case this.TAB_NAME_TRANSLATION_REVIEWER:
      case this.TAB_NAME_QUESTION_REVIEWER:
        contributionSubType = AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW;
        break;
    }

    return contributionSubType;
  }

  updateColumns(contributionSubType: string): void {
    if (this.isMobileView()) {
      this.columnsToDisplay = ['contributorName'];
    } else {
      this.columnsToDisplay = ['chevron', 'contributorName'];
    }
    if (
      contributionSubType === AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION
    ) {
      this.columnsToDisplay.push('recentPerformance', 'overallAccuracy');
    }
    this.columnsToDisplay.push(
      'contributionCount',
      'lastContributedInDays',
      'role'
    );

    if (this.isMobileView()) {
      this.columnsToDisplay.push('chevron');
    }
  }

  displayStatsForCurrentPage(): ContributorStats[] {
    return this.allStats.slice(
      this.getIndexOfFirstItemOnPage(),
      this.getIndexOfLastItemOnPage()
    );
  }

  fetchContributorAdminStats(): void {
    let contributionType: string = this.getContributionType(
      this.inputs.activeTab
    );
    let contributionSubType: string = this.getContributionSubType(
      this.inputs.activeTab
    );

    this.contributorDashboardAdminStatsBackendApiService
      .fetchContributorAdminStats(
        this.inputs.filter,
        this.maximumExpectedItems,
        0,
        contributionType,
        contributionSubType
      )
      .then(response => {
        this.allStats = response.stats;
        this.tableHasMoreThanMaximumExpectedItems = response.more;
        this.tableCanShowMoreItems =
          this.getIndexOfLastItemOnPage() < this.allStats.length;
        this.loadingMessage = '';
        if (!this.hasSomeStats()) {
          this.noDataMessage = 'No statistics to display';
        } else {
          this.noDataMessage = '';
          this.updateColumns(contributionSubType);
        }
      });
  }

  hasSomeStats(): boolean {
    return this.allStats.length > 0;
  }

  displayContributorAdminStats(): void {
    if (!this.hasSomeStats()) {
      this.fetchContributorAdminStats();
    } else {
      this.tableCanShowMoreItems =
        this.getIndexOfLastItemOnPage() < this.allStats.length;
      this.loadingMessage = '';
      this.noDataMessage = '';
    }
  }

  refreshPagination(): void {
    this.loadingMessage = 'Loading';
    this.allStats = [];
    this.goToPageNumber(0);
  }

  onItemsPerPageChange(newItemsPerPage: string): void {
    // Convert newItemsPerPage to a number, as Angular has converted
    // the numbers in the dropdown that calls this function to strings.
    this.itemsPerPage = Number(newItemsPerPage);
    this.refreshPagination();
  }

  goToPageNumber(pageNumber: number): void {
    this.statsPageNumber = pageNumber;
    this.displayContributorAdminStats();
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
