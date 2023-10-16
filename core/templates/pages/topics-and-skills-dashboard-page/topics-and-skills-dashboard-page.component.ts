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

import { Component, HostListener } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { TopicCreationService } from 'components/entity-creation-services/topic-creation.service';
import { SkillSummary } from 'domain/skill/skill-summary.model';
import { CreatorTopicSummary } from 'domain/topic/creator-topic-summary.model';
import { CategorizedSkills, TopicsAndSkillsDashboardBackendApiService } from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import { TopicsAndSkillsDashboardFilter } from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-filter.model';
import debounce from 'lodash/debounce';
import { CreateNewSkillModalService } from 'pages/topic-editor-page/services/create-new-skill-modal.service';
import { Subscription } from 'rxjs';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { ETopicPublishedOptions, ETopicStatusOptions, TopicsAndSkillsDashboardPageConstants } from './topics-and-skills-dashboard-page.constants';
import { TopicsAndSkillsDashboardPageService } from './topics-and-skills-dashboard-page.service';
import { PlatformFeatureService } from 'services/platform-feature.service';

type TopicPublishedOptionsKeys = (
  keyof typeof TopicsAndSkillsDashboardPageConstants.TOPIC_PUBLISHED_OPTIONS);
type TopicStatusOptionsKeys = (
  keyof typeof TopicsAndSkillsDashboardPageConstants.TOPIC_STATUS_OPTIONS);
type TopicSortOptionsKeys = (
  keyof typeof TopicsAndSkillsDashboardPageConstants.TOPIC_SORT_OPTIONS);
type TopicSortingOptionsKeys = (
  keyof typeof TopicsAndSkillsDashboardPageConstants.TOPIC_SORTING_OPTIONS);
type SkillStatusOptionsKeys = (
  keyof typeof TopicsAndSkillsDashboardPageConstants.SKILL_STATUS_OPTIONS);

@Component({
  selector: 'oppia-topics-and-skills-dashboard-page',
  templateUrl: './topics-and-skills-dashboard-page.component.html'
})
export class TopicsAndSkillsDashboardPageComponent {
  directiveSubscriptions: Subscription = new Subscription();
  totalTopicSummaries: CreatorTopicSummary[] = [];
  topicSummaries: CreatorTopicSummary[] = [];
  editableTopicSummaries: CreatorTopicSummary[] = [];
  untriagedSkillSummaries: SkillSummary[] = [];
  totalUntriagedSkillSummaries: SkillSummary[] = [];
  mergeableSkillSummaries: SkillSummary[] = [];
  skillSummaries: SkillSummary[] = [];
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  totalEntityCountToDisplay!: number;
  currentCount!: number;
  totalSkillCount!: number;
  skillsCategorizedByTopics!: CategorizedSkills;
  userCanCreateTopic!: boolean;
  userCanCreateSkill!: boolean;
  userCanDeleteTopic!: boolean;
  userCanDeleteSkill!: boolean;

  activeTab!: string;
  filterBoxIsShown!: boolean;
  filterObject!: TopicsAndSkillsDashboardFilter;
  fetchSkillsDebounced!: () => void;
  lastPage!: number;
  moreSkillsPresent!: boolean;
  nextCursor!: string | null;
  firstTimeFetchingSkills!: boolean;
  TAB_NAME_TOPICS: string = 'topics';
  MOVE_TO_NEXT_PAGE: string = 'next_page';
  MOVE_TO_PREV_PAGE: string = 'prev_page';
  TAB_NAME_SKILLS: string = 'skills';
  pageNumber: number = 0;
  topicPageNumber: number = 0;
  itemsPerPage: number = 10;
  skillPageNumber: number = 0;
  lastSkillPage: number = 0;
  itemsPerPageChoice: number[] = [10, 15, 20];
  classrooms: string[] = [];
  sortOptions: string[] = [];
  statusOptions: (ETopicPublishedOptions | ETopicStatusOptions)[] = [];
  displayedTopicSummaries: CreatorTopicSummary[] = [];
  displayedSkillSummaries: SkillSummary[] = [];
  skillStatusOptions: string[] = [];
  windowWidth: number = window.innerWidth;
  constructor(
    private focusManagerService: FocusManagerService,
    private createNewSkillModalService: CreateNewSkillModalService,
    private topicCreationService: TopicCreationService,
    private topicsAndSkillsDashboardBackendApiService:
    TopicsAndSkillsDashboardBackendApiService,
    private topicsAndSkillsDashboardPageService:
    TopicsAndSkillsDashboardPageService,
    private windowDimensionsService: WindowDimensionsService,
    private platformFeatureService: PlatformFeatureService
  ) {}

  ngOnInit(): void {
    this.activeTab = this.TAB_NAME_TOPICS;
    this.filterBoxIsShown = !this.windowDimensionsService.isWindowNarrow();
    this.filterObject = TopicsAndSkillsDashboardFilter.createDefault();

    for (let key in TopicsAndSkillsDashboardPageConstants.TOPIC_SORT_OPTIONS) {
      this.sortOptions.push(
        TopicsAndSkillsDashboardPageConstants.TOPIC_SORT_OPTIONS[
          key as TopicSortOptionsKeys]);
    }

    if (this.platformFeatureService.status.
      SerialChapterLaunchCurriculumAdminView.isEnabled) {
      this.sortOptions = [];
      for (let key in TopicsAndSkillsDashboardPageConstants
        .TOPIC_SORTING_OPTIONS) {
        this.sortOptions.push(
          TopicsAndSkillsDashboardPageConstants.TOPIC_SORTING_OPTIONS[
              key as TopicSortingOptionsKeys]);
      }
    }

    for (let key in TopicsAndSkillsDashboardPageConstants
      .TOPIC_PUBLISHED_OPTIONS) {
      this.statusOptions.push(
        TopicsAndSkillsDashboardPageConstants.TOPIC_PUBLISHED_OPTIONS[
          key as TopicPublishedOptionsKeys]);
    }

    if (this.platformFeatureService.status.
      SerialChapterLaunchCurriculumAdminView.isEnabled) {
      this.statusOptions = [];
      for (let key in TopicsAndSkillsDashboardPageConstants
        .TOPIC_STATUS_OPTIONS) {
        this.statusOptions.push(
          TopicsAndSkillsDashboardPageConstants.TOPIC_STATUS_OPTIONS[
                key as TopicStatusOptionsKeys]);
      }
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
      this.skillStatusOptions.push(
        TopicsAndSkillsDashboardPageConstants.SKILL_STATUS_OPTIONS[
          key as SkillStatusOptionsKeys]);
    }
    this.applyFilters();
  }

  createTopic(): void {
    this.topicCreationService.createNewTopic();
  }

  createSkill(): void {
    this.createNewSkillModalService.createNewSkill();
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
      return;
    }
    this.topicSummaries = (
      this.topicsAndSkillsDashboardPageService.getFilteredTopics(
        this.totalTopicSummaries, this.filterObject));

    this.displayedTopicSummaries =
            this.topicSummaries.slice(0, this.itemsPerPage);
    this.currentCount = this.topicSummaries.length;
    this.goToPageNumber(0);
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

  @HostListener('window:resize')
  filterBoxOnResize(): void {
    if (window.innerWidth !== this.windowWidth) {
      this.windowWidth = window.innerWidth;
      this.filterBoxIsShown = !this.windowDimensionsService.isWindowNarrow();
    }
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
