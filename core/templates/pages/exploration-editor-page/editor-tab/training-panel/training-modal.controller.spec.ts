// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for TrainingModalController.
 */

import { TestBed } from '@angular/core/testing';
import { ExplorationDataService } from 'pages/exploration-editor-page/services/exploration-data.service';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('Training Modal Controller', function() {
  var $rootScope = null;
  var $scope = null;
  var $uibModalInstance;
  var callbackSpy = jasmine.createSpy('callback');
  var StateEditorService = null;
  var ExplorationStatesService = null;
  var StateInteractionIdService = null;
  var ResponsesService = null;
  var InteractionObjectFactory = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ExplorationDataService,
          useValue: {
            explorationId: 0,
            autosaveChangeListAsync() {
              return;
            }
          }
        }
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

  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    StateEditorService = $injector.get('StateEditorService');
    ExplorationStatesService = $injector.get('ExplorationStatesService');
    StateInteractionIdService = $injector.get('StateInteractionIdService');
    ResponsesService = $injector.get('ResponsesService');
    InteractionObjectFactory = $injector.get('InteractionObjectFactory');
  }));

  describe('when answer group index is equal to response answer groups count',
    function() {
      beforeEach(angular.mock.inject(function($injector, $controller) {
        callbackSpy = jasmine.createSpy('callback');
        $uibModalInstance = jasmine.createSpyObj(['close', 'dismiss']);
        ExplorationStatesService.init({
          Init: {
            content: {
              content_id: '',
              html: ''
            },
            recorded_voiceovers: {
              voiceovers_mapping: {},
            },
            param_changes: [],
            interaction: {
              id: 'TextInput',
              answer_groups: [{
                rule_specs: [],
                outcome: {
                  dest: '',
                  feedback: {
                    content_id: '',
                    html: '',
                  }
                },
                training_data: ['Not the answer']
              }, {
                rule_specs: [],
                outcome: {
                  dest: '',
                  feedback: {
                    content_id: '',
                    html: '',
                  }
                },
                training_data: ['This is the answer']
              }],
              customization_args: {
                placeholder: {
                  value: {
                    content_id: 'ca_placeholder_0',
                    unicode_str: ''
                  }
                },
                rows: { value: 1 }
              },
              default_outcome: {
                dest: '',
                feedback: {
                  content_id: '',
                  html: '',
                },
              },
              hints: [],
            },
            written_translations: {
              translations_mapping: {},
            }
          },
        });
        StateEditorService.activeStateName = 'Init';
        StateInteractionIdService.init('Init', 'TextInput');
        ResponsesService.init(InteractionObjectFactory.createFromBackendDict({
          id: 'TextInput',
          answer_groups: [{
            outcome: {
              dest: 'Init',
              feedback: {
                content_id: '',
                html: ''
              },
            },
            training_data: ['This is the answer'],
            rule_specs: [],
          }],
          customization_args: {
            placeholder: {
              value: {
                content_id: 'ca_placeholder_0',
                unicode_str: ''
              }
            },
            rows: { value: 1 }
          },
          default_outcome: {
            dest: 'Init',
            feedback: {
              content_id: '',
              html: '',
            }
          },
          hints: [],
          confirmed_unclassified_answers: []
        }));

        $scope = $rootScope.$new();
        $controller('TrainingModalController', {
          $scope: $scope,
          $injector: $injector,
          $uibModalInstance: $uibModalInstance,
          unhandledAnswer: 'This is the answer',
          finishTrainingCallback: callbackSpy
        });
      }));

      it('should click on confirm button', function() {
        var answerGroups = (
          ExplorationStatesService.getInteractionAnswerGroupsMemento('Init'));
        var defaultOutcome = (
          ExplorationStatesService.getInteractionDefaultOutcomeMemento(
            'Init'));

        expect(answerGroups[0].outcome.dest).toBe('');
        expect(answerGroups[0].trainingData).toEqual(
          ['Not the answer']);
        expect(answerGroups[1].outcome.dest).toBe('');
        expect(answerGroups[1].trainingData).toEqual(
          ['This is the answer']);
        expect(defaultOutcome.dest).toBe('');

        $scope.onConfirm();
        expect($uibModalInstance.close).toHaveBeenCalled();
        expect(callbackSpy).toHaveBeenCalled();

        var updatedAnswerGroups = (
          ExplorationStatesService.getInteractionAnswerGroupsMemento('Init'));
        var updatedDefaultOutcome = (
          ExplorationStatesService.getInteractionDefaultOutcomeMemento(
            'Init'));

        expect(updatedAnswerGroups[0].outcome.dest).toBe('Init');
        expect(updatedAnswerGroups[0].trainingData).toEqual([]);
        expect(updatedDefaultOutcome.dest).toBe('Init');
      });

      it('should exit training modal', function() {
        $scope.exitTrainer();
        expect($uibModalInstance.close).toHaveBeenCalled();
      });
    });

  describe('when anwer group index is greater than response answer groups' +
    ' count', function() {
    var $scope = null;
    var $uibModalInstance;
    var callbackSpy = jasmine.createSpy('callback');
    var StateEditorService = null;
    var ExplorationStatesService = null;
    var StateInteractionIdService = null;
    var ResponsesService = null;
    var InteractionObjectFactory = null;

    beforeEach(angular.mock.inject(function($injector, $controller) {
      var $rootScope = $injector.get('$rootScope');
      StateEditorService = $injector.get('StateEditorService');
      ExplorationStatesService = $injector.get('ExplorationStatesService');
      StateInteractionIdService = $injector.get('StateInteractionIdService');
      ResponsesService = $injector.get('ResponsesService');
      InteractionObjectFactory = $injector.get('InteractionObjectFactory');

      $uibModalInstance = jasmine.createSpyObj(['close', 'dismiss']);
      ExplorationStatesService.init({
        Init: {
          content: {
            content_id: '',
            html: ''
          },
          recorded_voiceovers: {
            voiceovers_mapping: {},
          },
          param_changes: [],
          interaction: {
            answer_groups: [{
              outcome: {
                dest: '',
                feedback: {
                  content_id: '',
                  html: '',
                }
              },
              training_data: ['Not the answer'],
              rule_specs: [],
            }, {
              outcome: {
                dest: '',
                feedback: {
                  content_id: '',
                  html: '',
                },
              },
              training_data: ['Answer'],
              rule_specs: [],
            }, {
              outcome: {
                dest: '',
                feedback: {
                  content_id: '',
                  html: '',
                }
              },
              training_data: ['This is the answer'],
              rule_specs: [],
            }],
            customization_args: {
              placeholder: {
                value: {
                  content_id: 'ca_placeholder_0',
                  unicode_str: 'Type your answer here.'
                }
              },
              rows: { value: 1 }
            },
            default_outcome: {
              dest: '',
              feedback: {
                content_id: '',
                html: '',
              }
            },
            hints: [],
            id: 'TextInput'
          },
          written_translations: {
            translations_mapping: {},
          }
        },
      });
      StateEditorService.activeStateName = 'Init';
      StateInteractionIdService.init('Init', 'TextInput');
      ResponsesService.init(InteractionObjectFactory.createFromBackendDict({
        id: 'TextInput',
        answer_groups: [{
          outcome: {
            dest: 'Init',
            feedback: {
              content_id: '',
              html: ''
            },
          },
          training_data: ['This is the answer'],
          rule_specs: [],
        }],
        customization_args: {
          placeholder: {
            value: {
              content_id: 'ca_placeholder_0',
              unicode_str: ''
            }
          },
          rows: { value: 1 }
        },
        default_outcome: {
          dest: 'Init',
          feedback: {
            content_id: '',
            html: '',
          }
        },
        hints: [],
        confirmed_unclassified_answers: []
      }));
      $scope = $rootScope.$new();
      $controller('TrainingModalController', {
        $scope: $scope,
        $injector: $injector,
        $uibModalInstance: $uibModalInstance,
        unhandledAnswer: 'This is the answer',
        finishTrainingCallback: callbackSpy
      });
    }));

    it('should click on confirm button', function() {
      var answerGroups = (
        ExplorationStatesService.getInteractionAnswerGroupsMemento('Init'));
      expect(answerGroups[0].trainingData).toEqual(['Not the answer']);
      expect(answerGroups[1].trainingData).toEqual(['Answer']);
      expect(answerGroups[2].trainingData).toEqual(['This is the answer']);

      $scope.onConfirm();
      expect($uibModalInstance.close).toHaveBeenCalled();

      var upgatedAnswerGroups = (
        ExplorationStatesService.getInteractionAnswerGroupsMemento('Init'));
      expect(upgatedAnswerGroups[0].trainingData).toEqual([]);
      expect(upgatedAnswerGroups[1].trainingData).toEqual(
        ['This is the answer']);
      expect(upgatedAnswerGroups[2]).toBeUndefined();
    });

    it('should exit training modal', function() {
      $scope.exitTrainer();
      expect($uibModalInstance.close).toHaveBeenCalled();
    });
  });

  describe('when anwer group index is less than response answer groups count',
    function() {
      beforeEach(angular.mock.inject(function($injector, $controller) {
        var $rootScope = $injector.get('$rootScope');
        StateEditorService = $injector.get('StateEditorService');
        ExplorationStatesService = $injector.get('ExplorationStatesService');
        StateInteractionIdService = $injector.get('StateInteractionIdService');
        ResponsesService = $injector.get('ResponsesService');
        InteractionObjectFactory = $injector.get('InteractionObjectFactory');

        $uibModalInstance = jasmine.createSpyObj(['close', 'dismiss']);
        ExplorationStatesService.init({
          Init: {
            content: {
              content_id: '',
              html: ''
            },
            recorded_voiceovers: {
              voiceovers_mapping: {},
            },
            param_changes: [],
            interaction: {
              answer_groups: [{
                rule_specs: [],
                outcome: {
                  dest: '',
                  feedback: {
                    content_id: '',
                    html: '',
                  },
                },
                training_data: ['']
              }],
              customization_args: {
                placeholder: {
                  value: {
                    content_id: 'ca_placeholder_0',
                    unicode_str: ''
                  }
                },
                rows: { value: 1 }
              },
              default_outcome: {
                dest: '',
                feedback: {
                  content_id: '',
                  html: '',
                },
              },
              hints: [],
              id: 'TextInput',
            },
            written_translations: {
              translations_mapping: {},
            }
          },
        });
        StateEditorService.activeStateName = 'Init';
        StateInteractionIdService.init('Init', 'TextInput');
        ResponsesService.init(InteractionObjectFactory.createFromBackendDict({
          id: 'TextInput',
          answer_groups: [{
            outcome: {
              dest: 'Init',
              feedback: {
                content_id: '',
                html: ''
              },
            },
            rule_specs: [],
            training_data: []
          }, {
            outcome: {
              dest: 'Hola',
              feedback: {
                content_id: '',
                html: ''
              },
            },
            rule_specs: [],
            training_data: []
          }],
          default_outcome: {
            dest: 'Hola',
            feedback: {
              content_id: '',
              html: '',
            },
          },
          confirmed_unclassified_answers: [],
          customization_args: {
            rows: {
              value: true
            },
            placeholder: {
              value: {
                content_id: 'ca_placeholder_0',
                unicode_str: ''
              }
            }
          },
          hints: [],
        }));
        $scope = $rootScope.$new();
        $controller('TrainingModalController', {
          $scope: $scope,
          $injector: $injector,
          $uibModalInstance: $uibModalInstance,
          unhandledAnswer: 'This is the answer',
          finishTrainingCallback: callbackSpy
        });
      }));

      it('should click on confirm button', function() {
        var answerGroups = (
          ExplorationStatesService.getInteractionAnswerGroupsMemento('Init'));

        expect(answerGroups[0].trainingData).toEqual(['']);
        expect(answerGroups[1]).toBeUndefined();

        $scope.onConfirm();
        expect($uibModalInstance.close).toHaveBeenCalled();
        expect(callbackSpy).toHaveBeenCalled();

        var upgatedAnswerGroups = (
          ExplorationStatesService.getInteractionAnswerGroupsMemento('Init'));

        expect(upgatedAnswerGroups[0].trainingData).toEqual([]);
        expect(upgatedAnswerGroups[1].trainingData).toEqual(
          ['This is the answer']);
      });

      it('should exit training modal', function() {
        $scope.exitTrainer();
        expect($uibModalInstance.close).toHaveBeenCalled();
      });
    });
});
