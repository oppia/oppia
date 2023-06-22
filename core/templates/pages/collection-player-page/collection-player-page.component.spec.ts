// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for the Collection player page component.
 */

import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/compiler';
import { EventEmitter } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { AlertsService } from 'services/alerts.service';
import { CollectionPlayerBackendApiService } from './services/collection-player-backend-api.service';
import { GuestCollectionProgressService } from 'domain/collection/guest-collection-progress.service';
import { ReadOnlyCollectionBackendApiService } from 'domain/collection/read-only-collection-backend-api.service';
import { UserService } from 'services/user.service';
import { UrlService } from 'services/contextual/url.service';
import { Collection, CollectionBackendDict } from 'domain/collection/collection.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { CollectionPlaythrough } from 'domain/collection/collection-playthrough.model';
import { UserInfo } from 'domain/user/user-info.model';
import { CollectionPlayerPageComponent, IconParametersArray } from './collection-player-page.component';
import { CollectionNodeBackendDict } from 'domain/collection/collection-node.model';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { PageTitleService } from 'services/page-title.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
  instant(key: string, interpolateParams?: Object): string {
    return key;
  }
}

describe('Collection player page component', () => {
  let alertsService: AlertsService;
  let component: CollectionPlayerPageComponent;
  let fixture: ComponentFixture<CollectionPlayerPageComponent>;
  let collectionPlayerBackendApiService: CollectionPlayerBackendApiService;
  let guestCollectionProgressService:
    GuestCollectionProgressService;
  let readOnlyCollectionBackendApiService:
    ReadOnlyCollectionBackendApiService;
  let userService: UserService;
  let urlService: UrlService;
  let urlInterpolationService: UrlInterpolationService;
  let alertsSpy: jasmine.Spy<(warning: string) => void>;
  let sampleCollection: Collection;
  let sampleCollectionBackendObject: CollectionBackendDict;
  let collectionNodesList: IconParametersArray[];
  let collectionNodeBackendObject: CollectionNodeBackendDict;
  let pageTitleService: PageTitleService;
  let translateService: TranslateService;
  let i18nLanguageCodeService: I18nLanguageCodeService;

  const userInfoForCollectionCreator = new UserInfo(
    ['USER_ROLE'], true, false, false, false, true,
    'en', 'username1', 'tester@example.com', true
  );

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        CollectionPlayerPageComponent,
        MockTranslatePipe
      ],
      providers: [
        PageTitleService,
        {
          provide: TranslateService,
          useClass: MockTranslateService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    alertsService = TestBed.inject(AlertsService);
    collectionPlayerBackendApiService = TestBed.inject(
      CollectionPlayerBackendApiService);
    userService = TestBed.inject(UserService);
    urlService = TestBed.inject(UrlService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    guestCollectionProgressService = TestBed.inject(
      GuestCollectionProgressService);
    readOnlyCollectionBackendApiService = TestBed.inject(
      ReadOnlyCollectionBackendApiService);
    translateService = TestBed.inject(TranslateService);
    pageTitleService = TestBed.inject(PageTitleService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    fixture = TestBed.createComponent(CollectionPlayerPageComponent);
    component = fixture.componentInstance;

    collectionNodeBackendObject = {
      exploration_id: 'exp_id',
      exploration_summary: {
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        num_views: 0,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        human_readable_contributors_summary: {},
        language_code: 'en',
        thumbnail_bg_color: '#cc4b00',
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
      }
    };

    sampleCollectionBackendObject = {
      id: 'collectionId',
      title: 'title',
      objective: 'objective',
      category: 'category',
      version: 1,
      nodes: [
        collectionNodeBackendObject,
        collectionNodeBackendObject,
        collectionNodeBackendObject,
        collectionNodeBackendObject,
        collectionNodeBackendObject,
        collectionNodeBackendObject
      ],
      language_code: null,
      schema_version: null,
      tags: null,
      playthrough_dict: {
        next_exploration_id: 'expId',
        completed_exploration_ids: ['expId2']
      }
    };

    collectionNodesList = [
      {
        thumbnailIconUrl: '/inverted_subjects/Algebra.svg',
        left: '225px',
        top: '35px',
        thumbnailBgColor: '#cc4b00'
      },
      {
        thumbnailIconUrl: '/inverted_subjects/Algebra.svg',
        left: '390px',
        top: '145px',
        thumbnailBgColor: '#cc4b00'
      },
      {
        thumbnailIconUrl: '/inverted_subjects/Algebra.svg',
        left: '225px',
        top: '255px',
        thumbnailBgColor: '#cc4b00'
      },
      {
        thumbnailIconUrl: '/inverted_subjects/Algebra.svg',
        left: '60px',
        top: '365px',
        thumbnailBgColor: '#cc4b00'
      },
      {
        thumbnailIconUrl: '/inverted_subjects/Algebra.svg',
        left: '225px',
        top: '475px',
        thumbnailBgColor: '#cc4b00'
      },
      {
        thumbnailIconUrl: '/inverted_subjects/Algebra.svg',
        left: '390px',
        top: '585px',
        thumbnailBgColor: '#cc4b00'
      }
    ];

    sampleCollection = Collection.create(
      sampleCollectionBackendObject);

    spyOn(collectionPlayerBackendApiService, 'fetchCollectionSummariesAsync')
      .and.returnValue(Promise.resolve({
        is_admin: false,
        is_topic_manager: false,
        summaries: [],
        user_email: 'tester@example.com',
        username: false
      }));
    spyOn(urlService, 'getCollectionIdFromUrl').and.returnValue('collectionId');
    alertsSpy = spyOn(alertsService, 'addWarning').and.returnValue(null);
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true);
  });

  it('should throw warning message when an invalid collection ' +
    'is fetched from backend', fakeAsync(() => {
    spyOn(readOnlyCollectionBackendApiService, 'loadCollectionAsync')
      .and.rejectWith();
    spyOn(userService, 'getUserInfoAsync')
      .and.returnValue(Promise.resolve(userInfoForCollectionCreator));

    component.ngOnInit();
    tick();

    expect(alertsSpy).toHaveBeenCalledWith(
      'There was an error loading the collection.');
  }));

  it('should set page title and subscribe to the lang change emitter',
    fakeAsync(() => {
      spyOn(component, 'setPageTitle');
      spyOn(component, 'subscribeToOnLangChange');
      spyOn(readOnlyCollectionBackendApiService, 'loadCollectionAsync')
        .and.returnValue(Promise.resolve(sampleCollection));
      component.ngOnInit();
      tick();

      expect(component.setPageTitle).toHaveBeenCalled();
      expect(component.subscribeToOnLangChange).toHaveBeenCalled();
    }));

  it('should obtain translated title and set it whenever the ' +
    'selected language changes', () => {
    component.subscribeToOnLangChange();
    spyOn(component, 'setPageTitle');
    translateService.onLangChange.emit();

    expect(component.setPageTitle).toHaveBeenCalled();
  });

  it('should set page title', () => {
    spyOn(translateService, 'instant').and.callThrough();
    spyOn(pageTitleService, 'setDocumentTitle');
    component.collection = Collection.create(sampleCollectionBackendObject);
    component.setPageTitle();

    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_COLLECTION_PLAYER_PAGE_TITLE', {
        collectionTitle: 'title'
      });
    expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(
      'I18N_COLLECTION_PLAYER_PAGE_TITLE');
  });

  it('should unsubscribe upon component destruction', () => {
    component.subscribeToOnLangChange();
    expect(component.directiveSubscriptions.closed).toBe(false);
    component.ngOnDestroy();

    expect(component.directiveSubscriptions.closed).toBe(true);
  });

  it('should stop event propagation when click event is emitted', () => {
    let eventSpy = jasmine.createSpyObj(
      'event', ['stopPropagation']);

    component.onClickStopPropagation(eventSpy);

    expect(eventSpy.stopPropagation).toHaveBeenCalled();
  });

  it('should return exploration title position given index ' +
    'when calling \'getExplorationTitlePosition\'', () => {
    // Case 1.
    let result = component.getExplorationTitlePosition(2);
    expect(result).toBe('-13px');

    // Case 2.
    result = component.getExplorationTitlePosition(1);
    expect(result).toBe('40px');

    // Case 3.
    result = component.getExplorationTitlePosition(3);
    expect(result).toBe('-55px');
  });

  it('should return exploration url given exploration id', () => {
    component.collectionId = 'colId1';
    let url = component.getExplorationUrl('id1');

    expect(url).toBe('/explore/id1?collection_id=colId1');
  });

  it('should generate path icon parameters', fakeAsync(() => {
    spyOn(readOnlyCollectionBackendApiService, 'loadCollectionAsync')
      .and.resolveTo(sampleCollection);
    spyOn(userService, 'getUserInfoAsync')
      .and.returnValue(Promise.resolve(userInfoForCollectionCreator));

    // Loading collections.
    component.ngOnInit();
    tick();
    let pathIconParameters = component.generatePathIconParameters();

    expect(pathIconParameters).toEqual(collectionNodesList);
  }));

  it('should check whether the exploration is completed when ' +
      'collection playthrough is available',
  fakeAsync(() => {
    spyOn(readOnlyCollectionBackendApiService, 'loadCollectionAsync')
      .and.resolveTo(sampleCollection);
    spyOn(userService, 'getUserInfoAsync')
      .and.returnValue(Promise.resolve(userInfoForCollectionCreator));

    // Loading collections.
    component.ngOnInit();
    tick();
    let res = component.isCompletedExploration('123');

    expect(res).toBeFalse();
  }));

  it('should return false on checking whether exploration is completed ' +
      'when collection playthrough is not available',
  fakeAsync(() => {
    spyOn(readOnlyCollectionBackendApiService, 'loadCollectionAsync')
      .and.resolveTo(sampleCollection);
    spyOn(userService, 'getUserInfoAsync')
      .and.returnValue(Promise.resolve(userInfoForCollectionCreator));

    // Loading collections.
    component.ngOnInit();
    tick();

    // This happens when collection is not loaded.
    component.collectionPlaythrough = undefined;
    let res = component.isCompletedExploration('123');

    expect(res).toBeFalse();
  }));

  it('should generate empty path parameters when collection ' +
    'node count is one', fakeAsync(() => {
    sampleCollectionBackendObject.nodes = [collectionNodeBackendObject];
    sampleCollection = Collection.create(
      sampleCollectionBackendObject);
    spyOn(readOnlyCollectionBackendApiService, 'loadCollectionAsync')
      .and.resolveTo(sampleCollection);
    spyOn(userService, 'getUserInfoAsync')
      .and.returnValue(Promise.resolve(userInfoForCollectionCreator));

    // Loading collections.
    component.ngOnInit();
    tick();
    component.generatePathParameters();

    expect(component.pathSvgParameters).toBe('');
  }));

  it('should generate path parameters when collection ' +
    'node count is two', fakeAsync(() => {
    sampleCollectionBackendObject.nodes = [
      collectionNodeBackendObject,
      collectionNodeBackendObject
    ];
    sampleCollection = Collection.create(
      sampleCollectionBackendObject);
    spyOn(readOnlyCollectionBackendApiService, 'loadCollectionAsync')
      .and.resolveTo(sampleCollection);
    spyOn(userService, 'getUserInfoAsync')
      .and.returnValue(Promise.resolve(userInfoForCollectionCreator));

    // Loading collections.
    component.ngOnInit();
    tick();
    component.generatePathParameters();

    expect(component.pathSvgParameters).toBe(
      'M250 80  C 470 100, 470 280, 250 300');
  }));

  it('should generate path parameters when collection ' +
    'node count is three', fakeAsync(() => {
    sampleCollectionBackendObject.nodes = [
      collectionNodeBackendObject,
      collectionNodeBackendObject,
      collectionNodeBackendObject
    ];
    sampleCollection = Collection.create(
      sampleCollectionBackendObject);
    spyOn(readOnlyCollectionBackendApiService, 'loadCollectionAsync')
      .and.resolveTo(sampleCollection);

    // Loading collections.
    component.ngOnInit();
    tick();
    component.generatePathParameters();

    expect(component.pathSvgParameters).toBe(
      'M250 80  C 470 100, 470 280, 250 300');
  }));

  it('should generate path parameters when collection ' +
    'node count is four', fakeAsync(() => {
    sampleCollectionBackendObject.nodes = [
      collectionNodeBackendObject,
      collectionNodeBackendObject,
      collectionNodeBackendObject,
      collectionNodeBackendObject
    ];
    sampleCollection = Collection.create(
      sampleCollectionBackendObject);
    spyOn(readOnlyCollectionBackendApiService, 'loadCollectionAsync')
      .and.resolveTo(sampleCollection);
    spyOn(userService, 'getUserInfoAsync')
      .and.returnValue(Promise.resolve(userInfoForCollectionCreator));

    // Loading collections.
    component.ngOnInit();
    tick();
    component.generatePathParameters();

    expect(component.pathSvgParameters).toBe(
      'M250 80  C 470 100, 470 280, 250 300 S 30 500, 250 520, ');
  }));

  it('should return static image url given image path', () => {
    let urlInterpolationSpy = spyOn(
      urlInterpolationService, 'getStaticImageUrl')
      .and.returnValue('imageUrl');

    let url = component.getStaticImageUrl('/imagepath');

    expect(urlInterpolationSpy).toHaveBeenCalledWith('/imagepath');
    expect(url).toBe('imageUrl');
  });

  it('should toggle preview card when calling ' +
    '\'togglePreviewCard\'', () => {
    component.explorationCardIsShown = false;

    component.togglePreviewCard();
    expect(component.explorationCardIsShown).toBe(true);

    component.togglePreviewCard();
    expect(component.explorationCardIsShown).toBe(false);
  });

  it('should return collecton node from exploration id', () => {
    component.collection = sampleCollection;

    let result = component.getCollectionNodeForExplorationId('exp_id');

    expect(result).toEqual(sampleCollection.nodes[0]);
  });

  it('should update exploration preview card when calling ' +
    '\'updateExplorationPreview\'', () => {
    component.explorationCardIsShown = false;

    component.collection = sampleCollection;
    component.updateExplorationPreview('exp_id');

    expect(component.explorationCardIsShown).toBe(true);
    expect(component.currentExplorationId).toBe('exp_id');
  });

  it('should show warning message if we try to ' +
    'load a collection with invalid id', () => {
    component.collection = sampleCollection;

    component.getCollectionNodeForExplorationId('invalidId');

    expect(alertsSpy).toHaveBeenCalledWith(
      'There was an error loading the collection.');
  });

  it('should return next recommended collection node', fakeAsync(() => {
    component.collection = sampleCollection;
    component.collectionPlaythrough = (
      CollectionPlaythrough.create('exp_id', ['exp_id0']));

    let result = component.getNextRecommendedCollectionNodes();

    expect(result).toEqual(sampleCollection.nodes[0]);
  }));

  it('should return completed collection node', fakeAsync(() => {
    component.collection = sampleCollection;
    component.collectionPlaythrough = (
      CollectionPlaythrough.create('exp_id0', ['exp_id']));

    let result = component.getCompletedExplorationNodes();

    expect(result).toEqual(sampleCollection.nodes[0]);
  }));

  it('should return non recommended collection node ' +
    'count', fakeAsync(() => {
    spyOn(readOnlyCollectionBackendApiService, 'loadCollectionAsync')
      .and.resolveTo(sampleCollection);
    spyOn(userService, 'getUserInfoAsync')
      .and.returnValue(Promise.resolve(new UserInfo(
        ['USER_ROLE'], true, false, false, false, true,
        'en', 'username1', 'tester@example.com', false
      )));
    spyOn(guestCollectionProgressService, 'hasCompletedSomeExploration')
      .and.returnValue(true);

    // Loading collections.
    component.ngOnInit();
    tick();

    let result = component.getNonRecommendedCollectionNodeCount();
    expect(result).toEqual(4);
  }));

  it('should close the exploration card and scroll into the' +
      'exploration icon location on clicking outside of the exploration card',
  fakeAsync(() => {
    spyOn(readOnlyCollectionBackendApiService, 'loadCollectionAsync')
      .and.resolveTo(sampleCollection);
    spyOn(userService, 'getUserInfoAsync')
      .and.returnValue(Promise.resolve(userInfoForCollectionCreator));
    spyOn(component, 'scrollToLocation').and.callThrough();
    spyOn(component, 'closeOnClickingOutside').and.callThrough();
    spyOn(component, 'updateExplorationPreview').and.callThrough();

    fixture.detectChanges();
    component.ngOnInit();
    tick();
    fixture.detectChanges();

    // Opening the preview card.
    let icons = fixture.nativeElement.querySelectorAll(
      '.e2e-mobile-test-collection-exploration');
    let icon = icons[0];
    icon.dispatchEvent(new Event('click'));

    expect(component.scrollToLocation).toHaveBeenCalledWith(
      'mobile-path-anchor-0');
    expect(component.updateExplorationPreview).toHaveBeenCalledWith('exp_id');
    expect(component.explorationCardIsShown).toBeTrue();

    fixture.detectChanges();

    // Clicking outside the preview card.
    let mask = fixture.nativeElement.querySelector(
      '.oppia-activity-summary-tile-mobile-background-mask');
    mask.dispatchEvent(new Event('click'));

    expect(component.closeOnClickingOutside).toHaveBeenCalled();
    expect(component.scrollToLocation).toHaveBeenCalled();
    expect(component.explorationCardIsShown).toBeFalse();
  }));
});
