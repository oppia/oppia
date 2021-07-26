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

import { async, ComponentFixture, fakeAsync, TestBed, tick } from
  '@angular/core/testing';
import { Component, NO_ERRORS_SCHEMA, Pipe } from '@angular/core';
import { MaterialModule } from 'components/material.module';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { WindowRef } from 'services/contextual/window-ref.service';
import { CollectionSummaryTileComponent } from './collection-summary-tile.component';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { DateTimeFormatService } from 'services/date-time-format.service';
import { UserService } from 'services/user.service';

@Component({selector: 'learner-dashboard-icons', template: ''})
class LearnerDashboardIconsComponentStub {
}

@Pipe({name: 'truncateAndCapitalize'})
class MockTruncteAndCapitalizePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

describe('Collection Summary Tile Component', () => {
  let component: CollectionSummaryTileComponent;
  let fixture: ComponentFixture<CollectionSummaryTileComponent>;
  let dateTimeFormatService: DateTimeFormatService;
  let userService: UserService;
  let urlInterpolationService: UrlInterpolationService;

  let userInfo = {
    _role: 'USER_ROLE',
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
    isTranslationAdmin: () => false,
    isQuestionAdmin: () => false,
    canCreateCollections: () => true,
    getPreferredSiteLanguageCode: () =>'en',
    getUsername: () => 'username1',
    getEmail: () => 'tester@example.org',
    isLoggedIn: () => true
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MaterialModule,
        FormsModule,
        HttpClientTestingModule
      ],
      declarations: [
        CollectionSummaryTileComponent,
        MockTruncteAndCapitalizePipe,
        LearnerDashboardIconsComponentStub
      ],
      providers: [
        WindowRef,
        DateTimeFormatService,
        UrlInterpolationService,
        UserService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionSummaryTileComponent);
    component = fixture.componentInstance;
    dateTimeFormatService = TestBed.inject(DateTimeFormatService);
    userService = TestBed.inject(UserService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
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
      userService, 'getUserInfoAsync')
      .and.returnValue(Promise.resolve(userInfo));

    component.ngOnInit();
    tick();
    fixture.detectChanges();

    expect(component.defaultEmptyTitle).toBe('Untitled');
    expect(component.activityTypeCollection).toBe('collection');
    expect(userServiceSpy).toHaveBeenCalled();
  }));

  it('should get the last updated Date & time', () => {
    const dateTimeSpy = spyOn(
      dateTimeFormatService, 'getLocaleAbbreviatedDatetimeString')
      .and.returnValue('1:30 am');

    component.getLastUpdatedDatetime();
    fixture.detectChanges();

    expect(dateTimeSpy).toHaveBeenCalled();
  });

  it('should get the collection link url for editor page', () => {
    const urlSpy = spyOn(
      urlInterpolationService, 'interpolateUrl')
      .and.returnValue('/collection_editor/create/1');

    component.getCollectionLink();
    fixture.detectChanges();

    expect(urlSpy).toHaveBeenCalled();
  });

  it('should get the collection link url for viewer page', () => {
    const urlSpy = spyOn(
      urlInterpolationService, 'interpolateUrl')
      .and.returnValue('/collection/1');

    component.isLinkedToEditorPage = false;
    fixture.detectChanges();

    component.getCollectionLink();
    fixture.detectChanges();

    expect(urlSpy).toHaveBeenCalled();
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

  it('should get the image url', () => {
    const urlSpy = spyOn(
      urlInterpolationService, 'getStaticImageUrl')
      .and.returnValue('imageUrl');

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
