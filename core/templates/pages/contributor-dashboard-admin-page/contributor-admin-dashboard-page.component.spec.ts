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
import { ContributorAdminDashboardPageComponent } from './contributor-admin-dashboard-page.component';
import { UserService } from 'services/user.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CommunityContributionStatsBackendDict, ContributorDashboardAdminStatsBackendApiService } from './services/contributor-dashboard-admin-stats-backend-api.service';

describe('Contributor dashboard Admin page', () => {
  let component: ContributorAdminDashboardPageComponent;
  let fixture: ComponentFixture<ContributorAdminDashboardPageComponent>;
  let contributorDashboardAdminStatsBackendApiService: (
    ContributorDashboardAdminStatsBackendApiService);
  let userService: UserService;
  let fetchAssignedLanguageIdsSpy: jasmine.Spy;
  let translationCoordinatorInfo = {
    _roles: ['USER_ROLE'],
    _isModerator: true,
    _isCurriculumAdmin: false,
    _isTopicManager: false,
    _isSuperAdmin: false,
    _canCreateCollections: true,
    _preferredSiteLanguageCode: 'en',
    _username: 'username1',
    _email: 'tester@example.org',
    _isLoggedIn: true,
    isModerator: () => true,
    isCurriculumAdmin: () => false,
    isSuperAdmin: () => false,
    isTopicManager: () => false,
    isTranslationAdmin: () => false,
    isBlogAdmin: () => false,
    isBlogPostEditor: () => false,
    isQuestionAdmin: () => false,
    isQuestionCoordinator: () => false,
    isTranslationCoordinator: () => true,
    canCreateCollections: () => true,
    getPreferredSiteLanguageCode: () =>'en',
    getUsername: () => 'username1',
    getEmail: () => 'tester@example.org',
    isLoggedIn: () => true
  };
  let nullUserInfo = {
    _roles: ['USER_ROLE'],
    _isModerator: true,
    _isCurriculumAdmin: false,
    _isTopicManager: false,
    _isSuperAdmin: false,
    _canCreateCollections: true,
    _preferredSiteLanguageCode: 'en',
    _username: null,
    _email: 'tester@example.org',
    _isLoggedIn: true,
    isModerator: () => true,
    isCurriculumAdmin: () => false,
    isSuperAdmin: () => false,
    isTopicManager: () => false,
    isTranslationAdmin: () => false,
    isBlogAdmin: () => false,
    isBlogPostEditor: () => false,
    isQuestionAdmin: () => false,
    isQuestionCoordinator: () => false,
    isTranslationCoordinator: () => true,
    canCreateCollections: () => true,
    getPreferredSiteLanguageCode: () =>'en',
    getUsername: () => null,
    getEmail: () => 'tester@example.org',
    isLoggedIn: () => true
  };
  let questionCoordinatorInfo = {
    _roles: ['USER_ROLE'],
    _isModerator: true,
    _isCurriculumAdmin: false,
    _isTopicManager: false,
    _isSuperAdmin: false,
    _canCreateCollections: true,
    _preferredSiteLanguageCode: 'en',
    _username: 'username1',
    _email: 'tester@example.org',
    _isLoggedIn: true,
    isModerator: () => true,
    isCurriculumAdmin: () => false,
    isSuperAdmin: () => false,
    isTopicManager: () => false,
    isTranslationAdmin: () => false,
    isBlogAdmin: () => false,
    isBlogPostEditor: () => false,
    isQuestionAdmin: () => false,
    isQuestionCoordinator: () => true,
    isTranslationCoordinator: () => false,
    canCreateCollections: () => true,
    getPreferredSiteLanguageCode: () =>'en',
    getUsername: () => 'username1',
    getEmail: () => 'tester@example.org',
    isLoggedIn: () => true
  };
  let fullAccessUserInfo = {
    _roles: ['USER_ROLE'],
    _isModerator: true,
    _isCurriculumAdmin: false,
    _isTopicManager: false,
    _isSuperAdmin: false,
    _canCreateCollections: true,
    _preferredSiteLanguageCode: 'en',
    _username: 'username1',
    _email: 'tester@example.org',
    _isLoggedIn: true,
    isModerator: () => true,
    isCurriculumAdmin: () => false,
    isSuperAdmin: () => false,
    isTopicManager: () => false,
    isTranslationAdmin: () => false,
    isBlogAdmin: () => false,
    isBlogPostEditor: () => false,
    isQuestionAdmin: () => false,
    isQuestionCoordinator: () => true,
    isTranslationCoordinator: () => true,
    canCreateCollections: () => true,
    getPreferredSiteLanguageCode: () =>'en',
    getUsername: () => 'username1',
    getEmail: () => 'tester@example.org',
    isLoggedIn: () => true
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, BrowserAnimationsModule],
      declarations: [
        ContributorAdminDashboardPageComponent
      ],
      providers: [
        ContributorDashboardAdminStatsBackendApiService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ContributorAdminDashboardPageComponent);
    component = fixture.componentInstance;
    contributorDashboardAdminStatsBackendApiService = TestBed.inject(
      ContributorDashboardAdminStatsBackendApiService);
    userService = TestBed.inject(UserService);

    spyOn(
      contributorDashboardAdminStatsBackendApiService, 'fetchCommunityStats')
      .and.returnValue(Promise.resolve({
        translation_reviewers_count: {
          en: 1,
          ar: 1
        },
        question_reviewers_count: 1
      } as CommunityContributionStatsBackendDict));

    fetchAssignedLanguageIdsSpy = spyOn(
      contributorDashboardAdminStatsBackendApiService,
      'fetchAssignedLanguageIds')
      .and.returnValue(Promise.resolve(['en', 'ar']));

    spyOn(
      contributorDashboardAdminStatsBackendApiService,
      'fetchTopicChoices')
      .and.returnValue(Promise.resolve([
        { id: '1', topic: 'Science' },
        { id: '2', topic: 'Technology' },
      ]));
    fixture.detectChanges();

    component.ngOnInit();
  }));

  afterEach(() => {
    fixture.destroy();
  });

  it('should initialize variables onInit', fakeAsync(() => {
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(fullAccessUserInfo));

    component.ngOnInit();
    tick();
    fixture.detectChanges();

    expect(component.selectedLanguage.language).toEqual('English');
    expect(component.selectedLanguage.id).toEqual('en');
  }));

  it('should throw error if fetchAssignedLanguageIds returns invalid ' +
    'language', fakeAsync(() => {
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(fullAccessUserInfo));
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
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(fullAccessUserInfo));

    component.ngOnInit();
    tick();
    fixture.detectChanges();

    expect(component.selectedLanguage.language).toBe('English');
    expect(component.selectedLanguage.id).toBe('en');

    component.selectLanguage('العربية (Arabic)');
    expect(component.selectedLanguage.language).toBe('العربية (Arabic)');
    expect(component.selectedLanguage.id).toBe('ar');
  }));

  it('should select last activity from dropdown', fakeAsync(() => {
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(fullAccessUserInfo));
    component.ngOnInit();
    tick();
    fixture.detectChanges();

    expect(component.selectedLastActivity).toEqual(0);

    component.selectLastActivity(7);
    expect(component.selectedLastActivity).toEqual(7);

    component.selectLastActivity(0);
    expect(component.selectedLastActivity).toEqual(0);
  }));

  it('should apply topic filter', fakeAsync(() => {
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
  }));

  it('should throw error when topic filter chooses null', fakeAsync(() => {
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
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(fullAccessUserInfo));
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

    component.selectLanguage('العربية (Arabic)');
    expect(component.selectedLanguage.language).toBe('العربية (Arabic)');
    expect(component.selectedLanguage.id).toBe('ar');
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

  it('should update translation coordinator view', fakeAsync(() => {
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(translationCoordinatorInfo));

    component.ngOnInit();
    tick();
    fixture.detectChanges();

    expect(component.isTranslationCoordinator).toBeTrue();
  }));

  it('should update question coordinator view', fakeAsync(() => {
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(questionCoordinatorInfo));

    component.ngOnInit();
    tick();
    fixture.detectChanges();

    expect(component.isQuestionCoordinator).toBeTrue();
  }));

  it('should update translation and question coordinator view',
    fakeAsync(() => {
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve(fullAccessUserInfo));

      component.ngOnInit();
      tick();
      fixture.detectChanges();

      expect(component.isQuestionCoordinator).toBeTrue();
      expect(component.isTranslationCoordinator).toBeTrue();
    }));

  it('should not update translation and question coordinator view' +
    'if username is null', fakeAsync(() => {
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(nullUserInfo));

    component.ngOnInit();
    tick();
    fixture.detectChanges();

    expect(component.CONTRIBUTION_TYPES).toEqual([]);
  }));

  it('should correctly show and hide language dropdown when clicked away',
    fakeAsync(() => {
      spyOn(component, 'checkMobileView').and.returnValue(false);
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve(fullAccessUserInfo));
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

  it('should correctly show and hide activity dropdown when clicked away',
    fakeAsync(() => {
      spyOn(component, 'checkMobileView').and.returnValue(false);
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve(fullAccessUserInfo));
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

  it('should not show and hide activity dropdown when clicked away on mobile',
    fakeAsync(() => {
      spyOn(component, 'checkMobileView').and.returnValue(true);
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve(fullAccessUserInfo));
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
});
