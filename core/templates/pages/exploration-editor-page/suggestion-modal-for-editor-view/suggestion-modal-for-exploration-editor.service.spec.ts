// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit test for Suggestion Modal For Exploration Editor.
 */

import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('Suggestion Modal For Exploration Editor', () => {
  let $rootScope = null;
  let $scope = null;
  let $uibModal = null;
  let $q = null;
  let $log = null;

  let smfees = null;
  let activeThread;
  let extraParams;
  let ThreadDataBackendApiService;
  let ExplorationDataService;
  let ExplorationStatesService;
  let stateDict = {
    content: {
      content_id: 'content',
      html: 'content'
    },
    recorded_voiceovers: {
      voiceovers_mapping: {
        content: {},
        default_outcome: {},
        feedback_1: {},
        feedback_2: {}
      }
    },
    interaction: {
      id: 'TextInput',
      customization_args: {
        placeholder: {
          value: {
            content_id: 'ca_placeholder_0',
            unicode_str: ''
          }
        },
        rows: { value: 1 }
      },
      answer_groups: [{
        outcome: {
          dest: 'outcome 1',
          feedback: {
            content_id: 'feedback_1',
            html: ''
          },
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        },
        rule_specs: [{
          rule_type: 'Equals',
          inputs: {
            x: {
              contentId: 'rule_input_0',
              normalizedStrSet: ['10']
            }
          }
        }],
      }, {
        outcome: {
          dest: 'outcome 2',
          feedback: {
            content_id: 'feedback_2',
            html: ''
          },
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        },
        rule_specs: [{
          rule_type: 'Equals',
          inputs: {
            x: {
              contentId: 'rule_input_1',
              normalizedStrSet: ['5']
            }
          }
        }, {
          rule_type: 'Equals',
          inputs: {
            x: {
              contentId: 'rule_input_2',
              normalizedStrSet: ['6']
            }
          }
        }, {
          rule_type: 'FuzzyEquals',
          inputs: {
            x: {
              contentId: 'rule_input_3',
              normalizedStrSet: ['7']
            }
          }
        }],
      }],
      default_outcome: {
        dest: 'default',
        feedback: {
          content_id: 'default_outcome',
          html: ''
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null
      },
      hints: []
    },
    param_changes: [],
    solicit_answer_details: false,
    written_translations: {
      translations_mapping: {
        content: {},
        default_outcome: {},
        feedback_1: {},
        feedback_2: {}
      }
    }
  };

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));
  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector) {
    $uibModal = $injector.get('$uibModal');
    $q = $injector.get('$q');
    $log = $injector.get('$log');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

    smfees = $injector.get('SuggestionModalForExplorationEditorService');
    ThreadDataBackendApiService = $injector.get('ThreadDataBackendApiService');
    ExplorationDataService = $injector.get('ExplorationDataService');
    ExplorationStatesService = $injector.get('ExplorationStatesService');

    activeThread = {
      getSuggestion: () => {
        return {
          stateName: 'Hola'
        };
      },
      getSuggestionStateName: () => {},
      getSuggestionStatus: () => {},
      getReplacementHtmlFromSuggestion: () => {
        return '<p> Replacement HTML </p>';
      },
      threadId: 'id',
    };
    extraParams = {
      activeThread: activeThread,
      isSuggestionHandled: () => {},
      hasUnsavedChanges: () => {},
      isSuggestionValid: () => {},
      setActiveThread: () => {}
    };
    spyOn(ExplorationStatesService, 'setState');
    spyOn(ExplorationStatesService, 'getState').and.returnValue({
      content: {
        html: 'html'
      }
    });

    ExplorationDataService.data = {
      states: {
        Hola: stateDict
      },
      version: 10
    };
  }));

  it('should open suggestion modal', () => {
    spyOn($uibModal, 'open').and.callFake((options) => {
      options.resolve.currentContent();
      options.resolve.newContent();
      options.resolve.suggestionIsHandled();
      options.resolve.suggestionIsValid();
      options.resolve.suggestionStatus();
      options.resolve.threadUibModalInstance();
      options.resolve.unsavedChangesExist();
      return {
        result: $q.resolve({
          action: 'accept',
          audioUpdateRequired: true
        })
      };
    });
    spyOn(ThreadDataBackendApiService, 'resolveSuggestionAsync')
      .and.returnValue($q.resolve());

    smfees.showSuggestionModal('edit_exploration_state_content', extraParams);
    $scope.$apply();

    expect(ExplorationDataService.data.version).toBe(11);
    expect(ExplorationStatesService.setState).toHaveBeenCalled();
  });

  it('should error if there is problem while resolving suggestion', () => {
    spyOn(ThreadDataBackendApiService, 'resolveSuggestionAsync')
      .and.returnValue($q.reject());
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve({
        action: 'accept',
        audioUpdateRequired: true
      })
    });
    spyOn($log, 'error');

    smfees.showSuggestionModal('edit_exploration_state_content', extraParams);
    $scope.$apply();

    expect($log.error).toHaveBeenCalledWith('Error resolving suggestion');
  });

  it('should throw error on trying to show suggestion of a' +
    ' non-existent thread', () => {
    extraParams.activeThread = undefined;

    expect(() => {
      smfees.showSuggestionModal('edit_exploration_state_content', extraParams);
    }).toThrowError('Trying to show suggestion of a non-existent thread.');
  });
});
