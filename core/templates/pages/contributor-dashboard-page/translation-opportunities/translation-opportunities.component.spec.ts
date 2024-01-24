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
 * @fileoverview Unit tests for translationOpportunities.
 */

import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NgbActiveModal, NgbModal, NgbModalRef, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { ContributionOpportunitiesService } from 'pages/contributor-dashboard-page/services/contribution-opportunities.service';
import { ExplorationOpportunitySummary } from 'domain/opportunity/exploration-opportunity-summary.model';
import { OpportunitiesListComponent } from 'pages/contributor-dashboard-page/opportunities-list/opportunities-list.component';
import { OpportunitiesListItemComponent } from 'pages/contributor-dashboard-page/opportunities-list-item/opportunities-list-item.component';
import { TranslationLanguageService } from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import { TranslationModalComponent } from 'pages/contributor-dashboard-page/modal-templates/translation-modal.component';
import { TranslationOpportunitiesComponent } from './translation-opportunities.component';
import { UserInfo } from 'domain/user/user-info.model';
import { UserService } from 'services/user.service';
import { WrapTextWithEllipsisPipe } from 'filters/string-utility-filters/wrap-text-with-ellipsis.pipe';
import { LazyLoadingComponent } from 'components/common-layout-directives/common-elements/lazy-loading.component';
import { CkEditorCopyToolbarComponent } from 'components/ck-editor-helpers/ck-editor-copy-toolbar/ck-editor-copy-toolbar.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { EventEmitter } from '@angular/core';

describe('Translation opportunities component', () => {
  let contributionOpportunitiesService: ContributionOpportunitiesService;
  let translationLanguageService: TranslationLanguageService;
  let userService: UserService;
  let modalService: NgbModal;
  let component: TranslationOpportunitiesComponent;
  let fixture: ComponentFixture<TranslationOpportunitiesComponent>;
  let translationModal: NgbModalRef;
  let httpTestingController: HttpTestingController;
  let loggedInUserInfo = new UserInfo(
    ['EXPLORATION_EDITOR'], false, false, false, false, false,
    'en', 'username', 'test@example.com', true
  );
  const notLoggedInUserInfo = new UserInfo(
    ['GUEST'], false, false, false, false, false,
    'en', null, null, false
  );

  let opportunitiesArray: ExplorationOpportunitySummary[] = [];
  let activeLanguageChangedEmitter = new EventEmitter();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        NgbTooltipModule
      ],
      declarations: [
        CkEditorCopyToolbarComponent,
        LazyLoadingComponent,
        OpportunitiesListComponent,
        OpportunitiesListItemComponent,
        TranslationModalComponent,
        TranslationOpportunitiesComponent,
        WrapTextWithEllipsisPipe,
      ],
      providers: [
        NgbModal,
        NgbActiveModal
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    translationModal = TestBed.createComponent(
      TranslationModalComponent) as unknown as NgbModalRef;
    httpTestingController = TestBed.inject(HttpTestingController);
    contributionOpportunitiesService = TestBed.inject(
      ContributionOpportunitiesService);
    translationLanguageService = TestBed.inject(TranslationLanguageService);
    userService = TestBed.inject(UserService);
    modalService = TestBed.inject(NgbModal);
    spyOn(modalService, 'open').and.returnValue(translationModal);
    spyOnProperty(translationLanguageService, 'onActiveLanguageChanged').and
      .returnValue(activeLanguageChangedEmitter);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  beforeEach(() => {
    opportunitiesArray = [
      ExplorationOpportunitySummary.createFromBackendDict({
        id: '1',
        topic_name: 'topic_1',
        story_title: 'Story title 1',
        chapter_title: 'Chapter title 1',
        content_count: 4,
        translation_counts: {
          en: 2
        },
        translation_in_review_counts: {
          en: 2
        },
        language_code: 'en',
        is_pinned: false
      }),
      ExplorationOpportunitySummary.createFromBackendDict({
        id: '2',
        topic_name: 'topic_2',
        story_title: 'Story title 2',
        chapter_title: 'Chapter title 2',
        content_count: 10,
        translation_counts: {
          en: 4
        },
        translation_in_review_counts: {
          en: 4
        },
        language_code: 'en',
        is_pinned: false
      })
    ];

    fixture = TestBed.createComponent(
      TranslationOpportunitiesComponent);
    component = fixture.componentInstance;
  });

  it('should load translation opportunities', () => {
    spyOn(translationLanguageService, 'getActiveLanguageCode').and.returnValue(
      'en');
    spyOn(
      contributionOpportunitiesService, 'getTranslationOpportunitiesAsync').and
      .resolveTo({
        opportunities: opportunitiesArray,
        more: false
      });

    component.loadOpportunitiesAsync().then(({opportunitiesDicts, more}) => {
      expect(opportunitiesDicts.length).toBe(2);
      expect(more).toBeFalse();
    });
  });

  it('should load more translation opportunities', () => {
    spyOn(translationLanguageService, 'getActiveLanguageCode').and.returnValue(
      'en');
    spyOn(
      contributionOpportunitiesService, 'getTranslationOpportunitiesAsync').and
      .resolveTo({
        opportunities: opportunitiesArray,
        more: true
      });
    component.loadOpportunitiesAsync().then(({opportunitiesDicts, more}) => {
      expect(opportunitiesDicts.length).toBe(2);
      expect(more).toBeTrue();
    });

    spyOn(
      contributionOpportunitiesService,
      'getMoreTranslationOpportunitiesAsync').and.resolveTo({
      opportunities: opportunitiesArray,
      more: false
    });

    component.loadMoreOpportunitiesAsync()
      .then(({opportunitiesDicts, more}) => {
        expect(opportunitiesDicts.length).toBe(2);
        expect(more).toBeFalse();
      });
  });

  it('should move opportunities with no translatable cards to the bottom ' +
    'of opportunity list', () => {
    spyOn(translationLanguageService, 'getActiveLanguageCode').and.returnValue(
      'en');

    const {opportunitiesDicts, } = (
      component.getPresentableOpportunitiesData({
        opportunities: opportunitiesArray,
        more: false
      }));

    expect(opportunitiesDicts.length).toBe(2);
    expect(
      opportunitiesDicts[opportunitiesDicts.length - 1].translationsCount +
      opportunitiesDicts[opportunitiesDicts.length - 1].inReviewCount ===
      opportunitiesDicts[opportunitiesDicts.length - 1].totalCount).toBeTrue();
    expect(opportunitiesDicts).toEqual([{
      id: '2',
      heading: 'Chapter title 2',
      subheading: 'topic_2 - Story title 2',
      progressPercentage: '40.00',
      actionButtonTitle: 'Translate',
      inReviewCount: 4,
      totalCount: 10,
      translationsCount: 4,
    },
    {
      id: '1',
      heading: 'Chapter title 1',
      subheading: 'topic_1 - Story title 1',
      progressPercentage: '50.00',
      actionButtonTitle: 'Translate',
      inReviewCount: 2,
      totalCount: 4,
      translationsCount: 2,
    }
    ]);
  });

  it('should not chagne contents of each opportunity when get presentable ' +
    'opportunities', () => {
    spyOn(translationLanguageService, 'getActiveLanguageCode').and.returnValue(
      'en');

    expect(component.allOpportunities).toEqual({});

    const {opportunitiesDicts, } = (
      component.getPresentableOpportunitiesData({
        opportunities: opportunitiesArray,
        more: false
      }));

    expect(Object.keys(component.allOpportunities).length).toEqual(2);
    expect(component.allOpportunities['1']).toEqual({
      id: '1',
      heading: 'Chapter title 1',
      subheading: 'topic_1 - Story title 1',
      progressPercentage: '50.00',
      actionButtonTitle: 'Translate',
      inReviewCount: 2,
      totalCount: 4,
      translationsCount: 2,
    });
    expect(component.allOpportunities['2']).toEqual({
      id: '2',
      heading: 'Chapter title 2',
      subheading: 'topic_2 - Story title 2',
      progressPercentage: '40.00',
      actionButtonTitle: 'Translate',
      inReviewCount: 4,
      totalCount: 10,
      translationsCount: 4,
    });

    expect(opportunitiesDicts.length).toBe(2);
    expect(opportunitiesDicts.sort((a, b) => {
      return parseInt(a.id) - parseInt(b.id);
    })).toEqual([{
      id: '1',
      heading: 'Chapter title 1',
      subheading: 'topic_1 - Story title 1',
      progressPercentage: '50.00',
      actionButtonTitle: 'Translate',
      inReviewCount: 2,
      totalCount: 4,
      translationsCount: 2,
    },
    {
      id: '2',
      heading: 'Chapter title 2',
      subheading: 'topic_2 - Story title 2',
      progressPercentage: '40.00',
      actionButtonTitle: 'Translate',
      inReviewCount: 4,
      totalCount: 10,
      translationsCount: 4,
    }
    ]);
  });

  it('should open translation modal when clicking button', fakeAsync(() => {
    spyOn(translationLanguageService, 'getActiveLanguageCode').and.returnValue(
      'en');
    spyOn(userService, 'getUserInfoAsync').and.resolveTo(loggedInUserInfo);
    spyOn(
      contributionOpportunitiesService, 'getTranslationOpportunitiesAsync').and
      .resolveTo({
        opportunities: opportunitiesArray,
        more: false
      });
    component.ngOnInit();
    tick();
    component.onClickButton('2');
    tick();
    expect(modalService.open).toHaveBeenCalled();
  }));

  it('should not open translation modal when user is not logged', fakeAsync(
    () => {
      spyOn(
        translationLanguageService, 'getActiveLanguageCode').and.returnValue(
        'en');
      spyOn(userService, 'getUserInfoAsync').and.resolveTo(notLoggedInUserInfo);
      spyOn(
        contributionOpportunitiesService,
        'getTranslationOpportunitiesAsync').and.resolveTo({
        opportunities: opportunitiesArray,
        more: true
      });
      spyOn(contributionOpportunitiesService, 'showRequiresLoginModal')
        .and.stub();

      component.ngOnInit();

      component.onClickButton('2');
      tick();

      expect(modalService.open).not.toHaveBeenCalled();
    }));

  it('should not show translation opportunities when language is not ' +
    'selected', fakeAsync(() => {
    spyOn(
      translationLanguageService, 'getActiveLanguageCode').and.callThrough();
    spyOn(userService, 'getUserInfoAsync').and.resolveTo(loggedInUserInfo);
    expect(component.languageSelected).toBe(false);

    component.ngOnInit();

    expect(component.languageSelected).toBe(false);
  }));

  it('should show translation opportunities when language is changed'
    , fakeAsync(() => {
      spyOn(
        translationLanguageService, 'getActiveLanguageCode').and.callThrough();
      spyOn(userService, 'getUserInfoAsync').and.resolveTo(loggedInUserInfo);
      component.ngOnInit();
      expect(component.languageSelected).toBe(false);

      activeLanguageChangedEmitter.emit();

      expect(component.languageSelected).toBe(true);
    }));
});
