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
 * @fileoverview Unit tests for exploration editor page component.
 */

import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {
  TestBed,
  fakeAsync,
  flushMicrotasks,
  discardPeriodicTasks,
  tick,
  flush,
  ComponentFixture,
} from '@angular/core/testing';
import {BrowserDynamicTestingModule} from '@angular/platform-browser-dynamic/testing';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {StateEditorRefreshService} from 'pages/exploration-editor-page/services/state-editor-refresh.service';
import {UserExplorationPermissionsService} from 'pages/exploration-editor-page/services/user-exploration-permissions.service';
import {AlertsService} from 'services/alerts.service';
import {InternetConnectivityService} from 'services/internet-connectivity.service';
import {PageContextService} from 'services/page-context.service';
import {EditabilityService} from 'services/editability.service';
import {
  ExplorationFeatures,
  ExplorationFeaturesBackendApiService,
} from 'services/exploration-features-backend-api.service';
import {ExplorationFeaturesService} from 'services/exploration-features.service';
import {LoaderService} from 'services/loader.service';
import {PageTitleService} from 'services/page-title.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {StateTopAnswersStatsBackendApiService} from 'services/state-top-answers-stats-backend-api.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {LostChangesModalComponent} from './modal-templates/lost-changes-modal.component';
import {AutosaveInfoModalsService} from './services/autosave-info-modals.service';
import {ChangeListService} from './services/change-list.service';
import {ExplorationDataService} from './services/exploration-data.service';
import {UserInfo} from 'domain/user/user-info.model';
import {WelcomeModalComponent} from './modal-templates/welcome-modal.component';
import {HelpModalComponent} from './modal-templates/help-modal.component';
import {ExplorationImprovementsService} from 'services/exploration-improvements.service';
import {UserService} from 'services/user.service';
import {ExplorationEditorPageComponent} from './exploration-editor-page.component';
import {ThreadDataBackendApiService} from './feedback-tab/services/thread-data-backend-api.service';
import {ExplorationPropertyService} from './services/exploration-property.service';
import {ExplorationRightsService} from './services/exploration-rights.service';
import {ExplorationSaveService} from './services/exploration-save.service';
import {ExplorationStatesService} from './services/exploration-states.service';
import {ExplorationTitleService} from './services/exploration-title.service';
import {ExplorationWarningsService} from './services/exploration-warnings.service';
import {GraphDataService} from './services/graph-data.service';
import {RouterService} from './services/router.service';
import {StateTutorialFirstTimeService} from './services/state-tutorial-first-time.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ExplorationPermissions} from 'domain/exploration/exploration-permissions.model';
import {WindowRef} from 'services/contextual/window-ref.service';
import {ExplorationPermissionsBackendApiService} from 'domain/exploration/exploration-permissions-backend-api.service';
import {EntityTranslationsService} from 'services/entity-translations.services';
import {EntityTranslation} from 'domain/translation/entity-translation.model';
import {EntityVoiceoversService} from 'services/entity-voiceovers.services';
import {EntityBulkTranslationsBackendApiService} from './services/entity-bulk-translations-backend-api.service';
import {LanguageCodeToEntityTranslations} from '../../services/entity-translations.services';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {FeedbackPromptModalComponent} from './modal-templates/feedback-prompt-modal.component';

class MockNgbModalRef {
  componentInstance = {};
}

class MockNgbModal {
  open() {
    return {
      componentInstance: {},
      result: Promise.resolve(),
    };
  }
}

class MockPlatformFeatureService {
  status = {
    ExplorationEditorCanModifyTranslations: {
      isEnabled: false,
    },
    ShowVoiceoverTabForNonCuratedExplorations: {
      isEnabled: false,
    },
  };
}

describe('Exploration editor page component', () => {
  let component: ExplorationEditorPageComponent;
  let fixture: ComponentFixture<ExplorationEditorPageComponent>;
  let cls: ChangeListService;
  let as: AlertsService;
  let efbas: ExplorationFeaturesBackendApiService;
  let eis: ExplorationImprovementsService;
  let ers: ExplorationRightsService;
  let eps: ExplorationPropertyService;
  let ess: ExplorationStatesService;
  let esaves: ExplorationSaveService;
  let ets: ExplorationTitleService;
  let ews: ExplorationWarningsService;
  let gds: GraphDataService;
  let pts: PageTitleService;
  let rs: RouterService;
  let autosaveInfoModalsService: AutosaveInfoModalsService;
  let sas: SiteAnalyticsService;
  let sers: StateEditorRefreshService;
  let sts: StateTutorialFirstTimeService;
  let stfts: StateTutorialFirstTimeService;
  let tds: ThreadDataBackendApiService;
  let userService: UserService;
  let ueps: UserExplorationPermissionsService;
  let ics: InternetConnectivityService;
  let pageContextService: PageContextService;
  let mockEnterEditorForTheFirstTime: EventEmitter<void>;
  let registerAcceptTutorialModalEventSpy;
  let registerDeclineTutorialModalEventSpy;
  let focusManagerService: FocusManagerService;
  let explorationPermissionsBackendApiService: ExplorationPermissionsBackendApiService;
  let entityTranslationsService: EntityTranslationsService;
  let entityBulkTranslationsBackendApiService: EntityBulkTranslationsBackendApiService;
  let ngbModal: NgbModal;
  let refreshGraphEmitter = new EventEmitter<void>();
  let mockRefreshTranslationTabEventEmitter = new EventEmitter<void>();
  let autosaveIsInProgress = new EventEmitter<boolean>();
  let mockConnectionServiceEmitter = new EventEmitter<boolean>();
  let mockOpenEditorTutorialEmitter = new EventEmitter<void>();
  let mockOpenTranslationTutorialEmitter = new EventEmitter<void>();
  let mockInitExplorationPageEmitter = new EventEmitter<void>();
  let isLocationSetToNonStateEditorTabSpy;
  let mockPlatformFeatureService = new MockPlatformFeatureService();

  let explorationId = 'exp1';
  let explorationData = {
    exploration_is_linked_to_story: true,
    states: {
      Introduction: {
        param_changes: [],
        content: {
          html: '',
        },
        unresolved_answers: {},
        interaction: {
          customization_args: {},
          answer_groups: [],
          default_outcome: {
            param_changes: [],
            dest: 'Final',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'content_1',
              html: '',
            },
          },
          confirmed_unclassified_answers: [],
          id: null,
          hints: [],
        },
      },
      Final: {
        param_changes: [],
        content: {
          html: '',
          audio_translations: {},
        },
        unresolved_answers: {},
        interaction: {
          customization_args: {},
          answer_groups: [],
          default_outcome: {
            param_changes: [],
            dest: 'Final',
            dest_if_really_stuck: null,
            feedback: {
              html: '',
              audio_translations: {},
            },
          },
          confirmed_unclassified_answers: [],
          id: null,
          hints: [],
        },
      },
    },
    title: 'Exploration Title',
    category: 'Exploration Category',
    objective: 'Exploration Objective',
    language_code: 'en',
    init_state_name: 'Introduction',
    tags: [],
    param_specs: [],
    param_changes: [],
    auto_tts_enabled: {},
    edits_allowed: true,
    user: {},
    version: '1',
    rights: {},
    email_preferences: {},
    draft_changes: [{}, {}, {}],
    is_version_of_draft_valid: false,
    show_state_editor_tutorial_on_load: true,
    show_state_translation_tutorial_on_load: true,
  };

  class MockWindowRef {
    location = {path: '/create/2234'};
    nativeWindow = {
      scrollTo: (value1, value2) => {},
      sessionStorage: {
        promoIsDismissed: null,
        setItem: (testKey1, testKey2) => {},
        removeItem: testKey => {},
      },
      gtag: (value1, value2, value3) => {},
      navigator: {
        onLine: true,
        userAgent: null,
      },
      location: {
        path: '/create/2234',
        pathname: '/',
        hostname: 'oppiaserver.appspot.com',
        search: '',
        protocol: '',
        reload: () => {},
        hash: '',
        href: '',
      },
      document: {
        documentElement: {
          setAttribute: (value1, value2) => {},
          clientWidth: null,
          clientHeight: null,
        },
        body: {
          clientWidth: null,
          clientHeight: null,
          style: {
            overflowY: '',
          },
        },
      },
      addEventListener: (value1, value2) => {},
    };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        ExplorationEditorPageComponent,
        LostChangesModalComponent,
        WelcomeModalComponent,
        HelpModalComponent,
        FeedbackPromptModalComponent,
      ],
      providers: [
        ThreadDataBackendApiService,
        AlertsService,
        AutosaveInfoModalsService,
        ChangeListService,
        {
          provide: PageContextService,
          useValue: {
            getExplorationId: () => {
              return explorationId;
            },
            setExplorationIsLinkedToStory: () => {},
            setExplorationVersion: expVersion => {},
            isExplorationLinkedToStory: () => {},
          },
        },
        EditabilityService,
        ExplorationFeaturesBackendApiService,
        ExplorationFeaturesService,
        ExplorationWarningsService,
        InternetConnectivityService,
        PageTitleService,
        LoaderService,
        RouterService,
        SiteAnalyticsService,
        StateEditorRefreshService,
        StateEditorService,
        StateTopAnswersStatsBackendApiService,
        UserExplorationPermissionsService,
        UrlInterpolationService,
        FocusManagerService,
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService,
        },
        {
          provide: ExplorationDataService,
          useValue: {
            getDataAsync: callback => {
              callback();
              return Promise.resolve(explorationData);
            },
            autosaveChangeListAsync: () => {
              return;
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).overrideModule(BrowserDynamicTestingModule, {
      set: {
        entryComponents: [
          LostChangesModalComponent,
          WelcomeModalComponent,
          HelpModalComponent,
          FeedbackPromptModalComponent,
        ],
      },
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExplorationEditorPageComponent);
    component = fixture.componentInstance;
    const mockModalRef: Partial<NgbModalRef> = {
      componentInstance: {},
      result: Promise.resolve(),
    };

    spyOn(TestBed.inject(NgbModal), 'open').and.returnValue(
      mockModalRef as NgbModalRef
    );

    component.feedbackPromptModalData = {openThreadsCount: 0};

    cls = TestBed.inject(ChangeListService);
    as = TestBed.inject(AlertsService);
    ngbModal = TestBed.inject(NgbModal);
    efbas = TestBed.inject(ExplorationFeaturesBackendApiService);
    ics = TestBed.inject(InternetConnectivityService);
    eis = TestBed.inject(ExplorationImprovementsService);
    ers = TestBed.inject(ExplorationRightsService);
    eps = TestBed.inject(ExplorationPropertyService);
    ess = TestBed.inject(ExplorationStatesService);
    esaves = TestBed.inject(ExplorationSaveService);
    ets = TestBed.inject(ExplorationTitleService);
    ews = TestBed.inject(ExplorationWarningsService);
    gds = TestBed.inject(GraphDataService);
    pts = TestBed.inject(PageTitleService);
    rs = TestBed.inject(RouterService);
    sas = TestBed.inject(SiteAnalyticsService);
    sers = TestBed.inject(StateEditorRefreshService);
    sts = TestBed.inject(StateTutorialFirstTimeService);
    stfts = TestBed.inject(StateTutorialFirstTimeService);
    tds = TestBed.inject(ThreadDataBackendApiService);
    userService = TestBed.inject(UserService);
    autosaveInfoModalsService = TestBed.inject(AutosaveInfoModalsService);
    ueps = TestBed.inject(UserExplorationPermissionsService);
    focusManagerService = TestBed.inject(FocusManagerService);
    explorationPermissionsBackendApiService = TestBed.inject(
      ExplorationPermissionsBackendApiService
    );
    entityTranslationsService = TestBed.inject(EntityTranslationsService);
    entityBulkTranslationsBackendApiService = TestBed.inject(
      EntityBulkTranslationsBackendApiService
    );
    pageContextService = TestBed.inject(PageContextService);

    spyOn(tds, 'getOpenThreadsCount').and.returnValue(0);
    spyOn(tds, 'getFeedbackThreadsAsync').and.returnValue(Promise.resolve([]));
    spyOn(pts, 'setDocumentTitle').and.callThrough();

    isLocationSetToNonStateEditorTabSpy = spyOn(
      rs,
      'isLocationSetToNonStateEditorTab'
    );
    isLocationSetToNonStateEditorTabSpy.and.returnValue(null);

    spyOn(
      explorationPermissionsBackendApiService,
      'getPermissionsAsync'
    ).and.returnValue(
      Promise.resolve(
        new ExplorationPermissions(
          null,
          null,
          null,
          null,
          null,
          null,
          true,
          null
        )
      )
    );
    spyOn(autosaveInfoModalsService, 'showVersionMismatchModal').and.callFake(
      value => {}
    );
    spyOn(autosaveInfoModalsService, 'showLostChangesModal').and.stub();
    spyOn(autosaveInfoModalsService, 'isModalOpen').and.returnValue(false);

    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
    // This will destroy the fixture once the test gone end
    // this is going to makesure that each testcase is going
    // to run independent of another test case.
    fixture.destroy();
  });

  describe('when user permission is true and draft changes not valid', () => {
    beforeEach(() => {
      registerAcceptTutorialModalEventSpy = spyOn(
        sas,
        'registerAcceptTutorialModalEvent'
      );
      registerDeclineTutorialModalEventSpy = spyOn(
        sas,
        'registerDeclineTutorialModalEvent'
      );
      spyOn(efbas, 'fetchExplorationFeaturesAsync').and.returnValue(
        Promise.resolve({
          explorationIsCurated: null,
        } as ExplorationFeatures)
      );
      spyOn(eis, 'initAsync').and.returnValue(Promise.resolve());
      spyOn(eis, 'flushUpdatedTasksToBackend').and.returnValue(
        Promise.resolve()
      );
      spyOn(ews, 'updateWarnings').and.callThrough();
      spyOn(gds, 'recompute').and.callThrough();
      spyOn(ueps, 'getPermissionsAsync').and.returnValue(
        Promise.resolve({
          canEdit: true,
          canVoiceover: true,
        } as ExplorationPermissions)
      );
      spyOnProperty(rs, 'onRefreshTranslationTab').and.returnValue(
        mockRefreshTranslationTabEventEmitter
      );
      spyOn(cls, 'getChangeList').and.returnValue(null);
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve(
          new UserInfo(
            ['USER_ROLE'],
            true,
            true,
            false,
            false,
            false,
            null,
            null,
            null,
            false
          )
        )
      );
      spyOnProperty(stfts, 'onOpenEditorTutorial').and.returnValue(
        mockOpenEditorTutorialEmitter
      );
      spyOnProperty(stfts, 'onOpenTranslationTutorial').and.returnValue(
        mockOpenTranslationTutorialEmitter
      );
      (tds.getOpenThreadsCount as jasmine.Spy).and.returnValue(0);

      ets.init(explorationData.title);
      explorationData.is_version_of_draft_valid = false;
      explorationData.draft_changes = ['data1', 'data2'];

      component.ngOnInit();
    });

    afterEach(() => {
      component.ngOnDestroy();
    });

    it('should start editor tutorial when on main page', fakeAsync(() => {
      tds.countOfOpenFeedbackThreads = 2;
      isLocationSetToNonStateEditorTabSpy.and.returnValue(false);
      (tds.getOpenThreadsCount as jasmine.Spy).and.returnValue(2);
      spyOn(component, 'startEditorTutorial').and.callThrough();
      spyOn(sers.onRefreshStateEditor, 'emit');

      component.ngOnInit();
      tick();
      rs.navigateToMainTab(null);
      component.isWarningsAreShown(true);
      tick();

      mockOpenEditorTutorialEmitter.emit();
      expect(component.startEditorTutorial).toHaveBeenCalled();
      expect(sers.onRefreshStateEditor.emit).toHaveBeenCalled();

      flush();
      discardPeriodicTasks();
    }));

    it('should return the thread count', () => {
      tds.countOfOpenFeedbackThreads = 2;
      (tds.getOpenThreadsCount as jasmine.Spy).and.returnValue(2);
      component.hasCriticalWarnings();
      expect(component.getOpenThreadsCount()).toEqual(2);
    });

    it('should skip to main content', () => {
      const mockElement = document.createElement('div');
      mockElement.classList.add('exploration-editor-content');
      document.body.appendChild(mockElement);

      component.skipEditorNavbar();

      const focusedElement = document.activeElement as HTMLElement;
      expect(focusedElement.tabIndex).toBe(-1);
    });

    it('should start editor tutorial when not on main page', fakeAsync(() => {
      tds.countOfOpenFeedbackThreads = 2;
      (tds.getOpenThreadsCount as jasmine.Spy).and.returnValue(2);
      spyOn(component, 'startEditorTutorial').and.callThrough();
      spyOn(rs, 'navigateToMainTab');
      rs.navigateToSettingsTab();

      tick();

      expect(rs.getActiveTabName()).toBe('settings');
      mockOpenEditorTutorialEmitter.emit();
      expect(component.startEditorTutorial).toHaveBeenCalled();
      expect(rs.navigateToMainTab).toHaveBeenCalled();
    }));

    it('should start translation tutorial when on translation page', fakeAsync(() => {
      tds.countOfOpenFeedbackThreads = 2;
      (tds.getOpenThreadsCount as jasmine.Spy).and.returnValue(2);
      spyOn(component, 'startTranslationTutorial').and.callThrough();
      rs.navigateToTranslationTab();
      mockRefreshTranslationTabEventEmitter.emit();

      tick();

      mockOpenTranslationTutorialEmitter.emit();
      expect(component.startTranslationTutorial).toHaveBeenCalled();

      flush();
      discardPeriodicTasks();
    }));

    it('should start translation tutorial when not on translation page', fakeAsync(() => {
      tds.countOfOpenFeedbackThreads = 2;
      (tds.getOpenThreadsCount as jasmine.Spy).and.returnValue(2);
      spyOn(component, 'startTranslationTutorial').and.callThrough();
      spyOn(rs, 'navigateToTranslationTab');

      rs.navigateToSettingsTab();
      tick();
      mockOpenTranslationTutorialEmitter.emit();
      tick();

      expect(component.startTranslationTutorial).toHaveBeenCalled();
      expect(rs.navigateToTranslationTab).toHaveBeenCalled();

      flush();
      discardPeriodicTasks();
    }));

    it('should return navbar text', () => {
      expect(component.getNavbarText()).toEqual('Exploration Editor');
    });

    it('should return warning count, warnings list & critical warning', () => {
      spyOn(ews, 'countWarnings').and.returnValue(1);
      expect(component.countWarnings()).toEqual(1);
      spyOn(ews, 'getWarnings').and.returnValue([]);
      expect(component.getWarnings()).toEqual([]);
    });

    it('should return the thread count', () => {
      tds.countOfOpenFeedbackThreads = 2;
      (tds.getOpenThreadsCount as jasmine.Spy).and.returnValue(2);
      component.hasCriticalWarnings();
      expect(component.getOpenThreadsCount()).toEqual(2);
    });

    it('should navigate to main tab', fakeAsync(() => {
      tds.countOfOpenFeedbackThreads = 2;
      (tds.getOpenThreadsCount as jasmine.Spy).and.returnValue(0);
      isLocationSetToNonStateEditorTabSpy.and.returnValue(null);
      spyOn(rs, 'getCurrentStateFromLocationPath').and.returnValue(null);
      spyOn(rs, 'navigateToMainTab').and.callThrough();

      component.selectMainTab();
      component.initExplorationPage();
      tick();

      expect(rs.navigateToMainTab).toHaveBeenCalled();
      flush();
      discardPeriodicTasks();
    }));

    it('should navigate between tabs', () => {
      tds.countOfOpenFeedbackThreads = 2;
      (tds.getOpenThreadsCount as jasmine.Spy).and.returnValue(2);
      let focusSpy = spyOn(component, 'setFocusOnActiveTab');
      spyOn(rs, 'navigateToMainTab').and.stub();
      component.selectMainTab();
      expect(rs.navigateToMainTab).toHaveBeenCalled();

      spyOn(rs, 'navigateToTranslationTab').and.stub();
      component.selectTranslationTab();
      expect(rs.navigateToTranslationTab).toHaveBeenCalled();

      spyOn(rs, 'navigateToPreviewTab').and.stub();
      component.selectPreviewTab();
      expect(rs.navigateToPreviewTab).toHaveBeenCalled();

      spyOn(rs, 'navigateToSettingsTab').and.stub();
      component.selectSettingsTab();
      expect(rs.navigateToSettingsTab).toHaveBeenCalled();

      spyOn(rs, 'navigateToStatsTab').and.stub();
      component.selectStatsTab();
      expect(rs.navigateToStatsTab).toHaveBeenCalled();

      spyOn(rs, 'navigateToImprovementsTab').and.stub();
      component.selectImprovementsTab();
      expect(rs.navigateToImprovementsTab).toHaveBeenCalled();

      spyOn(rs, 'navigateToHistoryTab').and.stub();
      component.selectHistoryTab();
      expect(rs.navigateToHistoryTab).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalledWith('history');

      spyOn(rs, 'navigateToFeedbackTab').and.stub();
      component.selectFeedbackTab();
      expect(rs.navigateToFeedbackTab).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalledWith('feedback');
    });

    it('should set focus on active tab', () => {
      let focusSpy = spyOn(focusManagerService, 'setFocus');
      component.setFocusOnActiveTab('history');

      expect(focusSpy).toHaveBeenCalledWith('usernameInputField');

      component.activeThread = 'true';
      component.setFocusOnActiveTab('feedback');

      expect(focusSpy).toHaveBeenCalledWith('tmpMessageText');

      component.activeThread = null as unknown as string;
      component.setFocusOnActiveTab('feedback');

      expect(focusSpy).toHaveBeenCalledWith('newThreadButton');
    });

    it('should generate the aria label correctly', () => {
      const mockWarnings = [
        {message: 'Warning 1'},
        {message: 'Warning 2'},
        {message: 'Warning 3'},
      ];

      spyOn(component, 'getWarnings').and.returnValue(mockWarnings);
      spyOn(component, 'countWarnings').and.returnValue(mockWarnings.length);

      const ariaLabel = component.generateAriaLabelForWarnings();

      expect(ariaLabel).toBe(
        'Total warnings: 3. Warning 1: Warning 1. Warning 2: ' +
          'Warning 2. Warning 3: Warning 3'
      );
    });

    it('should show the user help modal for editor tutorial', fakeAsync(() => {
      (ngbModal.open as jasmine.Spy).and.returnValue({
        result: Promise.resolve('editor'),
      } as NgbModalRef);

      component.showUserHelpModal();
      tick();

      expect(ngbModal.open).toHaveBeenCalled();
      flush();
      discardPeriodicTasks();
    }));

    it('should show the user help modal for editor tutorial', fakeAsync(() => {
      (ngbModal.open as jasmine.Spy).and.returnValue({
        result: Promise.resolve('translation'),
      } as NgbModalRef);

      component.showUserHelpModal();
      tick();

      expect(ngbModal.open).toHaveBeenCalled();
      flush();
      discardPeriodicTasks();
    }));
  });

  describe('Checking internet Connection', () => {
    beforeEach(() => {
      registerAcceptTutorialModalEventSpy = spyOn(
        sas,
        'registerAcceptTutorialModalEvent'
      );
      registerDeclineTutorialModalEventSpy = spyOn(
        sas,
        'registerDeclineTutorialModalEvent'
      );
      spyOn(efbas, 'fetchExplorationFeaturesAsync').and.returnValue(
        Promise.resolve(null)
      );
      spyOn(eis, 'initAsync').and.returnValue(Promise.resolve());
      spyOn(eis, 'flushUpdatedTasksToBackend').and.returnValue(
        Promise.resolve()
      );
      spyOn(ews, 'updateWarnings').and.callThrough();
      spyOn(gds, 'recompute').and.callThrough();

      (tds.getOpenThreadsCount as jasmine.Spy).and.returnValue(0);
      (tds.getFeedbackThreadsAsync as jasmine.Spy).and.returnValue(
        Promise.resolve([])
      );

      spyOn(ueps, 'getPermissionsAsync').and.returnValue(
        Promise.resolve({
          canEdit: true,
          canVoiceover: true,
        } as ExplorationPermissions)
      );
      spyOnProperty(stfts, 'onOpenEditorTutorial').and.returnValue(
        mockOpenEditorTutorialEmitter
      );
      spyOnProperty(ics, 'onInternetStateChange').and.returnValue(
        mockConnectionServiceEmitter
      );
      spyOnProperty(stfts, 'onOpenTranslationTutorial').and.returnValue(
        mockOpenTranslationTutorialEmitter
      );
      spyOn(as, 'addInfoMessage');
      spyOn(as, 'addSuccessMessage');
      explorationData.is_version_of_draft_valid = false;
      explorationData.draft_changes = ['data1', 'data2'];

      component.ngOnInit();
    });

    afterEach(() => {
      component.ngOnDestroy();
    });

    it('should change status to ONLINE when internet is connected', () => {
      mockConnectionServiceEmitter.emit(true);

      expect(as.addSuccessMessage).toHaveBeenCalled();
    });

    it('should change status to OFFLINE when internet disconnects', () => {
      mockConnectionServiceEmitter.emit(false);

      expect(as.addInfoMessage).toHaveBeenCalled();
    });

    it('should navigate to editor tab when internet disconnects', () => {
      let activeTabNameSpy = spyOn(rs, 'getActiveTabName');
      activeTabNameSpy.and.returnValue('settings');
      spyOn(rs, 'navigateToMainTab');
      mockConnectionServiceEmitter.emit(false);

      expect(as.addInfoMessage).toHaveBeenCalled();
      expect(rs.navigateToMainTab).toHaveBeenCalled();
    });
  });

  describe('when user permission is false and draft changes are true', () => {
    let mockExplorationPropertyChangedEventEmitter = new EventEmitter();
    let lastPublishedTranslations: LanguageCodeToEntityTranslations;

    beforeEach(() => {
      registerAcceptTutorialModalEventSpy = spyOn(
        sas,
        'registerAcceptTutorialModalEvent'
      );
      registerDeclineTutorialModalEventSpy = spyOn(
        sas,
        'registerDeclineTutorialModalEvent'
      );
      spyOn(efbas, 'fetchExplorationFeaturesAsync').and.returnValue(
        Promise.resolve({
          explorationIsCurated: null,
        } as ExplorationFeatures)
      );
      spyOn(eis, 'initAsync').and.returnValue(Promise.resolve());
      spyOn(eis, 'flushUpdatedTasksToBackend').and.returnValue(
        Promise.resolve()
      );
      spyOnProperty(eps, 'onExplorationPropertyChanged').and.returnValue(
        mockExplorationPropertyChangedEventEmitter
      );
      spyOn(ews, 'updateWarnings');
      spyOn(gds, 'recompute');
      (tds.getOpenThreadsCount as jasmine.Spy).and.returnValue(1);
      (tds.getFeedbackThreadsAsync as jasmine.Spy).and.returnValue(
        Promise.resolve([])
      );
      spyOn(ueps, 'getPermissionsAsync').and.returnValue(
        Promise.resolve({
          canEdit: true,
          canVoiceover: true,
        } as ExplorationPermissions)
      );
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve(
          new UserInfo(
            ['USER_ROLE'],
            true,
            true,
            false,
            false,
            false,
            null,
            null,
            null,
            false
          )
        )
      );
      spyOnProperty(ess, 'onRefreshGraph').and.returnValue(refreshGraphEmitter);
      spyOnProperty(cls, 'autosaveIsInProgress$').and.returnValue(
        autosaveIsInProgress
      );
      spyOnProperty(esaves, 'onInitExplorationPage').and.returnValue(
        mockInitExplorationPageEmitter
      );
      lastPublishedTranslations = {
        hi: EntityTranslation.createFromBackendDict({
          entity_id: 'exp1',
          entity_type: 'exploration',
          entity_version: 5,
          language_code: 'hi',
          translations: {
            content1: {
              translation: '<p>This is content 1.</p>',
              dataFormat: 'html',
              needsUpdate: true,
            },
          },
        }),
      };
      spyOn(
        entityBulkTranslationsBackendApiService,
        'fetchEntityBulkTranslationsAsync'
      ).and.returnValue(Promise.resolve(lastPublishedTranslations));
      explorationData.is_version_of_draft_valid = false;
      explorationData.draft_changes = [
        {
          cmd: 'edit_translation',
          language_code: 'fr',
          content_id: 'content0',
          translation: {
            content_value: '<p>test content one</p>',
            content_format: 'html',
            needs_update: false,
          },
        },
        {
          cmd: 'mark_translations_needs_update',
          content_id: 'content0',
        },
        {
          cmd: 'edit_translation',
          language_code: 'fr',
          content_id: 'content0',
          translation: {
            content_value: '',
            content_format: 'html',
            needs_update: false,
          },
        },
        {
          cmd: 'remove_translations',
          content_id: 'content0',
        },
        {
          cmd: 'edit_translation',
          language_code: 'fr',
          content_id: 'content0',
          translation: {
            content_value: '<p>new test content one</p>',
            content_format: 'html',
            needs_update: false,
          },
        },
        {
          cmd: 'mark_translation_needs_update_for_language',
          content_id: 'content0',
          language_code: 'fr',
        },
      ];
      mockPlatformFeatureService.status.ExplorationEditorCanModifyTranslations.isEnabled =
        true;
      component.feedbackPromptModalData = {
        openThreadsCount: 0,
      };
      ets.init(explorationData.title);
      component.ngOnInit();
    });

    afterEach(() => {
      component.ngOnDestroy();
    });

    it('should change the value of autosavingIsInProgress', fakeAsync(() => {
      autosaveIsInProgress.emit(true);
      tick();

      component.autosaveIsInProgress = true;
    }));

    it('should have component properties correspond to backend data', () => {
      expect(component.explorationUrl).toBe('/create/' + explorationId);
      expect(component.explorationDownloadUrl).toBe(
        '/createhandler/download/' + explorationId
      );
      expect(component.revertExplorationUrl).toBe(
        '/createhandler/revert/' + explorationId
      );
      expect(component.areExplorationWarningsVisible).toBeFalse();
    });

    it('should navigate to feedback tab', fakeAsync(() => {
      isLocationSetToNonStateEditorTabSpy.and.returnValue(null);
      spyOn(rs, 'getCurrentStateFromLocationPath').and.returnValue(null);
      spyOn(rs, 'navigateToFeedbackTab').and.callThrough();

      component.selectFeedbackTab();
      tick();

      expect(rs.navigateToFeedbackTab).toHaveBeenCalled();
    }));

    it('should react when exploration property changes', () => {
      mockExplorationPropertyChangedEventEmitter.emit();

      expect(pts.setDocumentTitle).toHaveBeenCalledWith(
        'Exploration Title - Oppia Editor'
      );
    });

    it('should react when untitled exploration property changes', () => {
      ets.init('');
      mockExplorationPropertyChangedEventEmitter.emit();

      expect(pts.setDocumentTitle).toHaveBeenCalledWith(
        'Untitled Exploration - Oppia Editor'
      );
    });

    it('should react when refreshing graph', () => {
      refreshGraphEmitter.emit();

      expect(gds.recompute).toHaveBeenCalled();
      expect(ews.updateWarnings).toHaveBeenCalled();
    });

    it('should react to initExplorationPage broadcasts', fakeAsync(() => {
      spyOn(ics, 'startCheckingConnection');
      spyOn(cls, 'loadAutosavedChangeList');
      isLocationSetToNonStateEditorTabSpy.and.returnValue(true);

      expect(component.explorationEditorPageHasInitialized).toEqual(false);
      mockInitExplorationPageEmitter.emit();
      tick();

      expect(cls.loadAutosavedChangeList).toHaveBeenCalled();
      expect(component.explorationEditorPageHasInitialized).toEqual(true);

      flush();
      discardPeriodicTasks();
    }));

    it('should update entity translations dict with draft changes', fakeAsync(() => {
      spyOn(EntityTranslation, 'createFromBackendDict').and.callThrough();
      let entityTranslation = EntityTranslation.createFromBackendDict({
        entity_id: explorationId,
        entity_type: 'exploration',
        entity_version: explorationData.version,
        language_code: 'fr',
        translations: {
          content0: {
            content_value: '<p>new test content one</p>',
            content_format: 'html',
            needs_update: true,
          },
        },
      });
      expect(
        entityTranslationsService.languageCodeToLatestEntityTranslations
      ).toEqual({});

      mockInitExplorationPageEmitter.emit();
      tick();

      expect(EntityTranslation.createFromBackendDict).toHaveBeenCalledWith({
        entity_id: explorationId,
        entity_type: 'exploration',
        entity_version: explorationData.version,
        language_code: 'fr',
        translations: {},
      });

      expect(
        entityTranslationsService.languageCodeToLatestEntityTranslations.fr
      ).toEqual(entityTranslation);

      flush();
      discardPeriodicTasks();
    }));

    it('should initialize entity translation object for last published translations', fakeAsync(() => {
      mockInitExplorationPageEmitter.emit();
      tick();

      expect(
        entityTranslationsService.languageCodeToLastPublishedEntityTranslations
      ).toEqual(lastPublishedTranslations);

      flush();
      discardPeriodicTasks();
    }));

    it('should initialize only latest draft changes when feature flag is disabled', fakeAsync(() => {
      spyOn(EntityTranslation, 'createFromBackendDict').and.callThrough();
      let entityTranslation = EntityTranslation.createFromBackendDict({
        entity_id: explorationId,
        entity_type: 'exploration',
        entity_version: explorationData.version,
        language_code: 'fr',
        translations: {
          content0: {
            content_value: '<p>new test content one</p>',
            content_format: 'html',
            needs_update: true,
          },
        },
      });
      mockPlatformFeatureService.status.ExplorationEditorCanModifyTranslations.isEnabled =
        false;

      expect(
        entityTranslationsService.languageCodeToLastPublishedEntityTranslations
      ).toEqual({});
      expect(
        entityTranslationsService.languageCodeToLatestEntityTranslations
      ).toEqual({});

      mockInitExplorationPageEmitter.emit();
      tick();

      expect(
        entityTranslationsService.languageCodeToLastPublishedEntityTranslations
      ).toEqual({});
      expect(
        entityTranslationsService.languageCodeToLatestEntityTranslations.fr
      ).toEqual(entityTranslation);

      flush();
      discardPeriodicTasks();
    }));

    it(
      'should start editor tutorial when closing welcome exploration' +
        ' modal',
      fakeAsync(() => {
        spyOn(component, 'startEditorTutorial').and.callThrough();
        (ngbModal.open as jasmine.Spy).and.returnValue({
          componentInstance: new MockNgbModalRef(),
          result: Promise.resolve(explorationId),
        } as NgbModalRef);

        component.isModalOpenable = true;
        component.showWelcomeExplorationModal();
        tick();
        tick();

        expect(registerAcceptTutorialModalEventSpy).toHaveBeenCalledWith(
          explorationId
        );
        expect(component.startEditorTutorial).toHaveBeenCalled();

        flush();
        discardPeriodicTasks();
      })
    );

    it(
      'should dismiss tutorial when dismissing welcome exploration' + ' modal',
      fakeAsync(() => {
        spyOn(component, 'startEditorTutorial').and.callThrough();
        (ngbModal.open as jasmine.Spy).and.returnValue({
          componentInstance: new MockNgbModalRef(),
          result: Promise.reject('dismiss'),
        } as NgbModalRef);

        component.showWelcomeExplorationModal();
        tick();

        expect(registerDeclineTutorialModalEventSpy).toHaveBeenCalled();
        expect(component.startEditorTutorial).not.toHaveBeenCalled();
      })
    );

    it('should toggle exploration warning visibility', () => {
      expect(component.areExplorationWarningsVisible).toBeFalse();

      component.toggleExplorationWarningVisibility();
      expect(component.areExplorationWarningsVisible).toBeTrue();

      component.toggleExplorationWarningVisibility();
      expect(component.areExplorationWarningsVisible).toBeFalse();
    });

    it('should get exploration url', () => {
      expect(component.getExplorationUrl(explorationId)).toBe('/explore/exp1');
      expect(component.getExplorationUrl(null)).toBe('');
    });

    it('should get active tab name', () => {
      let activeTabNameSpy = spyOn(rs, 'getActiveTabName');

      activeTabNameSpy.and.returnValue('preview');
      expect(component.getActiveTabName()).toBe('preview');

      activeTabNameSpy.and.returnValue('history');
      expect(component.getActiveTabName()).toBe('history');
    });
  });

  describe('Initializing improvements tab', () => {
    beforeEach(() => {
      mockEnterEditorForTheFirstTime = new EventEmitter();
      spyOn(efbas, 'fetchExplorationFeaturesAsync').and.returnValue(
        Promise.resolve(null)
      );
      spyOn(eis, 'initAsync').and.returnValue(Promise.resolve());
      spyOn(eis, 'flushUpdatedTasksToBackend').and.returnValue(
        Promise.resolve()
      );
      spyOn(ers, 'isPublic').and.returnValue(true);
      spyOn(ews, 'updateWarnings').and.callThrough();
      spyOn(gds, 'recompute').and.callThrough();
      (tds.getOpenThreadsCount as jasmine.Spy).and.returnValue(5);
      (tds.getFeedbackThreadsAsync as jasmine.Spy).and.returnValue(
        Promise.resolve([])
      );
      spyOn(ueps, 'getPermissionsAsync').and.returnValue(
        Promise.resolve({
          canEdit: true,
        } as ExplorationPermissions)
      );
      spyOnProperty(sts, 'onEnterEditorForTheFirstTime').and.returnValue(
        mockEnterEditorForTheFirstTime
      );

      explorationData.is_version_of_draft_valid = false;
      explorationData.draft_changes = ['data1', 'data2'];
    });

    afterEach(() => {
      component.ngOnDestroy();
    });

    it('should recognize when improvements tab is enabled', fakeAsync(() => {
      spyOn(ics, 'startCheckingConnection');
      spyOn(eis, 'isImprovementsTabEnabledAsync').and.returnValue(
        Promise.resolve(true)
      );

      component.ngOnInit();
      tick();
      flushMicrotasks();

      expect(component.isImprovementsTabEnabled()).toBeTrue();
    }));

    it('should recognize when improvements tab is disabled', fakeAsync(() => {
      spyOn(ics, 'startCheckingConnection');
      spyOn(eis, 'isImprovementsTabEnabledAsync').and.returnValue(
        Promise.resolve(false)
      );

      component.ngOnInit();
      tick();
      flushMicrotasks();

      expect(component.isImprovementsTabEnabled()).toBeFalse();
    }));

    it('should react to enterEditorForTheFirstTime event', fakeAsync(() => {
      spyOn(component, 'showWelcomeExplorationModal').and.callThrough();
      component.ngOnInit();
      tick();
      mockEnterEditorForTheFirstTime.emit();
      tick();

      expect(component.showWelcomeExplorationModal).toHaveBeenCalled();
      flush();
      discardPeriodicTasks();
    }));
  });

  describe('editability marking based on permissions', () => {
    let editabilityService: EditabilityService;
    let ueps: UserExplorationPermissionsService;
    let esaves: ExplorationSaveService;
    let explorationDataService: ExplorationDataService;
    let efbas: ExplorationFeaturesBackendApiService;
    let tds: ThreadDataBackendApiService;
    let userService: UserService;

    beforeEach(() => {
      editabilityService = TestBed.inject(EditabilityService);
      ueps = TestBed.inject(UserExplorationPermissionsService);
      esaves = TestBed.inject(ExplorationSaveService);
      explorationDataService = TestBed.inject(ExplorationDataService);
      efbas = TestBed.inject(ExplorationFeaturesBackendApiService);
      tds = TestBed.inject(ThreadDataBackendApiService);
      userService = TestBed.inject(UserService);

      (tds.getFeedbackThreadsAsync as jasmine.Spy)?.calls.reset();
    });

    it('should mark editable and translatable when user can edit', fakeAsync(() => {
      spyOn(ueps, 'getPermissionsAsync').and.returnValue(
        Promise.resolve({canEdit: true, canVoiceover: false})
      );

      spyOn(explorationDataService, 'getDataAsync').and.callFake(cb => {
        cb();
        return Promise.resolve(explorationData);
      });

      spyOn(efbas, 'fetchExplorationFeaturesAsync').and.returnValue(
        Promise.resolve({explorationIsCurated: false})
      );

      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve({
          isCurriculumAdmin: () => false,
          isModerator: () => false,
        })
      );

      const markEditableSpy = spyOn(editabilityService, 'markEditable');
      const markTranslatableSpy = spyOn(editabilityService, 'markTranslatable');

      component.ngOnInit();
      flush();

      esaves.onInitExplorationPage.emit();

      flush();
      tick(200);
      flush();
      tick(200);
      flushMicrotasks();

      discardPeriodicTasks();

      expect(markEditableSpy).toHaveBeenCalled();
      expect(markTranslatableSpy).toHaveBeenCalled();
    }));

    it('should mark translatable but not editable when user can voiceover but not edit', fakeAsync(() => {
      spyOn(ueps, 'getPermissionsAsync').and.returnValue(
        Promise.resolve({canEdit: false, canVoiceover: true})
      );
      spyOn(explorationDataService, 'getDataAsync').and.callFake(cb => {
        cb();
        return Promise.resolve(explorationData);
      });
      spyOn(efbas, 'fetchExplorationFeaturesAsync').and.returnValue(
        Promise.resolve({explorationIsCurated: false})
      );
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve({
          isCurriculumAdmin: () => false,
          isModerator: () => false,
        })
      );

      const markEditableSpy = spyOn(editabilityService, 'markEditable');
      const markTranslatableSpy = spyOn(editabilityService, 'markTranslatable');

      component.ngOnInit();
      esaves.onInitExplorationPage.emit();
      flush();
      tick(200);
      flush();
      tick(200);
      flushMicrotasks();
      discardPeriodicTasks();

      expect(markEditableSpy).not.toHaveBeenCalled();
      expect(markTranslatableSpy).toHaveBeenCalled();
    }));

    it('should mark neither editable nor translatable when user has no permissions', fakeAsync(() => {
      spyOn(ueps, 'getPermissionsAsync').and.returnValue(
        Promise.resolve({canEdit: false, canVoiceover: false})
      );
      spyOn(explorationDataService, 'getDataAsync').and.callFake(cb => {
        cb();
        return Promise.resolve(explorationData);
      });
      spyOn(efbas, 'fetchExplorationFeaturesAsync').and.returnValue(
        Promise.resolve({explorationIsCurated: false})
      );
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve({
          isCurriculumAdmin: () => false,
          isModerator: () => false,
        })
      );

      const markEditableSpy = spyOn(editabilityService, 'markEditable');
      const markTranslatableSpy = spyOn(editabilityService, 'markTranslatable');

      component.ngOnInit();
      esaves.onInitExplorationPage.emit();
      flush();
      tick(200);
      flush();
      tick(200);
      flushMicrotasks();
      discardPeriodicTasks();

      expect(markEditableSpy).not.toHaveBeenCalled();
      expect(markTranslatableSpy).not.toHaveBeenCalled();
    }));
  });

  it('should handle null draft changes correctly', fakeAsync(() => {
    const data = {...explorationData};
    data.draft_changes = null;

    const explorationDataServiceSpy = TestBed.inject(ExplorationDataService);
    spyOn(explorationDataServiceSpy, 'getDataAsync').and.callFake(callback => {
      callback();
      return Promise.resolve(data);
    });

    spyOn(efbas, 'fetchExplorationFeaturesAsync').and.returnValue(
      Promise.resolve({explorationIsCurated: false})
    );
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve({
        isCurriculumAdmin: () => false,
        isModerator: () => false,
      })
    );

    const entityVoiceoversService = TestBed.inject(EntityVoiceoversService);
    spyOn(entityVoiceoversService, 'init').and.callFake(() => {});
    spyOn(entityVoiceoversService, 'fetchEntityVoiceovers').and.callFake(
      () => {}
    );

    // Mock Bulk Translations service just in case feature flag is true
    spyOn(
      entityBulkTranslationsBackendApiService,
      'fetchEntityBulkTranslationsAsync'
    ).and.returnValue(Promise.resolve({}));
    const platformFeatureService = TestBed.inject(PlatformFeatureService);
    platformFeatureService.status.ExplorationEditorCanModifyTranslations = {
      isEnabled: false,
    };

    spyOn(cls, 'loadAutosavedChangeList');
    spyOn(
      component,
      'populateEntityTranslationsWithDraftChanges'
    ).and.callThrough();

    component.ngOnInit();
    // Explicitly emit to ensure initExplorationPage runs
    esaves.onInitExplorationPage.emit();
    tick();
    flush();
    flushMicrotasks();

    expect(cls.loadAutosavedChangeList).not.toHaveBeenCalled();
    expect(
      component.populateEntityTranslationsWithDraftChanges
    ).toHaveBeenCalled();

    discardPeriodicTasks();
  }));

  it('should reset isModalOpenable when feedback prompt modal is dismissed', fakeAsync(() => {
    (tds.getOpenThreadsCount as jasmine.Spy).and.returnValue(3);
    component.isModalOpenable = true;
    const mockModalRef = {
      componentInstance: {},
      result: Promise.reject(),
    };
    (ngbModal.open as jasmine.Spy).and.returnValue(mockModalRef);

    component.maybeShowFeedbackPromptModal();

    expect(ngbModal.open).toHaveBeenCalled();
    expect(component.isModalOpenable).toBeFalse();

    flush();

    expect(component.isModalOpenable).toBeTrue();
  }));

  it('should handle exploration linked to story correctly', fakeAsync(() => {
    const linkedData = {...explorationData};
    linkedData.exploration_is_linked_to_story = true;

    const explorationDataServiceSpy = TestBed.inject(ExplorationDataService);
    spyOn(explorationDataServiceSpy, 'getDataAsync').and.callFake(callback => {
      callback();
      return Promise.resolve(linkedData);
    });
    spyOn(efbas, 'fetchExplorationFeaturesAsync').and.returnValue(
      Promise.resolve({explorationIsCurated: false})
    );
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve({
        isCurriculumAdmin: () => false,
        isModerator: () => false,
      })
    );
    spyOn(pageContextService, 'setExplorationIsLinkedToStory');

    component.ngOnInit();
    tick();
    flush();

    expect(component.explorationIsLinkedToStory).toBeTrue();
    expect(pageContextService.setExplorationIsLinkedToStory).toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('should unlock exploration if edits are allowed', fakeAsync(() => {
    const allowedData = {...explorationData};
    allowedData.edits_allowed = true;

    const explorationDataServiceSpy = TestBed.inject(ExplorationDataService);
    spyOn(explorationDataServiceSpy, 'getDataAsync').and.callFake(callback => {
      callback();
      return Promise.resolve(allowedData);
    });

    spyOn(efbas, 'fetchExplorationFeaturesAsync').and.returnValue(
      Promise.resolve({explorationIsCurated: false})
    );
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve({
        isCurriculumAdmin: () => false,
        isModerator: () => false,
      })
    );

    const lockSpy = spyOn(component.editabilityService, 'lockExploration');

    component.ngOnInit();
    tick();
    flush();

    expect(lockSpy).toHaveBeenCalledWith(true);
    expect(lockSpy).toHaveBeenCalledWith(false);
    discardPeriodicTasks();
  }));

  it('should show feedback prompt modal when there are open feedback threads', fakeAsync(() => {
    ngbModal.open.calls.reset();
    (autosaveInfoModalsService.isModalOpen as jasmine.Spy).and.returnValue(
      false
    );
    (tds.getOpenThreadsCount as jasmine.Spy).and.returnValue(3);
    component.isModalOpenable = true;
    component.ngOnInit();
    tick();
    component.maybeShowFeedbackPromptModal();

    flush();
    discardPeriodicTasks();

    expect(ngbModal.open).toHaveBeenCalledWith(
      FeedbackPromptModalComponent,
      jasmine.objectContaining({
        backdrop: 'static',
        keyboard: false,
        windowClass: 'oppia-confirm-or-cancel-modal',
      })
    );
  }));

  it('should not show feedback prompt modal when there are no open threads', fakeAsync(() => {
    (tds.getOpenThreadsCount as jasmine.Spy).and.returnValue(0);
    component.feedbackPromptModalData = {openThreadsCount: 0};
    component.isModalOpenable = true;

    (ngbModal.open as jasmine.Spy).calls.reset();

    component.ngOnInit();
    esaves.onInitExplorationPage.emit();

    flushMicrotasks();
    flush();
    discardPeriodicTasks();

    expect(ngbModal.open).not.toHaveBeenCalled();
  }));

  describe('voiceover tab', () => {
    it('should be shown correctly', () => {
      let isExplorationLinkedToStorySpy = spyOn(
        pageContextService,
        'isExplorationLinkedToStory'
      );

      isExplorationLinkedToStorySpy.and.returnValue(true);
      expect(component.isVoiceoverTabEnabled()).toBeTrue();
      isExplorationLinkedToStorySpy.and.returnValue(false);
      mockPlatformFeatureService.status.ShowVoiceoverTabForNonCuratedExplorations.isEnabled =
        false;
      expect(component.isVoiceoverTabEnabled()).toBeFalse();
      isExplorationLinkedToStorySpy.and.returnValue(false);
      mockPlatformFeatureService.status.ShowVoiceoverTabForNonCuratedExplorations.isEnabled =
        true;
      expect(component.isVoiceoverTabEnabled()).toBeTrue();
    });

    it('should navigate to feedback tab when feedback prompt modal is confirmed', fakeAsync(() => {
      (tds.getOpenThreadsCount as jasmine.Spy).and.returnValue(3);
      (ngbModal.open as jasmine.Spy).calls.reset();

      spyOn(rs, 'navigateToFeedbackTab');

      component.isModalOpenable = true;

      const mockModalRef = {
        componentInstance: {
          openThreadsCount: 0,
        },
        result: Promise.resolve(),
      };
      (ngbModal.open as jasmine.Spy).and.returnValue(mockModalRef);

      component.maybeShowFeedbackPromptModal();
      flush();

      expect(rs.navigateToFeedbackTab).toHaveBeenCalled();
      expect(component.isModalOpenable).toBeTrue();
    }));

    it('should not show lost changes modal if another modal is already open', fakeAsync(() => {
      (autosaveInfoModalsService.isModalOpen as jasmine.Spy).and.returnValue(
        true
      );
      (
        autosaveInfoModalsService.showLostChangesModal as jasmine.Spy
      ).calls.reset();

      component.ngOnInit();
      esaves.onInitExplorationPage.emit();
      tick();
      flush();

      expect(
        autosaveInfoModalsService.showLostChangesModal
      ).not.toHaveBeenCalled();

      discardPeriodicTasks();
    }));

    it('should not mark translation tutorial as not seen if tutorial should not be shown on load', fakeAsync(() => {
      const data = {...explorationData};
      data.show_state_translation_tutorial_on_load = false;
      const explorationDataServiceSpy = TestBed.inject(ExplorationDataService);
      spyOn(explorationDataServiceSpy, 'getDataAsync').and.callFake(
        callback => {
          callback();
          return Promise.resolve(data);
        }
      );

      spyOn(stfts, 'markTranslationTutorialNotSeenBefore');

      component.ngOnInit();
      esaves.onInitExplorationPage.emit();
      tick();
      flush();

      expect(stfts.markTranslationTutorialNotSeenBefore).not.toHaveBeenCalled();

      discardPeriodicTasks();
    }));
  });

  it('should handle cancel in user help modal', fakeAsync(() => {
    (ngbModal.open as jasmine.Spy).and.returnValue({
      result: Promise.reject(),
    } as NgbModalRef);

    component.showUserHelpModal();
    tick();

    flush();
  }));

  it('should show lost changes modal when initialized with lost changes', fakeAsync(() => {
    const lostChanges = [{cmd: 'some_change', state_name: 'Introduction'}];
    const explorationDataServiceSpy = TestBed.inject(ExplorationDataService);

    spyOn(explorationDataServiceSpy, 'getDataAsync').and.callFake(callback => {
      callback(explorationId, lostChanges);
      return Promise.resolve(explorationData);
    });
    (autosaveInfoModalsService.isModalOpen as jasmine.Spy).and.returnValue(
      false
    );
    (
      autosaveInfoModalsService.showLostChangesModal as jasmine.Spy
    ).calls.reset();

    component.ngOnInit();
    esaves.onInitExplorationPage.emit();
    tick();
    flush();

    expect(autosaveInfoModalsService.showLostChangesModal).toHaveBeenCalledWith(
      lostChanges,
      explorationId
    );
    discardPeriodicTasks();
  }));

  it('should not show welcome exploration modal if isModalOpenable is false', () => {
    component.isModalOpenable = false;
    (ngbModal.open as jasmine.Spy).calls.reset();

    component.showWelcomeExplorationModal();

    expect(ngbModal.open).not.toHaveBeenCalled();
  });

  it('should not navigate to main tab when internet disconnects if already on main tab', () => {
    spyOn(rs, 'getActiveTabName').and.returnValue('main');
    spyOn(rs, 'navigateToMainTab');

    mockConnectionServiceEmitter.emit(false);

    expect(rs.navigateToMainTab).not.toHaveBeenCalled();
  });

  it('should update existing entity translation with draft changes', fakeAsync(() => {
    component.entityTranslationsService.languageCodeToLatestEntityTranslations =
      {
        fr: EntityTranslation.createFromBackendDict({
          entity_id: explorationId,
          entity_type: 'exploration',
          entity_version: 1,
          language_code: 'fr',
          translations: {},
        }),
      };

    const draftChanges = [
      {
        cmd: 'edit_translation',
        language_code: 'fr',
        content_id: 'content_updated',
        translation: {
          content_value: '<p>Updated Content</p>',
          content_format: 'html',
          needs_update: false,
        },
      },
    ];

    component.populateEntityTranslationsWithDraftChanges(draftChanges, 1);

    const translation =
      component.entityTranslationsService.languageCodeToLatestEntityTranslations.fr.getWrittenTranslation(
        'content_updated'
      );
    expect(translation).toBeDefined();
    const content = translation.getHtml
      ? translation.getHtml()
      : translation.toBackendDict
        ? translation.toBackendDict().content_value
        : translation.content_value;
    expect(content).toBe('<p>Updated Content</p>');
  }));
});
