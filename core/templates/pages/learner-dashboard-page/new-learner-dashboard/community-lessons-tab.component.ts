// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for community lessons tab in the Learner Dashboard
 * page.
 */

import { Component, Input } from '@angular/core';
import { LearnerDashboardActivityBackendApiService } from 'domain/learner_dashboard/learner-dashboard-activity-backend-api.service';
import { LearnerDashboardPageConstants } from '../learner-dashboard-page.constants';
import { LearnerExplorationSummary } from 'domain/summary/learner-exploration-summary.model';
import { CollectionSummary } from 'domain/collection/collection-summary.model';
import { ProfileSummary } from 'domain/user/profile-summary.model';
import { DeviceInfoService } from 'services/contextual/device-info.service';

 @Component({
   selector: 'oppia-community-lessons-tab',
   templateUrl: './community-lessons-tab.component.html'
 })
export class CommunityLessonsTabComponent {
  constructor(
    private learnerDashboardActivityBackendApiService: (
      LearnerDashboardActivityBackendApiService),
    private deviceInfoService: DeviceInfoService) {
  }
  @Input() incompleteExplorationsList: LearnerExplorationSummary[];
  @Input() incompleteCollectionsList: CollectionSummary[];
  @Input() completedExplorationsList: LearnerExplorationSummary[];
  @Input() completedCollectionsList: CollectionSummary[];
  @Input() explorationPlaylist: LearnerExplorationSummary[];
  @Input() collectionPlaylist: CollectionSummary[];
  @Input() subscriptionsList: ProfileSummary[];
  @Input() completedToIncompleteCollections: string[];
  noCommunityLessonActivity: boolean;
  noPlaylistActivity: boolean;
  totalIncompleteLessonsList: (
    LearnerExplorationSummary | CollectionSummary)[] = [];
  totalCompletedLessonsList: (
    LearnerExplorationSummary | CollectionSummary)[] = [];
  totalLessonsInPlaylist: (
    LearnerExplorationSummary | CollectionSummary)[] = [];
  allCommunityLessons: (
    LearnerExplorationSummary | CollectionSummary)[] = [];
  displayIncompleteLessonsList: (
    LearnerExplorationSummary | CollectionSummary)[] = [];
  displayCompletedLessonsList: (
    LearnerExplorationSummary | CollectionSummary)[] = [];
  displayLessonsInPlaylist: (
    LearnerExplorationSummary | CollectionSummary)[] = [];
  displayInCommunityLessons: (
    LearnerExplorationSummary | CollectionSummary)[] = [];
  selectedSection: string;
  completed: string = 'Completed';
  incomplete: string = 'Incomplete';
  all: string = 'All';
  moveToPrevPage: string = 'MOVE_TO_PREV_PAGE';
  moveToNextPage: string = 'MOVE_TO_NEXT_PAGE';
  dropdownEnabled: boolean;
  showMoreInSection = {
    incomplete: false,
    completed: false,
    playlist: false,
    subscriptions: false
  };
  pageNumberInCommunityLessons: number = 1;
  pageSize: number = 3;
  startIndexInCommunityLessons: number = 0;
  endIndexInCommunityLessons: number = 3;
  pageNumberInPlaylist: number = 1;
  startIndexInPlaylist: number = 0;
  endIndexInPlaylist: number = 3;

  ngOnInit(): void {
    this.noCommunityLessonActivity = (
      (this.incompleteExplorationsList.length === 0) &&
        (this.completedExplorationsList.length === 0) &&
        (this.incompleteCollectionsList.length === 0) &&
        (this.completedCollectionsList.length === 0));
    this.noPlaylistActivity = (
      (this.explorationPlaylist.length === 0) &&
      (this.collectionPlaylist.length === 0));
    this.totalIncompleteLessonsList.push(
      ...this.incompleteExplorationsList, ...this.incompleteCollectionsList);
    this.totalCompletedLessonsList.push(
      ...this.completedExplorationsList, ...this.completedCollectionsList);
    this.totalLessonsInPlaylist.push(
      ...this.explorationPlaylist, ...this.collectionPlaylist);
    this.allCommunityLessons.push(
      ...this.incompleteExplorationsList, ...this.incompleteCollectionsList,
      ...this.completedCollectionsList, ...this.completedExplorationsList);
    this.displayIncompleteLessonsList = this.totalIncompleteLessonsList.slice(
      0, 3);
    this.displayCompletedLessonsList = this.totalCompletedLessonsList.slice(
      0, 3);
    if (this.checkMobileView()) {
      this.displayLessonsInPlaylist = this.totalLessonsInPlaylist;
    } else {
      this.displayLessonsInPlaylist = this.totalLessonsInPlaylist.slice(0, 3);
    }
    this.displayInCommunityLessons = this.allCommunityLessons;
    this.selectedSection = this.all;
    this.dropdownEnabled = false;
  }

  decodePngURIData(base64ImageData: string): string {
    return decodeURIComponent(base64ImageData);
  }

  checkMobileView(): boolean {
    return this.deviceInfoService.isMobileDevice();
  }

  toggleDropdown(): void {
    this.dropdownEnabled = !this.dropdownEnabled;
  }

  changeSection(section: string): void {
    this.dropdownEnabled = !this.dropdownEnabled;
    this.selectedSection = section;
    if (section === this.completed) {
      this.displayInCommunityLessons = this.totalCompletedLessonsList;
    } else if (section === this.incomplete) {
      this.displayInCommunityLessons = this.totalIncompleteLessonsList;
    } else if (section === this.all) {
      this.displayInCommunityLessons = [];
      this.displayInCommunityLessons.push(
        ...this.totalIncompleteLessonsList, ...this.totalCompletedLessonsList);
    }
    this.pageNumberInCommunityLessons = 1;
    this.startIndexInCommunityLessons = 0;
    this.endIndexInCommunityLessons = 3;
  }

  getLessonType(tile: LearnerExplorationSummary | CollectionSummary): string {
    if (this.totalIncompleteLessonsList.includes(tile)) {
      return this.incomplete;
    } else if (this.totalCompletedLessonsList.includes(tile)) {
      return this.completed;
    }
  }

  showUsernamePopover(subscriberUsername: string): string {
    // The popover on the subscription card is only shown if the length
    // of the subscriber username is greater than 10 and the user hovers
    // over the truncated username.
    if (subscriberUsername.length > 10) {
      return 'mouseenter';
    } else {
      return 'none';
    }
  }

  handleShowMore(section: string): void {
    this.showMoreInSection[section] = !this.showMoreInSection[section];
    if (
      section === 'incomplete' && this.showMoreInSection.incomplete === true) {
      this.displayIncompleteLessonsList = this.totalIncompleteLessonsList;
    } else if (
      section === 'incomplete' && this.showMoreInSection.incomplete === false) {
      this.displayIncompleteLessonsList = this.totalIncompleteLessonsList.slice(
        0, 3);
    } else if (
      section === 'completed' && this.showMoreInSection.completed === true) {
      this.displayCompletedLessonsList = this.totalCompletedLessonsList;
    } else if (
      section === 'completed' && this.showMoreInSection.completed === false) {
      this.displayCompletedLessonsList = this.totalCompletedLessonsList.slice(
        0, 3);
    } else if (
      section === 'playlist' && this.showMoreInSection.playlist === true) {
      this.displayLessonsInPlaylist = this.totalLessonsInPlaylist;
      this.startIndexInPlaylist = 0;
      this.endIndexInPlaylist = this.totalLessonsInPlaylist.length;
    } else if (
      section === 'playlist' && this.showMoreInSection.playlist === false) {
      this.startIndexInPlaylist = 0;
      this.endIndexInPlaylist = this.pageSize;
    }
  }

  getTileType(tile: LearnerExplorationSummary | CollectionSummary): string {
    if (tile instanceof LearnerExplorationSummary) {
      return 'exploration';
    }
    return 'collection';
  }

  changePageByOne(direction: string, section: string): void {
    if (section === 'communityLessons') {
      let totalPages = this.displayInCommunityLessons.length / this.pageSize;
      if (direction === this.moveToPrevPage &&
        this.pageNumberInCommunityLessons > 1) {
        this.pageNumberInCommunityLessons -= 1;
      }
      if (totalPages > Math.floor(totalPages)) {
        totalPages = Math.floor(totalPages) + 1;
      }
      if (direction === this.moveToNextPage &&
        this.pageNumberInCommunityLessons < totalPages) {
        this.pageNumberInCommunityLessons += 1;
      }
      this.startIndexInCommunityLessons = (
        this.pageNumberInCommunityLessons - 1) * this.pageSize;
      this.endIndexInCommunityLessons = Math.min(
        this.startIndexInCommunityLessons + this.pageSize,
        this.displayInCommunityLessons.length);
    } else if (section === 'playlist') {
      let totalPages = this.displayLessonsInPlaylist.length / this.pageSize;
      if (direction === this.moveToPrevPage &&
        this.pageNumberInPlaylist > 1) {
        this.pageNumberInPlaylist -= 1;
      }
      if (totalPages > Math.floor(totalPages)) {
        totalPages = Math.floor(totalPages) + 1;
      }
      if (direction === this.moveToNextPage &&
        this.pageNumberInPlaylist < totalPages) {
        this.pageNumberInPlaylist += 1;
      }
      this.startIndexInPlaylist = (
        this.pageNumberInPlaylist - 1) * this.pageSize;
      this.endIndexInPlaylist = Math.min(
        this.startIndexInPlaylist + this.pageSize,
        this.displayLessonsInPlaylist.length);
    }
  }

  openRemoveActivityModal(
      sectionNameI18nId: string, subsectionName: string,
      activity: LearnerExplorationSummary | CollectionSummary): void {
    this.learnerDashboardActivityBackendApiService.removeActivityModalAsync(
      sectionNameI18nId, subsectionName,
      activity.id, activity.title)
      .then(() => {
        if (sectionNameI18nId ===
          LearnerDashboardPageConstants
            .LEARNER_DASHBOARD_SECTION_I18N_IDS.INCOMPLETE) {
          if (subsectionName ===
            LearnerDashboardPageConstants
              .LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS) {
            let index = this.totalIncompleteLessonsList.findIndex(
              exp => exp.id === activity.id);
            if (index !== -1) {
              this.totalIncompleteLessonsList.splice(index, 1);
            }
          } else if (subsectionName ===
            LearnerDashboardPageConstants
              .LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS) {
            let index = this.totalIncompleteLessonsList.findIndex(
              collection => collection.id === activity.id);
            if (index !== -1) {
              this.totalIncompleteLessonsList.splice(index, 1);
            }
          } if (this.showMoreInSection.incomplete === true) {
            this.displayIncompleteLessonsList = (
              this.totalIncompleteLessonsList);
          } else if (this.showMoreInSection.incomplete === false) {
            this.displayIncompleteLessonsList = (
              this.totalIncompleteLessonsList.slice(0, 3));
          } if (this.selectedSection === this.all) {
            this.displayInCommunityLessons = [];
            this.displayInCommunityLessons.push(
              ...this.totalIncompleteLessonsList,
              ...this.totalCompletedLessonsList);
          } if (this.displayInCommunityLessons.slice(
            this.startIndexInCommunityLessons,
            this.endIndexInCommunityLessons).length === 0) {
            this.pageNumberInCommunityLessons = 1;
            this.startIndexInCommunityLessons = 0;
            this.endIndexInCommunityLessons = 3;
          }
        } else if (sectionNameI18nId ===
          LearnerDashboardPageConstants
            .LEARNER_DASHBOARD_SECTION_I18N_IDS.PLAYLIST) {
          if (subsectionName ===
            LearnerDashboardPageConstants
              .LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS) {
            let index = this.totalLessonsInPlaylist.findIndex(
              exp => exp.id === activity.id);
            if (index !== -1) {
              this.totalLessonsInPlaylist.splice(index, 1);
            }
          } else if (subsectionName ===
            LearnerDashboardPageConstants
              .LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.COLLECTIONS) {
            let index = this.totalLessonsInPlaylist.findIndex(
              collection => collection.id === activity.id);
            if (index !== -1) {
              this.totalLessonsInPlaylist.splice(index, 1);
            }
          } if (this.showMoreInSection.playlist === true) {
            this.displayLessonsInPlaylist = this.totalLessonsInPlaylist;
          } else if (this.showMoreInSection.playlist === false) {
            this.displayLessonsInPlaylist = (
              this.totalLessonsInPlaylist.slice(0, 3));
          } if (this.checkMobileView()) {
            this.displayLessonsInPlaylist = this.totalLessonsInPlaylist;
          } if (this.displayLessonsInPlaylist.slice(
            this.startIndexInPlaylist,
            this.endIndexInPlaylist).length === 0) {
            this.pageNumberInPlaylist = 1;
            this.startIndexInPlaylist = 0;
            this.endIndexInPlaylist = 3;
          }
        }
      });
  }
}
