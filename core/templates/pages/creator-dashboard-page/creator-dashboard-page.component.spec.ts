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
 * @fileoverview Unit tests for creator dashboard page component.
 */

import { CollectionSummary, CollectionSummaryBackendDict } from 'domain/collection/collection-summary.model';
import { CreatorDashboardStats } from 'domain/creator_dashboard/creator-dashboard-stats.model';
import { CreatorExplorationSummary } from 'domain/summary/creator-exploration-summary.model';
import { ProfileSummary } from 'domain/user/profile-summary.model';
import { CreatorDashboardPageComponent } from './creator-dashboard-page.component';
import { ComponentFixture, fakeAsync, TestBed, waitForAsync } from '@angular/core/testing';
import { CreatorDashboardBackendApiService, CreatorDashboardData } from 'domain/creator_dashboard/creator-dashboard-backend-api.service';
import { CsrfTokenService } from 'services/csrf-token.service';
import { UserService } from 'services/user.service';
import { ExplorationCreationService } from 'components/entity-creation-services/exploration-creation.service';
import { UserInfo } from 'domain/user/user-info.model';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { NO_ERRORS_SCHEMA, Pipe } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SortByPipe } from 'filters/string-utility-filters/sort-by.pipe';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';

@Pipe({name: 'truncate'})
class MockTruncatePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

describe('Creator Dashboard Page Component', () => {
  let fixture: ComponentFixture<CreatorDashboardPageComponent>;
  let component: CreatorDashboardPageComponent;
  let creatorDashboardBackendApiService: CreatorDashboardBackendApiService;
  let csrfService: CsrfTokenService;
  let userService: UserService;
  let explorationCreationService: ExplorationCreationService;
  let windowDimensionsService: WindowDimensionsService;
  let userInfo = {
    canCreateCollections: () => true
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        CreatorDashboardPageComponent,
        MockTranslatePipe,
        MockTruncatePipe,
        SortByPipe
      ],
      providers: [],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(CreatorDashboardPageComponent);
    component = fixture.componentInstance;
    creatorDashboardBackendApiService = TestBed.inject(
      CreatorDashboardBackendApiService);
    csrfService = TestBed.inject(CsrfTokenService);
    explorationCreationService = TestBed.inject(ExplorationCreationService);
    userService = TestBed.inject(UserService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);

    spyOn(csrfService, 'getTokenAsync').and.returnValue(
      Promise.resolve('sample-csrf-token'));
    spyOn(userService, 'getProfileImageDataUrl').and.returnValue(
      ['default-image-url-png', 'default-image-url-webp']);

    // This approach was choosen because spyOn() doesn't work on properties
    // that doesn't have a get access type.
    // Without this approach the test will fail because it'll throw
    // 'Property innerWidth does not have access type get' error.
    // eslint-disable-next-line max-len
    // ref: https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
    // ref: https://github.com/jasmine/jasmine/issues/1415
    Object.defineProperty(window, 'innerWidth', {
      get: () => undefined,
      set: () => {}
    });
  }));

  it('should get the correct exploration editor page URL corresponding to a' +
    ' given exploration ID', () => {
    let explorationId = '1';
    expect(component.getExplorationUrl(explorationId)).toBe(
      '/create/' + explorationId);
  });

  it('should get the correct collection editor page URL corresponding to a' +
    ' given collection ID', () => {
    let collectionId = '1';
    expect(component.getCollectionUrl(collectionId)).toBe(
      '/collection_editor/create/' + collectionId);
  });

  it('should check if the view is tablet or not', () => {
    let widthSpy = spyOn(windowDimensionsService, 'getWidth');
    widthSpy.and.returnValue(700);

    expect(component.checkTabletView()).toBe(true);

    widthSpy.and.returnValue(800);

    expect(component.checkTabletView()).toBe(false);
  });

  it('should get username popover event type according to username length',
    () => {
      expect(component.showUsernamePopover('abcdefghijk')).toBe('mouseenter');
      expect(component.showUsernamePopover('abc')).toBe('none');
    });

  it('should get complete thumbail icon path corresponding to a given' +
    ' relative path', () => {
    expect(component.getCompleteThumbnailIconUrl('/path/to/icon.png')).toBe(
      '/assets/images/path/to/icon.png');
  });

  it('should get Trusted Resource Url', () => {
    expect(component.getTrustedResourceUrl('%2Fimages%2Furl%2F1')).toBe(
      '/images/url/1');
  });

  it('should create new exploration when clicked on CREATE' +
   ' EXPLORATION button', () => {
    spyOn(
      explorationCreationService, 'createNewExploration');
    component.createNewExploration();
    expect(
      explorationCreationService.createNewExploration).toHaveBeenCalled();
  });

  it('should get user profile image png data url correctly', () => {
    expect(component.getProfileImagePngDataUrl('username')).toBe(
      'default-image-url-png');
  });

  it('should get user profile image webp data url correctly', () => {
    expect(component.getProfileImageWebpDataUrl('username')).toBe(
      'default-image-url-webp');
  });

  describe('when fetching dashboard successfully and on explorations tab',
    () => {
      let dashboardData = {
        explorations_list: [
          {
            human_readable_contributors_summary: {
              username: {
                num_commits: 3
              }
            },
            category: 'Algebra',
            community_owned: false,
            tags: [],
            title: 'Testing Exploration',
            created_on_msec: 1593786508029.501,
            num_total_threads: 0,
            num_views: 1,
            last_updated_msec: 1593786607552.753,
            status: 'public',
            num_open_threads: 0,
            thumbnail_icon_url: '/subjects/Algebra.svg',
            language_code: 'en',
            objective: 'To test exploration recommendations',
            id: 'hi27Jix1QGbT',
            thumbnail_bg_color: '#cc4b00',
            activity_type: 'exploration',
            ratings: {
              1: 0,
              2: 0,
              3: 0,
              4: 0,
              5: 0
            }
          }
        ],
        collections_list: [],
        subscribers_list: [],
        dashboard_stats: {
          average_ratings: 0,
          num_ratings: 0,
          total_open_feedback: 0,
          total_plays: 10
        },
        last_week_stats: {
          average_ratings: 0,
          num_ratings: 0,
          total_open_feedback: 0,
          total_plays: 5
        },
        display_preference: 'card',
        threads_for_created_suggestions_list: [{
          status: '',
          subject: '',
          summary: '',
          original_author_username: '',
          last_updated_msecs: 0,
          message_count: '',
          thread_id: 'exp1',
          last_nonempty_message_author: '',
          last_nonempty_message_text: '',
        }],
        created_suggestions_list: [{
          suggestion_type: 'edit_exploration_state_content',
          suggestion_id: 'exp1',
          target_type: '',
          target_id: '',
          status: '',
          author_name: '',
          change: {
            state_name: '',
            new_value: { html: ''},
            old_value: { html: ''},
          },
          last_updated_msecs: 0
        }, {
          suggestion_type: 'edit_exploration_state_content',
          suggestion_id: 'exp2',
          target_type: '',
          target_id: '',
          status: '',
          author_name: '',
          change: {
            state_name: '',
            new_value: { html: ''},
            old_value: { html: ''},
          },
          last_updated_msecs: 0
        }],
        threads_for_suggestions_to_review_list: [{
          status: '',
          subject: '',
          summary: '',
          original_author_username: '',
          last_updated_msecs: 0,
          message_count: '',
          thread_id: 'exp2',
          last_nonempty_message_author: '',
          last_nonempty_message_text: '',
        }],
        suggestions_to_review_list: [{
          suggestion_type: 'edit_exploration_state_content',
          suggestion_id: 'exp2',
          target_type: '',
          target_id: '',
          status: '',
          author_name: '',
          change: {
            state_name: '',
            new_value: { html: ''},
            old_value: { html: ''},
          },
          last_updated_msecs: 0
        }, {
          suggestion_type: 'edit_exploration_state_content',
          suggestion_id: 'exp1',
          target_type: '',
          target_id: '',
          status: '',
          author_name: '',
          change: {
            state_name: '',
            new_value: { html: ''},
            old_value: { html: ''},
          },
          last_updated_msecs: 0
        }]
      };

      beforeEach(waitForAsync(() => {
        spyOn(creatorDashboardBackendApiService, 'fetchDashboardDataAsync')
          .and.returnValue(Promise.resolve({
            dashboardStats: CreatorDashboardStats
              .createFromBackendDict(dashboardData.dashboard_stats),
            // Because lastWeekStats may be null.
            lastWeekStats: dashboardData.last_week_stats ? (
              CreatorDashboardStats
                .createFromBackendDict(dashboardData.last_week_stats)) : null,
            displayPreference: dashboardData.display_preference,
            subscribersList: dashboardData.subscribers_list.map(
              subscriber => ProfileSummary
                .createFromSubscriberBackendDict(subscriber)),
            explorationsList: dashboardData.explorations_list.map(
              expSummary => CreatorExplorationSummary
                .createFromBackendDict(expSummary)),
            collectionsList: dashboardData.collections_list.map(
              collectionSummary => CollectionSummary
                .createFromBackendDict(collectionSummary))
          } as CreatorDashboardData));
        spyOn(userService, 'getUserInfoAsync').and.returnValue(
          Promise.resolve(userInfo as UserInfo));

        component.ngOnInit();
      }));

      it('should save the exploration format view in the backend when creator' +
        ' changes the format view', () => {
        let spyObj = spyOn(
          creatorDashboardBackendApiService, 'postExplorationViewAsync')
          .and.returnValue(Promise.resolve());

        component.setMyExplorationsView('a');

        expect(spyObj).toHaveBeenCalled();
        expect(component.myExplorationsView).toBe('a');
      });

      it('should reverse the sort order of explorations when the creator' +
        ' re-selects the current sorting type', () => {
        expect(component.isCurrentSortDescending).toBeTrue();
        expect(component.currentSortType).toBe('numOpenThreads');
        component.setExplorationsSortingOptions('numOpenThreads');
        expect(component.isCurrentSortDescending).toBeFalse();
      });

      it('should update the exploration sort order based on the' +
        ' option chosen by the creator', () => {
        component.setExplorationsSortingOptions('new_open');
        expect(component.currentSortType).toBe('new_open');
      });

      it('should reverse the sort order of subscriptions when the creator' +
        ' re-selects the current sorting type', () => {
        expect(component.isCurrentSubscriptionSortDescending).toBeTrue();
        expect(component.currentSubscribersSortType).toBe('username');
        component.setSubscriptionSortingOptions('username');
        expect(component.isCurrentSubscriptionSortDescending).toBeFalse();
      });

      it('should update the subscription sort order based on the' +
        ' option chosen by the creator', () => {
        component.setSubscriptionSortingOptions('new_subscriber');
        expect(component.currentSubscribersSortType).toBe('new_subscriber');
      });

      it('should sort subscription list by username', () => {
        expect(component.currentSubscribersSortType).toBe('username');
        expect(component.sortSubscriptionFunction()).toBe('username');
      });

      it('should not sort subscription list by impact given empty object',
        () => {
          component.setSubscriptionSortingOptions('impact');
          expect(component.currentSubscribersSortType).toBe('impact');
          expect(component.sortSubscriptionFunction()).toBe('impact');
        });

      it('should sort exploration list by untitled explorations when title' +
        ' is not provided and exploration is private', () => {
        expect(component.currentSortType).toBe('numOpenThreads');
        component.setExplorationsSortingOptions('title');
        expect(component.currentSortType).toBe('title');

        expect(component.sortByFunction()).toBe('title');
      });

      it('should sort exploration list by options that is not last update' +
        ' when trying to sort by number of views', () => {
        component.setExplorationsSortingOptions('ratings');
        expect(component.currentSortType).toBe('ratings');

        expect(component.sortByFunction()).toBe('default');
      });

      it('should sort exploration list by last updated when last updated' +
        ' value is provided', () => {
        component.setExplorationsSortingOptions('lastUpdatedMsec');
        expect(component.currentSortType).toBe('lastUpdatedMsec');

        expect(component.sortByFunction()).toBe('lastUpdatedMsec');
      });

      it('should expect 0 to be returned', () => {
        expect(component.returnZero()).toBe(0);
      });

      it('should not sort exploration list by options that is not last update' +
        ' when trying to sort by number of views', () => {
        component.setExplorationsSortingOptions('numViews');
        expect(component.currentSortType).toBe('numViews');

        expect(component.sortByFunction()).toBe('numViews');
      });

      it('should update exploration view and publish text on resizing page',
        fakeAsync(() => {
          let innerWidthSpy = spyOnProperty(window, 'innerWidth');
          let spyObj = spyOn(
            creatorDashboardBackendApiService, 'postExplorationViewAsync')
            .and.returnValue(Promise.resolve());

          component.setMyExplorationsView('list');


          expect(spyObj).toHaveBeenCalled();
          expect(component.myExplorationsView).toBe('list');

          innerWidthSpy.and.callFake(() => 480);

          angular.element(window).triggerHandler('resize');

          expect(component.myExplorationsView).toBe('card');
          expect(component.publishText).toBe(
            'Publish the exploration to receive statistics.');

          innerWidthSpy.and.callFake(() => 768);

          angular.element(window).triggerHandler('resize');

          expect(component.myExplorationsView).toBe('card');
          expect(component.publishText).toBe(
            'This exploration is private. Publish it to receive statistics.');
        }));
    });

  describe('when on collections tab', () => {
    let dashboardData = {
      explorations_list: [],
      collections_list: [{
        last_updated: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        thumbnail_icon_url: '/subjects/Algebra.svg',
        language_code: 'en',
        thumbnail_bg_color: '#cc4b00',
        created_on: 1591296635736.666,
        status: 'public',
        category: 'Algebra',
        title: 'Test Title',
        node_count: 0
      }],
      subscribers_list: [],
      dashboard_stats: {
        average_ratings: 0,
        num_ratings: 0,
        total_open_feedback: 0,
        total_plays: 10
      },
      last_week_stats: null,
      display_preference: [],
      threads_for_created_suggestions_list: [],
      created_suggestions_list: [],
      threads_for_suggestions_to_review_list: [],
      suggestions_to_review_list: []
    };

    beforeEach(waitForAsync(() => {
      spyOn(creatorDashboardBackendApiService, 'fetchDashboardDataAsync')
        // This throws "Type object is not assignable to type
        // 'CreatorDashboardData'." We need to suppress this error
        // because of the need to test validations. This throws an
        // error only in the case of strict checks and we need to
        // suppress this error because the case where the returned
        // data is an empty object is also important to test.
        // @ts-ignore
        .and.returnValue(Promise.resolve({
          dashboardStats: CreatorDashboardStats
            .createFromBackendDict(dashboardData.dashboard_stats),
          // Because lastWeekStats may be null.
          lastWeekStats: dashboardData.last_week_stats ? (
            CreatorDashboardStats.createFromBackendDict(
              // This throws "Argument of type 'null' is not assignable to
              // parameter of type 'object'." We need to suppress this error
              // because of the need to test validations.
              // @ts-ignore
              dashboardData.last_week_stats)
            ) : null,
          displayPreference: dashboardData.display_preference,
          subscribersList: dashboardData.subscribers_list.map(
            subscriber => ProfileSummary
              .createFromSubscriberBackendDict(subscriber)),
          explorationsList: dashboardData.explorations_list.map(
            expSummary => CreatorExplorationSummary
              .createFromBackendDict(expSummary)),
          collectionsList: dashboardData.collections_list.map(
            // This throws "Type object is not assignable to type
            // 'CreatorDashboardData'." We need to suppress this error
            // because of the need to test validations. This throws an
            // error only in the case of strict checks and we need to
            // suppress this error because the case where the returned
            // data is an empty object is also important to test.
            // @ts-ignore
            (collectionSummary: CollectionSummary) => CollectionSummary
              .createFromBackendDict(
                // This throws "Type object is not assignable to type
                // 'CreatorDashboardData'." We need to suppress this error
                // because of the need to test validations. This throws an
                // error only in the case of strict checks and we need to
                // suppress this error because the case where the returned
                // data is an empty object is also important to test.
                // @ts-ignore
                collectionSummary as CollectionSummaryBackendDict))
        } as CreatorDashboardData));

      component.ngOnInit();
    }));

    it('should evaluate active tab', () => {
      component.setActiveTab('myCollections');
      expect(component.activeTab).toBe('myCollections');
    });
  });
});
