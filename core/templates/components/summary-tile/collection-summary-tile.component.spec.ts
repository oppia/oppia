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
 * @fileoverview Unit tests for for CollectionSummaryTileComponent.
 */

import {
  async,
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {Component, NO_ERRORS_SCHEMA, Pipe} from '@angular/core';
import {MaterialModule} from 'modules/material.module';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import {WindowRef} from 'services/contextual/window-ref.service';
import {CollectionSummaryTileComponent} from './collection-summary-tile.component';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {UrlService} from 'services/contextual/url.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {of} from 'rxjs';
import {DateTimeFormatService} from 'services/date-time-format.service';
import {UserInfo} from 'domain/user/user-info.model';
import {UserService} from 'services/user.service';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MockTranslatePipe} from 'tests/unit-test-utils';

@Component({selector: 'learner-dashboard-icons', template: ''})
class LearnerDashboardIconsComponentStub {}

@Pipe({name: 'truncateAndCapitalize'})
class MockTruncteAndCapitalizePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

class MockUrlService {
  getPathname(): string {
    return '/community-library';
  }
}

class MockWindowDimensionsService {
  getResizeEvent() {
    return of(new Event('resize'));
  }

  getWidth(): number {
    return 530;
  }
}

describe('Collection Summary Tile Component', () => {
  let component: CollectionSummaryTileComponent;
  let fixture: ComponentFixture<CollectionSummaryTileComponent>;
  let dateTimeFormatService: DateTimeFormatService;
  let userService: UserService;
  let urlInterpolationService: UrlInterpolationService;
  let urlService: MockUrlService;
  let windowDimensionsService: MockWindowDimensionsService;

  let userInfo: UserInfo = new UserInfo(
    ['USER_ROLE'],
    true,
    false,
    false,
    false,
    true,
    'en',
    'username1',
    'tester@example.com',
    true
  );

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MaterialModule,
        FormsModule,
        HttpClientTestingModule,
      ],
      declarations: [
        CollectionSummaryTileComponent,
        MockTruncteAndCapitalizePipe,
        LearnerDashboardIconsComponentStub,
        MockTranslatePipe,
      ],
      providers: [
        WindowRef,
        DateTimeFormatService,
        UrlInterpolationService,
        UserService,
        {
          provide: UrlService,
          useClass: MockUrlService,
        },
        {
          provide: WindowDimensionsService,
          useClass: MockWindowDimensionsService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionSummaryTileComponent);
    component = fixture.componentInstance;
    dateTimeFormatService = TestBed.inject(DateTimeFormatService);
    userService = TestBed.inject(UserService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    urlService = TestBed.inject(UrlService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    component.getCollectionId = '1';
    component.getCollectionTitle = 'Title';
    component.getLastUpdatedMsec = 1000;
    component.getObjective = 'objective';
    component.getNodeCount = '1';
    component.getCategory = 'category';
    component.getThumbnailIconUrl = '/subjects/Welcome';
    component.getThumbnailBgColor = 'blue';
    component.isPlaylistTile = true;
    component.isLinkedToEditorPage = true;
    component.showLearnerDashboardIconsIfPossible = 'true';
    component.isContainerNarrow = true;
    component.isOwnedByCurrentUser = true;
    fixture.detectChanges();
  });

  it('should intialize the component and set values', fakeAsync(() => {
    const userServiceSpy = spyOn(
      userService,
      'getUserInfoAsync'
    ).and.returnValue(Promise.resolve(userInfo));
    const windowResizeSpy = spyOn(
      windowDimensionsService,
      'getResizeEvent'
    ).and.callThrough();
    component.mobileCutoffPx = 536;

    component.ngOnInit();
    tick();
    fixture.detectChanges();

    expect(component.defaultEmptyTitle).toBe('Untitled');
    expect(component.activityTypeCollection).toBe('collection');
    expect(userServiceSpy).toHaveBeenCalled();
    expect(windowResizeSpy).toHaveBeenCalled();
    expect(component.resizeSubscription).not.toBe(undefined);
  }));

  it('should remove all subscriptions when ngOnDestroy is called', fakeAsync(() => {
    component.resizeSubscription = of(new Event('resize')).subscribe();
    tick();
    fixture.detectChanges();

    component.ngOnDestroy();

    tick();
    fixture.detectChanges();
    expect(component.resizeSubscription.closed).toBe(true);
  }));

  it(
    'should set mobileCutoffPx to 0 if it is not ' + 'specified',
    fakeAsync(() => {
      const userServiceSpy = spyOn(
        userService,
        'getUserInfoAsync'
      ).and.returnValue(Promise.resolve(userInfo));
      const windowResizeSpy = spyOn(
        windowDimensionsService,
        'getResizeEvent'
      ).and.callThrough();

      component.ngOnInit();
      tick();
      fixture.detectChanges();

      expect(userServiceSpy).toHaveBeenCalled();
      expect(windowResizeSpy).toHaveBeenCalled();
      expect(component.mobileCutoffPx).toBe(0);
    })
  );

  it('should check if mobile card should be shown', () => {
    const urlServiceSpy = spyOn(urlService, 'getPathname').and.returnValue(
      '/community-library'
    );
    const windowWidthSpy = spyOn(
      windowDimensionsService,
      'getWidth'
    ).and.returnValue(530);
    component.mobileCutoffPx = 537;

    component.checkIfMobileCardToBeShown();

    expect(urlServiceSpy).toHaveBeenCalled();
    expect(windowWidthSpy).toHaveBeenCalled();
    expect(component.mobileCardToBeShown).toBe(true);

    urlServiceSpy.and.returnValue('/not-community-library');

    component.checkIfMobileCardToBeShown();

    expect(component.mobileCardToBeShown).toBe(false);
  });

  it('should get the last updated Date & time', () => {
    const dateTimeSpy = spyOn(
      dateTimeFormatService,
      'getLocaleAbbreviatedDatetimeString'
    ).and.returnValue('1:30 am');

    component.getLastUpdatedDatetime();
    fixture.detectChanges();

    expect(dateTimeSpy).toHaveBeenCalled();
  });

  it('should get relative last updated Date & time', () => {
    const dateTimeSpy = spyOn(
      dateTimeFormatService,
      'getRelativeTimeFromNow'
    ).and.returnValue('a few seconds ago');

    // Date.now() returns the current time in milliseconds since the
    // Epoch.
    component.getLastUpdatedMsec = Date.now();
    let relativeLastUpdatedDateTime =
      component.getRelativeLastUpdatedDateTime();
    fixture.detectChanges();

    expect(dateTimeSpy).toHaveBeenCalled();
    expect(relativeLastUpdatedDateTime).toBe('a few seconds ago');
  });

  it('should fail to get relative last updated Date & time', () => {
    const dateTimeSpy = spyOn(dateTimeFormatService, 'getRelativeTimeFromNow');
    component.getLastUpdatedMsec = 0;

    let relativeLastUpdatedDateTime =
      component.getRelativeLastUpdatedDateTime();
    fixture.detectChanges();

    expect(dateTimeSpy).not.toHaveBeenCalled();
    expect(relativeLastUpdatedDateTime).toBeNull();
  });

  it('should get the collection link url for editor page', () => {
    const urlSpy = spyOn(
      urlInterpolationService,
      'interpolateUrl'
    ).and.returnValue('/collection_editor/create/1');

    component.getCollectionLink();
    fixture.detectChanges();

    expect(urlSpy).toHaveBeenCalled();
  });

  it('should get the collection link url for viewer page', () => {
    const urlSpy = spyOn(
      urlInterpolationService,
      'interpolateUrl'
    ).and.returnValue('/collection/1');

    component.isLinkedToEditorPage = false;
    fixture.detectChanges();

    component.getCollectionLink();
    fixture.detectChanges();

    expect(urlSpy).toHaveBeenCalled();
  });

  it('should get the thumbnail url', () => {
    const urlSpy = spyOn(
      urlInterpolationService,
      'getStaticImageUrl'
    ).and.returnValue('thumbnailUrl');

    component.getThumbnailIconUrl = 'thumbnailUrl';
    component.getCompleteThumbnailIconUrl();
    fixture.detectChanges();

    expect(urlSpy).toHaveBeenCalled();
  });

  it('should get the image url', () => {
    const urlSpy = spyOn(
      urlInterpolationService,
      'getStaticImageUrl'
    ).and.returnValue('imageUrl');

    component.getCompleteThumbnailIconUrl();
    fixture.detectChanges();

    expect(urlSpy).toHaveBeenCalled();
  });

  it('should set the hover state to true', () => {
    component.setHoverState(true);
    fixture.detectChanges();

    expect(component.collectionIsCurrentlyHoveredOver).toBe(true);
  });

  it('should set the hover state to false', () => {
    component.setHoverState(false);
    fixture.detectChanges();

    expect(component.collectionIsCurrentlyHoveredOver).toBe(false);
  });
});
