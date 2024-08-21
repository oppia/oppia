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
 * @fileoverview Unit tests for editorNavigation.
 */

import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  discardPeriodicTasks,
  fakeAsync,
  flush,
  flushMicrotasks,
  TestBed,
  tick,
} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {Subscription} from 'rxjs';
import {NgbModal, NgbModalRef, NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {RouterService} from '../services/router.service';
import {UserService} from 'services/user.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {ChangeListService} from '../services/change-list.service';
import {HelpModalComponent} from '../modal-templates/help-modal.component';
import {ContextService} from 'services/context.service';
import {ExplorationFeaturesService} from 'services/exploration-features.service';
import {ExplorationImprovementsService} from 'services/exploration-improvements.service';
import {InternetConnectivityService} from 'services/internet-connectivity.service';
import {ThreadDataBackendApiService} from '../feedback-tab/services/thread-data-backend-api.service';
import {ExplorationWarningsService} from '../services/exploration-warnings.service';
import {StateTutorialFirstTimeService} from '../services/state-tutorial-first-time.service';
import {ExplorationRightsService} from '../services/exploration-rights.service';
import {EditabilityService} from 'services/editability.service';
import {ExplorationSaveService} from '../services/exploration-save.service';
import {EditorNavigationComponent} from './editor-navigation.component';
import {UserInfo} from 'domain/user/user-info.model';
import {UserExplorationPermissionsService} from '../services/user-exploration-permissions.service';

describe('Editor Navigation Component', () => {
  let component: EditorNavigationComponent;
  let fixture: ComponentFixture<EditorNavigationComponent>;
  let contextService: ContextService;
  let explorationFeaturesService: ExplorationFeaturesService;
  let explorationImprovementsService: ExplorationImprovementsService;
  let explorationWarningsService: ExplorationWarningsService;
  let stateTutorialFirstTimeService: StateTutorialFirstTimeService;
  let threadDataBackendApiService: ThreadDataBackendApiService;
  let routerService: RouterService;
  let windowDimensionsService: WindowDimensionsService;
  let ngbModal: NgbModal;
  let explorationRightsService: ExplorationRightsService;
  let editabilityService: EditabilityService;
  let explorationSaveService: ExplorationSaveService;
  let changeListService: ChangeListService;
  let mockOpenPostTutorialHelpPopover = new EventEmitter();
  let mockGetResizeEvent = new EventEmitter();
  let mockConnectionServiceEmitter = new EventEmitter<boolean>();
  let testSubscriptions: Subscription;

  const openEditorTutorialSpy = jasmine.createSpy('openEditorTutorial');
  const openTranslationTutorialSpy = jasmine.createSpy(
    'openTranslationTutorial'
  );

  let explorationId = 'exp1';
  let isImprovementsTabEnabledAsyncSpy: jasmine.Spy;

  class MockInternetConnectivityService {
    onInternetStateChange = mockConnectionServiceEmitter;

    isOnline(): boolean {
      return true;
    }
  }

  class MockUserService {
    getUserInfoAsync(): Promise<UserInfo> {
      return Promise.resolve({
        isLoggedIn: () => true,
      } as UserInfo);
    }
  }

  class MockStateTutorialFirstTimeService {
    onOpenPostTutorialHelpPopover = mockOpenPostTutorialHelpPopover;
    onOpenTranslationTutorial = new EventEmitter();
    onOpenEditorTutorial = new EventEmitter();
  }

  class MockWindowDimensionsService {
    getResizeEvent() {
      return mockGetResizeEvent;
    }

    getWidth() {
      return 1200;
    }
  }

  class MockNgbModalRef {
    componentInstance = {};
  }

  class MockNgbModal {
    open() {
      return {
        result: Promise.resolve(),
      };
    }
  }

  class MockUserExplorationPermissionsService {
    getPermissionsAsync() {
      return Promise.resolve({
        canPublish: true,
      });
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, NgbModule],
      declarations: [EditorNavigationComponent, HelpModalComponent],
      providers: [
        ChangeListService,
        RouterService,
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
        {
          provide: UserExplorationPermissionsService,
          useClass: MockUserExplorationPermissionsService,
        },
        {
          provide: InternetConnectivityService,
          useClass: MockInternetConnectivityService,
        },
        {
          provide: UserService,
          useClass: MockUserService,
        },
        {
          provide: StateTutorialFirstTimeService,
          useClass: MockStateTutorialFirstTimeService,
        },
        {
          provide: WindowDimensionsService,
          useClass: MockWindowDimensionsService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
  });

  beforeEach(() => {
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    changeListService = TestBed.inject(ChangeListService);
    ngbModal = TestBed.inject(NgbModal);
    routerService = TestBed.inject(RouterService);

    fixture = TestBed.createComponent(EditorNavigationComponent);
    component = fixture.componentInstance;

    component.ngOnInit();
  });

  afterEach(() => {
    // This will destroy the fixture once the test gone end
    // this is going to makesure that each testcase is going
    // to run independent of another test case.
    fixture.destroy();
  });

  describe('when screen is large', () => {
    beforeEach(() => {
      contextService = TestBed.inject(ContextService);
      explorationRightsService = TestBed.inject(ExplorationRightsService);
      explorationSaveService = TestBed.inject(ExplorationSaveService);
      editabilityService = TestBed.inject(EditabilityService);
      explorationFeaturesService = TestBed.inject(ExplorationFeaturesService);
      explorationImprovementsService = TestBed.inject(
        ExplorationImprovementsService
      );
      explorationWarningsService = TestBed.inject(ExplorationWarningsService);
      threadDataBackendApiService = TestBed.inject(ThreadDataBackendApiService);
      stateTutorialFirstTimeService = TestBed.inject(
        StateTutorialFirstTimeService
      );

      spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);

      isImprovementsTabEnabledAsyncSpy = spyOn(
        explorationImprovementsService,
        'isImprovementsTabEnabledAsync'
      );

      isImprovementsTabEnabledAsyncSpy.and.returnValue(Promise.resolve(false));
    });

    beforeEach(() => {
      testSubscriptions = new Subscription();
      testSubscriptions.add(
        stateTutorialFirstTimeService.onOpenTranslationTutorial.subscribe(
          openTranslationTutorialSpy
        )
      );
      testSubscriptions.add(
        stateTutorialFirstTimeService.onOpenEditorTutorial.subscribe(
          openEditorTutorialSpy
        )
      );
    });

    afterEach(() => {
      testSubscriptions.unsubscribe();
      component.ngOnDestroy();
    });

    it('should initialize component properties after controller is initialized', () => {
      spyOn(explorationRightsService, 'isPrivate').and.returnValue(true);
      component.postTutorialHelpPopoverIsShown = false;
      component.userIsLoggedIn = true;
      component.improvementsTabIsEnabled = false;
      component.isPublishButtonEnabled = true;

      expect(component.isPostTutorialHelpPopoverShown()).toBe(false);
      expect(component.isUserLoggedIn()).toBe(true);
      expect(component.isImprovementsTabEnabled()).toBe(false);
      expect(component.showPublishButton()).toEqual(true);
    });

    it('should get warnings whenever has one', () => {
      let warnings = [
        {
          type: 'ERROR',
        },
        {
          type: 'CRITICAL',
        },
      ];
      spyOn(explorationWarningsService, 'getWarnings').and.returnValue(
        warnings
      );
      spyOn(explorationWarningsService, 'countWarnings').and.returnValue(
        warnings.length
      );
      component.isScreenLarge();

      expect(component.countWarnings()).toBe(2);
      expect(component.getWarnings()).toEqual(warnings);
      expect(component.hasCriticalWarnings()).toBe(false);
    });

    it(
      'should open editor tutorial after closing user help modal with mode' +
        'editor',
      () => {
        spyOn(ngbModal, 'open').and.returnValue({
          componentInstance: new MockNgbModalRef(),
          result: Promise.resolve('editor'),
        } as NgbModalRef);

        component.showUserHelpModal();

        expect(ngbModal.open).toHaveBeenCalled();
      }
    );

    it(
      'should open editor tutorial after closing user help modal with mode' +
        'translation',
      () => {
        spyOn(ngbModal, 'open').and.returnValue({
          componentInstance: new MockNgbModalRef(),
          result: Promise.resolve('translation'),
        } as NgbModalRef);

        component.showUserHelpModal();

        expect(ngbModal.open).toHaveBeenCalled();
      }
    );

    it('should return if exploration is private', () => {
      spyOn(explorationRightsService, 'isPrivate').and.returnValue(true);
      expect(component.isPrivate()).toEqual(true);
    });

    it('should return if exploration is locked for editing', () => {
      spyOn(changeListService, 'isExplorationLockedForEditing').and.returnValue(
        true
      );
      expect(component.isExplorationLockedForEditing()).toEqual(true);
    });

    it('should return if exploration is editable outside tutorial mode', () => {
      spyOn(
        editabilityService,
        'isEditableOutsideTutorialMode'
      ).and.returnValue(true);
      spyOn(editabilityService, 'isTranslatable').and.returnValue(true);
      expect(component.isEditableOutsideTutorialMode()).toEqual(true);
    });

    it('should update autosaveIsInProgress when autosaveInProgressEventEmitter emits true', () => {
      spyOn(
        changeListService.autosaveInProgressEventEmitter,
        'subscribe'
      ).and.callFake((callback: (autosaveInProgress: boolean) => void) => {
        callback(true);
      });
      component.ngOnInit();
      expect(component.autosaveIsInProgress).toBe(true);
    });

    it('should update autosaveIsInProgress when autosaveInProgressEventEmitter emits false', () => {
      spyOn(
        changeListService.autosaveInProgressEventEmitter,
        'subscribe'
      ).and.callFake((callback: (autosaveInProgress: boolean) => void) => {
        callback(false);
      });
      component.ngOnInit();
      expect(component.autosaveIsInProgress).toBe(false);
    });

    it('should call exploration save service to discard changes', () => {
      let explorationSpy = spyOn(explorationSaveService, 'discardChanges');
      component.discardChanges();
      expect(explorationSpy).toHaveBeenCalled();
    });

    it('should call exploration save service to save changes', () => {
      let deferred = Promise.resolve();
      let explorationSpy = spyOn(
        explorationSaveService,
        'saveChangesAsync'
      ).and.returnValue(deferred);
      component.saveChanges();

      expect(explorationSpy).toHaveBeenCalled();
    });

    it('should show/hide the loading dots', () => {
      component.showLoadingDots();
      expect(component.loadingDotsAreShown).toEqual(true);
      component.hideLoadingDots();
      expect(component.loadingDotsAreShown).toEqual(false);
    });

    it('should return if exploration is saveable', () => {
      spyOn(explorationSaveService, 'isExplorationSaveable').and.returnValue(
        true
      );
      expect(component.isExplorationSaveable()).toEqual(true);
    });

    it('should toggle mobile nav options', () => {
      component.mobileNavOptionsAreShown = false;
      component.toggleMobileNavOptions();
      expect(component.mobileNavOptionsAreShown).toEqual(true);
      component.toggleMobileNavOptions();
      expect(component.mobileNavOptionsAreShown).toEqual(false);
    });

    it('should return the number of changes', () => {
      spyOn(changeListService, 'getChangeList').and.returnValue([]);
      expect(component.getChangeListLength()).toEqual(0);
    });

    it('should hide loading dots after publishing the exploration', fakeAsync(() => {
      component.loadingDotsAreShown = true;
      let deferred = Promise.resolve();
      spyOn(
        explorationSaveService,
        'showPublishExplorationModal'
      ).and.returnValue(deferred);

      component.showPublishExplorationModal();
      tick();

      expect(component.loadingDotsAreShown).toEqual(false);
    }));

    it('should navigate to main tab when clicking on tab', () => {
      spyOn(routerService, 'getActiveTabName').and.returnValue('main');

      component.selectMainTab('');

      expect(component.getActiveTabName()).toBe('main');
    });

    it('should navigate to translation tab when clicking on tab', () => {
      spyOn(routerService, 'getActiveTabName').and.returnValue('translation');

      component.selectTranslationTab();

      expect(component.getActiveTabName()).toBe('translation');
    });

    it('should navigate to preview tab when clicking on tab', fakeAsync(() => {
      spyOn(routerService, 'getActiveTabName').and.returnValue('preview');

      component.selectPreviewTab();

      tick();
      flush();
      discardPeriodicTasks();

      expect(component.getActiveTabName()).toBe('preview');
    }));

    it('should navigate to settings tab when clicking on tab', () => {
      spyOn(routerService, 'getActiveTabName').and.returnValue('settings');

      component.selectSettingsTab();

      expect(component.getActiveTabName()).toBe('settings');
    });

    it('should navigate to stats tab when clicking on tab', () => {
      spyOn(routerService, 'getActiveTabName').and.returnValue('stats');

      component.selectStatsTab();

      expect(component.getActiveTabName()).toBe('stats');
    });

    it('should navigate to improvements tab when clicking on tab', () => {
      spyOn(routerService, 'getActiveTabName').and.returnValue('improvements');

      spyOn(explorationFeaturesService, 'isInitialized').and.returnValue(true);
      isImprovementsTabEnabledAsyncSpy.and.returnValue(Promise.resolve(true));
      component.selectImprovementsTab();

      expect(component.getActiveTabName()).toBe('improvements');
    });

    it('should navigate to history tab when clicking on tab', () => {
      spyOn(routerService, 'getActiveTabName').and.returnValue('history');

      component.selectHistoryTab();

      expect(component.getActiveTabName()).toBe('history');
    });

    it('should navigate to feedback tab when clicking on tab', () => {
      spyOn(routerService, 'getActiveTabName').and.returnValue('feedback');

      component.selectFeedbackTab();

      expect(component.getActiveTabName()).toBe('feedback');
    });

    it('should get open thread count', () => {
      spyOn(threadDataBackendApiService, 'getOpenThreadsCount').and.returnValue(
        5
      );
      mockOpenPostTutorialHelpPopover.emit();

      expect(component.getOpenThreadsCount()).toBe(5);
    });

    it('should toggle post tutorial help popover when resizing page', fakeAsync(() => {
      mockGetResizeEvent.emit(new Event('resize'));
      mockOpenPostTutorialHelpPopover.emit();

      expect(component.postTutorialHelpPopoverIsShown).toBe(true);

      tick();
      flush();
      flushMicrotasks();

      expect(component.postTutorialHelpPopoverIsShown).toBe(false);
    }));

    it('should toggle post tutorial help popover when resizing page', fakeAsync(() => {
      spyOn(windowDimensionsService, 'getWidth').and.returnValue(10);

      mockGetResizeEvent.emit(new Event('resize'));
      mockOpenPostTutorialHelpPopover.emit();

      expect(component.postTutorialHelpPopoverIsShown).toBe(false);
    }));

    it('should change connnection status to ONLINE when internet is connected', () => {
      component.connectedToInternet = false;
      mockConnectionServiceEmitter.emit(true);

      expect(component.connectedToInternet).toBe(true);
    });

    it('should change connnection status to OFFLINE when internet disconnects', fakeAsync(() => {
      component.connectedToInternet = true;
      mockConnectionServiceEmitter.emit(false);

      tick();

      expect(component.connectedToInternet).toBe(false);
    }));
  });
});
