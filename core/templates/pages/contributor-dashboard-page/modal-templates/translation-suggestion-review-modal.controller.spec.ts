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
 * @fileoverview Unit tests for TranslationSuggestionReviewModalComponent.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslationSuggestionReviewModalComponent } from './translation-suggestion-review-modal.component';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AlertsService } from 'services/alerts.service';
import { ContributionAndReviewService } from '../services/contribution-and-review.service';
import { LanguageUtilService } from 'domain/utilities/language-util.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { ThreadDataBackendApiService } from 'pages/exploration-editor-page/feedback-tab/services/thread-data-backend-api.service';
import { UserService } from 'services/user.service';
import { UserInfo } from 'domain/user/user-info.model';

class MockChangeDetectorRef {
  detectChanges(): void {}
}

describe('Translation Suggestion Review Modal Component', function() {
  let fixture: ComponentFixture<TranslationSuggestionReviewModalComponent>;
  let component: TranslationSuggestionReviewModalComponent;
  let alertsService: AlertsService;
  let contributionAndReviewService: ContributionAndReviewService;
  let languageUtilService: LanguageUtilService;
  let siteAnalyticsService: SiteAnalyticsService;
  let threadDataBackendApiService: ThreadDataBackendApiService;
  let userService: UserService;
  let activeModal: NgbActiveModal;
  let changeDetectorRef: MockChangeDetectorRef = new MockChangeDetectorRef();

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [TranslationSuggestionReviewModalComponent],
      providers: [
        NgbActiveModal,
        AlertsService,
        ContributionAndReviewService,
        LanguageUtilService,
        SiteAnalyticsService,
        ThreadDataBackendApiService,
        UserService,
        {
          provide: ChangeDetectorRef,
          useValue: changeDetectorRef
        }
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      TranslationSuggestionReviewModalComponent);
    component = fixture.componentInstance;
    activeModal = TestBed.inject(NgbActiveModal);
    alertsService = TestBed.inject(AlertsService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    threadDataBackendApiService = TestBed.inject(ThreadDataBackendApiService);
    userService = TestBed.inject(UserService);
    contributionAndReviewService = TestBed.inject(
      ContributionAndReviewService);
    languageUtilService = TestBed.inject(LanguageUtilService);
    spyOn(
      siteAnalyticsService,
      'registerContributorDashboardViewSuggestionForReview');
    spyOn(
      languageUtilService, 'getAudioLanguageDescription')
      .and.returnValue('audio_language_description');
  });

  describe('when reviewing suggestion', function() {
    const reviewable = true;
    const subheading = 'subheading_title';
    const suggestion1 = {
      suggestion_id: 'suggestion_1',
      target_id: '1',
      suggestion_type: 'translate_content',
      change: {
        content_id: 'hint_1',
        content_html: '<p>content</p><p>&nbsp;</p>',
        translation_html: 'Tradução',
        state_name: 'StateName'
      },
      exploration_content_html: '<p>content</p><p>&nbsp;</p>'
    };
    const suggestion2 = {
      suggestion_id: 'suggestion_2',
      target_id: '2',
      suggestion_type: 'translate_content',
      change: {
        content_id: 'hint_1',
        content_html: '<p>content</p>',
        translation_html: 'Tradução',
        state_name: 'StateName'
      },
      exploration_content_html: '<p>content CHANGED</p>'
    };

    const contribution1 = {
      suggestion: suggestion1,
      details: null
    };
    const contribution2 = {
      suggestion: suggestion2,
      details: {
        topic_name: 'topic_2',
        story_title: 'story_2',
        chapter_title: 'chapter_2'
      }
    };

    const suggestionIdToContribution = {
      suggestion_1: contribution1,
      suggestion_2: contribution2
    };

    const editedContent = {
      html: '<p>In Hindi</p>'
    };

    const userInfo = new UserInfo(
      ['USER_ROLE'], true, false, false, false, true,
      'en', 'username1', 'tester@example.com', true
    );

    beforeEach(() => {
      component.initialSuggestionId = 'suggestion_1';
      component.subheading = subheading;
      component.reviewable = reviewable;
      component.suggestionIdToContribution = angular.copy(
        suggestionIdToContribution);
      component.editedContent = editedContent;
    });

    it('should call user service at initialization.',
      function() {
        const userInfoSpy = spyOn(
          userService, 'getUserInfoAsync')
          .and.returnValue(Promise.resolve(userInfo));

        const contributionRightsDataSpy = spyOn(
          userService,
          'getUserContributionRightsDataAsync')
          .and.returnValue(Promise.resolve(
            {
              can_review_translation_for_language_codes: ['ar'],
              can_review_voiceover_for_language_codes: [],
              can_review_questions: false
            }));
        component.ngOnInit();
        expect(userInfoSpy).toHaveBeenCalled();
        expect(contributionRightsDataSpy).toHaveBeenCalled();
      });

    it('should initialize $scope properties after controller is initialized',
      function() {
        component.ngOnInit();
        expect(component.subheading).toBe(subheading);
        expect(component.reviewable).toBe(reviewable);
        expect(component.activeSuggestionId).toBe('suggestion_1');
        expect(component.activeSuggestion).toEqual(suggestion1);
        expect(component.reviewMessage).toBe('');
      });

    it('should register Contributor Dashboard view suggestion for review ' +
      'event after controller is initialized', function() {
      component.ngOnInit();
      expect(
        siteAnalyticsService
          .registerContributorDashboardViewSuggestionForReview)
        .toHaveBeenCalledWith('Translation');
    });

    it('should notify user on failed suggestion update', function() {
      component.ngOnInit();
      const error = new Error('Error');
      expect(component.errorFound).toBeFalse();
      expect(component.errorMessage).toBe('');

      component.showTranslationSuggestionUpdateError(error);

      expect(component.errorFound).toBeTrue();
      expect(component.errorMessage).toBe('Invalid Suggestion: Error');
    });

    it('should accept suggestion in suggestion modal service when clicking' +
      ' on accept and review next suggestion button', function() {
      component.ngOnInit();
      expect(component.activeSuggestionId).toBe('suggestion_1');
      expect(component.activeSuggestion).toEqual(suggestion1);
      expect(component.reviewable).toBe(reviewable);
      expect(component.reviewMessage).toBe('');
      // Suggestion 1's exploration_content_html matches its content_html.
      expect(component.hasExplorationContentChanged()).toBe(false);
      expect(component.displayExplorationContent()).toEqual(
        suggestion1.change.content_html);

      spyOn(
        siteAnalyticsService,
        'registerContributorDashboardAcceptSuggestion');
      spyOn(contributionAndReviewService, 'resolveSuggestionToExploration')
        .and.callFake((
            targetId, suggestionId, action, reviewMessage, commitMessage,
            successCallback, errorCallback) => {
          return Promise.resolve(successCallback(suggestionId));
        });
      spyOn(activeModal, 'close');

      component.reviewMessage = 'Review message example';
      component.translationUpdated = true;
      component.acceptAndReviewNext();

      expect(component.activeSuggestionId).toBe('suggestion_2');
      expect(component.activeSuggestion).toEqual(suggestion2);
      expect(component.reviewable).toBe(reviewable);
      expect(component.reviewMessage).toBe('');
      // Suggestion 2's exploration_content_html does not match its
      // content_html.
      expect(component.hasExplorationContentChanged()).toBe(true);
      expect(component.displayExplorationContent()).toEqual(
        suggestion2.exploration_content_html);
      expect(
        siteAnalyticsService.registerContributorDashboardAcceptSuggestion)
        .toHaveBeenCalledWith('Translation');
      expect(contributionAndReviewService.resolveSuggestionToExploration)
        .toHaveBeenCalledWith(
          '1', 'suggestion_1', 'accept', 'Review message example: ' +
          'This suggestion was submitted with reviewer edits.',
          'hint section of "StateName" card',
          jasmine.any(Function), jasmine.any(Function));

      component.reviewMessage = 'Review message example 2';
      component.translationUpdated = false;
      component.acceptAndReviewNext();

      expect(
        siteAnalyticsService.registerContributorDashboardAcceptSuggestion)
        .toHaveBeenCalledWith('Translation');
      expect(contributionAndReviewService.resolveSuggestionToExploration)
        .toHaveBeenCalledWith(
          '2', 'suggestion_2', 'accept', 'Review message example 2',
          'hint section of "StateName" card', jasmine.any(Function),
          jasmine.any(Function));
      expect(activeModal.close).toHaveBeenCalledWith([
        'suggestion_1', 'suggestion_2']);
    });

    it('should reject suggestion in suggestion modal service when clicking ' +
      'on reject and review next suggestion button', function() {
      component.ngOnInit();
      expect(component.activeSuggestionId).toBe('suggestion_1');
      expect(component.activeSuggestion).toEqual(suggestion1);
      expect(component.reviewable).toBe(reviewable);
      expect(component.reviewMessage).toBe('');

      spyOn(contributionAndReviewService, 'resolveSuggestionToExploration')
        .and.callFake((
            targetId, suggestionId, action, reviewMessage, commitMessage,
            successCallback, errorCallback) => {
          return Promise.resolve(successCallback(suggestionId));
        });
      spyOn(
        siteAnalyticsService,
        'registerContributorDashboardRejectSuggestion');
      spyOn(activeModal, 'close');

      component.reviewMessage = 'Review message example';
      component.translationUpdated = true;
      component.rejectAndReviewNext(component.reviewMessage);

      expect(component.activeSuggestionId).toBe('suggestion_2');
      expect(component.activeSuggestion).toEqual(suggestion2);
      expect(component.reviewable).toBe(reviewable);
      expect(component.reviewMessage).toBe('');
      expect(
        siteAnalyticsService.registerContributorDashboardRejectSuggestion)
        .toHaveBeenCalledWith('Translation');
      expect(contributionAndReviewService.resolveSuggestionToExploration)
        .toHaveBeenCalledWith(
          '1', 'suggestion_1', 'reject', 'Review message example',
          'hint section of "StateName" card', jasmine.any(Function),
          jasmine.any(Function));

      component.reviewMessage = 'Review message example 2';
      component.translationUpdated = false;
      component.rejectAndReviewNext(component.reviewMessage);

      expect(
        siteAnalyticsService.registerContributorDashboardRejectSuggestion)
        .toHaveBeenCalledWith('Translation');
      expect(contributionAndReviewService.resolveSuggestionToExploration)
        .toHaveBeenCalledWith(
          '2', 'suggestion_2', 'reject', 'Review message example 2',
          'hint section of "StateName" card', jasmine.any(Function),
          jasmine.any(Function));
      expect(activeModal.close).toHaveBeenCalledWith([
        'suggestion_1', 'suggestion_2']);
    });

    it('should reject a suggestion if the backend pre accept validation ' +
    'failed', function() {
      component.ngOnInit();
      expect(component.activeSuggestionId).toBe('suggestion_1');
      expect(component.activeSuggestion).toEqual(suggestion1);
      expect(component.reviewable).toBe(reviewable);
      expect(component.reviewMessage).toBe('');
      spyOn(
        siteAnalyticsService,
        'registerContributorDashboardAcceptSuggestion');
      spyOn(contributionAndReviewService, 'resolveSuggestionToExploration')
        .and.callFake((
            targetId, suggestionId, action, reviewMessage, commitMessage,
            successCallback, errorCallback) => {
          let dummyErrorResponse = new Error('Error');
          if (errorCallback) {
            return Promise.reject(errorCallback(dummyErrorResponse));
          }
        });
      spyOn(alertsService, 'addWarning');

      component.reviewMessage = 'Review message example';
      component.acceptAndReviewNext();

      expect(
        siteAnalyticsService.registerContributorDashboardAcceptSuggestion)
        .toHaveBeenCalledWith('Translation');
      expect(contributionAndReviewService.resolveSuggestionToExploration)
        .toHaveBeenCalledWith(
          '1', 'suggestion_1', 'accept', 'Review message example',
          'hint section of "StateName" card', jasmine.any(Function),
          jasmine.any(Function));
      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Invalid Suggestion: Error.');
    });

    it(
      'should cancel suggestion in suggestion modal service when clicking ' +
      'on cancel suggestion button', function() {
        spyOn(activeModal, 'close');
        component.cancel();
        expect(activeModal.close).toHaveBeenCalledWith([]);
      });

    it(
      'should open the translation editor when the edit button is clicked',
      function() {
        component.editSuggestion();
        expect(component.startedEditing).toBe(true);
      });

    it(
      'should close the translation editor when the cancel button is clicked',
      function() {
        component.cancelEdit();
        expect(component.startedEditing).toBe(false);
      });

    it(
      'should update translation when the update button is clicked',
      function() {
        component.ngOnInit();
        spyOn(contributionAndReviewService, 'updateTranslationSuggestionAsync')
          .and.callFake((
              suggestionId, translationHtml,
              successCallback, errorCallback) => {
            return Promise.resolve(successCallback());
          });

        component.updateSuggestion();

        expect(contributionAndReviewService.updateTranslationSuggestionAsync)
          .toHaveBeenCalledWith(
            'suggestion_1', component.editedContent.html,
            jasmine.any(Function),
            jasmine.any(Function));
      });

    describe('isHtmlContentEqual', function() {
      it('should return true regardless of &nbsp; differences', function() {
        expect(component.isHtmlContentEqual(
          '<p>content</p><p>&nbsp;&nbsp;</p>', '<p>content</p><p> </p>'))
          .toBe(true);
      });

      it('should return true regardless of new line differences', function() {
        expect(component.isHtmlContentEqual(
          '<p>content</p>\r\n\n<p>content2</p>',
          '<p>content</p><p>content2</p>'))
          .toBe(true);
      });

      it('should return false if html content differ', function() {
        expect(component.isHtmlContentEqual(
          '<p>content</p>', '<p>content CHANGED</p>'))
          .toBe(false);
      });

      it('should return false if array contents differ', function() {
        expect(component.isHtmlContentEqual(
          ['<p>content1</p>', '<p>content2</p>'],
          ['<p>content1</p>', '<p>content2 CHANGED</p>']))
          .toBe(false);
      });

      it('should return true if array contents are equal', function() {
        expect(component.isHtmlContentEqual(
          ['<p>content1</p>', '<p>content2</p>'],
          ['<p>content1</p>', '<p>content2</p>']))
          .toBe(true);
      });

      it('should return false if type is different', function() {
        expect(component.isHtmlContentEqual(
          ['<p>content1</p>', '<p>content2</p>'],
          '<p>content2</p>'))
          .toBe(false);
      });
    });
  });

  describe('when viewing suggestion', function() {
    const reviewable = false;
    const subheading = 'subheading_title';

    const suggestion1 = {
      suggestion_id: 'suggestion_1',
      target_id: '1',
      suggestion_type: 'translate_content',
      change: {
        content_id: 'hint_1',
        content_html: ['Translation1', 'Translation2'],
        translation_html: 'Tradução',
        state_name: 'StateName'
      },
      exploration_content_html: ['Translation1', 'Translation2 CHANGED'],
      status: 'rejected'
    };
    const suggestion2 = {
      suggestion_id: 'suggestion_2',
      target_id: '2',
      suggestion_type: 'translate_content',
      change: {
        content_id: 'hint_1',
        content_html: 'Translation',
        translation_html: 'Tradução',
        state_name: 'StateName'
      },
      exploration_content_html: 'Translation'
    };

    const contribution1 = {
      suggestion: suggestion1,
      details: null
    };
    const contribution2 = {
      suggestion: suggestion2,
      details: {
        topic_name: 'topic_2',
        story_title: 'story_2',
        chapter_title: 'chapter_2'
      }
    };

    const suggestionIdToContribution = {
      suggestion_1: contribution1,
      suggestion_2: contribution2
    };

    beforeEach(() => {
      component.initialSuggestionId = 'suggestion_1';
      component.subheading = subheading;
      component.reviewable = reviewable;
      component.suggestionIdToContribution = angular.copy(
        suggestionIdToContribution);
    });

    it('should initialize $scope properties after controller is initialized',
      function() {
        const messages = [{
          author_username: '',
          created_on_msecs: 0,
          entity_type: '',
          entity_id: '',
          message_id: 0,
          text: '',
          updated_status: '',
          updated_subject: '',
        }];

        const fetchMessagesAsyncSpy = spyOn(
          threadDataBackendApiService, 'fetchMessagesAsync')
          .and.returnValue(Promise.resolve({messages: messages}));

        component.ngOnInit();
        component.init();

        expect(component.activeSuggestionId).toBe('suggestion_1');
        expect(component.activeSuggestion).toEqual(suggestion1);
        expect(component.reviewable).toBe(reviewable);
        expect(component.subheading).toBe('subheading_title');
        // Suggestion 1's exploration_content_html does not match its
        // content_html.
        expect(component.hasExplorationContentChanged()).toBe(true);
        expect(fetchMessagesAsyncSpy).toHaveBeenCalledWith('suggestion_1');
        expect(component.reviewMessage).toBe('');
      });
  });

  describe('when reviewing suggestions' +
    ' with deleted opportunites', function() {
    const reviewable = false;
    const subheading = 'subheading_title';

    const suggestion1 = {
      suggestion_id: 'suggestion_1',
      target_id: '1',
      suggestion_type: 'translate_content',
      change: {
        content_id: 'hint_1',
        content_html: ['Translation1', 'Translation2'],
        translation_html: 'Tradução',
        state_name: 'StateName'
      },
      exploration_content_html: ['Translation1', 'Translation2 CHANGED'],
      status: 'rejected'
    };
    const suggestion2 = {
      suggestion_id: 'suggestion_2',
      target_id: '2',
      suggestion_type: 'translate_content',
      change: {
        content_id: 'hint_1',
        content_html: 'Translation',
        translation_html: 'Tradução',
        state_name: 'StateName'
      },
      exploration_content_html: 'Translation'
    };

    const contribution1 = {
      suggestion: suggestion1,
      details: null
    };

    const deletedContribution = {
      suggestion: suggestion2,
      details: null
    };

    const suggestionIdToContribution = {
      suggestion_1: contribution1,
      suggestion_deleted: deletedContribution,
    };

    beforeEach(() => {
      component.initialSuggestionId = 'suggestion_1';
      component.subheading = subheading;
      component.reviewable = reviewable;
      component.suggestionIdToContribution = angular.copy(
        suggestionIdToContribution);
      component.ngOnInit();
    });

    it('should reject suggestion in suggestion modal service when clicking ' +
      'on reject and review next suggestion button', function() {
      expect(component.activeSuggestionId).toBe('suggestion_1');
      expect(component.activeSuggestion).toEqual(suggestion1);
      expect(component.reviewable).toBe(reviewable);
      expect(component.reviewMessage).toBe('');

      spyOn(contributionAndReviewService, 'resolveSuggestionToExploration')
        .and.callFake((
            targetId, suggestionId, action, reviewMessage, commitMessage,
            successCallback, errorCallback) => {
          return Promise.resolve(successCallback(suggestionId));
        });
      spyOn(
        siteAnalyticsService,
        'registerContributorDashboardRejectSuggestion');
      spyOn(activeModal, 'close');

      component.reviewMessage = 'Review message example';
      component.rejectAndReviewNext(component.reviewMessage);

      expect(
        siteAnalyticsService.registerContributorDashboardRejectSuggestion)
        .toHaveBeenCalledWith('Translation');
      expect(contributionAndReviewService.resolveSuggestionToExploration)
        .toHaveBeenCalledWith(
          '1', 'suggestion_1', 'reject', 'Review message example',
          'hint section of "StateName" card', jasmine.any(Function),
          jasmine.any(Function));
      expect(activeModal.close).toHaveBeenCalledWith([
        'suggestion_1']);
    });
  });

  describe('when set the schema constant', function() {
    const reviewable = true;
    const subheading = 'subheading_title';
    const suggestion1 = {
      suggestion_id: 'suggestion_1',
      target_id: '1',
      suggestion_type: 'translate_content',
      change: {
        content_id: 'hint_1',
        content_html: '<p>content</p><p>&nbsp;</p>',
        translation_html: 'Tradução',
        state_name: 'StateName'
      },
      exploration_content_html: '<p>content</p><p>&nbsp;</p>'
    };
    const suggestion2 = {
      suggestion_id: 'suggestion_2',
      target_id: '2',
      suggestion_type: 'translate_content',
      change: {
        content_id: 'hint_1',
        content_html: '<p>content</p>',
        translation_html: 'Tradução',
        state_name: 'StateName'
      },
      exploration_content_html: '<p>content CHANGED</p>'
    };

    const contribution1 = {
      suggestion: suggestion1,
      details: null
    };
    const contribution2 = {
      suggestion: suggestion2,
      details: {
        topic_name: 'topic_2',
        story_title: 'story_2',
        chapter_title: 'chapter_2'
      }
    };

    const suggestionIdToContribution = {
      suggestion_1: contribution1,
      suggestion_2: contribution2
    };

    const editedContent = {
      html: '<p>In Hindi</p>'
    };

    beforeEach(() => {
      component.initialSuggestionId = 'suggestion_1';
      component.subheading = subheading;
      component.reviewable = reviewable;
      component.suggestionIdToContribution = angular.copy(
        suggestionIdToContribution);
      component.editedContent = editedContent;
      component.ngOnInit();
    });

    it('should get html schema', () => {
      expect(component.getHtmlSchema()).toEqual({
        type: 'html',
      });
    });

    it('should get unicode schema', () => {
      expect(component.getUnicodeSchema()).toEqual({
        type: 'unicode'
      });
    });

    it('should get set of strings schema', () => {
      expect(component.getSetOfStringsSchema()).toEqual({
        type: 'list',
        items: {
          type: 'unicode'
        }
      });
    });

    it('should invoke change detection when html is updated', () => {
      component.editedContent.html = 'old';
      spyOn(changeDetectorRef, 'detectChanges').and.callThrough();
      component.updateHtml('new');
      expect(component.editedContent.html).toEqual('new');
    });

    it('should not invoke change detection when html is not updated', () => {
      component.editedContent.html = 'old';
      spyOn(changeDetectorRef, 'detectChanges').and.callThrough();
      component.updateHtml('old');
      expect(component.editedContent.html).toEqual('old');
      expect(changeDetectorRef.detectChanges).toHaveBeenCalledTimes(0);
    });
  });
});
