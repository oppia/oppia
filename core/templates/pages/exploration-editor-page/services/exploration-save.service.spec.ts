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

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter } from '@angular/core';
import { fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { EditabilityService } from 'services/editability.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { AutosaveInfoModalsService } from './autosave-info-modals.service';
import { ChangeListService } from './change-list.service';
import { ExplorationDataService } from './exploration-data.service';
import { ExplorationLanguageCodeService } from './exploration-language-code.service';
import { ExplorationTagsService } from './exploration-tags.service';
// ^^^ This block is to be removed.

describe('Exploration save service ' +
  'when draft changes are present and there ' +
  'is version mismatch it', function() {
  let $rootScope = null;
  let $uibModal = null;
  let explorationSaveService = null;
  let autosaveInfoModalsService: AutosaveInfoModalsService = null;
  let changeListService: ChangeListService = null;
  let ExplorationRightsService = null;
  let ExplorationTitleService = null;
  let ngbModal: NgbModal = null;

  importAllAngularServices();
  beforeEach(angular.mock.module('oppia'));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: ExplorationDataService,
          useValue: {
            save(changeList, message, successCb, errorCb) {
              successCb(false, [
                {
                  cmd: 'add_state',
                  state_name: 'StateName'
                }]);
            }
          }
        },
      ]
    });
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('$window', {
      location: {
        reload() {}
      }
    });

    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));

  beforeEach(angular.mock.inject(function($injector) {
    explorationSaveService = $injector.get('ExplorationSaveService');
    $rootScope = $injector.get('$rootScope');
    $uibModal = $injector.get('$uibModal');
    autosaveInfoModalsService = $injector.get('AutosaveInfoModalsService');
    changeListService = $injector.get('ChangeListService');
    ExplorationRightsService = $injector.get('ExplorationRightsService');
    ExplorationTitleService = $injector.get('ExplorationTitleService');
    ngbModal = $injector.get('NgbModal');
  }));

  it('should open version mismatch modal', fakeAsync(function() {
    let modalSpy = spyOn(
      autosaveInfoModalsService, 'showVersionMismatchModal')
      .and.returnValue(null);
    let startLoadingCb = jasmine.createSpy('startLoadingCb');
    let endLoadingCb = jasmine.createSpy('endLoadingCb');
    spyOn($uibModal, 'open').and.returnValue(
      {
        opened: Promise.resolve(),
        result: Promise.resolve(['1'])
      });
    spyOn(ExplorationRightsService, 'isPrivate')
      .and.returnValue(true);

    explorationSaveService.showPublishExplorationModal(
      startLoadingCb, endLoadingCb);
    // We need multiple '$rootScope.$apply()' here since, the source code
    // consists of nested promises.
    $rootScope.$apply();
    tick();
    $rootScope.$apply();
    tick();
    $rootScope.$apply();

    expect(modalSpy).toHaveBeenCalled();
  }));

  it('should restore all memento\'s after modal was ' +
    'closed', fakeAsync(function() {
    let startLoadingCb = jasmine.createSpy('startLoadingCb');
    let endLoadingCb = jasmine.createSpy('endLoadingCb');
    let restoreSpy = spyOn(ExplorationTitleService, 'restoreFromMemento')
      .and.returnValue(null);
    spyOn($uibModal, 'open').and.returnValue(
      {
        opened: Promise.resolve(),
        result: Promise.reject()
      });

    explorationSaveService.showPublishExplorationModal(
      startLoadingCb, endLoadingCb);
    $rootScope.$apply();
    tick();

    expect(restoreSpy).toHaveBeenCalled();
  }));

  it('should open confirm discard changes modal when clicked ' +
    'on discard changes button', fakeAsync(function() {
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return ({
        result: Promise.resolve()
      } as NgbModalRef);
    });
    spyOn(changeListService, 'discardAllChanges')
      .and.returnValue(Promise.resolve(null));

    explorationSaveService.discardChanges();
    // We need multiple '$rootScope.$apply()' here since, the source code
    // consists of nested promises.
    $rootScope.$apply();
    tick();
    $rootScope.$apply();
    tick();
    $rootScope.$apply();

    expect(modalSpy).toHaveBeenCalled();
  }));

  it('should return \'initExplorationPageEventEmitter\' ' +
    'when calling \'onInitExplorationPage\'', fakeAsync(function() {
    let mockEventEmitter = new EventEmitter();

    expect(explorationSaveService.onInitExplorationPage)
      .toEqual(mockEventEmitter);
  }));
});

describe('Exploration save service ' +
  'when there are no pending draft changes it', function() {
  let $uibModal = null;
  let $rootScope = null;
  let explorationSaveService = null;
  let autosaveInfoModalsService: AutosaveInfoModalsService = null;
  let changeListService: ChangeListService = null;
  let editabilityService: EditabilityService = null;
  let ExplorationCategoryService = null;
  let explorationLanguageCodeService: ExplorationLanguageCodeService = null;
  let ExplorationObjectiveService = null;
  let ExplorationRightsService = null;
  let explorationTagsService: ExplorationTagsService = null;
  let ExplorationTitleService = null;
  let NgbModal = null;

  importAllAngularServices();
  beforeEach(angular.mock.module('oppia'));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: ExplorationDataService,
          useValue: {
            save(changeList, message, successCb, errorCb) {
              successCb(true, []);
            }
          }
        },
      ]
    });
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));

  beforeEach(angular.mock.inject(function($injector) {
    explorationSaveService = $injector.get('ExplorationSaveService');
    $uibModal = $injector.get('$uibModal');
    $rootScope = $injector.get('$rootScope');
    autosaveInfoModalsService = $injector.get('AutosaveInfoModalsService');
    changeListService = $injector.get('ChangeListService');
    editabilityService = $injector.get('EditabilityService');
    ExplorationCategoryService = $injector.get('ExplorationCategoryService');
    explorationLanguageCodeService = $injector.get(
      'ExplorationLanguageCodeService');
    ExplorationObjectiveService = $injector.get('ExplorationObjectiveService');
    ExplorationRightsService = $injector.get('ExplorationRightsService');
    explorationTagsService = $injector.get('ExplorationTagsService');
    ExplorationTitleService = $injector.get('ExplorationTitleService');
    NgbModal = $injector.get('NgbModal');
  }));

  it('should not open version mismatch modal', fakeAsync(function() {
    let modalSpy = spyOn(
      autosaveInfoModalsService, 'showVersionMismatchModal')
      .and.returnValue(null);
    let startLoadingCb = jasmine.createSpy('startLoadingCb');
    let endLoadingCb = jasmine.createSpy('endLoadingCb');
    spyOn(ExplorationRightsService, 'publish')
      .and.resolveTo();
    spyOn($uibModal, 'open').and.returnValue(
      {
        opened: Promise.resolve(),
        result: Promise.resolve([])
      });
    spyOn(ExplorationRightsService, 'isPrivate')
      .and.returnValue(true);

    explorationSaveService.showPublishExplorationModal(
      startLoadingCb, endLoadingCb);
    // We need multiple '$rootScope.$apply()' here since, the source code
    // consists of nested promises.
    $rootScope.$apply();
    tick();
    $rootScope.$apply();
    tick();
    $rootScope.$apply();

    expect(modalSpy).not.toHaveBeenCalled();
  }));

  it('should show congratulatory sharing modal', fakeAsync(function() {
    let startLoadingCb = jasmine.createSpy('startLoadingCb');
    let endLoadingCb = jasmine.createSpy('endLoadingCb');
    spyOn(changeListService, 'discardAllChanges')
      .and.returnValue(Promise.reject(null));
    let modalSpy = spyOn($uibModal, 'open').and.returnValue(
      {
        opened: Promise.resolve(),
        result: Promise.resolve(['1'])
      });
    spyOn(ExplorationRightsService, 'publish')
      .and.resolveTo();

    explorationSaveService.showPublishExplorationModal(
      startLoadingCb, endLoadingCb);
    // We need multiple '$rootScope.$apply()' here since, the source code
    // consists of nested promises.
    $rootScope.$apply();
    tick();
    $rootScope.$apply();
    tick();
    $rootScope.$apply();

    expect(modalSpy).toHaveBeenCalled();
  }));

  it('should not publish exploration in case of backend ' +
    'error', fakeAsync(function() {
    spyOn(NgbModal, 'open').and.returnValue({
      result: Promise.reject('failure')
    });
    let publishSpy = spyOn(ExplorationRightsService, 'publish')
      .and.resolveTo();

    ExplorationTitleService.savedMemento = true;
    ExplorationObjectiveService.savedMemento = true;
    ExplorationCategoryService.savedMemento = true;
    explorationLanguageCodeService.savedMemento = 'afk';
    explorationTagsService.savedMemento = 'invalid';

    explorationSaveService.showPublishExplorationModal();
    // We need multiple '$rootScope.$apply()' here since, the source code
    // consists of nested promises.
    $rootScope.$apply();
    tick();
    $rootScope.$apply();
    tick();
    $rootScope.$apply();

    expect(publishSpy).not.toHaveBeenCalled();
  }));

  it('should mark exploaration as editable', fakeAsync(function() {
    let editableSpy = spyOn(editabilityService, 'markNotEditable')
      .and.returnValue(null);
    let startLoadingCb = jasmine.createSpy('startLoadingCb');
    let endLoadingCb = jasmine.createSpy('endLoadingCb');
    spyOn(changeListService, 'discardAllChanges')
      .and.returnValue(Promise.resolve(null));
    spyOn($uibModal, 'open').and.returnValue(
      {
        opened: Promise.resolve(),
        result: Promise.resolve(['1'])
      });

    explorationSaveService.showPublishExplorationModal(
      startLoadingCb, endLoadingCb);
    // We need multiple '$rootScope.$apply()' here since, the source code
    // consists of nested promises.
    $rootScope.$apply();
    tick();
    $rootScope.$apply();
    tick();
    $rootScope.$apply();

    expect(editableSpy).toHaveBeenCalled();
  }));

  it('should open publish exploration modal', fakeAsync(function() {
    let modalSpy = spyOn($uibModal, 'open').and.callThrough();
    let startLoadingCb = jasmine.createSpy('startLoadingCb');
    let endLoadingCb = jasmine.createSpy('endLoadingCb');

    explorationSaveService.showPublishExplorationModal(
      startLoadingCb, endLoadingCb);
    // We need multiple '$rootScope.$apply()' here since, the source code
    // consists of nested promises.
    $rootScope.$apply();
    tick();
    $rootScope.$apply();
    tick();
    $rootScope.$apply();

    expect(modalSpy).toHaveBeenCalled();
  }));

  it('should check whether the exploration is saveable', function() {
    spyOn(changeListService, 'isExplorationLockedForEditing')
      .and.returnValue(false);

    let result = explorationSaveService.isExplorationSaveable();

    expect(result).toBe(false);
  });
});

describe('Exploration save service ' +
  'in case of backend error while saving ' +
  'exploration data it', function() {
  let $uibModal = null;
  let $rootScope = null;
  let explorationSaveService = null;
  let alertsService = null;
  let errorResponse = {
    error: {
      error: 'Error Message'
    }
  };

  importAllAngularServices();
  beforeEach(angular.mock.module('oppia'));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: ExplorationDataService,
          useValue: {
            save(changeList, message, successCb, errorCb) {
              errorCb(errorResponse);
            }
          }
        },
      ]
    });
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));

  beforeEach(angular.mock.inject(function($injector) {
    explorationSaveService = $injector.get('ExplorationSaveService');
    $uibModal = $injector.get('$uibModal');
    $rootScope = $injector.get('$rootScope');
    alertsService = $injector.get('AlertsService');
  }));

  it('should call error callback', fakeAsync(function() {
    let successCb = jasmine.createSpy('success');
    let errorCb = jasmine.createSpy('error');
    let modalSpy = spyOn($uibModal, 'open').and.returnValue(
      {
        opened: Promise.resolve(),
        result: Promise.resolve(['1'])
      });
    let alertsServiceSpy = spyOn(alertsService, 'addWarning');

    explorationSaveService.showPublishExplorationModal(
      successCb, errorCb);
    // We need multiple '$rootScope.$apply()' here since, the source code
    // consists of nested promises.
    $rootScope.$apply();
    tick();
    $rootScope.$apply();
    tick();
    $rootScope.$apply();

    expect(errorCb).toHaveBeenCalled();
    expect(modalSpy).toHaveBeenCalled();
    expect(alertsServiceSpy).toHaveBeenCalled();
  }));
});

describe('Exploration save service ' +
  'while saving changes', function() {
  let $uibModal = null;
  let $timeout = null;
  let $rootScope = null;
  let explorationSaveService = null;
  let changeListService: ChangeListService = null;
  let explorationDiffService = null;
  let ExplorationRightsService = null;
  let ExplorationStatesService = null;
  let ExplorationWarningsService = null;
  let RouterService = null;
  let statesObjectFactory = null;
  let focusManagerService: FocusManagerService = null;

  let statesBackendDict = {
    Hola: {
      content: {
        content_id: 'content',
        html: '{{HtmlValue}}'
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {},
        },
      },
      param_changes: [],
      interaction: {
        id: null,
        answer_groups: [{
          rule_specs: [],
          outcome: {
            dest: '',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'feedback_1',
              html: '{{FeedbackValue}}'
            },
          },
        }],
        default_outcome: {
          dest: 'Hola',
          dest_if_really_stuck: null,
          feedback: {
            content_id: '',
            html: '',
          },
        },
        hints: [],
      },
      written_translations: {
        translations_mapping: {
          content: {},
          default_outcome: {},
        },
      },
    },
    State: {
      content: {
        content_id: 'content',
        html: 'content'
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {},
        }
      },
      param_changes: [],
      interaction: {
        id: null,
        answer_groups: [{
          rule_specs: [],
          outcome: {
            dest: '',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'feedback_1',
              html: '{{StateFeedbackValue}}'
            },
          },
        }],
        default_outcome: {
          dest: 'State',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome',
            html: ''
          },
        },
        hints: []
      },
      written_translations: {
        translations_mapping: {
          content: {},
          default_outcome: {},
        }
      }
    },
    State2: {
      content: {
        content_id: 'content',
        html: 'content'
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {},
        }
      },
      param_changes: [],
      interaction: {
        id: null,
        answer_groups: [{
          rule_specs: [],
          outcome: {
            dest: '',
            dest_if_really_stuck: null,
            feedback: {
              content_id: '',
              html: ''
            }
          }
        }],
        default_outcome: {
          dest: 'State2',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome',
            html: ''
          },
        },
        hints: []
      },
      written_translations: {
        translations_mapping: {
          content: {},
          default_outcome: {},
        }
      }
    },
    State3: {
      content: {
        content_id: 'content',
        html: 'content'
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {},
        }
      },
      param_changes: [],
      interaction: {
        id: null,
        answer_groups: [{
          rule_specs: [],
          outcome: {
            dest: '',
            dest_if_really_stuck: null,
            feedback: {
              content_id: '',
              html: ''
            }
          }
        }],
        default_outcome: {
          dest: 'State2',
          dest_if_really_stuck: null,
          feedback: {
            content_id: '',
            html: ''
          },
        },
        hints: []
      },
      written_translations: {
        translations_mapping: {
          content: {},
          default_outcome: {},
        }
      }
    }
  };

  importAllAngularServices();
  beforeEach(angular.mock.module('oppia'));

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
                init_state_name: 'Hola'
              });
            },
            save(changeList, message, successCb, errorCb) {
              successCb(true, []);
            }
          }
        },
        FocusManagerService
      ]
    });
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));

  beforeEach(angular.mock.inject(function($injector) {
    explorationSaveService = $injector.get('ExplorationSaveService');
    $uibModal = $injector.get('$uibModal');
    $timeout = $injector.get('$timeout');
    $rootScope = $injector.get('$rootScope');
    changeListService = $injector.get('ChangeListService');
    explorationDiffService = $injector.get('ExplorationDiffService');
    ExplorationRightsService = $injector.get('ExplorationRightsService');
    ExplorationStatesService = $injector.get('ExplorationStatesService');
    ExplorationWarningsService = $injector.get('ExplorationWarningsService');
    RouterService = $injector.get('RouterService');
    statesObjectFactory = $injector.get('StatesObjectFactory');
    focusManagerService = $injector.get('FocusManagerService');
  }));

  it('should open exploration save modal', fakeAsync(function() {
    let startLoadingCb = jasmine.createSpy('startLoadingCb');
    let endLoadingCb = jasmine.createSpy('endLoadingCb');
    let sampleStates = statesObjectFactory.createFromBackendDict(
      statesBackendDict);
    spyOn(RouterService, 'savePendingChanges')
      .and.returnValue(null);
    spyOn(ExplorationStatesService, 'getStates')
      .and.returnValue(sampleStates);
    spyOn(explorationDiffService, 'getDiffGraphData')
      .and.returnValue({
        nodes: 'nodes',
        links: ['links'],
        finalStateIds: ['finalStaeIds'],
        originalStateIds: ['Hola'],
        stateIds: [],
      });
    let modalSpy = spyOn($uibModal, 'open').and.callThrough();

    explorationSaveService.saveChangesAsync(
      startLoadingCb, endLoadingCb);
    // We need multiple '$rootScope.$apply()' here since, the source code
    // consists of nested promises.
    flush();
    $rootScope.$apply();
    $timeout.flush();
    flush();
    $rootScope.$apply();

    expect(modalSpy).toHaveBeenCalled();
  }));

  it('should remove focus after exploration save modal ' +
    'is closed', fakeAsync(function() {
    let startLoadingCb = jasmine.createSpy('startLoadingCb');
    let endLoadingCb = jasmine.createSpy('endLoadingCb');
    let sampleStates = statesObjectFactory.createFromBackendDict(
      statesBackendDict);
    let mockEventEmitter = new EventEmitter();
    spyOn(RouterService, 'savePendingChanges')
      .and.returnValue(null);
    spyOn(ExplorationStatesService, 'getStates')
      .and.returnValue(sampleStates);
    spyOn(explorationDiffService, 'getDiffGraphData')
      .and.returnValue({
        nodes: 'nodes',
        links: ['links'],
        finalStateIds: ['finalStaeIds'],
        originalStateIds: ['Hola'],
        stateIds: [],
      });
    spyOn($uibModal, 'open').and.callThrough();
    let focusSpy = spyOnProperty(focusManagerService, 'onFocus')
      .and.returnValue(mockEventEmitter);

    explorationSaveService.saveChangesAsync(
      startLoadingCb, endLoadingCb);
    // We need multiple '$rootScope.$apply()' here since, the source code
    // consists of nested promises.
    flush();
    $rootScope.$apply();
    $timeout.flush();
    flush();
    $rootScope.$apply();

    mockEventEmitter.emit('labelForClearingFocus');
    tick();

    expect(focusSpy).toHaveBeenCalled();
  }));

  it('should not open exploration save modal in case of ' +
    'backend error', fakeAsync(function() {
    let startLoadingCb = jasmine.createSpy('startLoadingCb');
    let endLoadingCb = jasmine.createSpy('endLoadingCb');
    let sampleStates = statesObjectFactory.createFromBackendDict(
      statesBackendDict);
    spyOn(RouterService, 'savePendingChanges')
      .and.returnValue(null);
    spyOn(ExplorationStatesService, 'getStates')
      .and.returnValue(sampleStates);
    spyOn(explorationDiffService, 'getDiffGraphData')
      .and.returnValue({
        nodes: 'nodes',
        links: ['links'],
        finalStateIds: ['finalStaeIds'],
        originalStateIds: ['Hola'],
        stateIds: [],
      });
    spyOn(ExplorationRightsService, 'isPrivate')
      .and.returnValue(false);
    spyOn(ExplorationWarningsService, 'countWarnings')
      .and.returnValue(1);
    spyOn(changeListService, 'discardAllChanges')
      .and.returnValue(Promise.resolve(null));
    let modalSpy = spyOn($uibModal, 'open').and.callThrough();

    expectAsync(
      explorationSaveService.saveChangesAsync(startLoadingCb, endLoadingCb)
    ).toBeRejected();
    flush();
    $rootScope.$apply();

    expect(modalSpy).not.toHaveBeenCalled();
  }));

  it('should not open exploration save modal if ' +
    'it is already opened', fakeAsync(function() {
    let startLoadingCb = jasmine.createSpy('startLoadingCb');
    let endLoadingCb = jasmine.createSpy('endLoadingCb');
    let sampleStates = statesObjectFactory.createFromBackendDict(
      statesBackendDict);
    spyOn(RouterService, 'savePendingChanges')
      .and.returnValue(null);
    spyOn(ExplorationStatesService, 'getStates')
      .and.returnValue(sampleStates);
    spyOn(explorationDiffService, 'getDiffGraphData')
      .and.returnValue({
        nodes: 'nodes',
        links: ['links'],
        finalStateIds: ['finalStaeIds'],
        originalStateIds: ['Hola'],
        stateIds: [],
      });
    let modalSpy = spyOn($uibModal, 'open').and.callThrough();

    // Opening modal first time.
    explorationSaveService.saveChangesAsync(
      startLoadingCb, endLoadingCb);
    // Opening modal second time.
    explorationSaveService.saveChangesAsync(
      startLoadingCb, endLoadingCb);
    // We need multiple '$rootScope.$apply()' here since, the source code
    // consists of nested promises.
    flush();
    $rootScope.$apply();
    flush();
    $rootScope.$apply();

    expect(modalSpy).toHaveBeenCalledTimes(1);
  }));

  it('should focus on the exploration save modal ' +
    'when modal is opened', fakeAsync(function() {
    let startLoadingCb = jasmine.createSpy('startLoadingCb');
    let endLoadingCb = jasmine.createSpy('endLoadingCb');
    let sampleStates = statesObjectFactory.createFromBackendDict(
      statesBackendDict);
    spyOn(RouterService, 'savePendingChanges')
      .and.returnValue(null);
    spyOn(ExplorationStatesService, 'getStates')
      .and.returnValue(sampleStates);
    spyOn(explorationDiffService, 'getDiffGraphData')
      .and.returnValue({
        nodes: 'nodes',
        links: ['links'],
        finalStateIds: ['finalStaeIds'],
        originalStateIds: ['Hola'],
        stateIds: [],
      });
    spyOn(changeListService, 'discardAllChanges')
      .and.returnValue(Promise.resolve(null));
    let focusSpy = spyOn(focusManagerService, 'setFocus')
      .and.returnValue(null);
    let modalSpy = spyOn($uibModal, 'open').and.returnValue(
      {
        opened: Promise.resolve(),
        result: Promise.resolve('commitMessage')
      });

    explorationSaveService.saveChangesAsync(
      startLoadingCb, endLoadingCb);
    // We need multiple '$rootScope.$apply()' here since, the source code
    // consists of nested promises.
    flush();
    $rootScope.$apply();
    $timeout.flush();
    flush();
    $rootScope.$apply();

    expect(modalSpy).toHaveBeenCalled();
    expect(focusSpy).toHaveBeenCalled();
  }));

  it('should not focus on exploration save modal in case ' +
    'of backend error', fakeAsync(function() {
    let startLoadingCb = jasmine.createSpy('startLoadingCb');
    let endLoadingCb = jasmine.createSpy('endLoadingCb');
    let sampleStates = statesObjectFactory.createFromBackendDict(
      statesBackendDict);
    spyOn(RouterService, 'savePendingChanges')
      .and.returnValue(null);
    spyOn(ExplorationStatesService, 'getStates')
      .and.returnValue(sampleStates);
    spyOn(explorationDiffService, 'getDiffGraphData')
      .and.returnValue({
        nodes: 'nodes',
        links: ['links'],
        finalStateIds: ['finalStaeIds'],
        originalStateIds: ['Hola'],
        stateIds: [],
      });
    let modalSpy = spyOn($uibModal, 'open').and.returnValue(
      {
        opened: Promise.resolve(),
        result: Promise.reject()
      });
    let focusSpy = spyOn(focusManagerService, 'setFocus')
      .and.returnValue(null);

    explorationSaveService.saveChangesAsync(
      startLoadingCb, endLoadingCb);
    tick();
    $rootScope.$apply();

    expect(modalSpy).toHaveBeenCalled();
    expect(focusSpy).not.toHaveBeenCalled();
  }));
});
