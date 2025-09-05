// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for new lesson player sidebar component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {LessonPlayerSidebarComponent} from './lesson-player-sidebar.component';
import {NO_ERRORS_SCHEMA, Pipe} from '@angular/core';
import {MobileMenuService} from '../../services/mobile-menu.service';
import {I18nLanguageCodeService} from '../../../../services/i18n-language-code.service';
import {
  FetchExplorationBackendResponse,
  ReadOnlyExplorationBackendApiService,
} from '../../../../domain/exploration/read-only-exploration-backend-api.service';
import {UrlService} from '../../../../services/contextual/url.service';
import {BehaviorSubject} from 'rxjs';
import {MockTranslatePipe} from '../../../../tests/unit-test-utils';
import {TranslateService} from '@ngx-translate/core';
import {MockTranslateService} from '../../../../components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import {PageContextService} from '../../../../services/page-context.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {MatBottomSheet} from '@angular/material/bottom-sheet';
import {LearnerLocalNavBackendApiService} from '../../../../pages/exploration-player-page/services/learner-local-nav-backend-api.service';
import {AlertsService} from '../../../../services/alerts.service';
import {WindowDimensionsService} from '../../../../services/contextual/window-dimensions.service';
import {ShareLessonModalComponent} from './share-lesson-modal.component';
import {NewFlagExplorationModalComponent} from './flag-lesson-modal.component';
import {LessonFeedbackModalComponent} from './lesson-feedback-modal.component';
import {CustomizableThankYouModalComponent} from './customizable-thank-you-modal.component';
import {ConversationFlowService} from '../../services/conversation-flow.service';
import {of} from 'rxjs';

@Pipe({name: 'truncateAndCapitalize'})
class MockTruncteAndCapitalizePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

describe('LessonPlayerSidebarComponent', () => {
  let component: LessonPlayerSidebarComponent;
  let fixture: ComponentFixture<LessonPlayerSidebarComponent>;
  let mockMobileMenuService: Partial<MobileMenuService>;
  let pageContextService: PageContextService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService;
  let urlService: UrlService;
  let mockNgbModal: jasmine.SpyObj<NgbModal>;
  let mockBottomSheet: jasmine.SpyObj<MatBottomSheet>;
  let conversationFlowService: ConversationFlowService;
  let mockLearnerLocalNavBackendApiService: jasmine.SpyObj<LearnerLocalNavBackendApiService>;
  let mockAlertsService: jasmine.SpyObj<AlertsService>;
  let mockWindowDimensionsService: jasmine.SpyObj<WindowDimensionsService>;
  let visibilitySubject: BehaviorSubject<boolean>;

  beforeEach(waitForAsync(() => {
    visibilitySubject = new BehaviorSubject<boolean>(false);
    mockMobileMenuService = {
      getMenuVisibility: () => visibilitySubject.asObservable(),
      toggleMenuVisibility: jasmine.createSpy('toggleMenuVisibility'),
    };

    const ngbModalSpy = jasmine.createSpyObj('NgbModal', ['open']);
    const bottomSheetSpy = jasmine.createSpyObj('MatBottomSheet', ['open']);
    const learnerLocalNavSpy = jasmine.createSpyObj(
      'LearnerLocalNavBackendApiService',
      ['postReportAsync']
    );
    const alertsServiceSpy = jasmine.createSpyObj('AlertsService', [
      'addWarning',
    ]);
    const windowDimensionsServiceSpy = jasmine.createSpyObj(
      'WindowDimensionsService',
      ['getWidth']
    );

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        LessonPlayerSidebarComponent,
        MockTruncteAndCapitalizePipe,
        MockTranslatePipe,
      ],
      providers: [
        ReadOnlyExplorationBackendApiService,
        PageContextService,
        I18nLanguageCodeService,
        ConversationFlowService,
        UrlService,
        {
          provide: MobileMenuService,
          useValue: mockMobileMenuService,
        },
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
        {
          provide: NgbModal,
          useValue: ngbModalSpy,
        },
        {
          provide: MatBottomSheet,
          useValue: bottomSheetSpy,
        },
        {
          provide: LearnerLocalNavBackendApiService,
          useValue: learnerLocalNavSpy,
        },
        {
          provide: AlertsService,
          useValue: alertsServiceSpy,
        },
        {
          provide: WindowDimensionsService,
          useValue: windowDimensionsServiceSpy,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LessonPlayerSidebarComponent);
    component = fixture.componentInstance;
    pageContextService = TestBed.inject(PageContextService);
    conversationFlowService = TestBed.inject(ConversationFlowService);
    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService
    );
    urlService = TestBed.inject(UrlService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    mockNgbModal = TestBed.inject(NgbModal) as jasmine.SpyObj<NgbModal>;
    mockBottomSheet = TestBed.inject(
      MatBottomSheet
    ) as jasmine.SpyObj<MatBottomSheet>;
    mockLearnerLocalNavBackendApiService = TestBed.inject(
      LearnerLocalNavBackendApiService
    ) as jasmine.SpyObj<LearnerLocalNavBackendApiService>;
    mockAlertsService = TestBed.inject(
      AlertsService
    ) as jasmine.SpyObj<AlertsService>;
    mockWindowDimensionsService = TestBed.inject(
      WindowDimensionsService
    ) as jasmine.SpyObj<WindowDimensionsService>;
  });

  it('should initialize when component loads into view', fakeAsync(() => {
    let explorationId = 'expId';
    let explorationTitle = 'Exploration Title';
    let explorationObjective = 'Exploration Objective';

    spyOn(pageContextService, 'getExplorationId').and.returnValue(
      explorationId
    );
    spyOn(
      readOnlyExplorationBackendApiService,
      'fetchExplorationAsync'
    ).and.returnValue(
      Promise.resolve({
        exploration: {
          title: explorationTitle,
          objective: explorationObjective,
        },
      } as FetchExplorationBackendResponse)
    );
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
    spyOn(urlService, 'getPidFromUrl').and.returnValue('');
    spyOn(i18nLanguageCodeService, 'getExplorationTranslationKey');

    component.ngOnInit();
    tick();

    expect(urlService.getExplorationVersionFromUrl).toHaveBeenCalled();
    expect(urlService.getPidFromUrl).toHaveBeenCalled();
    expect(pageContextService.getExplorationId).toHaveBeenCalled();
    expect(
      readOnlyExplorationBackendApiService.fetchExplorationAsync
    ).toHaveBeenCalled();
    expect(
      i18nLanguageCodeService.getExplorationTranslationKey
    ).toHaveBeenCalled();
    expect(component.expDescription).toBe(explorationObjective);
    expect(component.explorationTitle).toBe(explorationTitle);
  }));

  it('should handle mobile menu visibility changes', () => {
    component.ngOnInit();
    expect(component.mobileMenuVisible).toBe(false);

    visibilitySubject.next(true);
    expect(component.mobileMenuVisible).toBe(true);

    visibilitySubject.next(false);
    expect(component.mobileMenuVisible).toBe(false);
  });

  it('should toggle sidebar', () => {
    component.sidebarIsExpanded = false;
    component.toggleSidebar();
    expect(component.sidebarIsExpanded).toBe(true);
    component.toggleSidebar();
    expect(component.sidebarIsExpanded).toBe(false);
  });

  it('should check if hacky exp desc translation is displayed', () => {
    spyOn(
      i18nLanguageCodeService,
      'isHackyTranslationAvailable'
    ).and.returnValue(true);
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageEnglish').and.returnValue(
      false
    );

    let hackyExpDescTranslationIsDisplayed =
      component.isHackyExpDescTranslationDisplayed();
    expect(hackyExpDescTranslationIsDisplayed).toBe(true);

    (
      i18nLanguageCodeService.isCurrentLanguageEnglish as jasmine.Spy
    ).and.returnValue(true);
    hackyExpDescTranslationIsDisplayed =
      component.isHackyExpDescTranslationDisplayed();
    expect(hackyExpDescTranslationIsDisplayed).toBe(false);

    (
      i18nLanguageCodeService.isHackyTranslationAvailable as jasmine.Spy
    ).and.returnValue(false);
    (
      i18nLanguageCodeService.isCurrentLanguageEnglish as jasmine.Spy
    ).and.returnValue(false);
    hackyExpDescTranslationIsDisplayed =
      component.isHackyExpDescTranslationDisplayed();
    expect(hackyExpDescTranslationIsDisplayed).toBe(false);
  });

  it('should show share lesson modal on mobile', () => {
    mockWindowDimensionsService.getWidth.and.returnValue(400);
    const mockBottomSheetRef = jasmine.createSpyObj('MatBottomSheetRef', [
      'afterDismissed',
    ]);
    mockBottomSheet.open.and.returnValue(mockBottomSheetRef);
    component.explorationTitle = 'Test Title';

    const result = component.showShareLessonModal();

    expect(mockBottomSheet.open).toHaveBeenCalledWith(
      ShareLessonModalComponent,
      {
        data: {
          explorationTitle: 'Test Title',
        },
      }
    );
    expect(result).toBe(mockBottomSheetRef);
  });

  it('should show share lesson modal on desktop', () => {
    mockWindowDimensionsService.getWidth.and.returnValue(800);
    const mockModalRef = jasmine.createSpyObj('NgbModalRef', [
      'componentInstance',
    ]);
    mockModalRef.componentInstance = {};
    mockNgbModal.open.and.returnValue(mockModalRef);
    component.explorationTitle = 'Test Title';

    const result = component.showShareLessonModal();

    expect(mockNgbModal.open).toHaveBeenCalledWith(ShareLessonModalComponent, {
      backdrop: 'static',
    });
    expect(mockModalRef.componentInstance.explorationTitle).toBe('Test Title');
    expect(result).toBe(mockModalRef);
  });

  it('should show flag exploration modal on mobile with successful report', fakeAsync(() => {
    mockWindowDimensionsService.getWidth.and.returnValue(400);
    const mockBottomSheetRef = jasmine.createSpyObj('MatBottomSheetRef', [
      'afterDismissed',
    ]);
    const mockResult = {reportType: 'spam'};
    mockBottomSheetRef.afterDismissed.and.returnValue(of(mockResult));
    mockBottomSheet.open.and.returnValue(mockBottomSheetRef);
    mockLearnerLocalNavBackendApiService.postReportAsync.and.returnValue(
      Promise.resolve()
    );
    spyOn(component, 'showThankYouModal');
    component.explorationId = 'testId';

    const result = component.showFlagExplorationModal();
    tick();

    expect(mockBottomSheet.open).toHaveBeenCalledWith(
      NewFlagExplorationModalComponent
    );
    expect(
      mockLearnerLocalNavBackendApiService.postReportAsync
    ).toHaveBeenCalledWith('testId', mockResult);
    expect(component.showThankYouModal).toHaveBeenCalledWith(
      'I18N_PLAYER_REPORT_SUCCESS_MODAL_BODY'
    );
    expect(result).toBe(mockBottomSheetRef);
  }));

  it('should show flag exploration modal on mobile with error', fakeAsync(() => {
    mockWindowDimensionsService.getWidth.and.returnValue(400);
    const mockBottomSheetRef = jasmine.createSpyObj('MatBottomSheetRef', [
      'afterDismissed',
    ]);
    const mockResult = {reportType: 'spam'};
    const errorMessage = 'Error occurred';
    mockBottomSheetRef.afterDismissed.and.returnValue(of(mockResult));
    mockBottomSheet.open.and.returnValue(mockBottomSheetRef);
    mockLearnerLocalNavBackendApiService.postReportAsync.and.returnValue(
      Promise.reject(errorMessage)
    );
    component.explorationId = 'testId';

    component.showFlagExplorationModal();
    tick();

    expect(mockAlertsService.addWarning).toHaveBeenCalledWith(errorMessage);
  }));

  it('should get is user logged in', () => {
    spyOn(conversationFlowService, 'getIsLoggedIn').and.returnValue(true);
    expect(component.isUserLoggedIn()).toBeTrue();
  });

  it('should show flag exploration modal on mobile with no result', () => {
    mockWindowDimensionsService.getWidth.and.returnValue(400);
    const mockBottomSheetRef = jasmine.createSpyObj('MatBottomSheetRef', [
      'afterDismissed',
    ]);
    mockBottomSheetRef.afterDismissed.and.returnValue(of(null));
    mockBottomSheet.open.and.returnValue(mockBottomSheetRef);

    component.showFlagExplorationModal();

    expect(
      mockLearnerLocalNavBackendApiService.postReportAsync
    ).not.toHaveBeenCalled();
  });

  it('should show flag exploration modal on desktop with successful report', fakeAsync(() => {
    mockWindowDimensionsService.getWidth.and.returnValue(800);
    const mockModalRef = jasmine.createSpyObj('NgbModalRef', ['result']);
    const mockResult = {reportType: 'spam'};
    mockModalRef.result = Promise.resolve(mockResult);
    mockNgbModal.open.and.returnValue(mockModalRef);
    mockLearnerLocalNavBackendApiService.postReportAsync.and.returnValue(
      Promise.resolve()
    );
    spyOn(component, 'showThankYouModal');
    component.explorationId = 'testId';

    const result = component.showFlagExplorationModal();
    tick();

    expect(mockNgbModal.open).toHaveBeenCalledWith(
      NewFlagExplorationModalComponent,
      {
        backdrop: 'static',
      }
    );
    expect(
      mockLearnerLocalNavBackendApiService.postReportAsync
    ).toHaveBeenCalledWith('testId', mockResult);
    expect(component.showThankYouModal).toHaveBeenCalledWith(
      'I18N_PLAYER_REPORT_SUCCESS_MODAL_BODY'
    );
    expect(result).toBe(mockModalRef);
  }));

  it('should show flag exploration modal on desktop with error', fakeAsync(() => {
    mockWindowDimensionsService.getWidth.and.returnValue(800);
    const mockModalRef = jasmine.createSpyObj('NgbModalRef', ['result']);
    const mockResult = {reportType: 'spam'};
    const errorMessage = 'Error occurred';
    mockModalRef.result = Promise.resolve(mockResult);
    mockNgbModal.open.and.returnValue(mockModalRef);
    mockLearnerLocalNavBackendApiService.postReportAsync.and.returnValue(
      Promise.reject(errorMessage)
    );
    spyOn(component, 'showThankYouModal');
    component.explorationId = 'testId';

    component.showFlagExplorationModal();
    tick();

    expect(mockAlertsService.addWarning).toHaveBeenCalledWith(errorMessage);
    expect(component.showThankYouModal).toHaveBeenCalledWith(
      'I18N_PLAYER_REPORT_SUCCESS_MODAL_BODY'
    );
  }));

  it('should show flag exploration modal on desktop with rejection', fakeAsync(() => {
    mockWindowDimensionsService.getWidth.and.returnValue(800);
    const mockModalRef = jasmine.createSpyObj('NgbModalRef', ['result']);
    mockModalRef.result = Promise.reject('dismissed');
    mockNgbModal.open.and.returnValue(mockModalRef);

    component.showFlagExplorationModal();
    tick();

    expect(
      mockLearnerLocalNavBackendApiService.postReportAsync
    ).not.toHaveBeenCalled();
  }));

  it('should show feedback modal on mobile', () => {
    mockWindowDimensionsService.getWidth.and.returnValue(400);
    const mockBottomSheetRef = jasmine.createSpyObj('MatBottomSheetRef', [
      'afterDismissed',
    ]);
    mockBottomSheetRef.afterDismissed.and.returnValue(of('success'));
    mockBottomSheet.open.and.returnValue(mockBottomSheetRef);
    spyOn(component, 'showThankYouModal');

    const result = component.showFeedbackModal();

    expect(mockBottomSheet.open).toHaveBeenCalledWith(
      LessonFeedbackModalComponent
    );
    expect(component.showThankYouModal).toHaveBeenCalledWith(
      'I18N_PLAYER_THANK_FEEDBACK'
    );
    expect(result).toBe(mockBottomSheetRef);
  });

  it('should show feedback modal on mobile with cancel', () => {
    mockWindowDimensionsService.getWidth.and.returnValue(400);
    const mockBottomSheetRef = jasmine.createSpyObj('MatBottomSheetRef', [
      'afterDismissed',
    ]);
    mockBottomSheetRef.afterDismissed.and.returnValue(of('cancel'));
    mockBottomSheet.open.and.returnValue(mockBottomSheetRef);
    spyOn(component, 'showThankYouModal');

    component.showFeedbackModal();

    expect(component.showThankYouModal).not.toHaveBeenCalled();
  });

  it('should show feedback modal on desktop', fakeAsync(() => {
    mockWindowDimensionsService.getWidth.and.returnValue(800);
    const mockModalRef = jasmine.createSpyObj('NgbModalRef', ['result']);
    mockModalRef.result = Promise.resolve('success');
    mockNgbModal.open.and.returnValue(mockModalRef);
    spyOn(component, 'showThankYouModal');

    const result = component.showFeedbackModal();
    tick();

    expect(mockNgbModal.open).toHaveBeenCalledWith(
      LessonFeedbackModalComponent,
      {
        backdrop: 'static',
      }
    );
    expect(component.showThankYouModal).toHaveBeenCalledWith(
      'I18N_PLAYER_THANK_FEEDBACK'
    );
    expect(result).toBe(mockModalRef);
  }));

  it('should show feedback modal on desktop with rejection', fakeAsync(() => {
    mockWindowDimensionsService.getWidth.and.returnValue(800);
    const mockModalRef = jasmine.createSpyObj('NgbModalRef', ['result']);
    mockModalRef.result = Promise.reject('dismissed');
    mockNgbModal.open.and.returnValue(mockModalRef);
    spyOn(component, 'showThankYouModal');

    component.showFeedbackModal();
    tick();

    expect(component.showThankYouModal).not.toHaveBeenCalled();
  }));

  it('should show thank you modal on mobile', () => {
    mockWindowDimensionsService.getWidth.and.returnValue(400);
    const mockBottomSheetRef = jasmine.createSpyObj('MatBottomSheetRef', [
      'afterDismissed',
    ]);
    mockBottomSheet.open.and.returnValue(mockBottomSheetRef);

    const result = component.showThankYouModal('TEST_I18N_KEY');

    expect(mockBottomSheet.open).toHaveBeenCalledWith(
      CustomizableThankYouModalComponent,
      {
        data: {
          modalMessageI18nKey: 'TEST_I18N_KEY',
        },
      }
    );
    expect(result).toBe(mockBottomSheetRef);
  });

  it('should show thank you modal on desktop', () => {
    mockWindowDimensionsService.getWidth.and.returnValue(800);
    const mockModalRef = jasmine.createSpyObj('NgbModalRef', [
      'componentInstance',
    ]);
    mockModalRef.componentInstance = {};
    mockNgbModal.open.and.returnValue(mockModalRef);

    const result = component.showThankYouModal('TEST_I18N_KEY');

    expect(mockNgbModal.open).toHaveBeenCalledWith(
      CustomizableThankYouModalComponent,
      {
        backdrop: true,
      }
    );
    expect(mockModalRef.componentInstance.modalMessageI18nKey).toBe(
      'TEST_I18N_KEY'
    );
    expect(result).toBe(mockModalRef);
  });

  it('should correctly identify mobile screen size', () => {
    mockWindowDimensionsService.getWidth.and.returnValue(400);
    expect(component.isMobileScreenSize()).toBe(true);

    mockWindowDimensionsService.getWidth.and.returnValue(800);
    expect(component.isMobileScreenSize()).toBe(false);

    mockWindowDimensionsService.getWidth.and.returnValue(480);
    expect(component.isMobileScreenSize()).toBe(false);

    mockWindowDimensionsService.getWidth.and.returnValue(479);
    expect(component.isMobileScreenSize()).toBe(true);
  });
});
