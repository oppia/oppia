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
import { SchemaBasedEditorDirective } from 'components/forms/schema-based-editors/schema-based-editor.directive';
import { AngularHtmlBindWrapperDirective } from 'components/angular-html-bind/angular-html-bind-wrapper.directive';
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
  let httpTestingController;
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
        AngularHtmlBindWrapperDirective,
        CkEditorCopyToolbarComponent,
        LazyLoadingComponent,
        OpportunitiesListComponent,
        OpportunitiesListItemComponent,
        SchemaBasedEditorDirective,
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
        content_count: 1,
        translation_counts: {
          en: 2
        },
        translation_in_review_counts: {
          en: 2
        }
      }),
      ExplorationOpportunitySummary.createFromBackendDict({
        id: '2',
        topic_name: 'topic_2',
        story_title: 'Story title 2',
        chapter_title: 'Chapter title 2',
        content_count: 2,
        translation_counts: {
          en: 4
        },
        translation_in_review_counts: {
          en: 4
        }
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
      translationLanguageService, 'getActiveLanguageCode').and.returnValue(
      null);
    spyOn(userService, 'getUserInfoAsync').and.resolveTo(loggedInUserInfo);
    expect(component.languageSelected).toBe(false);

    component.ngOnInit();

    expect(component.languageSelected).toBe(false);
  }));

  it('should show translation opportunities when language is changed'
    , fakeAsync(() => {
      spyOn(
        translationLanguageService, 'getActiveLanguageCode').and.returnValue(
        null);
      spyOn(userService, 'getUserInfoAsync').and.resolveTo(loggedInUserInfo);
      component.ngOnInit();
      expect(component.languageSelected).toBe(false);

      activeLanguageChangedEmitter.emit();

      expect(component.languageSelected).toBe(true);
    }));
});
