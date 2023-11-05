// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ContributorBadgesComponent.
 */

import { ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { UserService } from 'services/user.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UserInfo } from 'domain/user/user-info.model';
import { ContributionAndReviewStatsService } from '../services/contribution-and-review-stats.service';
import { LanguageUtilService } from 'domain/utilities/language-util.service';
import { ContributorBadgesComponent } from './contributor-badges.component';
import { MobileBadgeType } from './contributor-badges.component';

describe('Contributor badge component', () => {
  let fetchAllContributionAndReviewStatsAsync: jasmine.Spy;
  const akanFirstTopicTranslationContributionStat = {
    language_code: 'ak',
    topic_name: 'first_topic',
    submitted_translations_count: 2,
    submitted_translation_word_count: 100,
    accepted_translations_count: 7,
    accepted_translations_without_reviewer_edits_count: 0,
    accepted_translation_word_count: 50,
    rejected_translations_count: 0,
    rejected_translation_word_count: 0,
    first_contribution_date: 'Mar 2021',
    last_contribution_date: 'Mar 2021'
  };
  const akanSecondTopicTranslationContributionStat = {
    language_code: 'ak',
    topic_name: 'second_topic',
    submitted_translations_count: 2,
    submitted_translation_word_count: 100,
    accepted_translations_count: 7,
    accepted_translations_without_reviewer_edits_count: 0,
    accepted_translation_word_count: 50,
    rejected_translations_count: 0,
    rejected_translation_word_count: 0,
    first_contribution_date: 'Mar 2021',
    last_contribution_date: 'Mar 2021'
  };
  const spanishFirstTopicTranslationContributionStat = {
    language_code: 'es',
    topic_name: 'first_topic',
    submitted_translations_count: 1500,
    submitted_translation_word_count: 10000,
    accepted_translations_count: 1429,
    accepted_translations_without_reviewer_edits_count: 0,
    accepted_translation_word_count: 10000,
    rejected_translations_count: 0,
    rejected_translation_word_count: 0,
    first_contribution_date: 'Mar 2021',
    last_contribution_date: 'Mar 2021'
  };
  const spanishSecondTopicTranslationContributionStat = {
    language_code: 'es',
    topic_name: 'second_topic',
    submitted_translations_count: 1500,
    submitted_translation_word_count: 10000,
    accepted_translations_count: 1429,
    accepted_translations_without_reviewer_edits_count: 0,
    accepted_translation_word_count: 10000,
    rejected_translations_count: 0,
    rejected_translation_word_count: 0,
    first_contribution_date: 'Mar 2021',
    last_contribution_date: 'Mar 2021'
  };
  const akanFirstTopicTranslationReviewStat = {
    language_code: 'ak',
    topic_name: 'first_topic',
    reviewed_translations_count: 50,
    reviewed_translation_word_count: 100,
    accepted_translations_count: 20,
    accepted_translations_with_reviewer_edits_count: 10,
    accepted_translation_word_count: 70,
    first_contribution_date: 'Mar 2021',
    last_contribution_date: 'Mar 2021'
  };
  const hindiTopicTranslationReviewStat = {
    language_code: 'hi',
    topic_name: 'second_topic',
    reviewed_translations_count: 50,
    reviewed_translation_word_count: 100,
    accepted_translations_count: 20,
    accepted_translations_with_reviewer_edits_count: 10,
    accepted_translation_word_count: 70,
    first_contribution_date: 'Mar 2021',
    last_contribution_date: 'Mar 2021'
  };
  const spanishTranslationReviewStat = {
    language_code: 'es',
    topic_name: 'published_topic_name',
    reviewed_translations_count: 2000,
    reviewed_translation_word_count: 4000,
    accepted_translations_count: 1970,
    accepted_translations_with_reviewer_edits_count: 1250,
    accepted_translation_word_count: 3500,
    first_contribution_date: 'Mar 2021',
    last_contribution_date: 'Mar 2021'
  };
  const questionContributionStat = {
    topic_name: 'published_topic_name',
    submitted_questions_count: 1,
    accepted_questions_count: 1,
    accepted_questions_without_reviewer_edits_count: 0,
    first_contribution_date: 'Mar 2021',
    last_contribution_date: 'Mar 2021'
  };
  const questionReviewStat = {
    topic_name: 'published_topic_name',
    reviewed_questions_count: 1,
    accepted_questions_count: 1,
    accepted_questions_with_reviewer_edits_count: 1,
    first_contribution_date: 'Mar 2021',
    last_contribution_date: 'Mar 2021'
  };

  const fetchAllStatsResponse = {
    translation_contribution_stats: [
      akanFirstTopicTranslationContributionStat,
      akanSecondTopicTranslationContributionStat,
      spanishFirstTopicTranslationContributionStat,
      spanishSecondTopicTranslationContributionStat
    ],
    translation_review_stats: [
      akanFirstTopicTranslationReviewStat,
      hindiTopicTranslationReviewStat,
      spanishTranslationReviewStat
    ],
    question_contribution_stats: [questionContributionStat],
    question_review_stats: [questionReviewStat]
  };
  let component: ContributorBadgesComponent;
  let fixture: ComponentFixture<ContributorBadgesComponent>;
  let contributionAndReviewStatsService: ContributionAndReviewStatsService;
  let languageUtilService: LanguageUtilService;
  let userService: UserService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        ContributorBadgesComponent
      ],
      providers: [
        ContributionAndReviewStatsService,
        LanguageUtilService,
        UserService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(ContributorBadgesComponent);
    component = fixture.componentInstance;

    contributionAndReviewStatsService = TestBed.inject(
      ContributionAndReviewStatsService);
    languageUtilService = TestBed.inject(LanguageUtilService);
    userService = TestBed.inject(UserService);

    fixture.detectChanges();
  }));

  afterEach(() => {
    fixture.destroy();
  });

  describe('when user navigates to contributor badge page ', () => {
    describe('when user has translation badges and question rights ', () => {
      const userContributionRights = {
        can_review_translation_for_language_codes: ['es', 'pt', 'hi'],
        can_review_voiceover_for_language_codes: ['es', 'pt', 'hi'],
        can_review_questions: true,
        can_suggest_questions: true,
      };

      beforeEach(waitForAsync(() => {
        fetchAllContributionAndReviewStatsAsync = spyOn(
          contributionAndReviewStatsService,
          'fetchAllStats');
        fetchAllContributionAndReviewStatsAsync.and.returnValue(
          Promise.resolve(fetchAllStatsResponse));
        spyOn(
          languageUtilService, 'getAudioLanguageDescription')
          .and.returnValues(
            'Akan', 'Akan', 'Spanish',
            'Spanish', 'Akan', 'Hindi',
            'Spanish', 'Spanish', 'português', 'Hindi',);
        spyOn(
          languageUtilService, 'getShortLanguageDescription')
          .and.returnValue('Language');
        spyOn(userService, 'getUserInfoAsync')
          .and.returnValue(Promise.resolve({
            isLoggedIn: () => true,
            getUsername: () => 'user'
          } as UserInfo));
        spyOn(userService, 'getUserContributionRightsDataAsync')
          .and.returnValue(Promise.resolve(userContributionRights));
        component.ngOnInit();
      }));

      it('should create translation badges', fakeAsync(() => {
        expect(component.translationBadges).not.toBeNull();
      }));

      it('should create question badges', fakeAsync(() => {
        expect(component.questionSubmissionBadges.length).toBeGreaterThan(0);
        expect(component.questionReviewBadges.length).toBeGreaterThan(0);
      }));

      it('should toggle language dropdown when user clicks on it', fakeAsync(
        () => {
          component.dropdownShown = false;

          component.toggleLanguageDropdown();

          expect(component.dropdownShown).toBeTrue();
        }));

      it('should toggle mobile language dropdown when user clicks on it',
        fakeAsync(() => {
          component.mobileDropdownShown = false;

          component.toggleMobileLanguageDropdown();

          expect(component.mobileDropdownShown).toBeTrue();
        }));

      it('should toggle mobile badge type dropdown', fakeAsync(() => {
        component.mobileBadgeTypeDropdownShown = false;

        component.toggleMobileBadgeTypeDropdown();

        expect(component.mobileBadgeTypeDropdownShown).toBeTrue();
      }));

      it('should show badges in selected language', fakeAsync(() => {
        component.selectLanguageOption('Hindi');

        expect(component.selectedLanguage).toBe('Hindi');
      }));

      it('should show translation badges type in mobile', fakeAsync(() => {
        component.selectBadgeType(MobileBadgeType.Translation);

        expect(component.mobileBadgeTypeSelected).toBe(
          MobileBadgeType.Translation);
      }));

      it('should show question badges type in mobile', fakeAsync(() => {
        component.selectBadgeType(MobileBadgeType.Question);

        expect(component.mobileBadgeTypeSelected).toBe(
          MobileBadgeType.Question);
      }));
    });

    describe(
      'when user has no translation badges and no question rights ', () => {
        const userContributionRights = {
          can_review_translation_for_language_codes: [],
          can_review_voiceover_for_language_codes: [],
          can_review_questions: false,
          can_suggest_questions: false,
        };

        beforeEach(waitForAsync(() => {
          fetchAllContributionAndReviewStatsAsync = spyOn(
            contributionAndReviewStatsService,
            'fetchAllStats');
          fetchAllContributionAndReviewStatsAsync.and.returnValue(
            Promise.resolve({
              translation_contribution_stats: [],
              translation_review_stats: [],
              question_contribution_stats: [],
              question_review_stats: []
            }));
          spyOn(
            languageUtilService, 'getAudioLanguageDescription')
            .and.returnValues('Spanish', 'português', 'Hindi', 'Akan');
          spyOn(
            languageUtilService, 'getShortLanguageDescription')
            .and.returnValue('Language');
          spyOn(userService, 'getUserInfoAsync')
            .and.returnValue(Promise.resolve({
              isLoggedIn: () => true,
              getUsername: () => 'user'
            } as UserInfo));
          spyOn(userService, 'getUserContributionRightsDataAsync')
            .and.returnValue(Promise.resolve(userContributionRights));
          component.ngOnInit();
        }));

        it('should not display any badge', fakeAsync(() => {
          expect(component.translationBadges).toEqual({});
          expect(component.questionSubmissionBadges).toEqual([]);
        }));
      });
  });

  describe('when user contribution rights can not be fetched',
    () => {
      it('should throw error to mention the error',
        fakeAsync(() => {
          spyOn(userService, 'getUserInfoAsync')
            .and.returnValue(Promise.resolve({
              isLoggedIn: () => true,
              getUsername: () => 'user'
            } as UserInfo));
          spyOn(userService, 'getUserContributionRightsDataAsync')
            .and.returnValue(Promise.resolve(null));

          expect(() => {
            component.ngOnInit();
            tick();
          }).toThrowError();
          flush();
        }));
    });

  describe('when user navigates to contributor stats page without login',
    () => {
      it('should throw error if username is invalid',
        fakeAsync(() => {
          const defaultUserInfo = new UserInfo(
            ['GUEST'], false, false, false, false, false,
            null, null, null, false);
          spyOn(userService, 'getUserInfoAsync').and
            .returnValue(Promise.resolve(defaultUserInfo));

          expect(() => {
            component.ngOnInit();
            tick();
          }).toThrowError();
          flush();
        }));
    });

  describe('when user interacts with dropdown',
    () => {
      let getDropdownOptionsContainer: () => HTMLElement;

      beforeEach(() => {
        getDropdownOptionsContainer = () => {
          return fixture.debugElement.nativeElement.querySelector(
            '.oppia-stats-type-selector-dropdown-container');
        };
      });

      it('should correctly show and hide when clicked away',
        fakeAsync(() => {
          let fakeClickAwayEvent = new MouseEvent('click');
          Object.defineProperty(
            fakeClickAwayEvent,
            'target',
            {value: document.createElement('div')});

          component.onDocumentClick(fakeClickAwayEvent);
          fixture.detectChanges();

          expect(component.dropdownShown).toBe(false);
          expect(getDropdownOptionsContainer()).toBeFalsy();
        }));
    });
});
