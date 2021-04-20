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
 * @fileoverview Component for the topics and skills dashboard.
 */

import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { SkillCreationService } from 'components/entity-creation-services/skill-creation.service';
import { TopicCreationService } from 'components/entity-creation-services/topic-creation.service';
import { SkillSummary } from 'domain/skill/skill-summary.model';
import { TopicSummary } from 'domain/topic/topic-summary.model';
import { TopicsAndSkillsDashboardBackendApiService } from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import { TopicsAndSkillsDashboardFilter } from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-filter.model';
import { debounce } from 'lodash';
import { Subscription } from 'rxjs';
import { AlertsService } from 'services/alerts.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { TopicsAndSkillsDashboardPageConstants } from './topics-and-skills-dashboard-page.constants';
import { TopicsAndSkillsDashboardPageService } from './topics-and-skills-dashboard-page.service';

require('base-components/base-content.directive.ts');
@Component({
  selector: 'oppia-topics-and-skills-dashboard-page',
  templateUrl: './topics-and-skills-dashboard-page.component.html'
})
export class TopicsAndSkillsDashboardPageComponent {
  directiveSubscriptions: Subscription = new Subscription();
  TOPIC_CLASSROOM_UNASSIGNED: string = 'UNASSIGNED';
  totalTopicSummaries: TopicSummary[] = [];
  topicSummaries: TopicSummary[] = [];
  totalEntityCountToDisplay: number;
  currentCount: number;
  totalSkillCount: number;
  skillsCategorizedByTopics;
  editableTopicSummaries: TopicSummary[] = [];
  untriagedSkillSummaries: SkillSummary[] = [];
  totalUntriagedSkillSummaries: SkillSummary[] = [];
  mergeableSkillSummaries: SkillSummary[] = [];
  skillSummaries: SkillSummary[] = [];

  userCanCreateTopic: boolean;
  userCanCreateSkill: boolean;
  userCanDeleteTopic: boolean;
  userCanDeleteSkill: boolean;

  TAB_NAME_TOPICS: string = 'topics';
  activeTab: string = this.TAB_NAME_TOPICS;
  MOVE_TO_NEXT_PAGE: string = 'next_page';
  MOVE_TO_PREV_PAGE: string = 'prev_page';
  TAB_NAME_SKILLS: string = 'skills';
  pageNumber: number = 0;
  topicPageNumber: number = 0;
  itemsPerPage: number = 10;
  skillPageNumber: number = 0;
  lastSkillPage: number = 0;
  selectedIndex = null;
  itemsPerPageChoice: number[] = [10, 15, 20];
  filterBoxIsShown: boolean;
  filterObject: TopicsAndSkillsDashboardFilter;
  classrooms = [];
  sortOptions = [];
  statusOptions = [];
  select2DropdownIsShown: boolean = true;
  fetchSkillsDebounced;
  lastPage: number;
  moreSkillsPresent;
  nextCursor: string;
  firstTimeFetchingSkills;
  displayedTopicSummaries: TopicSummary[] = [];
  displayedSkillSummaries: SkillSummary[] = [];
  skillStatusOptions: string[] = [];

  constructor(
    private alertsService: AlertsService,
    private focusManagerService: FocusManagerService,
    private skillCreationService: SkillCreationService,
    private topicCreationService: TopicCreationService,
    private topicsAndSkillsDashboardBackendApiService:
    TopicsAndSkillsDashboardBackendApiService,
    private topicsAndSkillsDashboardPageService:
    TopicsAndSkillsDashboardPageService,
    private windowDimensionsService: WindowDimensionsService
  ) {}

  ngOnInit(): void {
    this.filterBoxIsShown = !this.windowDimensionsService.isWindowNarrow();
    this.filterObject = TopicsAndSkillsDashboardFilter.createDefault();

    for (let key in TopicsAndSkillsDashboardPageConstants.TOPIC_SORT_OPTIONS) {
      this.sortOptions.push(
        TopicsAndSkillsDashboardPageConstants.TOPIC_SORT_OPTIONS[key]);
    }

    for (let key in TopicsAndSkillsDashboardPageConstants
      .TOPIC_PUBLISHED_OPTIONS) {
      this.statusOptions.push(
        TopicsAndSkillsDashboardPageConstants.TOPIC_PUBLISHED_OPTIONS[key]);
    }

    this.fetchSkillsDebounced = debounce(this.fetchSkills, 300);

    this.directiveSubscriptions.add(
      this.topicsAndSkillsDashboardBackendApiService.
        onTopicsAndSkillsDashboardReinitialized.subscribe(
          (stayInSameTab: boolean) => {
            this._initDashboard(stayInSameTab);
          }
        )
    );
    // The _initDashboard function is written separately since it is
    // also called in $scope.$on when some external events are
    // triggered.
    this._initDashboard(false);
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  generateNumbersTillRange(range: number): number[] {
    let arr: number[] = [];
    for (let i = 0; i < range; i++) {
      arr.push(i);
    }
    return arr;
  }

  /**
   * Tells whether the next skill page is present in memory or not.
   * This case occurs when the next page is fetched from the backend
   * and then we move back one page, but the next page is still in
   * memory. So instead of making the backend call for the next page,
   * we first check if the next page is present in memory.
   * @returns {Boolean} - Whether the next page is present or not.
   */
  isNextSkillPagePresent(): boolean {
    let totalSkillsPresent: number = this.skillSummaries.length;
    // Here +1 is used since we are checking the next page and
    // another +1 because page numbers start from 0.
    let numberOfSkillsRequired: number = (
      (this.skillPageNumber + 2) * this.itemsPerPage);

    return totalSkillsPresent >= numberOfSkillsRequired;
  }

  /**
   * Sets the active tab to topics or skills.
   * @param {String} tabName - name of the tab to set.
   */
  setActiveTab(tabName: string): void {
    this.activeTab = tabName;
    this.filterObject.reset();
    if (this.activeTab === this.TAB_NAME_TOPICS) {
      this.goToPageNumber(this.topicPageNumber);
      this.focusManagerService.setFocus('createTopicBtn');
    } else if (this.activeTab === this.TAB_NAME_SKILLS) {
      this.initSkillDashboard();
      this.focusManagerService.setFocus('createSkillBtn');
    }
  }


  initSkillDashboard(): void {
    this.skillStatusOptions = [];
    this.moreSkillsPresent = true;
    this.firstTimeFetchingSkills = true;
    for (let key in TopicsAndSkillsDashboardPageConstants
      .SKILL_STATUS_OPTIONS) {
      this.skillStatusOptions
        .push(TopicsAndSkillsDashboardPageConstants.SKILL_STATUS_OPTIONS[key]);
    }
  }

  createTopic(): void {
    this.topicCreationService.createNewTopic();
  }

  createSkill(): void {
    this.skillCreationService.createNewSkill();
  }

  /**
   * @param {Number} pageNumber - Page number to navigate to.
   */
  goToPageNumber(pageNumber: number): void {
    if (this.activeTab === this.TAB_NAME_TOPICS) {
      this.topicPageNumber = pageNumber;
      this.pageNumber = this.topicPageNumber;
      this.currentCount = this.topicSummaries.length;
      this.displayedTopicSummaries =
              this.topicSummaries.slice(
                pageNumber * this.itemsPerPage,
                (pageNumber + 1) * this.itemsPerPage);
    } else if (this.activeTab === this.TAB_NAME_SKILLS) {
      this.skillPageNumber = pageNumber;
      this.pageNumber = this.skillPageNumber;
      this.displayedSkillSummaries = this.skillSummaries.slice(
        pageNumber * this.itemsPerPage,
        (pageNumber + 1) * this.itemsPerPage);
    }
  }

  fetchSkills(): void {
    if (this.moreSkillsPresent) {
      this.topicsAndSkillsDashboardBackendApiService
        .fetchSkillsDashboardDataAsync(
          this.filterObject, this.itemsPerPage, this.nextCursor).then(
          (response) => {
            this.moreSkillsPresent = response.more;
            this.nextCursor = response.nextCursor;
            this.skillSummaries.push(...response.skillSummaries);
            this.currentCount = this.skillSummaries.length;
            if (this.firstTimeFetchingSkills) {
              this.goToPageNumber(0);
              this.firstTimeFetchingSkills = false;
            } else {
              this.goToPageNumber(this.pageNumber + 1);
            }
          });
    } else if (this.skillSummaries.length >
            ((this.skillPageNumber + 1) * this.itemsPerPage)) {
      this.goToPageNumber(this.pageNumber + 1);
    }
  }

  navigateSkillPage(direction: string): void {
    if (direction === this.MOVE_TO_NEXT_PAGE) {
      if (this.isNextSkillPagePresent()) {
        this.goToPageNumber(this.pageNumber + 1);
      } else {
        this.fetchSkillsDebounced();
      }
    } else if (this.pageNumber >= 1) {
      this.goToPageNumber(this.pageNumber - 1);
    }
  }

  /**
   * @param {String} direction - Direction, whether to change the
   * page to left or right by 1.
   */
  changePageByOne(direction: string): void {
    this.lastPage = parseInt(
      String(this.currentCount / this.itemsPerPage));
    if (direction === this.MOVE_TO_PREV_PAGE && this.pageNumber >= 1) {
      this.goToPageNumber(this.pageNumber - 1);
    } else if (direction === this.MOVE_TO_NEXT_PAGE &&
            this.pageNumber < this.lastPage - 1) {
      this.goToPageNumber(this.pageNumber + 1);
    }
  }

  applyFilters(): void {
    if (this.activeTab === this.TAB_NAME_SKILLS) {
      this.moreSkillsPresent = true;
      this.firstTimeFetchingSkills = true;
      this.skillSummaries = [];
      this.nextCursor = null;
      this.fetchSkills();
      this._forceSelect2Refresh();
      return;
    }
    this.topicSummaries = (
      this.topicsAndSkillsDashboardPageService.getFilteredTopics(
        this.totalTopicSummaries, this.filterObject));

    this.displayedTopicSummaries =
            this.topicSummaries.slice(0, this.itemsPerPage);
    this.currentCount = this.topicSummaries.length;
    this.goToPageNumber(0);
    this._forceSelect2Refresh();
  }

  // Select2 dropdown cannot automatically refresh its display
  // after being translated.
  // Use ctrl.select2DropdownIsShown in its ng-if attribute
  // and this function to force it to reload.
  _forceSelect2Refresh(): void {
    this.select2DropdownIsShown = false;
    setTimeout(() => {
      this.select2DropdownIsShown = true;
    }, 100);
  }

  resetFilters(): void {
    this.getUpperLimitValueForPagination();
    this.topicSummaries = this.totalTopicSummaries;
    this.currentCount = this.totalEntityCountToDisplay;
    this.filterObject.reset();
    this.applyFilters();
  }

  toggleFilterBox(): void {
    this.filterBoxIsShown = !this.filterBoxIsShown;
  }

  getUpperLimitValueForPagination(): number {
    return (
      Math.min((
        (this.pageNumber * this.itemsPerPage) +
          this.itemsPerPage), this.currentCount));
  }

  getTotalCountValueForSkills(): number | string {
    if (this.skillSummaries.length > this.itemsPerPage) {
      return 'many';
    }

    return this.skillSummaries.length;
  }

  refreshPagination(): void {
    this.goToPageNumber(0);
  }

  /**
   * Calls the TopicsAndSkillsDashboardBackendApiService and fetches
   * the topics and skills dashboard data.
   * @param {Boolean} stayInSameTab - To stay in the same tab or not.
  */
  _initDashboard(stayInSameTab: boolean): void {
    this.topicsAndSkillsDashboardBackendApiService.fetchDashboardDataAsync()
      .then((response) => {
        this.totalTopicSummaries = response.topicSummaries;
        this.topicSummaries = this.totalTopicSummaries;
        this.totalEntityCountToDisplay = this.topicSummaries.length;
        this.currentCount = this.totalEntityCountToDisplay;
        this.applyFilters();
        this.editableTopicSummaries = this.topicSummaries
          .filter((summary) => summary.canEditTopic === true);
        this.focusManagerService.setFocus('createTopicBtn');
        this.totalSkillCount = response.totalSkillCount;
        this.skillsCategorizedByTopics = response.categorizedSkillsDict;
        this.untriagedSkillSummaries = response.untriagedSkillSummaries;
        this.totalUntriagedSkillSummaries = this.untriagedSkillSummaries;
        this.mergeableSkillSummaries = response.mergeableSkillSummaries;

        if (!stayInSameTab || !this.activeTab) {
          this.activeTab = this.TAB_NAME_TOPICS;
        }
        this.userCanCreateSkill = response.canCreateSkill;
        this.userCanCreateTopic = response.canCreateTopic;
        this.userCanDeleteSkill = response.canDeleteSkill;
        this.userCanDeleteTopic = response.canDeleteTopic;

        if (this.topicSummaries.length === 0 &&
            this.untriagedSkillSummaries.length !== 0) {
          this.activeTab = this.TAB_NAME_SKILLS;
          this.initSkillDashboard();
          this.focusManagerService.setFocus('createSkillBtn');
        }
        this.classrooms = response.allClassroomNames;
      });
  }
}

angular.module('oppia').directive('oppiaTopicsAndSkillsDashboardPage',
  downgradeComponent({ component: TopicsAndSkillsDashboardPageComponent }));

// Require('base-components/base-content.directive.ts');
// require(
//   'components/common-layout-directives/common-elements/' +
//     'background-banner.component.ts');
// require(
//   'components/forms/custom-forms-directives/select2-dropdown.directive.ts');
// require('components/entity-creation-services/skill-creation.service.ts');
// require('components/entity-creation-services/topic-creation.service.ts');
// require('components/rubrics-editor/rubrics-editor.directive.ts');

// require('domain/skill/rubric.model.ts');
// require('domain/skill/SkillObjectFactory.ts');
// require(
//   'domain/topics_and_skills_dashboard/' +
//     'topics-and-skills-dashboard-backend-api.service.ts');
// require('domain/utilities/url-interpolation.service.ts');
// require(
//   'pages/topics-and-skills-dashboard-page/' +
//     'create-new-skill-modal.controller.ts');
// require(
//   'pages/topics-and-skills-dashboard-page/skills-list/' +
//     'skills-list.directive.ts');
// require(
//   'pages/topics-and-skills-dashboard-page/topics-list/' +
//     'topics-list.component.ts');
// require(
//   'pages/topics-and-skills-dashboard-page/' +
//     'topics-and-skills-dashboard-page.service');
// require(
//   'pages/topics-and-skills-dashboard-page/' +
//     'topics-and-skills-dashboard-page.constants.ajs.ts');
// require('services/alerts.service.ts');
// require('services/contextual/window-dimensions.service.ts');
// require('services/image-local-storage.service.ts');
// require('services/stateful/focus-manager.service.ts');

// import { Subscription } from 'rxjs';
// import debounce from 'lodash/debounce';

// import { TopicsAndSkillsDashboardFilter } from
//   // eslint-disable-next-line max-len
//   'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-filter.model';

// angular.module('oppia').component('topicsAndSkillsDashboardPage', {
//   template: require('./topics-and-skills-dashboard-page.component.html'),
//   controller: [
//     '$rootScope', '$scope', '$timeout', 'AlertsService',
//     'FocusManagerService', 'SkillCreationService',
//     'TopicCreationService', 'TopicsAndSkillsDashboardBackendApiService',
//     'TopicsAndSkillsDashboardPageService', 'WindowDimensionsService',
//     'FATAL_ERROR_CODES', 'SKILL_STATUS_OPTIONS', 'TOPIC_FILTER_CLASSROOM_ALL',
//     'TOPIC_PUBLISHED_OPTIONS', 'TOPIC_SORT_OPTIONS',
//     function(
//         $rootScope, $scope, $timeout, AlertsService,
//         FocusManagerService, SkillCreationService,
//         TopicCreationService, TopicsAndSkillsDashboardBackendApiService,
//         TopicsAndSkillsDashboardPageService, WindowDimensionsService,
//         FATAL_ERROR_CODES, SKILL_STATUS_OPTIONS, TOPIC_FILTER_CLASSROOM_ALL,
//         TOPIC_PUBLISHED_OPTIONS, TOPIC_SORT_OPTIONS) {
//       var ctrl = this;
//       ctrl.directiveSubscriptions = new Subscription();
//       var TOPIC_CLASSROOM_UNASSIGNED = 'Unassigned';

//       /**
//        * Calls the TopicsAndSkillsDashboardBackendApiService and fetches
//        * the topics and skills dashboard data.
//        * @param {Boolean} stayInSameTab - To stay in the same tab or not.
//       */
//       ctrl._initDashboard = function(stayInSameTab) {
//         TopicsAndSkillsDashboardBackendApiService.fetchDashboardDataAsync()
//           .then(function(response) {
//             ctrl.totalTopicSummaries = response.topicSummaries;
//             ctrl.topicSummaries = ctrl.totalTopicSummaries;
//             ctrl.totalEntityCountToDisplay = ctrl.topicSummaries.length;
//             ctrl.currentCount = ctrl.totalEntityCountToDisplay;
//             ctrl.applyFilters();
//             ctrl.editableTopicSummaries = (ctrl.topicSummaries.filter(
//               function(summary) {
//                 return summary.canEditTopic === true;
//               }
//             ));
//             FocusManagerService.setFocus('createTopicBtn');
//             ctrl.totalSkillCount = response.totalSkillCount;
//             ctrl.skillsCategorizedByTopics = (
//               response.categorizedSkillsDict);
//             ctrl.untriagedSkillSummaries = (
//               response.untriagedSkillSummaries);
//             ctrl.totalUntriagedSkillSummaries = (
//               ctrl.untriagedSkillSummaries);
//             ctrl.mergeableSkillSummaries = (
//               response.mergeableSkillSummaries);
//             if (!stayInSameTab || !ctrl.activeTab) {
//               ctrl.activeTab = ctrl.TAB_NAME_TOPICS;
//             }
//             ctrl.userCanCreateTopic = response.canCreateTopic;
//             ctrl.userCanCreateSkill = response.canCreateSkill;
//             ctrl.userCanDeleteTopic = response.canDeleteTopic;
//             ctrl.userCanDeleteSkill = response.canDeleteSkill;

//             if (ctrl.topicSummaries.length === 0 &&
//                       ctrl.untriagedSkillSummaries.length !== 0) {
//               ctrl.activeTab = ctrl.TAB_NAME_SKILLS;
//               ctrl.initSkillDashboard();
//               FocusManagerService.setFocus('createSkillBtn');
//             }
//             ctrl.classrooms = response.allClassroomNames;
//             // Adding the if checks since karma tests adds
//             // the values in the array for every it block.
//             if (!ctrl.classrooms.includes(TOPIC_CLASSROOM_UNASSIGNED)) {
//               ctrl.classrooms.unshift(TOPIC_CLASSROOM_UNASSIGNED);
//             }
//             if (!ctrl.classrooms.includes(TOPIC_FILTER_CLASSROOM_ALL)) {
//               ctrl.classrooms.unshift(TOPIC_FILTER_CLASSROOM_ALL);
//             }
//             ctrl.skillClassrooms = angular.copy(ctrl.classrooms);
//             var unassignedValueIndex = (
//               ctrl.skillClassrooms.indexOf(TOPIC_CLASSROOM_UNASSIGNED));
//             if (unassignedValueIndex !== -1) {
//               ctrl.skillClassrooms.splice(unassignedValueIndex, 1);
//             }

//             $rootScope.$apply();
//           },
//           function(errorResponse) {
//             if (FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
//               AlertsService.addWarning('Failed to get dashboard data.');
//             } else {
//               AlertsService.addWarning(
//                 'Unexpected error code from the server.');
//             }
//           }
//           );
//       };

//       /**
//        * Tells whether the next skill page is present in memory or not.
//        * This case occurs when the next page is fetched from the backend
//        * and then we move back one page, but the next page is still in
//        * memory. So instead of making the backend call for the next page,
//        * we first check if the next page is present in memory.
//        * @returns {Boolean} - Whether the next page is present or not.
//        */
//       ctrl.isNextSkillPagePresent = function() {
//         var totalSkillsPresent = ctrl.skillSummaries.length;
//         // Here +1 is used since we are checking the next page and
//         // another +1 because page numbers start from 0.
//         var numberOfSkillsRequired = (
//           (ctrl.skillPageNumber + 2) * ctrl.itemsPerPage);

//         return totalSkillsPresent >= numberOfSkillsRequired;
//       };

//       /**
//        * Sets the active tab to topics or skills.
//        * @param {String} tabName - name of the tab to set.
//        */
//       ctrl.setActiveTab = function(tabName) {
//         ctrl.activeTab = tabName;
//         ctrl.filterObject.reset();
//         if (ctrl.activeTab === ctrl.TAB_NAME_TOPICS) {
//           ctrl.goToPageNumber(ctrl.topicPageNumber);
//           FocusManagerService.setFocus('createTopicBtn');
//         } else if (ctrl.activeTab === ctrl.TAB_NAME_SKILLS) {
//           ctrl.initSkillDashboard();
//           FocusManagerService.setFocus('createSkillBtn');
//         }
//       };

//       ctrl.initSkillDashboard = function() {
//         ctrl.skillStatusOptions = [];
//         ctrl.moreSkillsPresent = true;
//         ctrl.firstTimeFetchingSkills = true;
//         for (let key in SKILL_STATUS_OPTIONS) {
//           ctrl.skillStatusOptions.push(SKILL_STATUS_OPTIONS[key]);
//         }
//         ctrl.applyFilters();
//       };

//       ctrl.createTopic = function() {
//         TopicCreationService.createNewTopic();
//       };

//       ctrl.createSkill = function() {
//         SkillCreationService.createNewSkill();
//       };
//       /**
//        * @param {Number} pageNumber - Page number to navigate to.
//        */
//       ctrl.goToPageNumber = function(pageNumber) {
//         if (ctrl.activeTab === ctrl.TAB_NAME_TOPICS) {
//           ctrl.topicPageNumber = pageNumber;
//           ctrl.pageNumber = ctrl.topicPageNumber;
//           ctrl.currentCount = ctrl.topicSummaries.length;
//           ctrl.displayedTopicSummaries =
//                   ctrl.topicSummaries.slice(
//                     pageNumber * ctrl.itemsPerPage,
//                     (pageNumber + 1) * ctrl.itemsPerPage);
//         } else if (ctrl.activeTab === ctrl.TAB_NAME_SKILLS) {
//           ctrl.skillPageNumber = pageNumber;
//           ctrl.pageNumber = ctrl.skillPageNumber;
//           ctrl.displayedSkillSummaries = ctrl.skillSummaries.slice(
//             pageNumber * ctrl.itemsPerPage,
//             (pageNumber + 1) * ctrl.itemsPerPage);
//         }
//       };

//       ctrl.fetchSkills = function() {
//         if (ctrl.moreSkillsPresent) {
//           TopicsAndSkillsDashboardBackendApiService
//             .fetchSkillsDashboardDataAsync(
//               ctrl.filterObject, ctrl.itemsPerPage, ctrl.nextCursor).then(
//               (response) => {
//                 ctrl.moreSkillsPresent = response.more;
//                 ctrl.nextCursor = response.nextCursor;
//                 ctrl.skillSummaries.push(...response.skillSummaries);
//                 ctrl.currentCount = ctrl.skillSummaries.length;
//                 if (ctrl.firstTimeFetchingSkills) {
//                   ctrl.goToPageNumber(0);
//                   ctrl.firstTimeFetchingSkills = false;
//                 } else {
//                   ctrl.goToPageNumber(ctrl.pageNumber + 1);
//                 }
//                 $scope.$applyAsync();
//               });
//         } else if (ctrl.skillSummaries.length >
//                 ((ctrl.skillPageNumber + 1) * ctrl.itemsPerPage)) {
//           ctrl.goToPageNumber(ctrl.pageNumber + 1);
//         }
//       };

//       ctrl.navigateSkillPage = function(direction) {
//         if (direction === ctrl.MOVE_TO_NEXT_PAGE) {
//           if (ctrl.isNextSkillPagePresent()) {
//             ctrl.goToPageNumber(ctrl.pageNumber + 1);
//           } else {
//             ctrl.fetchSkillsDebounced();
//           }
//         } else if (ctrl.pageNumber >= 1) {
//           ctrl.goToPageNumber(ctrl.pageNumber - 1);
//         }
//       };
//       /**
//        * @param {String} direction - Direction, whether to change the
//        * page to left or right by 1.
//        */
//       ctrl.changePageByOne = function(direction) {
//         ctrl.lastPage = parseInt(
//           String(ctrl.currentCount / ctrl.itemsPerPage));
//         if (direction === ctrl.MOVE_TO_PREV_PAGE && ctrl.pageNumber >= 1) {
//           ctrl.goToPageNumber(ctrl.pageNumber - 1);
//         } else if (direction === ctrl.MOVE_TO_NEXT_PAGE &&
//                 ctrl.pageNumber < ctrl.lastPage - 1) {
//           ctrl.goToPageNumber(ctrl.pageNumber + 1);
//         }
//       };

//       ctrl.applyFilters = function() {
//         if (ctrl.activeTab === ctrl.TAB_NAME_SKILLS) {
//           ctrl.moreSkillsPresent = true;
//           ctrl.firstTimeFetchingSkills = true;
//           ctrl.skillSummaries = [];
//           ctrl.nextCursor = null;
//           ctrl.fetchSkills();
//           $scope.$applyAsync();
//           _forceSelect2Refresh();
//           return;
//         }
//         ctrl.topicSummaries = (
//           TopicsAndSkillsDashboardPageService.getFilteredTopics(
//             ctrl.totalTopicSummaries, ctrl.filterObject));

//         ctrl.displayedTopicSummaries =
//                 ctrl.topicSummaries.slice(0, ctrl.itemsPerPage);
//         ctrl.currentCount = ctrl.topicSummaries.length;
//         ctrl.goToPageNumber(0);
//         $scope.$applyAsync();
//         _forceSelect2Refresh();
//       };

//       // Select2 dropdown cannot automatically refresh its display
//       // after being translated.
//       // Use ctrl.select2DropdownIsShown in its ng-if attribute
//       // and this function to force it to reload.
//       var _forceSelect2Refresh = function() {
//         ctrl.select2DropdownIsShown = false;
//         $timeout(function() {
//           ctrl.select2DropdownIsShown = true;
//         }, 100);
//       };

//       ctrl.resetFilters = function() {
//         ctrl.getUpperLimitValueForPagination();
//         ctrl.topicSummaries = ctrl.totalTopicSummaries;
//         ctrl.currentCount = ctrl.totalEntityCountToDisplay;
//         ctrl.filterObject.reset();
//         ctrl.applyFilters();
//       };

//       ctrl.toggleFilterBox = function() {
//         ctrl.filterBoxIsShown = !ctrl.filterBoxIsShown;
//       };

//       ctrl.getUpperLimitValueForPagination = function() {
//         return (
//           Math.min((
//             (ctrl.pageNumber * ctrl.itemsPerPage) +
//             ctrl.itemsPerPage), ctrl.currentCount));
//       };

//       ctrl.getTotalCountValueForSkills = function() {
//         if (ctrl.skillSummaries.length > ctrl.itemsPerPage) {
//           return 'many';
//         }
//         return ctrl.skillSummaries.length;
//       };

//       ctrl.refreshPagination = function() {
//         ctrl.goToPageNumber(0);
//       };

//       ctrl.$onInit = function() {
//         ctrl.skillSummaries = [];
//         ctrl.TAB_NAME_TOPICS = 'topics';
//         ctrl.activeTab = ctrl.TAB_NAME_TOPICS;
//         ctrl.MOVE_TO_NEXT_PAGE = 'next_page';
//         ctrl.MOVE_TO_PREV_PAGE = 'prev_page';
//         ctrl.TAB_NAME_SKILLS = 'skills';
//         ctrl.pageNumber = 0;
//         ctrl.topicPageNumber = 0;
//         ctrl.itemsPerPage = 10;
//         ctrl.skillPageNumber = 0;
//         ctrl.lastSkillPage = 0;
//         ctrl.selectedIndex = null;
//         ctrl.activeTab = ctrl.TAB_NAME_TOPICS;
//         ctrl.itemsPerPageChoice = [10, 15, 20];
//         ctrl.filterBoxIsShown = !WindowDimensionsService.isWindowNarrow();
//         ctrl.filterObject = (
//           TopicsAndSkillsDashboardFilter.createDefault());
//         ctrl.classrooms = [];
//         ctrl.sortOptions = [];
//         for (let key in TOPIC_SORT_OPTIONS) {
//           ctrl.sortOptions.push(TOPIC_SORT_OPTIONS[key]);
//         }
//         ctrl.statusOptions = [];
//         for (let key in TOPIC_PUBLISHED_OPTIONS) {
//           ctrl.statusOptions.push(TOPIC_PUBLISHED_OPTIONS[key]);
//         }
//         ctrl.select2DropdownIsShown = true;

//         ctrl.generateNumbersTillRange = function(range) {
//           var arr = [];
//           for (var i = 0; i < range; i++) {
//             arr.push(i);
//           }
//           return arr;
//         };
//         ctrl.fetchSkillsDebounced = debounce(ctrl.fetchSkills, 300);

//         ctrl.directiveSubscriptions.add(
//           TopicsAndSkillsDashboardBackendApiService.
//             onTopicsAndSkillsDashboardReinitialized.subscribe(
//               (stayInSameTab) => {
//                 ctrl._initDashboard(stayInSameTab);
//               }
//             )
//         );
//         // The _initDashboard function is written separately since it is
//         // also called in $scope.$on when some external events are
//         // triggered.
//         ctrl._initDashboard(false);
//       };

//       ctrl.$onDestroy = function() {
//         ctrl.directiveSubscriptions.unsubscribe();
//       };
//     }
//   ]
// });
