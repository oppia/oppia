// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for contributor admin dashboard page component.
 */

import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CdAdminTranslationRoleEditorModal } from './translation-role-editor-modal/cd-admin-translation-role-editor-modal.component';
import { ContributorAdminDashboardPageComponent } from './contributor-admin-dashboard-page.component';
import { UserService } from 'services/user.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ContributorDashboardAdminBackendApiService } from './services/contributor-dashboard-admin-backend-api.service';
import { CommunityContributionStatsBackendDict, ContributorDashboardAdminStatsBackendApiService } from './services/contributor-dashboard-admin-stats-backend-api.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CdAdminQuestionRoleEditorModal } from './question-role-editor-modal/cd-admin-question-role-editor-modal.component';
import { UsernameInputModal } from './username-input-modal/username-input-modal.component';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { UserInfo } from 'domain/user/user-info.model';
import { ContributorAdminStatsTable } from './contributor-dashboard-tables/contributor-admin-stats-table.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { By } from '@angular/platform-browser';
import { WindowRef } from 'services/contextual/window-ref.service';


describe('Contributor dashboard Admin page', () => {
  let component: ContributorAdminDashboardPageComponent;
  let fixture: ComponentFixture<ContributorAdminDashboardPageComponent>;
  let contributorDashboardAdminStatsBackendApiService: (
    ContributorDashboardAdminStatsBackendApiService);
  let contributorDashboardAdminBackendApiService: (
    ContributorDashboardAdminBackendApiService);
  let ngbModal: NgbModal;
  let $window: WindowRef;

  class MockNgbModalRef {
    componentInstance!: {};
  }
  let userService: UserService;
  let fetchAssignedLanguageIdsSpy: jasmine.Spy;
  let getUserInfoSpy: jasmine.Spy;
  let fetchContributorAdminStatsSpy: jasmine.Spy;
  let ContAdminStatsSpy: jasmine.Spy;
  let translationCoordinatorInfo = new UserInfo(
    ['USER_ROLE', 'TRANSLATION_COORDINATOR'], true, false, false, false, true,
    'en', 'username1', 'tester@example.com', true
  );
  let nullUserInfo = new UserInfo(
    ['USER_ROLE', 'TRANSLATION_COORDINATOR'], true, false, false, false, true,
    'en', null, 'tester@example.com', true
  );
  let questionCoordinatorInfo = new UserInfo(
    ['USER_ROLE', 'QUESTION_COORDINATOR'], true, false, false, false, true,
    'en', 'username1', 'tester@example.com', true
  );
  let fullAccessUserInfo = new UserInfo(
    ['USER_ROLE', 'QUESTION_COORDINATOR', 'TRANSLATION_COORDINATOR'], true,
    false, false, false, true, 'en', 'username1', 'tester@example.com', true
  );

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule,
        BrowserAnimationsModule,
        MatTooltipModule,
        MatTableModule],
      declarations: [
        CdAdminTranslationRoleEditorModal,
        ContributorAdminDashboardPageComponent,
        ContributorAdminStatsTable
      ],
      providers: [
        ContributorDashboardAdminStatsBackendApiService,
        ContributorDashboardAdminBackendApiService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).overrideModule(BrowserDynamicTestingModule, {
      set: {
        entryComponents: [
          CdAdminTranslationRoleEditorModal]
      }
    }).compileComponents();


    fixture = TestBed.createComponent(ContributorAdminDashboardPageComponent);
    component = fixture.componentInstance;
    contributorDashboardAdminStatsBackendApiService = TestBed.inject(
      ContributorDashboardAdminStatsBackendApiService);
    userService = TestBed.inject(UserService);
    contributorDashboardAdminBackendApiService = TestBed.inject(
      ContributorDashboardAdminBackendApiService);
    ngbModal = TestBed.inject(NgbModal);

    // This approach was choosen because spyOn() doesn't work on properties
    // that doesn't have a get access type.
    // Without this approach the test will fail because it'll throw
    // 'Property innerWidth does not have access type get' error.
    // eslint-disable-next-line max-len
    // ref: https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
    // ref: https://github.com/jasmine/jasmine/issues/1415

    $window = TestBed.inject(WindowRef);
    Object.defineProperty($window.nativeWindow, 'innerWidth', {
      get: () => 1000
    });

    spyOn(
      contributorDashboardAdminStatsBackendApiService, 'fetchCommunityStats')
      .and.returnValue(Promise.resolve({
        translation_reviewers_count: {
          en: 1,
          ar: 1,
          ms: 1,
          az: 1,
          'hi-en': 1
        },
        question_reviewers_count: 1
      } as CommunityContributionStatsBackendDict));

    fetchAssignedLanguageIdsSpy = spyOn(
      contributorDashboardAdminStatsBackendApiService,
      'fetchAssignedLanguageIds')
      .and.returnValue(Promise.resolve(['en', 'ar', 'az', 'ms', 'hi-en']));

    spyOn(
      contributorDashboardAdminStatsBackendApiService,
      'fetchTopicChoices')
      .and.returnValue(Promise.resolve([[
        { id: '1', topic: 'Science' },
        { id: '2', topic: 'Technology' },
      ], [
        { id: '1', topic: 'Science' },
        { id: '2', topic: 'Technology' },
      ]]));

    ContAdminStatsSpy = spyOn(
      ContributorAdminStatsTable.prototype,
      'ngOnInit');
  }));

  afterEach(() => {
    fixture.destroy();
  });

  describe('when user is not logged in', () => {
    beforeEach(() => {
      getUserInfoSpy = spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve(nullUserInfo));

      fixture.detectChanges();
    });

    it('should not update translation and question coordinator view' +
      'if username is null', fakeAsync(() => {
      component.ngOnInit();
      tick();
      fixture.detectChanges();

      expect(component.CONTRIBUTION_TYPES).toEqual([]);
    }));
  });

  describe('when no languages are available', () => {
    beforeEach(() => {
      getUserInfoSpy = spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve(fullAccessUserInfo));
    });

    it('should default to English language if no language is populated ' +
      'if user is logged in', fakeAsync(() => {
      component.ngOnInit();
      tick();
      fixture.detectChanges();
      component.selectLanguage('French');

      expect(component.selectedLanguage).toEqual({
        language: 'English',
        id: 'en'
      });
    }));
  });

  describe('when user is logged in', () => {
    beforeEach(() => {
      getUserInfoSpy = spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve(fullAccessUserInfo));

      fixture.detectChanges();

      component.ngOnInit();
    });

    it('should initialize the contributor admin stats table only' +
       ' once when the contributor dashboard admin component' +
       ' is intialized', fakeAsync(() => {
      component.ngOnInit();
      fixture.detectChanges();
      tick();
      const statsTable = fixture.debugElement.query(
        By.directive(ContributorAdminStatsTable));
      expect(statsTable).toBeTruthy();
      expect(ContAdminStatsSpy).toHaveBeenCalledTimes(1);
    }));

    it('should fetch contributor admin stats only once when' +
       ' when the contributor dashboard admin component ' +
       'is initialized', fakeAsync(() => {
      fetchContributorAdminStatsSpy = spyOn(
        contributorDashboardAdminStatsBackendApiService,
        'fetchContributorAdminStats')
        .and.returnValue(Promise.resolve(
          {stats: [], nextOffset: 0, more: false}));
      component.ngOnInit();
      fixture.detectChanges();
      tick();
      expect(fetchContributorAdminStatsSpy).toHaveBeenCalledTimes(1);
    }));

    it('should initialize variables onInit', fakeAsync(() => {
      component.ngOnInit();
      tick();
      fixture.detectChanges();

      expect(component.selectedLanguage.language).toEqual('English');
      expect(component.selectedLanguage.id).toEqual('en');
    }));

    it('should throw error if fetchAssignedLanguageIds returns invalid ' +
      'language', fakeAsync(() => {
      fetchAssignedLanguageIdsSpy.and.returnValue(Promise.resolve(
        ['invalid_language']));

      expect(() => {
        component.ngOnInit();
        tick();
      }).toThrowError();
    }));

    it('should open language dropdown', () => {
      expect(component.languageDropdownShown).toBeFalse();

      component.toggleLanguageDropdown();

      expect(component.languageDropdownShown).toBeTrue();
    });

    it('should open last activity dropdown', fakeAsync(() => {
      expect(component.activityDropdownShown).toBeFalse();

      component.toggleActivityDropdown();

      expect(component.activityDropdownShown).toBeTrue();
    }));

    it('should select language from dropdown', fakeAsync(() => {
      component.ngOnInit();
      tick();
      fixture.detectChanges();
      const nonDefaultLanguage = {
        id: 'ar',
        language: 'Arabic (العربية)'
      };
      component.selectLanguage(nonDefaultLanguage.language);
      expect(component.selectedLanguage.language)
        .toBe(nonDefaultLanguage.language);
      expect(component.selectedLanguage.id).toBe(nonDefaultLanguage.id);
    }));

    it('should select last activity from dropdown', fakeAsync(() => {
      component.ngOnInit();
      tick();
      fixture.detectChanges();

      let lastActivityDays = 7;
      component.selectLastActivity(lastActivityDays);
      expect(component.selectedLastActivity).toEqual(lastActivityDays);
      lastActivityDays = 0;
      component.selectLastActivity(lastActivityDays);
      expect(component.selectedLastActivity).toEqual(lastActivityDays);
    }));

    it('should remove duplicates from available topics when component' +
       ' is initialized', fakeAsync(() => {
      // Duplicate topics are present in the topics returned
      // by the stats service.
      component.ngOnInit();
      tick();
      expect(component.topics).toEqual ([
        { id: '1', topic: 'Science' },
        { id: '2', topic: 'Technology' },
      ]);
    }));

    it('should apply the topic filter to the topic dropdown' +
       'when a topic is chosen', fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.selectedTopicNames = ['Science'];

      fixture.detectChanges();
      tick();
      component.applyTopicFilter();

      expect(component.selectedTopicIds).toEqual(['1']);
    }));

    it('should throw error when topic filter has chosen a topic id ' +
        'that is no longer valid', fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.selectedTopicNames = ['topic_with_no_id'];
      component.topics = [
        { id: '1', topic: 'Science' },
        { id: '2', topic: 'Technology' },
      ];

      fixture.detectChanges();
      tick();

      expect(() => {
        component.applyTopicFilter();
        tick();
      }).toThrowError(
        'Selected Topic Id doesn\'t match any valid topic.');
    }));

    it('should apply topic and language filter both', fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.selectedTopicNames = ['Science', 'Technology'];
      component.topics = [
        { id: '1', topic: 'Science' },
        { id: '2', topic: 'Technology' },
      ];

      fixture.detectChanges();
      tick();
      component.applyTopicFilter();

      expect(component.selectedTopicIds).toEqual(['1', '2']);
      expect(component.selectedLanguage.language).toBe('English');
      expect(component.selectedLanguage.id).toBe('en');
      const nonDefaultLanguage = {
        id: 'ar',
        language: 'Arabic (العربية)'
      };
      component.selectLanguage(nonDefaultLanguage.language);
      expect(component.selectedLanguage.language)
        .toBe(nonDefaultLanguage.language);
      expect(component.selectedLanguage.id).toBe(nonDefaultLanguage.id);
      expect(component.selectedTopicIds).toEqual(['1', '2']);
    }));

    it('should evaluate active tab', () => {
      component.setActiveTab('Translation Submitter');

      expect(component.activeTab).toBe('Translation Submitter');
    });

    it('should update selectedContributionType', () => {
      component.updateSelectedContributionType('selection1');

      expect(component.selectedContributionType).toEqual('selection1');
    });

    it('should set the translation coordinator variable when the user' +
       ' is a translation coordinator', fakeAsync(() => {
      getUserInfoSpy.and.returnValue(
        Promise.resolve(translationCoordinatorInfo));

      component.ngOnInit();
      tick();
      fixture.detectChanges();

      expect(component.isTranslationCoordinator).toBeTrue();
    }));

    it('should set the question coordinator variable when the user' +
    ' is a question coordinator', fakeAsync(() => {
      getUserInfoSpy.and.returnValue(
        Promise.resolve(questionCoordinatorInfo));

      component.ngOnInit();
      tick();
      fixture.detectChanges();

      expect(component.isQuestionCoordinator).toBeTrue();
    }));

    it('should update translation and question coordinator view',
      fakeAsync(() => {
        component.ngOnInit();
        tick();
        fixture.detectChanges();

        expect(component.isQuestionCoordinator).toBeTrue();
        expect(component.isTranslationCoordinator).toBeTrue();
      }));

    it('should open the language dropdown when clicked away',
      fakeAsync(() => {
        spyOn(component, 'checkMobileView').and.returnValue(false);
        const fakeClickAwayEvent = new MouseEvent('click');
        Object.defineProperty(
          fakeClickAwayEvent,
          'target',
          {value: document.createElement('div')});

        component.toggleLanguageDropdown();
        component.ngOnInit();
        tick();
        component.onDocumentClick(fakeClickAwayEvent);
        fixture.detectChanges();

        expect(component.languageDropdownShown).toBe(false);
      }));

    it('should hide opened activity dropdown when clicking away',
      fakeAsync(() => {
        spyOn(component, 'checkMobileView').and.returnValue(false);
        const fakeClickAwayEvent = new MouseEvent('click');
        Object.defineProperty(
          fakeClickAwayEvent,
          'target',
          {value: document.createElement('div')});

        component.toggleActivityDropdown();
        component.ngOnInit();
        tick();
        component.onDocumentClick(fakeClickAwayEvent);
        fixture.detectChanges();

        expect(component.activityDropdownShown).toBe(false);
      }));

    it('should not hide opened activity dropdown when clicking away on mobile',
      fakeAsync(() => {
        spyOn(component, 'checkMobileView').and.returnValue(true);
        const fakeClickAwayEvent = new MouseEvent('click');
        Object.defineProperty(
          fakeClickAwayEvent,
          'target',
          {value: document.createElement('div')});

        component.toggleActivityDropdown();
        component.ngOnInit();
        tick();
        component.onDocumentClick(fakeClickAwayEvent);
        fixture.detectChanges();

        expect(component.activityDropdownShown).toBe(true);
      }));

    it('should open question role editor modal when on question' +
      ' submitter tab', fakeAsync(() => {
      const removeRightsSpy = spyOn(
        contributorDashboardAdminBackendApiService,
        'removeContributionReviewerAsync');
      component.activeTab = component.TAB_NAME_QUESTION_SUBMITTER;
      fixture.detectChanges();
      spyOn(
        contributorDashboardAdminBackendApiService,
        'contributionReviewerRightsAsync').and.returnValue(Promise.resolve({
        can_submit_questions: true,
        can_review_questions: true,
        can_review_translation_for_language_codes: [],
        can_review_voiceover_for_language_codes: []
      }));
      let modalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
        return ({
          componentInstance: MockNgbModalRef,
          result: Promise.resolve({
            isQuestionSubmitter: false,
            isQuestionReviewer: true
          })
        }) as NgbModalRef;
      });

      component.openRoleEditor('user1');
      tick();

      expect(modalSpy).toHaveBeenCalledWith(CdAdminQuestionRoleEditorModal);
      expect(removeRightsSpy).toHaveBeenCalled();
    }));

    it('should open question role editor modal when on question' +
      ' reviewer tabs', fakeAsync(() => {
      const removeRightsSpy = spyOn(
        contributorDashboardAdminBackendApiService,
        'removeContributionReviewerAsync');
      component.activeTab = component.TAB_NAME_QUESTION_REVIEWER;
      fixture.detectChanges();
      spyOn(
        contributorDashboardAdminBackendApiService,
        'contributionReviewerRightsAsync').and.returnValue(Promise.resolve({
        can_submit_questions: false,
        can_review_questions: true,
        can_review_translation_for_language_codes: ['en'],
        can_review_voiceover_for_language_codes: []
      }));
      let modalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
        return ({
          componentInstance: MockNgbModalRef,
          result: Promise.resolve({
            isQuestionSubmitter: false,
            isQuestionReviewer: false
          })
        }) as NgbModalRef;
      });

      component.openRoleEditor('user1');
      tick();

      expect(modalSpy).toHaveBeenCalledWith(CdAdminQuestionRoleEditorModal);
      expect(removeRightsSpy).toHaveBeenCalled();
    }));

    it('should open question role editor modal and return changed' +
      ' value of question reviewer', fakeAsync(() => {
      const removeRightsSpy = spyOn(
        contributorDashboardAdminBackendApiService,
        'removeContributionReviewerAsync');
      component.activeTab = component.TAB_NAME_QUESTION_SUBMITTER;
      fixture.detectChanges();
      spyOn(
        contributorDashboardAdminBackendApiService,
        'contributionReviewerRightsAsync').and.returnValue(Promise.resolve({
        can_submit_questions: true,
        can_review_questions: true,
        can_review_translation_for_language_codes: [],
        can_review_voiceover_for_language_codes: []
      }));
      let modalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
        return ({
          componentInstance: MockNgbModalRef,
          result: Promise.resolve({
            isQuestionSubmitter: true,
            isQuestionReviewer: false
          })
        }) as NgbModalRef;
      });

      component.openRoleEditor('user1');
      tick();

      expect(modalSpy).toHaveBeenCalledWith(CdAdminQuestionRoleEditorModal);
      expect(removeRightsSpy).toHaveBeenCalled();
    }));

    it('should open question role editor modal and return changed value of' +
      ' question reviewer', fakeAsync(() => {
      const addRightsSpy = spyOn(
        contributorDashboardAdminBackendApiService,
        'addContributionReviewerAsync');
      component.activeTab = component.TAB_NAME_QUESTION_SUBMITTER;
      fixture.detectChanges();
      spyOn(
        contributorDashboardAdminBackendApiService,
        'contributionReviewerRightsAsync').and.returnValue(Promise.resolve({
        can_submit_questions: true,
        can_review_questions: false,
        can_review_translation_for_language_codes: [],
        can_review_voiceover_for_language_codes: []
      }));
      let modalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
        return ({
          componentInstance: MockNgbModalRef,
          result: Promise.resolve({
            isQuestionSubmitter: true,
            isQuestionReviewer: true
          })
        }) as NgbModalRef;
      });

      component.openRoleEditor('user1');
      tick();

      expect(modalSpy).toHaveBeenCalledWith(CdAdminQuestionRoleEditorModal);
      expect(addRightsSpy).toHaveBeenCalled();
    }));

    it('should open question role editor modal and return changed value' +
      ' question submitter', fakeAsync(() => {
      const addRightsSpy = spyOn(
        contributorDashboardAdminBackendApiService,
        'addContributionReviewerAsync');
      component.activeTab = component.TAB_NAME_QUESTION_SUBMITTER;
      fixture.detectChanges();
      spyOn(
        contributorDashboardAdminBackendApiService,
        'contributionReviewerRightsAsync').and.returnValue(Promise.resolve({
        can_submit_questions: false,
        can_review_questions: true,
        can_review_translation_for_language_codes: [],
        can_review_voiceover_for_language_codes: []
      }));
      let modalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
        return ({
          componentInstance: MockNgbModalRef,
          result: Promise.resolve({
            isQuestionSubmitter: true,
            isQuestionReviewer: true
          })
        }) as NgbModalRef;
      });

      component.openRoleEditor('user1');
      tick();

      expect(modalSpy).toHaveBeenCalledWith(CdAdminQuestionRoleEditorModal);
      expect(addRightsSpy).toHaveBeenCalled();
    }));

    it('should open translation role editor modal', fakeAsync(() => {
      component.activeTab = component.TAB_NAME_TRANSLATION_REVIEWER;
      fixture.detectChanges();
      spyOn(
        contributorDashboardAdminBackendApiService,
        'contributionReviewerRightsAsync').and.returnValue(Promise.resolve({
        can_submit_questions: false,
        can_review_questions: true,
        can_review_translation_for_language_codes: ['en'],
        can_review_voiceover_for_language_codes: []
      }));
      let modalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
        return ({
          componentInstance: MockNgbModalRef
        }) as NgbModalRef;
      });

      component.openRoleEditor('user1');
      tick();

      expect(modalSpy).toHaveBeenCalledWith(
        CdAdminTranslationRoleEditorModal);
    }));

    it('should open username input modal', fakeAsync(() => {
      component.activeTab = component.TAB_NAME_TRANSLATION_REVIEWER;
      fixture.detectChanges();
      const openRoleEditorSpy = spyOn(component, 'openRoleEditor');
      let modalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
        return ({
          componentInstance: MockNgbModalRef,
          result: Promise.resolve('user1')
        }) as NgbModalRef;
      });

      component.openUsernameInputModal();
      tick();

      expect(modalSpy).toHaveBeenCalledWith(UsernameInputModal);
      expect(openRoleEditorSpy).toHaveBeenCalledWith('user1');
    }));

    it('should start any language with its English name', fakeAsync(() => {
      component.ngOnInit();
      tick();
      expect(component.languageChoices).toContain({
        id: 'ms',
        language: 'Bahasa Melayu (بهاس ملايو)'
      });
      expect(component.languageChoices).toContain({
        id: 'hi-en',
        language: 'Hinglish'
      });
      expect(component.languageChoices).toContain({
        id: 'az',
        language: 'Azerbaijani (Azeri)'
      });
    }));
  });
});
