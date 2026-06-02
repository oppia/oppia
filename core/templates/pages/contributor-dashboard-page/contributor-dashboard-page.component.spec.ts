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
 * @fileoverview Unit tests for contributor dashboard page component.
 */

import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {ContributorDashboardPageComponent} from 'pages/contributor-dashboard-page/contributor-dashboard-page.component';
import {ContributionAndReviewService} from './services/contribution-and-review.service';
import {ContributionOpportunitiesService} from './services/contribution-opportunities.service';
import {TranslationTopicService} from 'pages/exploration-editor-page/translation-tab/services/translation-topic.service';
import {TranslationLanguageService} from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import {UserService} from 'services/user.service';
import {LocalStorageService} from 'services/local-storage.service';
import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {UserInfo} from 'domain/user/user-info.model';
import {AppConstants} from 'app.constants';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {JoyrideService} from 'ngx-joyride';
import {TranslationOnboardingModalComponent} from './modal-templates/translation-onboarding-modal.component';
import {TranslationOnboardingSkipConfirmationModalComponent} from './modal-templates/translation-onboarding-skip-confirmation-modal.component';
import {TranslationModalComponent} from './modal-templates/translation-modal.component';
import {TranslationTutorialCompletionModalComponent} from './modal-templates/translation-tutorial-completion-modal.component';

describe('Contributor dashboard page', () => {
  class MockJoyrideService {
    startTour() {
      return {
        subscribe: (
          onNext: () => void,
          onError: () => void,
          onComplete: () => void
        ) => {
          onNext();
          onError();
          onComplete();
        },
      };
    }

    closeTour(): void {}
  }

  let component: ContributorDashboardPageComponent;
  let fixture: ComponentFixture<ContributorDashboardPageComponent>;
  let localStorageService: LocalStorageService;
  let userService: UserService;
  let translationLanguageService: TranslationLanguageService;
  let translationTopicService: TranslationTopicService;
  let contributionOpportunitiesService: ContributionOpportunitiesService;
  let userContributionRights = {
    can_review_translation_for_language_codes: ['en', 'pt', 'hi'],
    can_review_voiceover_for_language_codes: ['en', 'pt', 'hi'],
    can_review_questions: true,
    can_suggest_questions: true,
  };
  let focusManagerService: FocusManagerService;
  let getTranslatableTopicNamesAsyncSpy: jasmine.Spy;
  let getUserInfoAsyncSpy: jasmine.Spy;
  let urlInterpolationService: UrlInterpolationService;
  let contributionAndReviewService: ContributionAndReviewService;
  let ngbModal: NgbModal;
  let joyride: JoyrideService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ContributorDashboardPageComponent],
      providers: [
        LocalStorageService,
        UserService,
        TranslationLanguageService,
        TranslationTopicService,
        ContributionOpportunitiesService,
        ContributionAndReviewService,
        NgbModal,
        {
          provide: JoyrideService,
          useClass: MockJoyrideService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContributorDashboardPageComponent);
    component = fixture.componentInstance;

    contributionAndReviewService = TestBed.inject(ContributionAndReviewService);
    contributionOpportunitiesService = TestBed.inject(
      ContributionOpportunitiesService
    );
    localStorageService = TestBed.inject(LocalStorageService);
    ngbModal = TestBed.inject(NgbModal);
    joyride = TestBed.inject(JoyrideService);
    translationLanguageService = TestBed.inject(TranslationLanguageService);
    translationTopicService = TestBed.inject(TranslationTopicService);
    userService = TestBed.inject(UserService);
    focusManagerService = TestBed.inject(FocusManagerService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);

    getTranslatableTopicNamesAsyncSpy = spyOn(
      contributionOpportunitiesService,
      'getTranslatableTopicNamesAsync'
    );
    getTranslatableTopicNamesAsyncSpy.and.returnValue(
      Promise.resolve(['Topic 1', 'Topic 2'])
    );
    spyOn(
      localStorageService,
      'getLastSelectedTranslationLanguageCode'
    ).and.returnValue('');
    spyOn(
      localStorageService,
      'getLastSelectedTranslationTopicName'
    ).and.returnValue('Topic 1');
    spyOn(
      localStorageService,
      'hasSeenContributorDashboardTranslationOnboarding'
    ).and.returnValue(true);
    spyOn(
      localStorageService,
      'getContributorDashboardTranslationTutorialProgress'
    ).and.returnValue(0);
    spyOn(
      localStorageService,
      'saveContributorDashboardTranslationTutorialProgress'
    );
    spyOn(
      translationLanguageService,
      'setActiveLanguageCode'
    ).and.callThrough();
    spyOn(translationTopicService, 'setActiveTopicName').and.callThrough();

    let userInfo = {
      isLoggedIn: () => true,
      getUsername: () => 'username1',
    };

    getUserInfoAsyncSpy = spyOn(userService, 'getUserInfoAsync');
    getUserInfoAsyncSpy.and.returnValue(Promise.resolve(userInfo as UserInfo));
    spyOn(userService, 'getProfileImageDataUrl').and.returnValue([
      'default-image-url-png',
      'default-image-url-webp',
    ]);

    component.ngOnInit();
  });

  it('should set focus on select lang field', fakeAsync(() => {
    spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
      Promise.resolve(userContributionRights)
    );
    let focusSpy = spyOn(focusManagerService, 'setFocusWithoutScroll');

    component.onTabClick('translateTextTab');
    flush();

    expect(focusSpy).toHaveBeenCalled();
  }));

  it('should throw error if contribution rights is null', fakeAsync(() => {
    spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
      Promise.resolve(null)
    );
    expect(() => {
      component.ngOnInit();
      flush();
    }).toThrowError();
  }));

  it('should set default profile pictures when username is null', fakeAsync(() => {
    spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
      Promise.resolve(userContributionRights)
    );
    let userInfo = {
      isLoggedIn: () => true,
      getUsername: () => null,
    };

    getUserInfoAsyncSpy.and.returnValue(Promise.resolve(userInfo as UserInfo));

    component.ngOnInit();
    flush();

    expect(component.profilePicturePngDataUrl).toBe(
      urlInterpolationService.getStaticImageUrl(
        AppConstants.DEFAULT_PROFILE_IMAGE_PNG_PATH
      )
    );
    expect(component.profilePictureWebpDataUrl).toBe(
      urlInterpolationService.getStaticImageUrl(
        AppConstants.DEFAULT_PROFILE_IMAGE_WEBP_PATH
      )
    );
  }));

  it('should username equal to "" when user is not loggedIn', fakeAsync(() => {
    spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
      Promise.resolve(userContributionRights)
    );
    let userInfo = {
      isLoggedIn: () => false,
      getUsername: () => 'username1',
    };

    getUserInfoAsyncSpy.and.returnValue(Promise.resolve(userInfo as UserInfo));

    component.ngOnInit();
    flush();

    expect(component.username).toEqual('');
    expect(component.userIsLoggedIn).toBeFalse();
    expect(component.profilePicturePngDataUrl).toBe(
      urlInterpolationService.getStaticImageUrl(
        AppConstants.DEFAULT_PROFILE_IMAGE_PNG_PATH
      )
    );
    expect(component.profilePictureWebpDataUrl).toBe(
      urlInterpolationService.getStaticImageUrl(
        AppConstants.DEFAULT_PROFILE_IMAGE_WEBP_PATH
      )
    );
  }));

  describe('when user is logged in', () => {
    it('should set specific properties after ngOnInit is called', fakeAsync(() => {
      spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
        Promise.resolve(userContributionRights)
      );
      component.ngOnInit();
      flush();

      expect(component.topicName).toBe('Topic 1');
      expect(translationTopicService.setActiveTopicName).toHaveBeenCalled();
      expect(component.activeTabName).toBe('myContributionTab');
      expect(component.OPPIA_AVATAR_IMAGE_URL).toBe(
        '/assets/copyrighted-images/avatar/oppia_avatar_100px.svg'
      );
      expect(component.profilePicturePngDataUrl).toEqual(
        'default-image-url-png'
      );
      expect(component.profilePictureWebpDataUrl).toEqual(
        'default-image-url-webp'
      );
    }));

    it('should set active topic name as default when no topics are returned', fakeAsync(() => {
      spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
        Promise.resolve(userContributionRights)
      );
      getTranslatableTopicNamesAsyncSpy.and.returnValue(Promise.resolve([]));

      component.ngOnInit();
      flush();

      expect(component.topicName).toBeUndefined();
      expect(translationTopicService.setActiveTopicName).toHaveBeenCalled();
    }));

    it('should begin translation onboarding for a new contributor', fakeAsync(() => {
      spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
        Promise.resolve(userContributionRights)
      );
      flush();
      (
        localStorageService.hasSeenContributorDashboardTranslationOnboarding as jasmine.Spy
      ).and.returnValue(false);
      const modalSpy = spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.resolve('begin'),
      } as NgbModalRef);
      const markOnboardingAsSeenSpy = spyOn(
        localStorageService,
        'markContributorDashboardTranslationOnboardingAsSeen'
      );
      const startTourSpy = spyOn(joyride, 'startTour').and.callThrough();

      component.ngOnInit();
      flush();

      expect(component.activeTabName).toBe('translateTextTab');
      expect(component.showTranslationTutorialOpportunity).toBeTrue();
      expect(component.languageCode).toBe('es');
      expect(
        translationLanguageService.setActiveLanguageCode
      ).toHaveBeenCalledWith('es');
      expect(modalSpy).toHaveBeenCalledWith(
        TranslationOnboardingModalComponent,
        {
          backdrop: 'static',
          centered: true,
          keyboard: false,
          windowClass: 'oppia-translation-onboarding-modal-window',
        }
      );
      expect(markOnboardingAsSeenSpy).toHaveBeenCalledWith('username1');
      expect(startTourSpy).toHaveBeenCalledWith({
        steps: component.joyRideSteps,
        stepDefaultPosition: 'bottom',
        themeColor: '#1354a5',
      });
    }));

    it('should continue the translation tour from the opportunity step', fakeAsync(() => {
      const startTourSpy = spyOn(joyride, 'startTour').and.callThrough();

      component.translationTutorialProgressPercentage = 25;
      component.activeTabName = 'myContributionTab';
      component.replayTranslationTour();
      flush();

      expect(component.activeTabName).toBe('translateTextTab');
      expect(component.showTranslationTutorialOpportunity).toBeTrue();
      expect(startTourSpy).toHaveBeenCalledWith({
        steps: component.joyRideSteps,
        startWith: 'contributorDashboardTranslationOpportunity',
        stepDefaultPosition: 'bottom',
        themeColor: '#1354a5',
      });
    }));

    it('should continue the translation tour from the editor modal step', fakeAsync(() => {
      const openTranslationTutorialSpy = spyOn(
        component,
        'openTranslationTutorial'
      );

      component.translationTutorialProgressPercentage = 75;
      component.activeTabName = 'myContributionTab';
      component.replayTranslationTour();
      flush();

      expect(component.activeTabName).toBe('translateTextTab');
      expect(component.showTranslationTutorialOpportunity).toBeTrue();
      expect(openTranslationTutorialSpy).toHaveBeenCalledWith(
        'contributorDashboardTranslationCopyTool',
        4
      );
    }));

    it('should let contributors use the dashboard while the tour is open', () => {
      const backdropContainer = document.createElement('div');
      const backdropPart = document.createElement('div');
      backdropContainer.className = 'backdrop-container';
      backdropPart.className = 'joyride-backdrop';
      backdropContainer.appendChild(backdropPart);
      document.body.appendChild(backdropContainer);

      component.startTranslationTour();

      expect(backdropContainer.style.pointerEvents).toBe('none');
      expect(backdropPart.style.pointerEvents).toBe('none');

      backdropContainer.remove();
    });

    it('should replay the translation tour from My Contributions', fakeAsync(() => {
      const startTourSpy = spyOn(joyride, 'startTour').and.callThrough();

      component.activeTabName = 'myContributionTab';
      component.replayTranslationTour();
      flush();

      expect(component.activeTabName).toBe('translateTextTab');
      expect(component.showTranslationTutorialOpportunity).toBeTrue();
      expect(component.languageCode).toBe('es');
      expect(
        translationLanguageService.setActiveLanguageCode
      ).toHaveBeenCalledWith('es');
      expect(startTourSpy).toHaveBeenCalledWith({
        steps: component.joyRideSteps,
        stepDefaultPosition: 'bottom',
        themeColor: '#1354a5',
      });
    }));

    it('should open the tutorial translation and highlight its editor', fakeAsync(() => {
      const modalRef = {
        componentInstance: {
          tutorialEditorReady: new EventEmitter<void>(),
          tutorialProgressChange: new EventEmitter<number>(),
        },
        result: Promise.resolve(),
      } as NgbModalRef;
      const modalSpy = spyOn(ngbModal, 'open').and.returnValue(modalRef);
      const startTourSpy = spyOn(joyride, 'startTour').and.callThrough();

      component.openTranslationTutorial();

      expect(modalSpy).toHaveBeenCalledWith(TranslationModalComponent, {
        size: 'lg',
        backdrop: 'static',
        injector: jasmine.any(Object),
        backdropClass: 'forced-modal-stack',
        windowClass: 'forced-modal-stack',
      });
      expect(modalRef.componentInstance.opportunity).toBe(
        component.TRANSLATION_TUTORIAL_MODAL_OPPORTUNITY
      );
      expect(modalRef.componentInstance.isTranslationTutorial).toBeTrue();
      expect(
        modalRef.componentInstance.initialTranslationTutorialStepNumber
      ).toBe(3);
      expect(component.translationEditorJoyRideSteps).toEqual([
        'contributorDashboardTranslationOpportunity',
        'contributorDashboardTranslationEditor',
        'contributorDashboardTranslationCopyTool',
        'contributorDashboardTranslationSubmit',
      ]);

      modalRef.componentInstance.tutorialEditorReady.emit();
      flush();

      expect(startTourSpy).toHaveBeenCalledWith({
        steps: component.translationEditorJoyRideSteps,
        startWith: 'contributorDashboardTranslationEditor',
        stepDefaultPosition: 'right',
        themeColor: '#1354a5',
      });

      modalRef.componentInstance.tutorialProgressChange.emit(3);
      flush();

      expect(
        component.TRANSLATION_TUTORIAL_OPPORTUNITY.progressPercentage
      ).toBe(50);
      expect(component.TRANSLATION_TUTORIAL_OPPORTUNITY.translationsCount).toBe(
        50
      );
      expect(
        component.TRANSLATION_TUTORIAL_MODAL_OPPORTUNITY.progressPercentage
      ).toBe('50');
    }));

    it('should show the completion modal when tutorial is completed', fakeAsync(() => {
      const tutorialModalRef = {
        componentInstance: {
          tutorialEditorReady: new EventEmitter<void>(),
          tutorialProgressChange: new EventEmitter<number>(),
        },
        result: Promise.resolve('translationTutorialComplete'),
      } as NgbModalRef;
      const completionModalRef = {
        componentInstance: {},
        result: Promise.resolve(),
      } as NgbModalRef;
      const modalSpy = spyOn(ngbModal, 'open').and.returnValues(
        tutorialModalRef,
        completionModalRef
      );
      const closeTourSpy = spyOn(joyride, 'closeTour');

      component.openTranslationTutorial();
      flush();

      expect(closeTourSpy).toHaveBeenCalled();
      expect(modalSpy).toHaveBeenCalledWith(
        TranslationTutorialCompletionModalComponent,
        {
          backdrop: 'static',
          centered: true,
          keyboard: false,
          windowClass: 'oppia-translation-tutorial-completion-modal-window',
        }
      );
      expect(
        component.TRANSLATION_TUTORIAL_OPPORTUNITY.progressPercentage
      ).toBe(100);
      expect(component.TRANSLATION_TUTORIAL_OPPORTUNITY.translationsCount).toBe(
        100
      );
    }));

    it('should display the editor tour above the translation modal', () => {
      const backdropContainer = document.createElement('div');
      const editorTourPopup = document.createElement('div');
      const copyToolTourPopup = document.createElement('div');
      const submitTourPopup = document.createElement('div');
      backdropContainer.className = 'backdrop-container';
      editorTourPopup.id = 'joyride-step-contributorDashboardTranslationEditor';
      copyToolTourPopup.id =
        'joyride-step-contributorDashboardTranslationCopyTool';
      submitTourPopup.id = 'joyride-step-contributorDashboardTranslationSubmit';
      document.body.appendChild(backdropContainer);
      document.body.appendChild(editorTourPopup);
      document.body.appendChild(copyToolTourPopup);
      document.body.appendChild(submitTourPopup);

      component.startTranslationEditorTour();

      expect(backdropContainer.style.zIndex).toBe('1060');
      expect(editorTourPopup.style.zIndex).toBe('1061');
      expect(copyToolTourPopup.style.zIndex).toBe('1061');
      expect(submitTourPopup.style.zIndex).toBe('1061');

      backdropContainer.remove();
      editorTourPopup.remove();
      copyToolTourPopup.remove();
      submitTourPopup.remove();
    });

    it('should close the translation tour using Joyride', () => {
      const closeTourSpy = spyOn(joyride, 'closeTour');

      component.closeTranslationTour();

      expect(closeTourSpy).toHaveBeenCalled();
    });

    it('should show a confirmation when a contributor skips the tour', fakeAsync(() => {
      spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
        Promise.resolve(userContributionRights)
      );
      flush();
      (
        localStorageService.hasSeenContributorDashboardTranslationOnboarding as jasmine.Spy
      ).and.returnValue(false);
      const modalSpy = spyOn(ngbModal, 'open').and.returnValues(
        {
          result: Promise.reject('skip'),
        } as NgbModalRef,
        {
          result: Promise.resolve(false),
        } as NgbModalRef
      );

      component.ngOnInit();
      flush();

      expect(modalSpy).toHaveBeenCalledWith(
        TranslationOnboardingSkipConfirmationModalComponent,
        {
          backdrop: 'static',
          centered: true,
          keyboard: false,
          windowClass: 'oppia-translation-skip-confirmation-modal-window',
        }
      );
    }));

    it('should remember a confirmed skip when requested', fakeAsync(() => {
      spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
        Promise.resolve(userContributionRights)
      );
      flush();
      (
        localStorageService.hasSeenContributorDashboardTranslationOnboarding as jasmine.Spy
      ).and.returnValue(false);
      spyOn(ngbModal, 'open').and.returnValues(
        {
          result: Promise.reject('skip'),
        } as NgbModalRef,
        {
          result: Promise.resolve(true),
        } as NgbModalRef
      );
      const markOnboardingAsSeenSpy = spyOn(
        localStorageService,
        'markContributorDashboardTranslationOnboardingAsSeen'
      );

      component.ngOnInit();
      flush();

      expect(markOnboardingAsSeenSpy).toHaveBeenCalledWith('username1');
    }));

    it('should allow the skip prompt to be shown on a later visit', fakeAsync(() => {
      spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
        Promise.resolve(userContributionRights)
      );
      flush();
      (
        localStorageService.hasSeenContributorDashboardTranslationOnboarding as jasmine.Spy
      ).and.returnValue(false);
      spyOn(ngbModal, 'open').and.returnValues(
        {
          result: Promise.reject('skip'),
        } as NgbModalRef,
        {
          result: Promise.resolve(false),
        } as NgbModalRef
      );
      const markOnboardingAsSeenSpy = spyOn(
        localStorageService,
        'markContributorDashboardTranslationOnboardingAsSeen'
      );

      component.ngOnInit();
      flush();

      expect(markOnboardingAsSeenSpy).not.toHaveBeenCalled();
    }));

    it('should show onboarding again when skipping is cancelled', fakeAsync(() => {
      spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
        Promise.resolve(userContributionRights)
      );
      flush();
      (
        localStorageService.hasSeenContributorDashboardTranslationOnboarding as jasmine.Spy
      ).and.returnValue(false);
      const modalSpy = spyOn(ngbModal, 'open').and.returnValues(
        {
          result: Promise.reject('skip'),
        } as NgbModalRef,
        {
          result: Promise.reject('cancel'),
        } as NgbModalRef,
        {
          result: Promise.resolve('begin'),
        } as NgbModalRef
      );

      component.ngOnInit();
      flush();

      expect(modalSpy.calls.count()).toBe(3);
      expect(modalSpy.calls.argsFor(2)[0]).toBe(
        TranslationOnboardingModalComponent
      );
    }));

    it('should not show translation onboarding when it has been seen', fakeAsync(() => {
      spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
        Promise.resolve(userContributionRights)
      );
      const modalSpy = spyOn(ngbModal, 'open');

      component.ngOnInit();
      flush();

      expect(modalSpy).not.toHaveBeenCalled();
      expect(component.activeTabName).toBe('myContributionTab');
    }));

    it('should return language description in kebab case format', () => {
      spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
        Promise.resolve(userContributionRights)
      );
      let languageDescription = 'Deutsch (German)';

      expect(
        component.provideLanguageForProtractorClass(languageDescription)
      ).toEqual('deutsch-german');
    });

    it(
      'should initialize component properties after component is initialized' +
        ' and get data from backend',
      () => {
        spyOn(
          userService,
          'getUserContributionRightsDataAsync'
        ).and.returnValue(Promise.resolve(userContributionRights));
        expect(component.userIsLoggedIn).toBe(false);
        expect(component.username).toBe('');
        expect(component.userCanReviewQuestions).toBe(false);
        expect(component.userIsReviewer).toBe(false);
      }
    );

    it('should change active tab name when clicking on translate text tab', () => {
      spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
        Promise.resolve(userContributionRights)
      );
      let changedTab = 'translateTextTab';
      expect(component.activeTabName).toBe('myContributionTab');
      component.onTabClick(changedTab);
      expect(component.activeTabName).toBe(changedTab);
    });

    it('should change active language when clicking on language selector', () => {
      spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
        Promise.resolve(userContributionRights)
      );
      spyOn(
        localStorageService,
        'updateLastSelectedTranslationLanguageCode'
      ).and.callThrough();

      component.onChangeLanguage('hi');

      expect(
        translationLanguageService.setActiveLanguageCode
      ).toHaveBeenCalledWith('hi');
      expect(
        localStorageService.updateLastSelectedTranslationLanguageCode
      ).toHaveBeenCalledWith('hi');
    });

    it('should show language selector based on active tab', () => {
      spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
        Promise.resolve(userContributionRights)
      );
      let changedTab = 'translateTextTab';

      expect(component.activeTabName).toBe('myContributionTab');
      expect(component.showLanguageSelector()).toBe(false);

      component.onTabClick(changedTab);
      expect(component.activeTabName).toBe(changedTab);
      expect(component.showLanguageSelector()).toBe(true);
    });

    it('should change active topic when clicking on topic selector', () => {
      spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
        Promise.resolve(userContributionRights)
      );
      spyOn(
        localStorageService,
        'updateLastSelectedTranslationTopicName'
      ).and.callThrough();

      component.onChangeTopic('Topic 2');

      expect(translationTopicService.setActiveTopicName).toHaveBeenCalledWith(
        'Topic 2'
      );
      expect(
        localStorageService.updateLastSelectedTranslationTopicName
      ).toHaveBeenCalledWith('Topic 2');
    });

    it('should show topic selector based on active tab', () => {
      spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
        Promise.resolve(userContributionRights)
      );
      let changedTab = 'translateTextTab';

      expect(component.activeTabName).toBe('myContributionTab');
      expect(component.showLanguageSelector()).toBe(false);

      component.onTabClick(changedTab);
      expect(component.activeTabName).toBe(changedTab);
      expect(component.showTopicSelector()).toBe(true);
    });

    it('should show topic selector for questions reviews', () => {
      spyOn(userService, 'getUserContributionRightsDataAsync').and.returnValue(
        Promise.resolve(userContributionRights)
      );
      spyOn(
        contributionAndReviewService,
        'getActiveSuggestionType'
      ).and.returnValue('add_question');
      spyOn(contributionAndReviewService, 'getActiveTabType').and.returnValue(
        'reviews'
      );
      let changedTab = 'myContributionTab';

      component.onTabClick(changedTab);
      expect(component.activeTabName).toBe(changedTab);
      expect(component.showTopicSelector()).toBe(true);
    });
  });
});
