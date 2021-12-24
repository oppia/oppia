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
 * @fileoverview Unit tests for TrainingDataEditorPanelServiceModalController.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { TestBed } from '@angular/core/testing';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { ExplorationDataService } from 'pages/exploration-editor-page/services/exploration-data.service';
import { UpgradedServices } from 'services/UpgradedServices';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('TrainingDataEditorPanelServiceModalController', function() {
  importAllAngularServices();

  var $scope = null;
  var $uibModalInstance = null;
  var ExplorationStatesService = null;
  var ResponsesService = null;
  var InteractionObjectFactory = null;
  var StateInteractionIdService = null;
  var StateCustomizationArgsService = null;
  var TrainingModalService = null;
  var AlertsService = null;

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
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.module(function($provide) {
    $provide.value('StateEditorService', {
      getActiveStateName: function() {
        return 'Hola';
      }
    });
  }));

  describe('when answer group has rules', function() {
    beforeEach(angular.mock.inject(function($injector, $controller) {
      ExplorationStatesService = $injector.get('ExplorationStatesService');
      ResponsesService = $injector.get('ResponsesService');
      InteractionObjectFactory = $injector.get('InteractionObjectFactory');
      StateInteractionIdService = $injector.get('StateInteractionIdService');
      StateCustomizationArgsService = $injector.get(
        'StateCustomizationArgsService');
      TrainingModalService = $injector.get('TrainingModalService');
      AlertsService = $injector.get('AlertsService');

      ExplorationStatesService.init({
        Hola: {
          content: {
            content_id: '',
            html: 'This is Hola State'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              feedback_1: {}
            },
          },
          param_changes: [],
          interaction: {
            answer_groups: [{
              rule_specs: [],
              outcome: {
                dest: 'Hola',
                feedback: {
                  content_id: 'feedback_1',
                  html: '',
                },
              },
              training_data: ['Answer2']
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
              dest: 'Hola',
              feedback: {
                content_id: 'feedback_1',
                html: '',
              },
            },
            hints: [],
            id: 'TextInput',
            solution: null,
          },
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              feedback_1: {}
            },
          },
        },
      });
      ResponsesService.init(InteractionObjectFactory.createFromBackendDict({
        id: 'TextInput',
        answer_groups: [{
          outcome: {
            dest: '',
            feedback: {
              content_id: 'feedback_2',
              html: ''
            },
          },
          rule_specs: [{
            rule_type: 'Equals',
            inputs: {
              x: {
                contentId: 'rule_input',
                normalizedStrSet: ['c', 'd', 'e']
              }
            }
          }],
          training_data: ['Answer1', 'Answer2']
        }],
        default_outcome: {
          dest: 'Hola',
          feedback: {
            content_id: 'feedback_1',
            html: '',
          },
        },
        confirmed_unclassified_answers: [],
        customization_args: {
          placeholder: {
            value: {
              content_id: 'ca_placeholder_0',
              unicode_str: ''
            }
          },
          rows: { value: 1 }
        },
        hints: [],
      }));
      ResponsesService.changeActiveAnswerGroupIndex(0);
      StateInteractionIdService.init('Hola', 'TextInput');
      StateCustomizationArgsService.init('Hola', {});

      var $rootScope = $injector.get('$rootScope');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      $scope = $rootScope.$new();
      $controller(
        'TrainingDataEditorPanelServiceModalController', {
          $scope: $scope,
          $uibModalInstance: $uibModalInstance
        });
    }));

    it('should initialize $scope properties after controller is initialized',
      function() {
        expect($scope.stateName).toBe('Hola');
        expect($scope.stateContent).toBe('This is Hola State');
        expect($scope.answerGroupHasNonEmptyRules).toBe(true);
        expect($scope.inputTemplate).toBe(
          '<oppia-interactive-text-input ' +
          'label-for-focus-target="testInteractionInput" [last-answer]="null"' +
          '></oppia-interactive-text-input>');
      });

    it('should call init when controller is initialized', function() {
      expect($scope.trainingData).toEqual([{
        answer: 'Answer1',
        answerTemplate: '<oppia-response-text-input answer="&' +
          'amp;quot;Answer1&amp;quot;"></oppia-response-text-input>'
      }, {
        answer: 'Answer2',
        answerTemplate: '<oppia-response-text-input answer="&' +
          'amp;quot;Answer2&amp;quot;"></oppia-response-text-input>'
      }]);
      expect($scope.newAnswerIsAlreadyResolved).toBe(false);
      expect($scope.answerSuccessfullyAdded).toBe(false);
    });

    it('should remove answer from training data', function() {
      $scope.removeAnswerFromTrainingData(0);
      expect($scope.trainingData).toEqual([{
        answer: 'Answer2',
        answerTemplate: '<oppia-response-text-input answer="&' +
          'amp;quot;Answer2&amp;quot;"></oppia-response-text-input>'
      }]);
    });

    it('should submit answer that is explicity classified', function() {
      $scope.submitAnswer('Answer2');

      expect($scope.newAnswerTemplate).toBe(
        '<oppia-response-text-input answer="&amp;quot;Answer2&' +
        'amp;quot;"></oppia-response-text-input>');
      expect($scope.newAnswerFeedback).toEqual(
        SubtitledHtml.createDefault('', 'feedback_1'));
      expect($scope.newAnswerOutcomeDest).toBe('(try again)');
      expect($scope.newAnswerIsAlreadyResolved).toBe(true);
    });

    it('should submit answer that is not explicity classified', function() {
      var addSuccessMessageSpy = spyOn(AlertsService, 'addSuccessMessage')
        .and.callThrough();
      $scope.submitAnswer('Answer1');

      expect($scope.newAnswerTemplate).toBe(
        '<oppia-response-text-input answer="&amp;quot;Answer1&' +
        'amp;quot;"></oppia-response-text-input>');
      expect($scope.newAnswerFeedback).toEqual(
        SubtitledHtml.createDefault('', 'feedback_1'));
      expect($scope.newAnswerOutcomeDest).toBe('(try again)');
      expect($scope.newAnswerIsAlreadyResolved).toBe(false);
      expect(addSuccessMessageSpy).toHaveBeenCalledWith(
        'The answer Answer1 has been successfully trained.', 1000);
    });

    it('should open train unresolved answer modal', function() {
      var addSuccessMessageSpy = spyOn(AlertsService, 'addSuccessMessage')
        .and.callThrough();
      spyOn(TrainingModalService, 'openTrainUnresolvedAnswerModal').and
        .callFake(function(answer, callback) {
          callback();
        });

      $scope.openTrainUnresolvedAnswerModal(1);
      expect(addSuccessMessageSpy).toHaveBeenCalledWith(
        'The answer Answer2 has been successfully trained.', 1000);
    });

    it('should exit modal', function() {
      expect(true).toBe(true);
      $scope.exit();
      expect($uibModalInstance.close).toHaveBeenCalled();
    });
  });

  describe('when answer group does not have rule and has at least 2' +
    ' training data', function() {
    beforeEach(angular.mock.inject(function($injector, $controller) {
      ExplorationStatesService = $injector.get('ExplorationStatesService');
      ResponsesService = $injector.get('ResponsesService');
      InteractionObjectFactory = $injector.get('InteractionObjectFactory');
      StateInteractionIdService = $injector.get('StateInteractionIdService');
      StateCustomizationArgsService = $injector.get(
        'StateCustomizationArgsService');
      TrainingModalService = $injector.get('TrainingModalService');
      AlertsService = $injector.get('AlertsService');

      ExplorationStatesService.init({
        Hola: {
          content: {
            content_id: '',
            html: 'This is Hola State'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              feedback_1: {}
            },
          },
          param_changes: [],
          interaction: {
            answer_groups: [{
              rule_specs: [],
              outcome: {
                dest: 'Hola',
                feedback: {
                  content_id: 'feedback_1',
                  html: '',
                },
              },
              training_data: ['Answer2']
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
              dest: 'Hola',
              feedback: {
                content_id: 'feedback_1',
                html: '',
              },
            },
            hints: [],
            id: 'TextInput',
            solution: null,
          },
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              feedback_1: {}
            },
          },
        },
      });
      ResponsesService.init(InteractionObjectFactory.createFromBackendDict({
        id: 'TextInput',
        answer_groups: [{
          outcome: {
            dest: '',
            feedback: {
              content_id: 'feedback_2',
              html: ''
            },
          },
          rule_specs: [],
          training_data: ['Answer1', 'Answer2']
        }],
        default_outcome: {
          dest: 'Hola',
          feedback: {
            content_id: 'feedback_1',
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
      ResponsesService.changeActiveAnswerGroupIndex(0);
      StateInteractionIdService.init('Hola', 'TextInput');
      StateCustomizationArgsService.init('Hola', {});

      var $rootScope = $injector.get('$rootScope');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      $scope = $rootScope.$new();
      $controller(
        'TrainingDataEditorPanelServiceModalController', {
          $scope: $scope,
          $uibModalInstance: $uibModalInstance
        });
    }));

    it('should open train unresolved answer modal', function() {
      var addSuccessMessageSpy = spyOn(AlertsService, 'addSuccessMessage')
        .and.callThrough();
      spyOn(TrainingModalService, 'openTrainUnresolvedAnswerModal').and
        .callFake(function(answer, callback) {
          callback();
        });

      $scope.openTrainUnresolvedAnswerModal(1);
      expect(addSuccessMessageSpy).toHaveBeenCalledWith(
        'The answer Answer2 has been successfully trained.', 1000);
    });
  });

  describe('when answer group does not have rule and has one training' +
    ' data', function() {
    beforeEach(angular.mock.inject(function($injector, $controller) {
      ExplorationStatesService = $injector.get('ExplorationStatesService');
      ResponsesService = $injector.get('ResponsesService');
      InteractionObjectFactory = $injector.get('InteractionObjectFactory');
      StateInteractionIdService = $injector.get('StateInteractionIdService');
      StateCustomizationArgsService = $injector.get(
        'StateCustomizationArgsService');
      TrainingModalService = $injector.get('TrainingModalService');
      AlertsService = $injector.get('AlertsService');

      ExplorationStatesService.init({
        Hola: {
          content: {
            content_id: '',
            html: 'This is Hola State'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              feedback_1: {}
            },
          },
          param_changes: [],
          interaction: {
            answer_groups: [{
              rule_specs: [],
              outcome: {
                dest: 'Hola',
                feedback: {
                  content_id: 'feedback_1',
                  html: '',
                },
              },
              training_data: ['Answer2']
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
              dest: 'Hola',
              feedback: {
                content_id: 'feedback_1',
                html: '',
              },
            },
            hints: [],
            id: 'TextInput',
            solution: null,
          },
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              feedback_1: {}
            },
          },
        },
      });
      ResponsesService.init(InteractionObjectFactory.createFromBackendDict({
        id: 'TextInput',
        answer_groups: [{
          outcome: {
            dest: '',
            feedback: {
              content_id: 'feedback_2',
              html: ''
            },
          },
          rule_specs: [],
          training_data: ['Answer1']
        }],
        default_outcome: {
          dest: 'Hola',
          feedback: {
            content_id: 'feedback_1',
            html: '',
          },
        },
        confirmed_unclassified_answers: [],
        customization_args: {
          placeholder: {
            value: {
              content_id: 'ca_placeholder_0',
              unicode_str: ''
            }
          },
          rows: { value: 1 }
        },
        hints: [],
      }));
      ResponsesService.changeActiveAnswerGroupIndex(0);
      StateInteractionIdService.init('Hola', 'TextInput');
      StateCustomizationArgsService.init('Hola', {});

      var $rootScope = $injector.get('$rootScope');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      $scope = $rootScope.$new();
      $controller(
        'TrainingDataEditorPanelServiceModalController', {
          $scope: $scope,
          $uibModalInstance: $uibModalInstance
        });
    }));

    it('should open train unresolved answer modal', function() {
      var openTrainUnresolvedAnswerModalSpy = spyOn(
        TrainingModalService, 'openTrainUnresolvedAnswerModal').and
        .callThrough();

      $scope.openTrainUnresolvedAnswerModal(1);
      expect(openTrainUnresolvedAnswerModalSpy).not.toHaveBeenCalled();
    });
  });
});
