// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the controller of the 'State Editor'.
 */

import { EventEmitter } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { EditabilityService } from 'services/editability.service';
import { StateEditorService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-editor.service';
import { StateNameService } from
  'components/state-editor/state-editor-properties-services/state-name.service';
import { StateEditorRefreshService } from
  'pages/exploration-editor-page/services/state-editor-refresh.service';
import { ExplorationImprovementsTaskRegistryService } from
  'services/exploration-improvements-task-registry.service';
import { ExplorationStatsService } from 'services/exploration-stats.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { importAllAngularServices } from 'tests/unit-test-utils';

describe('State Name Editor component', function() {
  var ctrl = null;
  var $httpBackend = null;
  var $rootScope = null;
  var $scope = null;
  var editabilityService = null;
  var explorationStatesService = null;
  var routerService = null;
  var stateEditorService = null;
  var stateNameService = null;

  var mockExternalSaveEventEmitter = null;

  var mockExplorationData = {
    explorationId: 0,
    autosaveChangeList: function() {}
  };

  var autosaveDraftUrl = 'createhandler/autosave_draft/0';
  var validAutosaveResponse = {
    is_version_of_draft_valid: true
  };

  importAllAngularServices();

  beforeEach(angular.mock.module('directiveTemplates'));

  beforeEach(function() {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    editabilityService = TestBed.get(EditabilityService);
    stateEditorService = TestBed.get(StateEditorService);
    stateNameService = TestBed.get(StateNameService);
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('ExplorationDataService', mockExplorationData);
    $provide.value(
      'ExplorationImprovementsTaskRegistryService',
      TestBed.get(ExplorationImprovementsTaskRegistryService));
    $provide.value(
      'ExplorationStatsService', TestBed.get(ExplorationStatsService));
    $provide.value(
      'StateEditorRefreshService', TestBed.get(StateEditorRefreshService));
    $provide.constant('INVALID_NAME_CHARS', '#@&^%$');
    mockExternalSaveEventEmitter = new EventEmitter();
    $provide.value('ExternalSaveService', {
      onExternalSave: mockExternalSaveEventEmitter
    });
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $httpBackend = $injector.get('$httpBackend');
    $rootScope = $injector.get('$rootScope');
    explorationStatesService = $injector.get('ExplorationStatesService');
    routerService = $injector.get('RouterService');

    spyOn(mockExplorationData, 'autosaveChangeList');
    spyOn(stateNameService, 'isStateNameEditorShown').and.returnValue(true);

    explorationStatesService.init({
      'First State': {
        content: {
          content_id: 'content',
          html: 'First State Content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {}
          }
        },
        interaction: {
          id: null,
          answer_groups: [],
          default_outcome: {
            dest: 'Second State',
            feedback: {
              content_id: 'default_outcome',
              html: ''
            },
            param_changes: []
          },
          hints: []
        },
        param_changes: [],
        solicit_answer_details: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {}
          }
        },
      },
      'Second State': {
        content: {
          content_id: 'content',
          html: 'Second State Content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {}
          }
        },
        interaction: {
          id: null,
          answer_groups: [],
          default_outcome: {
            dest: 'Second State',
            feedback: {
              content_id: 'default_outcome',
              html: ''
            },
            param_changes: []
          },
          hints: []
        },
        param_changes: [],
        solicit_answer_details: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {}
          }
        },
      },
      'Third State': {
        content: {
          content_id: 'content',
          html: 'This is some content.'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {}
          }
        },
        interaction: {
          id: null,
          answer_groups: [],
          default_outcome: {
            dest: 'Second State',
            feedback: {
              content_id: 'default_outcome',
              html: ''
            },
            param_changes: []
          },
          hints: []
        },
        param_changes: [{
          name: 'comparison',
          generator_id: 'Copier',
          customization_args: {
            value: 'something clever',
            parse_with_jinja: false
          }
        }],
        solicit_answer_details: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {}
          }
        },
      }
    });

    $scope = $rootScope.$new();
    ctrl = $componentController('stateNameEditor', {
      $scope: $scope,
      EditabilityService: editabilityService,
      StateEditorService: stateEditorService,
      StateNameService: stateNameService
    });
    ctrl.$onInit();
  }));

  afterEach(() => {
    ctrl.$onDestroy();
  });

  it('should not save state name when it is longer than 50 characters',
    function() {
      expect(ctrl.saveStateName(
        'babababababababababababababababababababababababababab')).toBe(false);
    });

  it('should not save state names when it contains invalid characteres',
    function() {
      stateEditorService.setActiveStateName('Third State');
      ctrl.initStateNameEditor();
      expect(ctrl.saveStateName('#')).toBe(false);
    });

  it('should not save duplicate state names when trying to save a state' +
    ' that already exists', function() {
    expect(ctrl.saveStateName('Second State')).toBe(false);
  });

  it('should save state name and refresh to main tab when submitting' +
    ' state name form', function() {
    spyOn(routerService, 'navigateToMainTab');
    stateEditorService.setActiveStateName('First State');
    ctrl.initStateNameEditor();

    ctrl.saveStateNameAndRefresh('Fourth State');
    expect(routerService.navigateToMainTab).toHaveBeenCalled();
  });

  it('should save state names independently when editting more than one state',
    fakeAsync(() => {
      stateEditorService.setActiveStateName('Third State');
      ctrl.saveStateName('Fourth State');
      tick(200);
      expect(explorationStatesService.getState('Fourth State')).toBeTruthy();
      expect(explorationStatesService.getState('Third State')).toBeFalsy();

      stateEditorService.setActiveStateName('First State');
      ctrl.saveStateName('Fifth State');
      tick(200);
      expect(explorationStatesService.getState('Fifth State')).toBeTruthy();
      expect(explorationStatesService.getState('First State')).toBeFalsy();
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    }));

  it('should not re-save state names when it did not changed', function() {
    stateEditorService.setActiveStateName('Second State');
    ctrl.initStateNameEditor();
    ctrl.openStateNameEditor();
    expect(ctrl.saveStateName('Second State')).toBe(false);
  });

  it('should not change state name when state name edits fail', function() {
    stateEditorService.setActiveStateName('Third State');
    ctrl.initStateNameEditor();
    ctrl.openStateNameEditor();

    // This is not a valid state name.
    ctrl.saveStateName('#!% State');
    expect(stateEditorService.getActiveStateName()).toEqual('Third State');
    expect(mockExplorationData.autosaveChangeList).not.toHaveBeenCalled();

    // Long state names will not save.
    ctrl.saveStateName(
      'This state name is too long to be saved. Try to be brief next time.'
    );
    expect(stateEditorService.getActiveStateName()).toEqual('Third State');
    expect(mockExplorationData.autosaveChangeList).not.toHaveBeenCalled();

    // This will not save because it is an already existing state name.
    ctrl.saveStateName('First State');
    expect(stateEditorService.getActiveStateName()).toEqual('Third State');
    expect(mockExplorationData.autosaveChangeList).not.toHaveBeenCalled();

    // Will not save because the memento is the same as the new state name.
    ctrl.saveStateName('Third State');
    expect(stateEditorService.getActiveStateName()).toEqual('Third State');
    expect(mockExplorationData.autosaveChangeList).not.toHaveBeenCalled();
  });

  it('should save state name when ExternalSave event occurs', function() {
    spyOn(ctrl, 'saveStateName');
    ctrl.tmpStateName = 'SampleState';
    mockExternalSaveEventEmitter.emit();
    expect(ctrl.saveStateName).toHaveBeenCalledWith('SampleState');
  });
});
