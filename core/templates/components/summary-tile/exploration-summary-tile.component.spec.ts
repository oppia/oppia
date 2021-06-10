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
 * @fileoverview Unit tests for for ExplorationSummaryTileComponent.
 */

import { async, ComponentFixture, fakeAsync, TestBed, tick } from
  '@angular/core/testing';
import { Component, NO_ERRORS_SCHEMA, Pipe } from '@angular/core';
import { MaterialModule } from 'components/material.module';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { WindowRef } from 'services/contextual/window-ref.service';
import { ExplorationSummaryTileComponent } from './exploration-summary-tile.component';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { DateTimeFormatService } from 'services/date-time-format.service';
import { UserService } from 'services/user.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { of } from 'rxjs';
import { UrlParamsType, UrlService } from 'services/contextual/url.service';
import { RatingComputationService } from 'components/ratings/rating-computation/rating-computation.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';

@Component({selector: 'learner-dashboard-icons', template: ''})
class LearnerDashboardIconsComponentStub {
}

@Pipe({name: 'truncateAndCapitalize'})
class MockTruncteAndCapitalizePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

@Pipe({name: 'truncate'})
class MockTruncatePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

@Pipe({name: 'summarizeNonnegativeNumber'})
class MockSummarizeNonnegativeNumberPipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

class MockWindowRef {
  _window = {
    location: {
      _hash: '',
      _hashChange: null,
      _href: '',
      get hash() {
        return this._hash;
      },
      set hash(val) {
        this._hash = val;
        if (this._hashChange === null) {
          return;
        }
        this._hashChange();
      },
      get href() {
        return this._href;
      },
      set href(val) {
        this._href = val;
      },
      reload: (val) => val
    },
    get onhashchange() {
      return this.location._hashChange;
    },

    set onhashchange(val) {
      this.location._hashChange = val;
    }
  };
  get nativeWindow() {
    return this._window;
  }
}

class MockUrlService {
  addField(url: string, fieldName: string, fieldValue: string): string {
    let encodedFieldValue = fieldValue;
    let encodedFieldName = fieldName;
    return url + (url.indexOf('?') !== -1 ? '&' : '?') + encodedFieldName +
        '=' + encodedFieldValue;
  }

  getPathname(): string {
    return '/story/fhfhvhgvhvvh';
  }

  getUrlParams(): UrlParamsType {
    return {
      collection_id: '1',
      story_id: '1',
      node_id: '1',
    };
  }

  getStoryIdFromViewerUrl(): string {
    return '1';
  }
}

describe('Exploration Summary Tile Component', () => {
  let component: ExplorationSummaryTileComponent;
  let fixture: ComponentFixture<ExplorationSummaryTileComponent>;
  let dateTimeFormatService: DateTimeFormatService;
  let ratingComputationService: RatingComputationService;
  let userService: UserService;
  let urlService: MockUrlService;
  let urlInterpolationService: UrlInterpolationService;
  let windowDimensionsService: WindowDimensionsService;
  let resizeEvent = new Event('resize');
  let windowRef: MockWindowRef;

  let userInfo = {
    _isModerator: true,
    _isAdmin: false,
    _isTopicManager: false,
    _isSuperAdmin: false,
    _canCreateCollections: true,
    _preferredSiteLanguageCode: 'en',
    _username: 'username1',
    _email: 'tester@example.org',
    _isLoggedIn: true,
    isModerator: () => true,
    isAdmin: () => false,
    isSuperAdmin: () => false,
    isTopicManager: () => false,
    canCreateCollections: () => true,
    getPreferredSiteLanguageCode: () =>'en',
    getUsername: () => 'username1',
    getEmail: () => 'tester@example.org',
    isLoggedIn: () => true
  };

  beforeEach(async(() => {
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [
        MaterialModule,
        FormsModule,
        HttpClientTestingModule
      ],
      declarations: [
        ExplorationSummaryTileComponent,
        MockTruncatePipe,
        MockTruncteAndCapitalizePipe,
        MockSummarizeNonnegativeNumberPipe,
        MockTranslatePipe,
        LearnerDashboardIconsComponentStub,
      ],
      providers: [
        DateTimeFormatService,
        UrlInterpolationService,
        UserService,
        RatingComputationService,
        {
          provide: UrlService,
          useClass: MockUrlService
        },
        {
          provide: WindowDimensionsService,
          useValue: {
            getWidth: () => 1000,
            getResizeEvent: () => of(resizeEvent)
          }
        },
        {
          provide: WindowRef,
          useValue: windowRef
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExplorationSummaryTileComponent);
    component = fixture.componentInstance;
    dateTimeFormatService = TestBed.inject(DateTimeFormatService);
    userService = TestBed.inject(UserService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    ratingComputationService = TestBed.inject(RatingComputationService);
    urlService = TestBed.inject(UrlService);

    component.getCollectionId = '1';
    component.getExplorationId = '1';
    component.getExplorationTitle = 'Title';
    component.getStoryNodeId = '1';
    component.getLastUpdatedMsec = 1000;
    component.getNumViews = '100';
    component.getObjective = 'objective';
    component.getCategory = 'category';
    component.getRatings = {
      1: 1,
      2: 0,
      3: 0,
      4: 0,
      5: 1
    };
    component.getContributorsSummary = 'summary';
    component.getThumbnailIconUrl = '/subjects/Welcome';
    component.getThumbnailBgColor = 'blue';
    component.openInNewWindow = 'true';
    component.isCommunityOwned = true;
    component.isCollectionPreviewTile = true;
    component.mobileCutoffPx = 500;
    component.isPlaylistTile = true;
    component.getParentExplorationIds = '123';
    component.showLearnerDashboardIconsIfPossible = 'true';
    component.isContainerNarrow = true;
    component.isOwnedByCurrentUser = true;
    fixture.detectChanges();
  });

  it('should intialize the component and set values', fakeAsync(() => {
    const userServiceSpy = spyOn(
      userService, 'getUserInfoAsync')
      .and.returnValue(Promise.resolve(userInfo));
    const windowResizeSpy = spyOn(
      windowDimensionsService, 'getResizeEvent').and.callThrough();
    const windowWidthSpy = spyOn(
      windowDimensionsService, 'getWidth').and.callThrough();

    component.ngOnInit();
    tick();
    fixture.detectChanges();

    expect(component.activityType).toBe('exploration');
    expect(component.isRefresherExploration).toBe(true);
    expect(component.isWindowLarge).toBe(true);

    expect(userServiceSpy).toHaveBeenCalled();
    expect(windowResizeSpy).toHaveBeenCalled();
    expect(windowWidthSpy).toHaveBeenCalled();
  }));

  it('should intialize the component and set mobileCutoffPx to 0' +
    ' if it is undefined', fakeAsync(() => {
    const userServiceSpy = spyOn(
      userService, 'getUserInfoAsync')
      .and.returnValue(Promise.resolve(userInfo));
    const windowResizeSpy = spyOn(
      windowDimensionsService, 'getResizeEvent').and.callThrough();
    const windowWidthSpy = spyOn(
      windowDimensionsService, 'getWidth').and.callThrough();

    component.mobileCutoffPx = null;
    component.ngOnInit();
    tick();
    fixture.detectChanges();

    expect(component.mobileCutoffPx).toBe(0);

    expect(userServiceSpy).toHaveBeenCalled();
    expect(windowResizeSpy).toHaveBeenCalled();
    expect(windowWidthSpy).toHaveBeenCalled();
  }));

  it('should remove all subscriptions when calling ngOnDestroy',
    fakeAsync(() => {
      component.resizeSubscription = of(resizeEvent).subscribe();
      tick();
      fixture.detectChanges();

      component.ngOnDestroy();

      tick();
      fixture.detectChanges();
      expect(component.resizeSubscription.closed).toBe(true);
    }));

  it('should set the hover state to true', () => {
    component.setHoverState(true);
    fixture.detectChanges();

    expect(component.explorationIsCurrentlyHoveredOver).toBe(true);
  });

  it('should set the hover state to false', () => {
    component.setHoverState(false);
    fixture.detectChanges();

    expect(component.explorationIsCurrentlyHoveredOver).toBe(false);
  });

  it('should navigate to parent exploration', fakeAsync(() => {
    const explorationLinkSpy = spyOn(component, 'getExplorationLink')
      .and.returnValue('/parent/id/1');

    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: {
        href: '/parent/id/1'
      }
    });

    component.loadParentExploration();
    let location = component.getExplorationLink();

    tick();
    fixture.detectChanges();

    expect(explorationLinkSpy).toHaveBeenCalled();
    expect(windowRef.nativeWindow.location.href).toBe(location);
  }));

  it('should get the average ratings of the exploration', fakeAsync(() => {
    const ratingsSpy = spyOn(
      ratingComputationService, 'computeAverageRating')
      .and.returnValue(3);

    let averageRatings = component.getAverageRating();
    tick();
    fixture.detectChanges();

    expect(ratingsSpy).toHaveBeenCalled();
    expect(averageRatings).toBe(3);
  }));

  it('should fail to get the average ratings of the exploration' +
    ' if rating are undefined', fakeAsync(() => {
    const ratingsSpy = spyOn(
      ratingComputationService, 'computeAverageRating')
      .and.returnValue(3);

    component.getRatings = null;
    let averageRatings = component.getAverageRating();
    tick();
    fixture.detectChanges();

    expect(ratingsSpy).not.toHaveBeenCalled();
    expect(averageRatings).toBe(null);
  }));

  it('should get last updated Date & time', () => {
    const dateTimeSpy = spyOn(
      dateTimeFormatService, 'getLocaleAbbreviatedDatetimeString')
      .and.returnValue('1:30 am');

    let dateTime = component.getLastUpdatedDatetime();
    fixture.detectChanges();

    expect(dateTime).toBe('1:30 am');
    expect(dateTimeSpy).toHaveBeenCalled();
  });

  it('should fail to get last updated Date & time', () => {
    const dateTimeSpy = spyOn(
      dateTimeFormatService, 'getLocaleAbbreviatedDatetimeString')
      .and.returnValue('1:30 am');

    component.getLastUpdatedMsec = null;
    let dateTime = component.getLastUpdatedDatetime();
    fixture.detectChanges();

    expect(dateTime).toBe(null);
    expect(dateTimeSpy).not.toHaveBeenCalled();
  });

  it('should get the thumbnail url', () => {
    const urlSpy = spyOn(
      urlInterpolationService, 'getStaticImageUrl')
      .and.returnValue('thumbnailUrl');

    component.getThumbnailIconUrl = 'thumbnailUrl';
    component.getCompleteThumbnailIconUrl();
    fixture.detectChanges();

    expect(urlSpy).toHaveBeenCalled();
  });

  it('should return to the same page if ExplorationId is null', () => {
    component.getExplorationId = null;
    const result = component.getExplorationLink();
    fixture.detectChanges();

    expect(result).toBe('#');
  });

  it('should return the url for the exploration' +
    ' given collectionId and explorationId', fakeAsync(() => {
    const urlParamsSpy = spyOn(urlService, 'getUrlParams').and.returnValue({
      collection_id: '1',
    });
    const addFieldSpy = spyOn(urlService, 'addField').and.callThrough();
    const result = component.getExplorationLink();

    tick();
    fixture.detectChanges();

    expect(result).toBe('/explore/1?collection_id=1&parent=1&parent=2');
    expect(urlParamsSpy).toHaveBeenCalled();
    expect(addFieldSpy).toHaveBeenCalled();
  }));


  it('should return the url for the exploration' +
    ' given explorationId and storyId', fakeAsync(() => {
    const urlParamsSpy = spyOn(urlService, 'getUrlParams').and.returnValue({
    });
    const urlPathSpy = spyOn(urlService, 'getPathname').and.returnValue(
      '/story/fhfhvhgvhvvh');
    const storyIdSpy = spyOn(urlService, 'getStoryIdFromViewerUrl')
      .and.returnValue('1');
    const addFieldSpy = spyOn(urlService, 'addField').and.callThrough();

    const result = component.getExplorationLink();

    tick();
    fixture.detectChanges();

    expect(result).toBe(
      '/explore/1?collection_id=1&parent=1&parent=2&story_id=1&node_id=1');
    expect(urlParamsSpy).toHaveBeenCalled();
    expect(urlPathSpy).toHaveBeenCalled();
    expect(storyIdSpy).toHaveBeenCalled();
    expect(addFieldSpy).toHaveBeenCalled();
  }));

  it('should return the url for the exploration' +
    ' given nodeId and storyId', fakeAsync(() => {
    const urlParamsSpy = spyOn(urlService, 'getUrlParams').and.returnValue({
      story_id: '1',
      node_id: '1',
    });
    const urlPathSpy = spyOn(urlService, 'getPathname').and.returnValue(
      '/story/fhfhvhgvhvvh');
    const addFieldSpy = spyOn(urlService, 'addField').and.callThrough();

    component.getStoryNodeId = null;
    const result = component.getExplorationLink();

    tick();
    fixture.detectChanges();

    expect(result).toBe('/explore/1?collection_id=1&parent=1&parent=2');
    expect(urlParamsSpy).toHaveBeenCalled();
    expect(urlPathSpy).toHaveBeenCalled();
    expect(addFieldSpy).toHaveBeenCalled();
  }));
});
