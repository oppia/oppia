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
 * @fileoverview Unit tests for ContributorStatsComponent.
 */

import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {UserService} from 'services/user.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {UserInfo} from 'domain/user/user-info.model';
import {ContributorStatsComponent} from './contributor-stats.component';
import {ContributionAndReviewStatsService} from '../services/contribution-and-review-stats.service';
import {LanguageUtilService} from 'domain/utilities/language-util.service';
import {
  NgbActiveModal,
  NgbModal,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import {CertificateDownloadModalComponent} from '../modal-templates/certificate-download-modal.component';

describe('Contributor stats component', () => {
  let fetchAllContributionAndReviewStatsAsync: jasmine.Spy;
  const userContributionRights = {
    can_review_translation_for_language_codes: ['en', 'pt', 'hi'],
    can_review_voiceover_for_language_codes: ['en', 'pt', 'hi'],
    can_review_questions: true,
    can_suggest_questions: true,
  };
  const translationContributionStatTopic1 = {
    language_code: 'es',
    topic_name: 'topic_1',
    submitted_translations_count: 2,
    submitted_translation_word_count: 100,
    accepted_translations_count: 1,
    accepted_translations_without_reviewer_edits_count: 0,
    accepted_translation_word_count: 50,
    rejected_translations_count: 0,
    rejected_translation_word_count: 0,
    first_contribution_date: 'Mar 2021',
    last_contribution_date: 'Mar 2021',
  };
  const translationContributionStatTopic2 = {
    language_code: 'es',
    topic_name: 'topic_2',
    submitted_translations_count: 2,
    submitted_translation_word_count: 100,
    accepted_translations_count: 1,
    accepted_translations_without_reviewer_edits_count: 0,
    accepted_translation_word_count: 50,
    rejected_translations_count: 0,
    rejected_translation_word_count: 0,
    first_contribution_date: 'Mar 2021',
    last_contribution_date: 'Mar 2021',
  };
  const translationReviewStatTopic1 = {
    language_code: 'es',
    topic_name: 'topic_2',
    reviewed_translations_count: 1,
    reviewed_translation_word_count: 1,
    accepted_translations_count: 1,
    accepted_translations_with_reviewer_edits_count: 0,
    accepted_translation_word_count: 1,
    first_contribution_date: 'Mar 2021',
    last_contribution_date: 'Mar 2021',
  };
  const translationReviewStatTopic2 = {
    language_code: 'es',
    topic_name: 'topic_2',
    reviewed_translations_count: 1,
    reviewed_translation_word_count: 1,
    accepted_translations_count: 1,
    accepted_translations_with_reviewer_edits_count: 0,
    accepted_translation_word_count: 1,
    first_contribution_date: 'Mar 2021',
    last_contribution_date: 'Mar 2021',
  };
  const questionContributionStat = {
    topic_name: 'published_topic_name',
    submitted_questions_count: 1,
    accepted_questions_count: 1,
    accepted_questions_without_reviewer_edits_count: 0,
    first_contribution_date: 'Mar 2021',
    last_contribution_date: 'Mar 2021',
  };
  const questionReviewStat = {
    topic_name: 'published_topic_name',
    reviewed_questions_count: 1,
    accepted_questions_count: 1,
    accepted_questions_with_reviewer_edits_count: 1,
    first_contribution_date: 'Mar 2021',
    last_contribution_date: 'Mar 2021',
  };

  const fetchAllStatsResponse = {
    translation_contribution_stats: [
      translationContributionStatTopic1,
      translationContributionStatTopic2,
    ],
    translation_review_stats: [
      translationReviewStatTopic1,
      translationReviewStatTopic2,
    ],
    question_contribution_stats: [questionContributionStat],
    question_review_stats: [questionReviewStat],
  };
  let component: ContributorStatsComponent;
  let fixture: ComponentFixture<ContributorStatsComponent>;
  let contributionAndReviewStatsService: ContributionAndReviewStatsService;
  let languageUtilService: LanguageUtilService;
  let userService: UserService;
  let modalService: NgbModal;
  let certificateModal: NgbModalRef;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        ContributorStatsComponent,
        CertificateDownloadModalComponent,
      ],
      providers: [
        ContributionAndReviewStatsService,
        LanguageUtilService,
        UserService,
        NgbModal,
        NgbActiveModal,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(ContributorStatsComponent);
    component = fixture.componentInstance;

    contributionAndReviewStatsService = TestBed.inject(
      ContributionAndReviewStatsService
    );
    certificateModal = TestBed.createComponent(
      CertificateDownloadModalComponent
    ) as unknown as NgbModalRef;
    languageUtilService = TestBed.inject(LanguageUtilService);
    userService = TestBed.inject(UserService);
    modalService = TestBed.inject(NgbModal);
    spyOn(modalService, 'open').and.returnValue(certificateModal);

    fetchAllContributionAndReviewStatsAsync = spyOn(
      contributionAndReviewStatsService,
      'fetchAllStats'
    );
    fetchAllContributionAndReviewStatsAsync.and.returnValue(
      Promise.resolve(fetchAllStatsResponse)
    );
    spyOn(languageUtilService, 'getAudioLanguageDescription').and.returnValue(
      'audio_language_description'
    );

    fixture.detectChanges();

    component.type = 'translationContribution';
  }));

  afterEach(() => {
    fixture.destroy();
  });

  describe('when user navigates to contributor stats page ', () => {
    beforeEach(waitForAsync(() => {
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve({
          isLoggedIn: () => true,
          getUsername: () => 'user',
        } as UserInfo)
      );
      spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
        Promise.resolve(userContributionRights)
      );
      component.ngOnInit();
    }));

    it('should show translation contribution stats', fakeAsync(() => {
      component.selectOption('translationContribution');

      expect(component.dropdownShown).toBeFalse;
      expect(component.selectedContributionType).toEqual(
        'Translation Contributions'
      );
    }));

    it('should show translation review stats', fakeAsync(() => {
      component.selectOption('translationReview');

      expect(component.dropdownShown).toBeFalse;
      expect(component.selectedContributionType).toEqual('Translation Reviews');
    }));

    it('should show question contribution stats', fakeAsync(() => {
      component.selectOption('questionContribution');

      expect(component.dropdownShown).toBeFalse;
      expect(component.selectedContributionType).toEqual(
        'Question Contributions'
      );
    }));

    it('should show question review stats', fakeAsync(() => {
      component.selectOption('questionReview');

      expect(component.dropdownShown).toBeFalse;
      expect(component.selectedContributionType).toEqual('Question Reviews');
    }));

    it(
      'should open date range selecting model to generate certificate for' +
        ' contributors',
      fakeAsync(() => {
        component.openCertificateDownloadModal('add_question', '');
        tick();
        expect(modalService.open).toHaveBeenCalled();
      })
    );

    it('should be able to page stats', fakeAsync(() => {
      const pagedStats = {
        currentPageStartIndex: 0,
        data: [
          {
            firstContributionDate: 'Mar 2020',
            lastContributionDate: 'Mar 2022',
            topicName: 'Dummy Topic',
            acceptedCards: 1,
            acceptedWordCount: 1,
          },
          {
            firstContributionDate: 'Mar 2020',
            lastContributionDate: 'Mar 2022',
            topicName: 'Dummy Topic',
            acceptedCards: 1,
            acceptedWordCount: 1,
          },
          {
            firstContributionDate: 'Mar 2020',
            lastContributionDate: 'Mar 2022',
            topicName: 'Dummy Topic',
            acceptedCards: 1,
            acceptedWordCount: 1,
          },
          {
            firstContributionDate: 'Mar 2020',
            lastContributionDate: 'Mar 2022',
            topicName: 'Dummy Topic',
            acceptedCards: 1,
            acceptedWordCount: 1,
          },
          {
            firstContributionDate: 'Mar 2020',
            lastContributionDate: 'Mar 2022',
            topicName: 'Dummy Topic',
            acceptedCards: 1,
            acceptedWordCount: 1,
          },
          {
            firstContributionDate: 'Mar 2020',
            lastContributionDate: 'Mar 2022',
            topicName: 'Dummy Topic',
            acceptedCards: 1,
            acceptedWordCount: 1,
          },
        ],
      };

      component.goToNextPage(pagedStats);
      expect(pagedStats.currentPageStartIndex).toBe(5);

      component.goToPreviousPage(pagedStats);
      expect(pagedStats.currentPageStartIndex).toBe(0);
    }));

    it('should throw errors when there are no more pages', fakeAsync(() => {
      const pagedStats = {
        currentPageStartIndex: 0,
        data: [
          {
            firstContributionDate: 'Mar 2020',
            lastContributionDate: 'Mar 2022',
            topicName: 'Dummy Topic',
            acceptedCards: 1,
            acceptedWordCount: 1,
          },
        ],
      };

      expect(() => {
        component.goToNextPage(pagedStats);
      }).toThrowError('There are no more pages after this one.');
      expect(() => {
        component.goToPreviousPage(pagedStats);
      }).toThrowError('There are no more pages before this one.');
    }));

    it('should provide 0 to get original order of keyvaluea', fakeAsync(() => {
      expect(component.provideOriginalOrder()).toEqual(0);
    }));
  });

  describe('when user navigates to contributor stats page without login', () => {
    it('should throw error if username is invalid', fakeAsync(() => {
      const defaultUserInfo = new UserInfo(
        ['GUEST'],
        false,
        false,
        false,
        false,
        false,
        null,
        null,
        null,
        false
      );
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve(defaultUserInfo)
      );

      expect(() => {
        component.ngOnInit();
        tick();
      }).toThrowError();
      flush();
    }));
  });

  describe('when user contribution rights can not be fetched', () => {
    it('should throw error to mention the error', fakeAsync(() => {
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve({
          isLoggedIn: () => true,
          getUsername: () => 'user',
        } as UserInfo)
      );
      spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
        Promise.resolve(null)
      );

      expect(() => {
        component.ngOnInit();
        tick();
      }).toThrowError();
      flush();
    }));
  });

  describe('when user interacts with dropdown', () => {
    let getDropdownOptionsContainer: () => HTMLElement;

    beforeEach(() => {
      getDropdownOptionsContainer = () => {
        return fixture.debugElement.nativeElement.querySelector(
          '.oppia-stats-type-selector-dropdown-container'
        );
      };
    });

    it('should correctly show and hide when clicked away', fakeAsync(() => {
      let fakeClickAwayEvent = new MouseEvent('click');
      Object.defineProperty(fakeClickAwayEvent, 'target', {
        value: document.createElement('div'),
      });

      component.onDocumentClick(fakeClickAwayEvent);
      fixture.detectChanges();

      expect(component.dropdownShown).toBe(false);
      expect(getDropdownOptionsContainer()).toBeFalsy();
    }));

    it('should correctly show and hide correctly', fakeAsync(() => {
      expect(component.dropdownShown).toBe(false);
      expect(component.mobileDropdownShown).toBe(false);

      component.toggleDropdown();
      expect(component.dropdownShown).toBe(true);

      component.toggleDropdown();
      expect(component.dropdownShown).toBe(false);

      component.toggleMobileDropdown();
      expect(component.mobileDropdownShown).toBe(true);

      component.toggleMobileDropdown();
      expect(component.mobileDropdownShown).toBe(false);
    }));
  });
});
