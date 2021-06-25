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
  dropdownEnabled: boolean;
  showMore = {
    incomplete: false,
    completed: false,
    playlist: false,
    subscriptions: false
  };
  pageNumber: number = 1;
  pageSize: number = 3;
  startIndex: number = 0;
  endIndex: number = 3;

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
    this.selectedSection = 'All';
    this.dropdownEnabled = false;
  }

  decodePngURIData(base64ImageData: string): string {
    return decodeURIComponent(base64ImageData);
  }

  checkMobileView(): boolean {
    return this.deviceInfoService.isMobileDevice();
  }

  enableDropdown(): void {
    this.dropdownEnabled = !this.dropdownEnabled;
  }

  changeSection(section: string): void {
    this.dropdownEnabled = !this.dropdownEnabled;
    this.selectedSection = section;
    if (section === 'Completed') {
      this.displayInCommunityLessons = this.totalCompletedLessonsList;
    } else if (section === 'Incomplete') {
      this.displayInCommunityLessons = this.totalIncompleteLessonsList;
    } else if (section === 'All') {
      this.displayInCommunityLessons = [];
      this.displayInCommunityLessons.push(
        ...this.totalIncompleteLessonsList, ...this.totalCompletedLessonsList);
    }
    this.pageNumber = 1;
    this.startIndex = 0;
    this.endIndex = 3;
  }

  getLessonType(tile: LearnerExplorationSummary | CollectionSummary): string {
    if (this.totalIncompleteLessonsList.includes(tile)) {
      return 'Incomplete';
    } else if (this.totalCompletedLessonsList.includes(tile)) {
      return 'Completed';
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
    this.showMore[section] = !this.showMore[section];
    if (section === 'incomplete' && this.showMore.incomplete === true) {
      this.displayIncompleteLessonsList = this.totalIncompleteLessonsList;
    } else if (section === 'incomplete' && this.showMore.incomplete === false) {
      this.displayIncompleteLessonsList = this.totalIncompleteLessonsList.slice(
        0, 3);
    } else if (section === 'completed' && this.showMore.completed === true) {
      this.displayCompletedLessonsList = this.totalCompletedLessonsList;
    } else if (section === 'completed' && this.showMore.completed === false) {
      this.displayCompletedLessonsList = this.totalCompletedLessonsList.slice(
        0, 3);
    } else if (section === 'playlist' && this.showMore.playlist === true) {
      this.displayLessonsInPlaylist = this.totalLessonsInPlaylist;
    } else if (section === 'playlist' && this.showMore.playlist === false) {
      this.displayLessonsInPlaylist = this.totalLessonsInPlaylist.slice(0, 3);
    }
  }

  getTileType(tile: LearnerExplorationSummary | CollectionSummary): string {
    if (tile instanceof LearnerExplorationSummary) {
      return 'exploration';
    }
    return 'collection';
  }

  changePageByOne(direction: string): void {
    if (direction === 'MOVE_TO_PREV_PAGE' && this.pageNumber > 1) {
      this.pageNumber -= 1;
    }
    let totalPages = this.displayInCommunityLessons.length / this.pageSize;
    if (totalPages > Math.floor(totalPages)) {
      totalPages = Math.floor(totalPages) + 1;
    }
    if (direction === 'MOVE_TO_NEXT_PAGE' && this.pageNumber < totalPages) {
      this.pageNumber += 1;
    }
    this.startIndex = (this.pageNumber - 1) * this.pageSize;
    this.endIndex = Math.min(
      this.startIndex + this.pageSize,
      this.displayInCommunityLessons.length);
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
          } if (this.showMore.incomplete === true) {
            this.displayIncompleteLessonsList = (
              this.totalIncompleteLessonsList);
          } else if (this.showMore.incomplete === false) {
            this.displayIncompleteLessonsList = (
              this.totalIncompleteLessonsList.slice(0, 3));
          } if (this.selectedSection === 'All') {
            this.displayInCommunityLessons = [];
            this.displayInCommunityLessons.push(
              ...this.totalIncompleteLessonsList,
              ...this.totalCompletedLessonsList);
          } if (this.displayInCommunityLessons.slice(
            this.startIndex, this.endIndex).length === 0) {
            this.pageNumber = 1;
            this.startIndex = 0;
            this.endIndex = 3;
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
          } if (this.showMore.playlist === true) {
            this.displayLessonsInPlaylist = this.totalLessonsInPlaylist;
          } else if (this.showMore.playlist === false) {
            this.displayLessonsInPlaylist = (
              this.totalLessonsInPlaylist.slice(0, 3));
          }
        }
      });
  }
}
