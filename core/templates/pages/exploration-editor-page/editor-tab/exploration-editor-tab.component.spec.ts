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
 * @fileoverview Unit tests for the component of the 'State Editor'.
 */

import { TestBed } from '@angular/core/testing';
import { AngularNameService } from
  'pages/exploration-editor-page/services/angular-name.service';
import { AnswerClassificationResultObjectFactory } from
  'domain/classifier/AnswerClassificationResultObjectFactory';
import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { AnswerStatsObjectFactory } from
  'domain/exploration/AnswerStatsObjectFactory';
import { ClassifierObjectFactory } from
  'domain/classifier/ClassifierObjectFactory';
import { ExplorationDraftObjectFactory } from
  'domain/exploration/ExplorationDraftObjectFactory';
import { ExplorationFeaturesService } from
  'services/exploration-features.service';
import { FractionObjectFactory } from 'domain/objects/FractionObjectFactory';
import { HintObjectFactory } from 'domain/exploration/HintObjectFactory';
import { ImprovementsService } from 'services/improvements.service';
import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { ParamChangeObjectFactory } from
  'domain/exploration/ParamChangeObjectFactory';
import { ParamChangesObjectFactory } from
  'domain/exploration/ParamChangesObjectFactory';
import { ParamMetadataObjectFactory } from
  'domain/exploration/ParamMetadataObjectFactory';
import { RecordedVoiceoversObjectFactory } from
  'domain/exploration/RecordedVoiceoversObjectFactory';
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory';
import { SolutionValidityService } from
  // eslint-disable-next-line max-len
  'pages/exploration-editor-page/editor-tab/services/solution-validity.service';
import { StateClassifierMappingService } from
  'pages/exploration-player-page/services/state-classifier-mapping.service';
import { StateEditorService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-editor.service';
import { SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory';
import { UnitsObjectFactory } from 'domain/objects/UnitsObjectFactory';
import { VoiceoverObjectFactory } from
  'domain/exploration/VoiceoverObjectFactory';
import { WrittenTranslationObjectFactory } from
  'domain/exploration/WrittenTranslationObjectFactory';
import { WrittenTranslationsObjectFactory } from
  'domain/exploration/WrittenTranslationsObjectFactory';
import { SolutionObjectFactory } from
  'domain/exploration/SolutionObjectFactory';
import { SubtitledUnicode } from
  'domain/exploration/SubtitledUnicodeObjectFactory';

// TODO(#7222): Remove usage of UpgradedServices once upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';

describe('Exploration editor tab component', function() {
  var ctrl;
  var $q = null;
  var $scope = null;
  var $rootScope = null;
  var $uibModal = null;
  var answerGroupObjectFactory = null;
  var explorationFeaturesService = null;
  var explorationInitStateNameService = null;
  var explorationStatesService = null;
  var explorationWarningsService = null;
  var hintObjectFactory = null;
  var outcomeObjectFactory = null;
  var routerService = null;
  var solutionObjectFactory = null;
  var stateEditorService = null;
  var subtitledHtmlObjectFactory = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    const ugs = new UpgradedServices();
    for (const [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(function() {
    answerGroupObjectFactory = TestBed.get(AnswerGroupObjectFactory);
    explorationFeaturesService = TestBed.get(ExplorationFeaturesService);
    hintObjectFactory = TestBed.get(HintObjectFactory);
    outcomeObjectFactory = TestBed.get(OutcomeObjectFactory);
    solutionObjectFactory = TestBed.get(SolutionObjectFactory);
    subtitledHtmlObjectFactory = TestBed.get(SubtitledHtmlObjectFactory);
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('AngularNameService', TestBed.get(AngularNameService));
    $provide.value(
      'AnswerClassificationResultObjectFactory',
      TestBed.get(AnswerClassificationResultObjectFactory));
    $provide.value(
      'AnswerGroupObjectFactory', answerGroupObjectFactory);
    $provide.value(
      'AnswerStatsObjectFactory', TestBed.get(AnswerStatsObjectFactory));
    $provide.value(
      'ClassifierObjectFactory', TestBed.get(ClassifierObjectFactory));
    $provide.value(
      'ExplorationDraftObjectFactory',
      TestBed.get(ExplorationDraftObjectFactory));
    $provide.value(
      'ExplorationFeaturesService', explorationFeaturesService);
    $provide.value('FractionObjectFactory', TestBed.get(FractionObjectFactory));
    $provide.value('HintObjectFactory', hintObjectFactory);
    $provide.value('ImprovementsService', TestBed.get(ImprovementsService));
    $provide.value(
      'OutcomeObjectFactory', TestBed.get(OutcomeObjectFactory));
    $provide.value(
      'ParamChangeObjectFactory', TestBed.get(ParamChangeObjectFactory));
    $provide.value(
      'ParamChangesObjectFactory', TestBed.get(ParamChangesObjectFactory));
    $provide.value(
      'ParamMetadataObjectFactory', TestBed.get(ParamMetadataObjectFactory));
    $provide.value(
      'RecordedVoiceoversObjectFactory',
      TestBed.get(RecordedVoiceoversObjectFactory));
    $provide.value('RuleObjectFactory', TestBed.get(RuleObjectFactory));
    $provide.value(
      'SolutionValidityService', TestBed.get(SolutionValidityService));
    $provide.value(
      'StateClassifierMappingService',
      TestBed.get(StateClassifierMappingService));
    $provide.value(
      'StateEditorService', TestBed.get(StateEditorService));
    $provide.value(
      'SubtitledHtmlObjectFactory', TestBed.get(SubtitledHtmlObjectFactory));
    $provide.value('UnitsObjectFactory', TestBed.get(UnitsObjectFactory));
    $provide.value(
      'VoiceoverObjectFactory', TestBed.get(VoiceoverObjectFactory));
    $provide.value(
      'WrittenTranslationObjectFactory',
      TestBed.get(WrittenTranslationObjectFactory));
    $provide.value(
      'WrittenTranslationsObjectFactory',
      TestBed.get(WrittenTranslationsObjectFactory));
    $provide.value('ExplorationDataService', {
      autosaveChangeList: function() {}
    });
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    $uibModal = $injector.get('$uibModal');
    stateEditorService = $injector.get('StateEditorService');
    explorationInitStateNameService = $injector.get(
      'ExplorationInitStateNameService');
    explorationStatesService = $injector.get('ExplorationStatesService');
    explorationWarningsService = $injector.get('ExplorationWarningsService');
    routerService = $injector.get('RouterService');

    explorationStatesService.init({
      'First State': {
        content: {
          content_id: 'content',
          html: 'First State Content'
        },
        interaction: {
          id: 'TextInput',
          customization_args: {
            placeholder: {value: {
              content_id: 'ca_placeholder',
              unicode_str: ''
            }},
            rows: {value: 1}
          },
          answer_groups: [{
            rule_types_to_inputs_translations: {},
            rule_types_to_inputs: {},
            outcome: {
              dest: 'unused',
              feedback: {
                content_id: 'feedback_1',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            }
          }],
          default_outcome: {
            dest: 'default',
            feedback: {
              content_id: 'default_outcome',
              html: ''
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null
          },
          solution: {
            correct_answer: 'This is the correct answer',
            answer_is_exclusive: false,
            explanation: {
              html: 'Solution explanation',
              content_id: 'content_4'
            }
          },
          hints: []
        },
        next_content_id_index: 0,
        param_changes: [],
        solicit_answer_details: false,
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {
              en: {
                filename: 'myfile2.mp3',
                file_size_bytes: 120000,
                needs_update: false,
                duration_secs: 1.2
              }
            }
          }
        },
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {
              en: {
                html: 'This is a html',
                needs_update: false
              }
            }
          }
        }
      },
      'Second State': {
        content: {
          content_id: 'content',
          html: 'Second State Content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          }
        },
        interaction: {
          id: 'TextInput',
          customization_args: {
            placeholder: {value: {
              content_id: 'ca_placeholder',
              unicode_str: ''
            }},
            rows: {value: 1}
          },
          answer_groups: [{
            rule_types_to_inputs_translations: {},
            rule_types_to_inputs: {},
            outcome: {
              dest: 'unused',
              feedback: {
                content_id: 'feedback_1',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            }
          }],
          default_outcome: {
            dest: 'default',
            feedback: {
              content_id: 'default_outcome',
              html: ''
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null
          },
          hints: []
        },
        next_content_id_index: 0,
        param_changes: [],
        solicit_answer_details: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          }
        }
      }
    });

    $scope = $rootScope.$new();
    ctrl = $componentController('explorationEditorTab', {
      $scope: $scope
    });
    ctrl.$onInit();
  }));

  it('should evaluate controller properties after its initialization',
    function() {
      expect(ctrl.interactionIsShown).toBe(false);
    });

  it('should get state content placeholder text when init state name is equal' +
    ' to active state name', function() {
    stateEditorService.setActiveStateName('First State');
    explorationInitStateNameService.init('First State');

    expect(ctrl.getStateContentPlaceholder()).toBe(
      'This is the first card of your exploration. Use this space ' +
      'to introduce your topic and engage the learner, then ask ' +
      'them a question.');
  });

  it('should get state content placeholder text when init state name is' +
    ' different from active state name', function() {
    stateEditorService.setActiveStateName('First State');
    explorationInitStateNameService.init('Second State');

    expect(ctrl.getStateContentPlaceholder()).toBe(
      'You can speak to the learner here, then ask them a question.');
  });

  it('should get state content save button placeholder', function() {
    expect(ctrl.getStateContentSaveButtonPlaceholder()).toBe('Save Content');
  });

  it('should add state in exploration states', function() {
    spyOn(explorationStatesService, 'addState');

    ctrl.addState('Fourth State');

    expect(explorationStatesService.addState).toHaveBeenCalledWith(
      'Fourth State', null);
  });

  it('should refresh warnings from exploration warnings', function() {
    spyOn(explorationWarningsService, 'updateWarnings');

    ctrl.refreshWarnings();

    expect(explorationWarningsService.updateWarnings).toHaveBeenCalled();
  });

  it('should save state content successfully', function() {
    stateEditorService.setActiveStateName('First State');
    expect(explorationStatesService.getState('First State').content).toEqual(
      subtitledHtmlObjectFactory.createFromBackendDict({
        content_id: 'content',
        html: 'First State Content'
      }));

    var displayedValue = subtitledHtmlObjectFactory.createFromBackendDict({
      content_id: 'content',
      html: 'First State Content Changed'
    });
    ctrl.saveStateContent(displayedValue);

    expect(explorationStatesService.getState('First State').content).toEqual(
      displayedValue);
    expect(ctrl.interactionIsShown).toBe(true);
  });

  it('should save state interaction id successfully', function() {
    stateEditorService.setActiveStateName('First State');
    stateEditorService.setInteraction(
      explorationStatesService.getState('First State').interaction);

    expect(stateEditorService.interaction.id).toBe('TextInput');

    var newInteractionId = 'Continue';
    ctrl.saveInteractionId(newInteractionId);

    expect(stateEditorService.interaction.id).toBe(newInteractionId);
  });

  it('should save state next content id index successfully', function() {
    stateEditorService.setActiveStateName('First State');
    expect(
      explorationStatesService.getState('First State').nextContentIdIndex
    ).toEqual(0);

    ctrl.saveNextContentIdIndex(2);
    expect(
      explorationStatesService.getState('First State').nextContentIdIndex
    ).toBe(2);
  });

  it('should save interaction answer groups successfully', function() {
    stateEditorService.setActiveStateName('First State');
    stateEditorService.setInteraction(
      explorationStatesService.getState('First State').interaction);

    expect(stateEditorService.interaction.answerGroups).toEqual([
      answerGroupObjectFactory.createFromBackendDict({
        rule_types_to_inputs_translations: {},
        rule_types_to_inputs: {},
        outcome: {
          dest: 'unused',
          feedback: {
            content_id: 'feedback_1',
            html: ''
          },
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null
        }
      })]);

    var displayedValue = [answerGroupObjectFactory.createFromBackendDict({
      rule_types_to_inputs_translations: {},
      rule_types_to_inputs: {},
      outcome: {
        dest: 'Second State',
        feedback: {
          content_id: 'feedback_1',
          html: ''
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null
      },
      training_data: {},
      tagged_skill_misconception_id: ''
    })];
    ctrl.saveInteractionAnswerGroups(displayedValue);

    expect(stateEditorService.interaction.answerGroups).toEqual(displayedValue);
  });

  it('should save interaction default outcome successfully', function() {
    stateEditorService.setActiveStateName('First State');
    stateEditorService.setInteraction(
      explorationStatesService.getState('First State').interaction);

    expect(stateEditorService.interaction.defaultOutcome).toEqual(
      outcomeObjectFactory.createFromBackendDict({
        dest: 'default',
        feedback: {
          content_id: 'default_outcome',
          html: ''
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null
      }));

    var displayedValue = outcomeObjectFactory.createFromBackendDict({
      dest: 'Second State',
      feedback: {
        content_id: 'default_outcome_changed',
        html: 'This is the default outcome changed'
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null
    });
    ctrl.saveInteractionDefaultOutcome(displayedValue);

    expect(stateEditorService.interaction.defaultOutcome).toEqual(
      displayedValue);
  });

  it('should save interaction customization args successfully', function() {
    stateEditorService.setActiveStateName('First State');
    stateEditorService.setInteraction(
      explorationStatesService.getState('First State').interaction);

    expect(stateEditorService.interaction.customizationArgs).toEqual({
      rows: { value: 1 },
      placeholder: { value: new SubtitledUnicode('', 'ca_placeholder') }
    });

    var displayedValue = {
      placeholder: {
        value: 'Placeholder value'
      },
      rows: {
        value: 2
      }
    };
    ctrl.saveInteractionCustomizationArgs(displayedValue);

    expect(stateEditorService.interaction.customizationArgs).toEqual(
      displayedValue);
  });

  it('should save interaction solution successfully', function() {
    stateEditorService.setActiveStateName('First State');
    stateEditorService.setInteraction(
      explorationStatesService.getState('First State').interaction);

    expect(stateEditorService.interaction.solution).toEqual(
      solutionObjectFactory.createFromBackendDict({
        correct_answer: 'This is the correct answer',
        answer_is_exclusive: false,
        explanation: {
          html: 'Solution explanation',
          content_id: 'content_4'
        }
      }));

    var displayedValue = solutionObjectFactory.createFromBackendDict({
      correct_answer: 'This is the second correct answer',
      answer_is_exclusive: true,
      explanation: {
        html: 'Solution complete explanation',
        content_id: 'content_4'
      }
    });
    ctrl.saveSolution(displayedValue);

    expect(stateEditorService.interaction.solution).toEqual(
      displayedValue);
  });

  it('should save interaction hints successfully', function() {
    stateEditorService.setActiveStateName('First State');
    stateEditorService.setInteraction(
      explorationStatesService.getState('First State').interaction);

    expect(stateEditorService.interaction.hints).toEqual([]);

    var displayedValue = [hintObjectFactory.createFromBackendDict({
      hint_content: {
        content_id: '',
        html: 'This is a hint'
      }
    })];
    ctrl.saveHints(displayedValue);

    expect(stateEditorService.interaction.hints).toEqual(
      displayedValue);
  });

  it('should save solicit answer details successfully', function() {
    stateEditorService.setActiveStateName('First State');
    stateEditorService.setSolicitAnswerDetails(
      explorationStatesService.getState('First State').solicitAnswerDetails);

    expect(stateEditorService.solicitAnswerDetails).toBe(false);

    ctrl.saveSolicitAnswerDetails(true);

    expect(stateEditorService.solicitAnswerDetails).toBe(true);
  });

  it('should mark all audio as needing update when closing modal', function() {
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve()
    });
    stateEditorService.setActiveStateName('First State');

    expect(explorationStatesService.getState('First State')
      .recordedVoiceovers.voiceoversMapping.feedback_1.en.needsUpdate).toBe(
      false);
    expect(explorationStatesService.getState('First State')
      .writtenTranslations.translationsMapping.feedback_1.en.needsUpdate).toBe(
      false);

    ctrl.showMarkAllAudioAsNeedingUpdateModalIfRequired('feedback_1');
    $scope.$apply();

    expect(explorationStatesService.getState('First State')
      .recordedVoiceovers.voiceoversMapping.feedback_1.en.needsUpdate).toBe(
      true);
    expect(explorationStatesService.getState('First State')
      .writtenTranslations.translationsMapping.feedback_1.en.needsUpdate).toBe(
      true);
  });

  it('should not mark all audio as needing update when dismissing modal',
    function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.reject()
      });
      stateEditorService.setActiveStateName('First State');

      expect(explorationStatesService.getState('First State')
        .recordedVoiceovers.voiceoversMapping.feedback_1.en.needsUpdate).toBe(
        false);
      expect(explorationStatesService.getState('First State')
        .writtenTranslations.translationsMapping.feedback_1.en.needsUpdate)
        .toBe(false);

      ctrl.showMarkAllAudioAsNeedingUpdateModalIfRequired('feedback_1');
      $scope.$apply();

      expect(explorationStatesService.getState('First State')
        .recordedVoiceovers.voiceoversMapping.feedback_1.en.needsUpdate).toBe(
        false);
      expect(explorationStatesService.getState('First State')
        .writtenTranslations.translationsMapping.feedback_1.en.needsUpdate)
        .toBe(false);
    });

  it('should navigate to main tab in specific state name', function() {
    spyOn(routerService, 'navigateToMainTab');

    var stateName = 'Second State';
    ctrl.navigateToState(stateName);

    expect(routerService.navigateToMainTab).toHaveBeenCalledWith(stateName);
  });

  it('should evaluate if parameters are enabled', function() {
    var areParametersEnabledSpy = spyOn(
      explorationFeaturesService, 'areParametersEnabled');

    areParametersEnabledSpy.and.returnValue(true);
    expect(ctrl.areParametersEnabled()).toBe(true);

    areParametersEnabledSpy.and.returnValue(false);
    expect(ctrl.areParametersEnabled()).toBe(false);
  });

  it('should correctly broadcast the stateEditorInitialized flag with ' +
      'the state data', function() {
    stateEditorService.setActiveStateName('Second State');
    stateEditorService.updateStateInteractionEditorInitialised();
    stateEditorService.updateStateResponsesInitialised();
    stateEditorService.updateStateEditorDirectiveInitialised();

    $rootScope.$broadcast('refreshStateEditor');

    const stateEditorInitializedSpy = jasmine.createSpy(
      'stateEditorInitialized');
    let testsubscription =
      stateEditorService.onStateEditorInitialized.subscribe(
        stateEditorInitializedSpy);

    $scope.$apply();

    expect(stateEditorInitializedSpy).toHaveBeenCalledWith(
      explorationStatesService.getState('Second State')
    );

    testsubscription.unsubscribe();
  });
});
