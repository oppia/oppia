// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for for CommunityLessonsTabComponent.
 */

import { async, ComponentFixture, fakeAsync, TestBed } from
  '@angular/core/testing';
import { MaterialModule } from 'components/material.module';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LearnerDashboardActivityBackendApiService } from 'domain/learner_dashboard/learner-dashboard-activity-backend-api.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import { LearnerExplorationSummary } from 'domain/summary/learner-exploration-summary.model';
import { CollectionSummary } from 'domain/collection/collection-summary.model';
import { CommunityLessonsTabComponent } from './community-lessons-tab.component';
import { NO_ERRORS_SCHEMA, Pipe } from '@angular/core';

class MockRemoveActivityNgbModalRef {
  componentInstance: {
    sectionNameI18nId: null,
    subsectionName: null,
    activityId: null,
    activityTitle: null
  };
}

@Pipe({name: 'truncate'})
class MockTruncatePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

describe('Community lessons tab Component', () => {
  let component: CommunityLessonsTabComponent;
  let fixture: ComponentFixture<CommunityLessonsTabComponent>;
  let learnerDashboardActivityBackendApiService:
    LearnerDashboardActivityBackendApiService;
  let ngbModal: NgbModal;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MaterialModule,
        FormsModule,
        HttpClientTestingModule
      ],
      declarations: [
        CommunityLessonsTabComponent,
        MockTranslatePipe,
        MockTruncatePipe
      ],
      providers: [
        LearnerDashboardActivityBackendApiService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CommunityLessonsTabComponent);
    component = fixture.componentInstance;
    learnerDashboardActivityBackendApiService =
      TestBed.inject(LearnerDashboardActivityBackendApiService);
    ngbModal = TestBed.inject(NgbModal);
    component.incompleteExplorationsList = [];
    component.incompleteCollectionsList = [];
    component.completedExplorationsList = [];
    component.completedCollectionsList = [];
    component.explorationPlaylist = [];
    component.collectionPlaylist = [];
    component.subscriptionsList = [];
    component.completedToIncompleteCollections = [];

    fixture.detectChanges();
  });

  it ('should initilize values on init for web view', () => {
    component.ngOnInit();

    expect(component.noCommunityLessonActivity).toEqual(true);
    expect(component.noPlaylistActivity).toEqual(true);
    expect(component.totalIncompleteLessonsList).toEqual([]);
    expect(component.totalCompletedLessonsList).toEqual([]);
    expect(component.totalLessonsInPlaylist).toEqual([]);
    expect(component.allCommunityLessons).toEqual([]);
    expect(component.displayIncompleteLessonsList).toEqual([]);
    expect(component.displayCompletedLessonsList).toEqual([]);
    expect(component.displayLessonsInPlaylist).toEqual([]);
    expect(component.displayInCommunityLessons).toEqual([]);
    expect(component.selectedSection).toEqual('All');
    expect(component.dropdownEnabled).toEqual(false);
  });

  it ('should initilize values on init for mobile view', () => {
    spyOnProperty(navigator, 'userAgent').and.returnValue('iPhone');
    component.ngOnInit();

    expect(component.displayLessonsInPlaylist).toEqual([]);
  });

  it('should sanitize given png base64 data and generate url', () => {
    let result = component.decodePngURIData('%D1%88%D0%B5%D0%BB%D0%BB%D1%8B');

    fixture.detectChanges();

    expect(result).toBe('шеллы');
  });

  it('should enable the dropdown', () => {
    expect(component.dropdownEnabled).toEqual(false);
    component.toggleDropdown();
    expect(component.dropdownEnabled).toEqual(true);
  });

  it('should change sections', () => {
    component.dropdownEnabled = true;
    component.changeSection('Completed');
    expect(component.dropdownEnabled).toEqual(false);
    expect(component.selectedSection).toEqual('Completed');

    component.changeSection('Incomplete');
    expect(component.selectedSection).toEqual('Incomplete');

    component.changeSection('All');
    expect(component.selectedSection).toEqual('All');
  });

  it('should return the correct lesson type', () => {
    const incomplete = {
      last_updated_msec: 1591296737470.528,
      community_owned: false,
      objective: 'Test Objective',
      id: '44LKoKLlIbGe',
      num_views: 0,
      thumbnail_icon_url: '/subjects/Algebra.svg',
      human_readable_contributors_summary: {},
      language_code: 'en',
      thumbnail_bg_color: '#cd672b',
      created_on_msec: 1591296635736.666,
      ratings: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      },
      status: 'public',
      tags: [],
      activity_type: 'exploration',
      category: 'Algebra',
      title: 'Test Title'
    };
    let incompleteSummary = LearnerExplorationSummary.createFromBackendDict(
      incomplete);
    component.totalIncompleteLessonsList = [incompleteSummary];
    let result = component.getLessonType(incompleteSummary);
    expect(result).toEqual('Incomplete');

    const completed = {
      last_updated_msec: 1591296735670.528,
      community_owned: false,
      objective: 'Test Objective 1',
      id: '44LKoKLoobGe',
      num_views: 1,
      thumbnail_icon_url: '/subjects/image.svg',
      human_readable_contributors_summary: {},
      language_code: 'en',
      thumbnail_bg_color: '#cd622b',
      created_on_msec: 1591296225736.666,
      ratings: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      },
      status: 'public',
      tags: [],
      activity_type: 'exploration',
      category: 'Art',
      title: 'Test Title 1'
    };
    let completedSummary = LearnerExplorationSummary.createFromBackendDict(
      completed);
    component.totalCompletedLessonsList = [completedSummary];
    result = component.getLessonType(completedSummary);
    expect(result).toEqual('Completed');
  });

  it('should show username popover based on its length', () => {
    expect(component.showUsernamePopover('abcdefghijk')).toBe('mouseenter');
    expect(component.showUsernamePopover('abc')).toBe('none');
  });

  it('should handle show more button', () => {
    expect(component.showMoreInSection.incomplete).toEqual(false);
    const exp1 = {
      last_updated_msec: 1591296737470.528,
      community_owned: false,
      objective: 'Test Objective',
      id: '44LKoKLlIbGe',
      num_views: 0,
      thumbnail_icon_url: '/subjects/Algebra.svg',
      human_readable_contributors_summary: {},
      language_code: 'en',
      thumbnail_bg_color: '#cd672b',
      created_on_msec: 1591296635736.666,
      ratings: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      },
      status: 'public',
      tags: [],
      activity_type: 'exploration',
      category: 'Algebra',
      title: 'Test Title'
    };
    let summary1 = LearnerExplorationSummary.createFromBackendDict(
      exp1);
    const exp2 = {
      last_updated_msec: 1591296737470.528,
      community_owned: false,
      objective: 'Test Objective',
      id: '44LKoKLlIbGe',
      num_views: 0,
      thumbnail_icon_url: '/subjects/Algebra.svg',
      human_readable_contributors_summary: {},
      language_code: 'en',
      thumbnail_bg_color: '#cd672b',
      created_on_msec: 1591296635736.666,
      ratings: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      },
      status: 'public',
      tags: [],
      activity_type: 'exploration',
      category: 'Algebra',
      title: 'Test Title'
    };
    let summary2 = LearnerExplorationSummary.createFromBackendDict(
      exp2);
    const exp3 = {
      last_updated_msec: 1591296737470.528,
      community_owned: false,
      objective: 'Test Objective',
      id: '44LKoKLlIbGe',
      num_views: 0,
      thumbnail_icon_url: '/subjects/Algebra.svg',
      human_readable_contributors_summary: {},
      language_code: 'en',
      thumbnail_bg_color: '#cd672b',
      created_on_msec: 1591296635736.666,
      ratings: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      },
      status: 'public',
      tags: [],
      activity_type: 'exploration',
      category: 'Algebra',
      title: 'Test Title'
    };
    let summary3 = LearnerExplorationSummary.createFromBackendDict(
      exp3);
    const exp4 = {
      last_updated_msec: 1591296737470.528,
      community_owned: false,
      objective: 'Test Objective',
      id: '44LKoKLlIbGe',
      num_views: 0,
      thumbnail_icon_url: '/subjects/Algebra.svg',
      human_readable_contributors_summary: {},
      language_code: 'en',
      thumbnail_bg_color: '#cd672b',
      created_on_msec: 1591296635736.666,
      ratings: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      },
      status: 'public',
      tags: [],
      activity_type: 'exploration',
      category: 'Algebra',
      title: 'Test Title'
    };
    let summary4 = LearnerExplorationSummary.createFromBackendDict(
      exp4);

    component.totalIncompleteLessonsList = [
      summary1, summary2, summary3, summary4];
    component.handleShowMore('incomplete');
    expect(component.showMoreInSection.incomplete).toEqual(true);
    expect(component.displayIncompleteLessonsList).toEqual(
      component.totalIncompleteLessonsList);

    component.showMoreInSection.incomplete = true;
    component.handleShowMore('incomplete');
    expect(component.showMoreInSection.incomplete).toEqual(false);
    expect(component.displayIncompleteLessonsList).toEqual(
      component.totalIncompleteLessonsList.slice(0, 3));

    component.totalCompletedLessonsList = [
      summary1, summary2, summary3, summary4];
    component.totalIncompleteLessonsList = [];
    component.handleShowMore('completed');
    expect(component.showMoreInSection.completed).toEqual(true);
    expect(component.displayCompletedLessonsList).toEqual(
      component.totalCompletedLessonsList);

    component.showMoreInSection.completed = true;
    component.handleShowMore('completed');
    expect(component.showMoreInSection.completed).toEqual(false);
    expect(component.displayCompletedLessonsList).toEqual(
      component.totalCompletedLessonsList.slice(0, 3));

    component.totalLessonsInPlaylist = [
      summary1, summary2, summary3, summary4];
    component.totalCompletedLessonsList = [];
    component.handleShowMore('playlist');
    expect(component.showMoreInSection.playlist).toEqual(true);
    expect(component.displayLessonsInPlaylist).toEqual(
      component.totalLessonsInPlaylist);

    component.showMoreInSection.playlist = true;
    component.handleShowMore('playlist');
    expect(component.showMoreInSection.playlist).toEqual(false);
    expect(component.startIndexInPlaylist).toEqual(0);
    expect(component.endIndexInPlaylist).toEqual(3);
  });

  it('should get the correct tile type', () => {
    const collection = {
      last_updated_msec: 1591296737470.528,
      community_owned: false,
      objective: 'Test Objective',
      id: '44LKoKLlIbGe',
      thumbnail_icon_url: '/subjects/Algebra.svg',
      language_code: 'en',
      thumbnail_bg_color: '#cd672b',
      created_on: 1591296635736.666,
      status: 'public',
      category: 'Algebra',
      title: 'Test Title',
      node_count: 0
    };
    let collectionSummary = CollectionSummary.createFromBackendDict(
      collection);

    const exploration = {
      last_updated_msec: 1591296737470.528,
      community_owned: false,
      objective: 'Test Objective',
      id: '44LKoKLlIbGe',
      num_views: 0,
      thumbnail_icon_url: '/subjects/Algebra.svg',
      human_readable_contributors_summary: {},
      language_code: 'en',
      thumbnail_bg_color: '#cd672b',
      created_on_msec: 1591296635736.666,
      ratings: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      },
      status: 'public',
      tags: [],
      activity_type: 'exploration',
      category: 'Algebra',
      title: 'Test Title'
    };
    let explorationSummary = LearnerExplorationSummary.createFromBackendDict(
      exploration);

    let result = component.getTileType(explorationSummary);
    expect(result).toEqual('exploration');

    result = component.getTileType(collectionSummary);
    expect(result).toEqual('collection');
  });

  it ('should change page by one', () => {
    const exp1 = {
      last_updated_msec: 1591296737470.528,
      community_owned: false,
      objective: 'Test Objective',
      id: '44LKoKLlIbGe',
      num_views: 0,
      thumbnail_icon_url: '/subjects/Algebra.svg',
      human_readable_contributors_summary: {},
      language_code: 'en',
      thumbnail_bg_color: '#cd672b',
      created_on_msec: 1591296635736.666,
      ratings: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      },
      status: 'public',
      tags: [],
      activity_type: 'exploration',
      category: 'Algebra',
      title: 'Test Title'
    };
    let summary1 = LearnerExplorationSummary.createFromBackendDict(
      exp1);
    const exp2 = {
      last_updated_msec: 1591296737470.528,
      community_owned: false,
      objective: 'Test Objective',
      id: '44LKoKLlIbGe',
      num_views: 0,
      thumbnail_icon_url: '/subjects/Algebra.svg',
      human_readable_contributors_summary: {},
      language_code: 'en',
      thumbnail_bg_color: '#cd672b',
      created_on_msec: 1591296635736.666,
      ratings: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      },
      status: 'public',
      tags: [],
      activity_type: 'exploration',
      category: 'Algebra',
      title: 'Test Title'
    };
    let summary2 = LearnerExplorationSummary.createFromBackendDict(
      exp2);
    const exp3 = {
      last_updated_msec: 1591296737470.528,
      community_owned: false,
      objective: 'Test Objective',
      id: '44LKoKLlIbGe',
      num_views: 0,
      thumbnail_icon_url: '/subjects/Algebra.svg',
      human_readable_contributors_summary: {},
      language_code: 'en',
      thumbnail_bg_color: '#cd672b',
      created_on_msec: 1591296635736.666,
      ratings: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      },
      status: 'public',
      tags: [],
      activity_type: 'exploration',
      category: 'Algebra',
      title: 'Test Title'
    };
    let summary3 = LearnerExplorationSummary.createFromBackendDict(
      exp3);
    const exp4 = {
      last_updated_msec: 1591296737470.528,
      community_owned: false,
      objective: 'Test Objective',
      id: '44LKoKLlIbGe',
      num_views: 0,
      thumbnail_icon_url: '/subjects/Algebra.svg',
      human_readable_contributors_summary: {},
      language_code: 'en',
      thumbnail_bg_color: '#cd672b',
      created_on_msec: 1591296635736.666,
      ratings: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      },
      status: 'public',
      tags: [],
      activity_type: 'exploration',
      category: 'Algebra',
      title: 'Test Title'
    };
    let summary4 = LearnerExplorationSummary.createFromBackendDict(
      exp4);
    component.displayInCommunityLessons = [
      summary1, summary2, summary3, summary4];
    component.changePageByOne('MOVE_TO_NEXT_PAGE', 'communityLessons');
    expect(component.pageNumberInCommunityLessons).toEqual(2);

    component.pageNumberInCommunityLessons = 2;
    component.changePageByOne('MOVE_TO_PREV_PAGE', 'communityLessons');
    expect(component.pageNumberInCommunityLessons).toEqual(1);

    component.displayInCommunityLessons = [];
    component.displayLessonsInPlaylist = [
      summary1, summary2, summary3, summary4];
    component.changePageByOne('MOVE_TO_NEXT_PAGE', 'playlist');
    expect(component.pageNumberInPlaylist).toEqual(2);

    component.pageNumberInPlaylist = 2;
    component.changePageByOne('MOVE_TO_PREV_PAGE', 'playlist');
    expect(component.pageNumberInPlaylist).toEqual(1);
  });

  it('should open a modal to remove an exploration from playlist',
    fakeAsync(() => {
      spyOnProperty(navigator, 'userAgent').and.returnValue('iPhone');
      expect(
        learnerDashboardActivityBackendApiService.removeActivityModalStatus)
        .toBeUndefined;

      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        setTimeout(opt.beforeDismiss);
        return <NgbModalRef>(
          { componentInstance: MockRemoveActivityNgbModalRef,
            result: Promise.resolve('success')
          });
      });
      const exp1 = {
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        num_views: 0,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        human_readable_contributors_summary: {},
        language_code: 'en',
        thumbnail_bg_color: '#cd672b',
        created_on_msec: 1591296635736.666,
        ratings: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0
        },
        status: 'public',
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra',
        title: 'Test Title'
      };
      let summary1 = LearnerExplorationSummary.createFromBackendDict(
        exp1);
      component.explorationPlaylist = [summary1];
      component.totalLessonsInPlaylist = [summary1];
      let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION';
      let subsectionName = 'I18N_DASHBOARD_EXPLORATIONS';

      component.openRemoveActivityModal(
        sectionNameI18nId, subsectionName, summary1);
      fixture.detectChanges();

      expect(modalSpy).toHaveBeenCalled();
    }));

  it('should open a modal to remove a collection from playlist',
    fakeAsync(() => {
      expect(
        learnerDashboardActivityBackendApiService.removeActivityModalStatus)
        .toBeUndefined;

      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        setTimeout(opt.beforeDismiss);
        return <NgbModalRef>(
          { componentInstance: MockRemoveActivityNgbModalRef,
            result: Promise.resolve('success')
          });
      });

      const collection = {
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        thumbnail_icon_url: '/subjects/Algebra.svg',
        language_code: 'en',
        thumbnail_bg_color: '#cd672b',
        created_on: 1591296635736.666,
        status: 'public',
        category: 'Algebra',
        title: 'Test Title',
        node_count: 0
      };
      let collectionSummary = CollectionSummary.createFromBackendDict(
        collection);
      component.collectionPlaylist = [collectionSummary];
      component.totalLessonsInPlaylist = [collectionSummary];
      component.showMoreInSection.playlist = true;
      let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION';
      let subsectionName = 'I18N_DASHBOARD_COLLECTIONS';

      component.openRemoveActivityModal(
        sectionNameI18nId, subsectionName, collectionSummary);
      fixture.detectChanges();

      expect(modalSpy).toHaveBeenCalled();
    }));

  it('should open a modal to remove an exploration from incomplete list',
    fakeAsync(() => {
      expect(
        learnerDashboardActivityBackendApiService.removeActivityModalStatus)
        .toBeUndefined;

      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        setTimeout(opt.beforeDismiss);
        return <NgbModalRef>(
          { componentInstance: MockRemoveActivityNgbModalRef,
            result: Promise.resolve('success')
          });
      });
      const exp1 = {
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        num_views: 0,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        human_readable_contributors_summary: {},
        language_code: 'en',
        thumbnail_bg_color: '#cd672b',
        created_on_msec: 1591296635736.666,
        ratings: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0
        },
        status: 'public',
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra',
        title: 'Test Title'
      };
      let summary1 = LearnerExplorationSummary.createFromBackendDict(
        exp1);
      component.incompleteExplorationsList = [summary1];
      component.totalIncompleteLessonsList = [summary1];
      let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
      let subsectionName = 'I18N_DASHBOARD_EXPLORATIONS';

      component.openRemoveActivityModal(
        sectionNameI18nId, subsectionName, summary1);
      fixture.detectChanges();

      expect(modalSpy).toHaveBeenCalled();
    }));

  it('should open a modal to remove a collection from incomplete list',
    fakeAsync(() => {
      expect(
        learnerDashboardActivityBackendApiService.removeActivityModalStatus)
        .toBeUndefined;

      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        setTimeout(opt.beforeDismiss);
        return <NgbModalRef>(
          { componentInstance: MockRemoveActivityNgbModalRef,
            result: Promise.resolve('success')
          });
      });

      const collection = {
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        thumbnail_icon_url: '/subjects/Algebra.svg',
        language_code: 'en',
        thumbnail_bg_color: '#cd672b',
        created_on: 1591296635736.666,
        status: 'public',
        category: 'Algebra',
        title: 'Test Title',
        node_count: 0
      };
      let collectionSummary = CollectionSummary.createFromBackendDict(
        collection);
      component.incompleteCollectionsList = [collectionSummary];
      component.totalIncompleteLessonsList = [collectionSummary];
      component.showMoreInSection.incomplete = true;
      let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
      let subsectionName = 'I18N_DASHBOARD_COLLECTIONS';

      component.openRemoveActivityModal(
        sectionNameI18nId, subsectionName, collectionSummary);
      fixture.detectChanges();

      expect(modalSpy).toHaveBeenCalled();
    }));
});
