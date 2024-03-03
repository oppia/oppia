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
 * @fileoverview Unit tests for the Exploration save service.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {EventEmitter} from '@angular/core';
import {fakeAsync, flush, TestBed, tick} from '@angular/core/testing';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {ExplorationChangeAddState} from 'domain/exploration/exploration-draft.model';
import {
  StateObjectsBackendDict,
  StatesObjectFactory,
} from 'domain/exploration/StatesObjectFactory';
import {AlertsService} from 'services/alerts.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {EditabilityService} from 'services/editability.service';
import {InternetConnectivityService} from 'services/internet-connectivity.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {AutosaveInfoModalsService} from './autosave-info-modals.service';
import {ChangeListService} from './change-list.service';
import {ExplorationCategoryService} from './exploration-category.service';
import {ExplorationDataService} from './exploration-data.service';
import {
  ExplorationDiffService,
  ProcessedStateIdsAndData,
} from './exploration-diff.service';
import {ExplorationLanguageCodeService} from './exploration-language-code.service';
import {ExplorationObjectiveService} from './exploration-objective.service';
import {ExplorationRightsService} from './exploration-rights.service';
import {ExplorationSaveService} from './exploration-save.service';
import {ExplorationStatesService} from './exploration-states.service';
import {ExplorationTagsService} from './exploration-tags.service';
import {ExplorationTitleService} from './exploration-title.service';
import {ExplorationWarningsService} from './exploration-warnings.service';
import {RouterService} from './router.service';

class MockNgbModal {
  open() {
    return Promise.resolve();
  }
}

class MockrouterService {
  savePendingChanges() {}
  onRefreshVersionHistory = new EventEmitter();
}

describe(
  'Exploration save service ' +
    'when draft changes are present and there ' +
    'is version mismatch it',
  () => {
    let explorationSaveService: ExplorationSaveService;
    let autosaveInfoModalsService: AutosaveInfoModalsService;
    let changeListService: ChangeListService;
    let explorationRightsService: ExplorationRightsService;
    let explorationTitleService: ExplorationTitleService;
    let ngbModal: NgbModal;
    let mockConnectionServiceEmitter = new EventEmitter<boolean>();
    let siteAnalyticsService: SiteAnalyticsService;

    class MockInternetConnectivityService {
      onInternetStateChange = mockConnectionServiceEmitter;

      isOnline() {
        return true;
      }
    }

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          {
            provide: ExplorationDataService,
            useValue: {
              save(
                changeList: string[],
                message: string,
                successCb: (
                  arg0: boolean,
                  arg1: {cmd: string; state_name: string}[]
                ) => void,
                errorCb: () => void
              ) {
                successCb(false, [
                  {
                    cmd: 'add_state',
                    state_name: 'StateName',
                    content_id_for_state_content: 'content_0',
                    content_id_for_default_outcome: 'default_outcome_1',
                  } as ExplorationChangeAddState,
                ]);
              },
            },
          },
          ExplorationSaveService,
          AutosaveInfoModalsService,
          ChangeListService,
          ExplorationRightsService,
          ExplorationTitleService,
          {
            provide: InternetConnectivityService,
            useClass: MockInternetConnectivityService,
          },
          {
            provide: NgbModal,
            useClass: MockNgbModal,
          },
          {
            provide: RouterService,
            useClass: MockrouterService,
          },
          {
            provide: WindowRef,
            useValue: {
              nativeWindow: {
                location: {
                  reload() {},
                },
                gtag: () => {},
              },
            },
          },
        ],
      });
    });

    beforeEach(() => {
      explorationSaveService = TestBed.inject(ExplorationSaveService);
      autosaveInfoModalsService = TestBed.inject(AutosaveInfoModalsService);
      changeListService = TestBed.inject(ChangeListService);
      explorationRightsService = TestBed.inject(ExplorationRightsService);
      explorationTitleService = TestBed.inject(ExplorationTitleService);
      ngbModal = TestBed.inject(NgbModal);
      siteAnalyticsService = TestBed.inject(SiteAnalyticsService);

      spyOn(
        siteAnalyticsService,
        'registerOpenPublishExplorationModalEvent'
      ).and.stub();
      spyOn(siteAnalyticsService, 'registerPublishExplorationEvent').and.stub();
      spyOn(
        siteAnalyticsService,
        'registerCommitChangesToPublicExplorationEvent'
      ).and.stub();
      spyOn(
        siteAnalyticsService,
        'registerSavePlayableExplorationEvent'
      ).and.stub();
      spyOn(siteAnalyticsService, '_sendEventToGoogleAnalytics').and.stub();
    });

    it('should open version mismatch modal', fakeAsync(() => {
      let modalSpy = spyOn(
        autosaveInfoModalsService,
        'showVersionMismatchModal'
      ).and.returnValue();
      let startLoadingCb = jasmine.createSpy('startLoadingCb');
      let endLoadingCb = jasmine.createSpy('endLoadingCb');
      spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.resolve(['1']),
      } as NgbModalRef);
      spyOn(explorationRightsService, 'isPrivate').and.returnValue(true);

      explorationSaveService.showPublishExplorationModal(
        startLoadingCb,
        endLoadingCb
      );
      tick();
      tick();

      expect(modalSpy).toHaveBeenCalled();
    }));

    it(
      "should restore all memento's after modal was " + 'closed',
      fakeAsync(() => {
        let startLoadingCb = jasmine.createSpy('startLoadingCb');
        let endLoadingCb = jasmine.createSpy('endLoadingCb');
        let restoreSpy = spyOn(
          explorationTitleService,
          'restoreFromMemento'
        ).and.returnValue();
        spyOn(ngbModal, 'open').and.returnValue({
          result: Promise.reject(),
        } as NgbModalRef);

        explorationSaveService
          .showPublishExplorationModal(startLoadingCb, endLoadingCb)
          .catch(() => {});

        tick();

        expect(restoreSpy).toHaveBeenCalled();
      })
    );

    it(
      'should open confirm discard changes modal when clicked ' +
        'on discard changes button',
      fakeAsync(() => {
        const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
          return {
            result: Promise.resolve(),
          } as NgbModalRef;
        });
        spyOn(changeListService, 'discardAllChanges').and.returnValue(
          Promise.resolve()
        );

        explorationSaveService.discardChanges();
        tick();
        tick();

        expect(modalSpy).toHaveBeenCalled();
      })
    );

    it(
      "should return 'initExplorationPageEventEmitter' " +
        "when calling 'onInitExplorationPage'",
      fakeAsync(() => {
        let mockEventEmitter = new EventEmitter();

        expect(explorationSaveService.onInitExplorationPage).toEqual(
          mockEventEmitter
        );
      })
    );
  }
);

describe(
  'Exploration save service ' + 'when there are no pending draft changes it',
  () => {
    let explorationSaveService: ExplorationSaveService;
    let autosaveInfoModalsService: AutosaveInfoModalsService;
    let changeListService: ChangeListService;
    let editabilityService: EditabilityService;
    let explorationCategoryService: ExplorationCategoryService;
    let explorationLanguageCodeService: ExplorationLanguageCodeService;
    let explorationObjectiveService: ExplorationObjectiveService;
    let explorationRightsService: ExplorationRightsService;
    let explorationTagsService: ExplorationTagsService;
    let explorationTitleService: ExplorationTitleService;
    let ngbModal: NgbModal;
    let mockConnectionServiceEmitter = new EventEmitter<boolean>();
    let siteAnalyticsService: SiteAnalyticsService;

    class MockInternetConnectivityService {
      onInternetStateChange = mockConnectionServiceEmitter;

      isOnline() {
        return true;
      }
    }

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          {
            provide: ExplorationDataService,
            useValue: {
              save(
                changeList: string[],
                message: string,
                successCb: (arg0: boolean, arg1: string[]) => void,
                errorCb: () => void
              ) {
                successCb(true, []);
              },
            },
          },
          ExplorationSaveService,
          AutosaveInfoModalsService,
          ChangeListService,
          ExplorationRightsService,
          ExplorationTitleService,
          {
            provide: InternetConnectivityService,
            useClass: MockInternetConnectivityService,
          },
          {
            provide: NgbModal,
            useClass: MockNgbModal,
          },
          {
            provide: RouterService,
            useClass: MockrouterService,
          },
          {
            provide: WindowRef,
            useValue: {
              nativeWindow: {
                location: {
                  reload() {},
                },
              },
            },
          },
        ],
      });
    });

    beforeEach(() => {
      explorationSaveService = TestBed.inject(ExplorationSaveService);
      autosaveInfoModalsService = TestBed.inject(AutosaveInfoModalsService);
      changeListService = TestBed.inject(ChangeListService);
      editabilityService = TestBed.inject(EditabilityService);
      explorationCategoryService = TestBed.inject(ExplorationCategoryService);
      explorationLanguageCodeService = TestBed.inject(
        ExplorationLanguageCodeService
      );
      explorationObjectiveService = TestBed.inject(ExplorationObjectiveService);
      explorationRightsService = TestBed.inject(ExplorationRightsService);
      explorationTagsService = TestBed.inject(ExplorationTagsService);
      explorationTitleService = TestBed.inject(ExplorationTitleService);
      ngbModal = TestBed.inject(NgbModal);
      siteAnalyticsService = TestBed.inject(SiteAnalyticsService);

      spyOn(
        siteAnalyticsService,
        'registerOpenPublishExplorationModalEvent'
      ).and.stub();
      spyOn(siteAnalyticsService, 'registerPublishExplorationEvent').and.stub();
      spyOn(
        siteAnalyticsService,
        'registerCommitChangesToPublicExplorationEvent'
      ).and.stub();
      spyOn(
        siteAnalyticsService,
        'registerSavePlayableExplorationEvent'
      ).and.stub();
      spyOn(siteAnalyticsService, '_sendEventToGoogleAnalytics').and.stub();
    });

    it('should not open version mismatch modal', fakeAsync(() => {
      let modalSpy = spyOn(
        autosaveInfoModalsService,
        'showVersionMismatchModal'
      ).and.returnValue();
      let startLoadingCb = jasmine.createSpy('startLoadingCb');
      let endLoadingCb = jasmine.createSpy('endLoadingCb');
      spyOn(explorationRightsService, 'publish').and.resolveTo();
      spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.resolve([]),
      } as NgbModalRef);
      spyOn(explorationRightsService, 'isPrivate').and.returnValue(true);

      explorationSaveService.showPublishExplorationModal(
        startLoadingCb,
        endLoadingCb
      );
      tick();
      tick();

      expect(modalSpy).not.toHaveBeenCalled();
    }));

    it('should show congratulatory sharing modal', fakeAsync(() => {
      let startLoadingCb = jasmine.createSpy('startLoadingCb');
      let endLoadingCb = jasmine.createSpy('endLoadingCb');
      spyOn(changeListService, 'discardAllChanges').and.returnValue(
        Promise.reject(null)
      );
      let modalSpy = spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.resolve(['1']),
      } as NgbModalRef);
      spyOn(explorationRightsService, 'publish').and.resolveTo();

      explorationSaveService.showPublishExplorationModal(
        startLoadingCb,
        endLoadingCb
      );
      tick();
      tick();

      expect(modalSpy).toHaveBeenCalled();
    }));

    it(
      'should not publish exploration in case of backend ' + 'error',
      fakeAsync(() => {
        spyOn(ngbModal, 'open').and.returnValue({
          result: Promise.reject('failure'),
        } as NgbModalRef);
        let failHandler = jasmine.createSpy('fail');
        let publishSpy = spyOn(
          explorationRightsService,
          'publish'
        ).and.resolveTo();

        explorationTitleService.savedMemento = true;
        explorationObjectiveService.savedMemento = true;
        explorationCategoryService.savedMemento = true;
        explorationLanguageCodeService.savedMemento = 'afk';
        explorationTagsService.savedMemento = 'invalid';

        explorationSaveService
          // This throws "Argument of type 'null' is not assignable.". We need
          // to suppress this error because of strict type checking. This is
          // because the function is called with null as an argument.
          // @ts-ignore
          .showPublishExplorationModal(null, null)
          .catch(failHandler);
        tick();
        tick();

        expect(publishSpy).not.toHaveBeenCalled();
        expect(failHandler).toHaveBeenCalled();
      })
    );

    it('should mark exploaration as editable', fakeAsync(() => {
      let editableSpy = spyOn(
        editabilityService,
        'markNotEditable'
      ).and.returnValue();
      let startLoadingCb = jasmine.createSpy('startLoadingCb');
      let endLoadingCb = jasmine.createSpy('endLoadingCb');
      spyOn(changeListService, 'discardAllChanges').and.returnValue(
        Promise.resolve()
      );
      spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.resolve(['1']),
      } as NgbModalRef);

      explorationSaveService.showPublishExplorationModal(
        startLoadingCb,
        endLoadingCb
      );
      tick();
      tick();

      expect(editableSpy).toHaveBeenCalled();
    }));

    it('should check whether the exploration is saveable', () => {
      spyOn(changeListService, 'isExplorationLockedForEditing').and.returnValue(
        false
      );

      let result = explorationSaveService.isExplorationSaveable();

      expect(result).toBe(false);
    });
  }
);

describe(
  'Exploration save service ' +
    'in case of backend error while saving ' +
    'exploration data it',
  () => {
    let explorationSaveService: ExplorationSaveService;
    let ngbModal: NgbModal;
    let changeListService: ChangeListService;
    let mockConnectionServiceEmitter = new EventEmitter<boolean>();
    let siteAnalyticsService: SiteAnalyticsService;

    class MockInternetConnectivityService {
      onInternetStateChange = mockConnectionServiceEmitter;

      isOnline() {
        return true;
      }
    }

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          {
            provide: ExplorationDataService,
            useValue: {
              save(
                changeList: string[],
                message: string,
                successCb: (arg0: boolean, arg1: string[]) => void,
                errorCb: (arg0: {error: {error: string}}) => void
              ) {
                successCb(true, []);
                errorCb({error: {error: 'errorMessage'}});
              },
              discardDraftAsync() {},
            },
          },
          ExplorationSaveService,
          AutosaveInfoModalsService,
          ChangeListService,
          ExplorationRightsService,
          ExplorationTitleService,
          {
            provide: InternetConnectivityService,
            useClass: MockInternetConnectivityService,
          },
          {
            provide: NgbModal,
            useClass: MockNgbModal,
          },
          {
            provide: RouterService,
            useClass: MockrouterService,
          },
          {
            provide: WindowRef,
            useValue: {
              nativeWindow: {
                location: {
                  reload() {},
                },
              },
            },
          },
        ],
      });
    });

    beforeEach(() => {
      explorationSaveService = TestBed.inject(ExplorationSaveService);
      ngbModal = TestBed.inject(NgbModal);
      siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
      changeListService = TestBed.inject(ChangeListService);

      spyOn(changeListService, 'discardAllChanges').and.returnValue(
        Promise.resolve()
      );
      spyOn(
        siteAnalyticsService,
        'registerOpenPublishExplorationModalEvent'
      ).and.stub();
      spyOn(siteAnalyticsService, 'registerPublishExplorationEvent').and.stub();
      spyOn(
        siteAnalyticsService,
        'registerCommitChangesToPublicExplorationEvent'
      ).and.stub();
      spyOn(
        siteAnalyticsService,
        'registerSavePlayableExplorationEvent'
      ).and.stub();
      spyOn(siteAnalyticsService, '_sendEventToGoogleAnalytics').and.stub();
    });

    it('should call error callback', fakeAsync(() => {
      let successCb = jasmine.createSpy('success');
      let errorCb = jasmine.createSpy('error');
      let modalSpy = spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: {
          isExplorationPrivate: true,
          diffData: null,
        },
        result: Promise.resolve(['1']),
      } as NgbModalRef);

      explorationSaveService.showPublishExplorationModal(successCb, errorCb);
      tick();
      tick();

      expect(modalSpy).toHaveBeenCalled();
    }));
  }
);

describe('Exploration save service ' + 'while saving changes', () => {
  let explorationSaveService: ExplorationSaveService;
  let changeListService: ChangeListService;
  let explorationRightsService: ExplorationRightsService;
  let ngbModal: NgbModal;
  let statesObjectFactory: StatesObjectFactory;
  let siteAnalyticsService: SiteAnalyticsService;
  let routerService: RouterService;
  let explorationDiffService: ExplorationDiffService;
  let explorationStatesService: ExplorationStatesService;
  let explorationWarningsService: ExplorationWarningsService;
  let mockConnectionServiceEmitter = new EventEmitter<boolean>();
  let alertsService: AlertsService;
  let changeListServiceSpy: jasmine.Spy;
  class MockInternetConnectivityService {
    onInternetStateChange = mockConnectionServiceEmitter;

    isOnline() {
      return true;
    }
  }

  let statesBackendDict: StateObjectsBackendDict = {
    Hola: {
      classifier_model_id: '',
      solicit_answer_details: false,
      card_is_checkpoint: true,
      linked_skill_id: '',
      content: {
        content_id: 'content',
        html: '{{HtmlValue}}',
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {},
        },
      },
      param_changes: [],
      interaction: {
        confirmed_unclassified_answers: [],
        customization_args: {},
        solution: null,
        id: null,
        answer_groups: [
          {
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: null,
            outcome: {
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: '',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_1',
                html: '{{FeedbackValue}}',
              },
            },
          },
        ],
        default_outcome: {
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
          dest: 'Hola',
          dest_if_really_stuck: null,
          feedback: {
            content_id: '',
            html: '',
          },
        },
        hints: [],
      },
    },
    State: {
      classifier_model_id: '',
      solicit_answer_details: false,
      card_is_checkpoint: true,
      linked_skill_id: '',
      content: {
        content_id: 'content',
        html: 'content',
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {},
        },
      },
      param_changes: [],
      interaction: {
        confirmed_unclassified_answers: [],
        customization_args: {},
        solution: null,
        id: null,
        answer_groups: [
          {
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: null,
            outcome: {
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: '',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_1',
                html: '{{StateFeedbackValue}}',
              },
            },
          },
        ],
        default_outcome: {
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
          dest: 'State',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome',
            html: '',
          },
        },
        hints: [],
      },
    },
    State2: {
      classifier_model_id: '',
      solicit_answer_details: false,
      card_is_checkpoint: true,
      linked_skill_id: '',
      content: {
        content_id: 'content',
        html: 'content',
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {},
        },
      },
      param_changes: [],
      interaction: {
        confirmed_unclassified_answers: [],
        customization_args: {},
        solution: null,
        id: null,
        answer_groups: [
          {
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: null,
            outcome: {
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: '',
              dest_if_really_stuck: null,
              feedback: {
                content_id: '',
                html: '',
              },
            },
          },
        ],
        default_outcome: {
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
          dest: 'State2',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome',
            html: '',
          },
        },
        hints: [],
      },
    },
    State3: {
      classifier_model_id: '',
      solicit_answer_details: false,
      card_is_checkpoint: true,
      linked_skill_id: '',
      content: {
        content_id: 'content',
        html: 'content',
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {},
        },
      },
      param_changes: [],
      interaction: {
        confirmed_unclassified_answers: [],
        customization_args: {},
        solution: null,
        id: null,
        answer_groups: [
          {
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: null,
            outcome: {
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: '',
              dest_if_really_stuck: null,
              feedback: {
                content_id: '',
                html: '',
              },
            },
          },
        ],
        default_outcome: {
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
          dest: 'State2',
          dest_if_really_stuck: null,
          feedback: {
            content_id: '',
            html: '',
          },
        },
        hints: [],
      },
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: ExplorationDataService,
          useValue: {
            getLastSavedDataAsync() {
              return Promise.resolve({
                states: statesBackendDict,
                init_state_name: 'Hola',
              });
            },
            save(
              changeList: string[],
              message: string,
              successCb: (arg0: boolean, arg1: string[]) => void,
              errorCb: (arg0: {error: {error: string}}) => void
            ) {
              successCb(true, []);
              errorCb({error: {error: 'errorMessage'}});
            },
            discardDraftAsync() {},
          },
        },
        FocusManagerService,
        ExplorationSaveService,
        AutosaveInfoModalsService,
        ChangeListService,
        ExplorationRightsService,
        ExplorationTitleService,
        {
          provide: InternetConnectivityService,
          useClass: MockInternetConnectivityService,
        },
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
        {
          provide: RouterService,
          useClass: MockrouterService,
        },
        {
          provide: WindowRef,
          useValue: {
            nativeWindow: {
              location: {
                reload() {},
              },
            },
          },
        },
        ExplorationDiffService,
        ExplorationStatesService,
        FocusManagerService,
        ExplorationWarningsService,
      ],
    });
  });

  beforeEach(() => {
    explorationSaveService = TestBed.inject(ExplorationSaveService);
    changeListService = TestBed.inject(ChangeListService);
    explorationRightsService = TestBed.inject(ExplorationRightsService);
    ngbModal = TestBed.inject(NgbModal);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    statesObjectFactory = TestBed.inject(StatesObjectFactory);
    alertsService = TestBed.inject(AlertsService);
    routerService = TestBed.inject(RouterService);
    explorationDiffService = TestBed.inject(ExplorationDiffService);
    explorationStatesService = TestBed.inject(ExplorationStatesService);
    explorationWarningsService = TestBed.inject(ExplorationWarningsService);

    changeListServiceSpy = spyOn(changeListService, 'discardAllChanges');
    changeListServiceSpy.and.returnValue(Promise.resolve(null));
    spyOn(
      siteAnalyticsService,
      'registerOpenPublishExplorationModalEvent'
    ).and.stub();
    spyOn(siteAnalyticsService, 'registerPublishExplorationEvent').and.stub();
    spyOn(
      siteAnalyticsService,
      'registerCommitChangesToPublicExplorationEvent'
    ).and.stub();
    spyOn(
      siteAnalyticsService,
      'registerSavePlayableExplorationEvent'
    ).and.stub();
    spyOn(siteAnalyticsService, '_sendEventToGoogleAnalytics').and.stub();
  });

  it('should open exploration save modal', fakeAsync(() => {
    let startLoadingCb = jasmine.createSpy('startLoadingCb');
    let endLoadingCb = jasmine.createSpy('endLoadingCb');
    let sampleStates =
      statesObjectFactory.createFromBackendDict(statesBackendDict);
    spyOn(routerService, 'savePendingChanges').and.returnValue();
    spyOn(explorationStatesService, 'getStates').and.returnValue(sampleStates);
    spyOn(explorationDiffService, 'getDiffGraphData').and.returnValue({
      nodes: {
        nodes: {
          newestStateName: 'newestStateName',
          originalStateName: 'originalStateName',
          stateProperty: 'stateProperty',
        },
      },
      links: [
        {
          source: 0,
          target: 0,
          linkProperty: 'links',
        },
      ],
      finalStateIds: ['finalStaeIds'],
      originalStateIds: {Hola: 0},
      stateIds: {Hola: 0},
    } as ProcessedStateIdsAndData);
    let modalSpy = spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        isExplorationPrivate: true,
        diffData: null,
      },
      result: Promise.resolve('commitMessage'),
    } as NgbModalRef);

    explorationSaveService.saveChangesAsync(startLoadingCb, endLoadingCb);

    flush();
    tick();
    flush();

    expect(modalSpy).toHaveBeenCalled();
  }));

  it(
    'should not open exploration save modal in case of ' + 'backend error',
    fakeAsync(() => {
      let startLoadingCb = jasmine.createSpy('startLoadingCb');
      let endLoadingCb = jasmine.createSpy('endLoadingCb');

      spyOn(routerService, 'savePendingChanges').and.stub();
      spyOn(alertsService, 'addWarning').and.stub();
      spyOn(explorationRightsService, 'isPrivate').and.returnValue(false);
      spyOn(explorationWarningsService, 'countWarnings').and.returnValue(1);
      spyOn(explorationWarningsService, 'getWarnings').and.returnValue([
        'something',
      ]);

      explorationSaveService.saveChangesAsync(startLoadingCb, endLoadingCb);
      flush();
      tick();
      flush();

      expect(explorationWarningsService.countWarnings).toHaveBeenCalled();
    })
  );

  it(
    'should not open exploration save modal if ' + 'it is already opened',
    fakeAsync(() => {
      let startLoadingCb = jasmine.createSpy('startLoadingCb');
      let endLoadingCb = jasmine.createSpy('endLoadingCb');
      let sampleStates =
        statesObjectFactory.createFromBackendDict(statesBackendDict);
      spyOn(routerService, 'savePendingChanges').and.returnValue();
      spyOn(explorationStatesService, 'getStates').and.returnValue(
        sampleStates
      );
      spyOn(explorationDiffService, 'getDiffGraphData').and.returnValue({
        nodes: {
          nodes: {
            newestStateName: 'nodes',
            originalStateName: 'originalStateName',
            stateProperty: 'stateProperty',
          },
        },
        links: [
          {
            source: 0,
            target: 0,
            linkProperty: 'links',
          },
        ],
        finalStateIds: ['finalStaeIds'],
        originalStateIds: {Hola: 0},
        stateIds: {Hola: 0},
      } as ProcessedStateIdsAndData);

      let modalSpy = spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: {
          isExplorationPrivate: true,
          diffData: null,
        },
        result: Promise.resolve('commitMessage'),
      } as NgbModalRef);

      // Opening modal first time.
      explorationSaveService.saveChangesAsync(startLoadingCb, endLoadingCb);
      // Opening modal second time.
      explorationSaveService.saveChangesAsync(startLoadingCb, endLoadingCb);
      // We need multiple '$rootScope.$apply()' here since, the source code
      // consists of nested promises.
      flush();
      flush();

      expect(modalSpy).toHaveBeenCalledTimes(1);
    })
  );

  it(
    'should focus on the exploration save modal ' + 'when modal is opened',
    fakeAsync(() => {
      let startLoadingCb = jasmine.createSpy('startLoadingCb');
      let endLoadingCb = jasmine.createSpy('endLoadingCb');
      let sampleStates =
        statesObjectFactory.createFromBackendDict(statesBackendDict);
      spyOn(routerService, 'savePendingChanges').and.returnValue();
      spyOn(explorationStatesService, 'getStates').and.returnValue(
        sampleStates
      );
      spyOn(explorationDiffService, 'getDiffGraphData').and.returnValue({
        nodes: {
          nodes: {
            newestStateName: 'newestStateName',
            originalStateName: 'originalStateName',
            stateProperty: 'stateProperty',
          },
        },
        links: [
          {
            source: 0,
            target: 0,
            linkProperty: 'links',
          },
        ],
        finalStateIds: ['finalStaeIds'],
        originalStateIds: {Hola: 0},
        stateIds: {Hola: 0},
      } as ProcessedStateIdsAndData);
      changeListServiceSpy.and.returnValue(Promise.resolve(null));
      let modalSpy = spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: {
          isExplorationPrivate: true,
          diffData: null,
        },
        result: Promise.resolve('commitMessage'),
      } as NgbModalRef);

      explorationSaveService.saveChangesAsync(startLoadingCb, endLoadingCb);
      // We need multiple '$rootScope.$apply()' here since, the source code
      // consists of nested promises.
      flush();
      tick();
      flush();

      expect(modalSpy).toHaveBeenCalled();
    })
  );

  it(
    'should not focus on exploration save modal in case ' + 'of backend error',
    fakeAsync(() => {
      let startLoadingCb = jasmine.createSpy('startLoadingCb');
      let endLoadingCb = jasmine.createSpy('endLoadingCb');
      let sampleStates =
        statesObjectFactory.createFromBackendDict(statesBackendDict);
      spyOn(routerService, 'savePendingChanges').and.returnValue();
      spyOn(explorationStatesService, 'getStates').and.returnValue(
        sampleStates
      );
      spyOn(explorationDiffService, 'getDiffGraphData').and.returnValue({
        nodes: {
          nodes: {
            newestStateName: 'newestStateName',
            originalStateName: 'originalStateName',
            stateProperty: 'stateProperty',
          },
        },
        links: [
          {
            source: 0,
            target: 0,
            linkProperty: 'links',
          },
        ],
        finalStateIds: ['finalStaeIds'],
        originalStateIds: {Hola: 0},
        stateIds: {Hola: 0},
      } as ProcessedStateIdsAndData);
      let modalSpy = spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: {
          isExplorationPrivate: true,
          diffData: null,
        },
        result: Promise.reject(),
      } as NgbModalRef);

      explorationSaveService.saveChangesAsync(startLoadingCb, endLoadingCb);
      tick();

      expect(modalSpy).toHaveBeenCalled();
    })
  );
});
