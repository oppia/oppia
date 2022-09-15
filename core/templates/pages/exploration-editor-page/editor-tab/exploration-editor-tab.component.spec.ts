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

import { EventEmitter } from '@angular/core';
import { fakeAsync, TestBed, tick, flush } from '@angular/core/testing';
import { AngularNameService } from
  'pages/exploration-editor-page/services/angular-name.service';
import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { ExplorationFeaturesService } from
  'services/exploration-features.service';
import { HintObjectFactory } from 'domain/exploration/HintObjectFactory';
import { ImprovementsService } from 'services/improvements.service';
import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { ParamChangeObjectFactory } from
  'domain/exploration/ParamChangeObjectFactory';
import { ParamChangesObjectFactory } from
  'domain/exploration/ParamChangesObjectFactory';
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { SolutionValidityService } from
  // eslint-disable-next-line max-len
  'pages/exploration-editor-page/editor-tab/services/solution-validity.service';
import { StateClassifierMappingService } from
  'pages/exploration-player-page/services/state-classifier-mapping.service';
import { StateCardIsCheckpointService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-card-is-checkpoint.service';
import { StateEditorService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-editor.service';
import { UnitsObjectFactory } from 'domain/objects/UnitsObjectFactory';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { WrittenTranslationObjectFactory } from
  'domain/exploration/WrittenTranslationObjectFactory';
import { WrittenTranslationsObjectFactory } from
  'domain/exploration/WrittenTranslationsObjectFactory';
import { SolutionObjectFactory } from
  'domain/exploration/SolutionObjectFactory';
import { SubtitledUnicode } from
  'domain/exploration/SubtitledUnicodeObjectFactory';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { ExplorationDataService } from '../services/exploration-data.service';

describe('Exploration editor tab component', function() {
  var ctrl;
  var $q = null;
  var $scope = null;
  var $rootScope = null;
  var ngbModal: NgbModal;
  var $timeout = null;
  var answerGroupObjectFactory = null;
  var editabilityService = null;
  var explorationFeaturesService = null;
  var explorationInitStateNameService = null;
  var explorationStatesService = null;
  var explorationWarningsService = null;
  var hintObjectFactory = null;
  var outcomeObjectFactory = null;
  var routerService = null;
  var siteAnalyticsService = null;
  var stateEditorRefreshService = null;
  var solutionObjectFactory = null;
  var stateCardIsCheckpointService = null;
  var stateEditorService = null;
  var userExplorationPermissionsService = null;
  var focusManagerService = null;
  var mockRefreshStateEditorEventEmitter = null;

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

    answerGroupObjectFactory = TestBed.get(AnswerGroupObjectFactory);
    explorationFeaturesService = TestBed.get(ExplorationFeaturesService);
    hintObjectFactory = TestBed.get(HintObjectFactory);
    outcomeObjectFactory = TestBed.get(OutcomeObjectFactory);
    solutionObjectFactory = TestBed.get(SolutionObjectFactory);
    focusManagerService = TestBed.get(FocusManagerService);
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('AngularNameService', TestBed.get(AngularNameService));
    $provide.value(
      'AnswerGroupObjectFactory', answerGroupObjectFactory);
    $provide.value(
      'ExplorationFeaturesService', explorationFeaturesService);
    $provide.value('HintObjectFactory', hintObjectFactory);
    $provide.value('ImprovementsService', TestBed.get(ImprovementsService));
    $provide.value(
      'OutcomeObjectFactory', TestBed.get(OutcomeObjectFactory));
    $provide.value(
      'ParamChangeObjectFactory', TestBed.get(ParamChangeObjectFactory));
    $provide.value(
      'ParamChangesObjectFactory', TestBed.get(ParamChangesObjectFactory));
    $provide.value('RuleObjectFactory', TestBed.get(RuleObjectFactory));
    $provide.value('SiteAnalyticsService', TestBed.get(SiteAnalyticsService));
    $provide.value(
      'SolutionValidityService', TestBed.get(SolutionValidityService));
    $provide.value(
      'StateClassifierMappingService',
      TestBed.get(StateClassifierMappingService));
    $provide.value(
      'StateCardIsCheckpointService',
      TestBed.get(StateCardIsCheckpointService));
    $provide.value(
      'StateEditorService', TestBed.get(StateEditorService));
    $provide.value('UnitsObjectFactory', TestBed.get(UnitsObjectFactory));
    $provide.value(
      'WrittenTranslationObjectFactory',
      TestBed.get(WrittenTranslationObjectFactory));
    $provide.value(
      'WrittenTranslationsObjectFactory',
      TestBed.get(WrittenTranslationsObjectFactory));
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    ngbModal = $injector.get('NgbModal');
    $timeout = $injector.get('$timeout');
    stateEditorService = $injector.get('StateEditorService');
    stateCardIsCheckpointService = $injector.get(
      'StateCardIsCheckpointService');
    editabilityService = $injector.get('EditabilityService');
    focusManagerService = $injector.get('FocusManagerService');
    explorationInitStateNameService = $injector.get(
      'ExplorationInitStateNameService');
    explorationStatesService = $injector.get('ExplorationStatesService');
    explorationWarningsService = $injector.get('ExplorationWarningsService');
    routerService = $injector.get('RouterService');
    siteAnalyticsService = $injector.get('SiteAnalyticsService');
    stateEditorRefreshService = $injector.get('StateEditorRefreshService');
    userExplorationPermissionsService = $injector.get(
      'UserExplorationPermissionsService'
    );
    mockRefreshStateEditorEventEmitter = new EventEmitter();
    spyOnProperty(
      stateEditorRefreshService, 'onRefreshStateEditor').and.returnValue(
      mockRefreshStateEditorEventEmitter);

    explorationStatesService.init({
      'First State': {
        card_is_checkpoint: true,
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
            rows: {value: 1},
            catchMisspellings: {
              value: false
            }
          },
          answer_groups: [{
            rule_specs: [],
            outcome: {
              dest: 'unused',
              dest_if_really_stuck: null,
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
            dest_if_really_stuck: null,
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
        linked_skill_id: null,
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
        card_is_checkpoint: false,
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
            rows: {value: 1},
            catchMisspellings: {
              value: false
            }
          },
          answer_groups: [{
            rule_specs: [],
            outcome: {
              dest: 'unused',
              dest_if_really_stuck: null,
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
            dest_if_really_stuck: null,
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
        linked_skill_id: null,
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

  afterEach(() => {
    ctrl.$onDestroy();
  });

  it('should apply autofocus to elements in active tab', () => {
    spyOn(routerService, 'getActiveTabName').and.returnValues(
      'main', 'feedback', 'history');
    spyOn(focusManagerService, 'setFocus');
    ctrl.windowOnload();
    expect(ctrl.TabName).toBe('main');
    expect(focusManagerService.setFocus).toHaveBeenCalledWith(
      'oppiaEditableSection');
    ctrl.windowOnload();
    expect(ctrl.TabName).toBe('feedback');
    expect(focusManagerService.setFocus).toHaveBeenCalledWith(
      'newThreadButton');
    ctrl.windowOnload();
    expect(ctrl.TabName).toBe('history');
    expect(focusManagerService.setFocus).toHaveBeenCalledWith(
      'usernameInputField');
  });

  it('should call focus method when window loads', () => {
    stateEditorService.setActiveStateName('First State');
    var ctrlSpy = spyOn(ctrl, 'windowOnload');
    ctrl.initStateEditor();
    $scope.$apply();
    $timeout.flush();
    expect(ctrlSpy).toHaveBeenCalled();
  });

  it('should initialize controller properties after its initialization',
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
    spyOn(explorationStatesService, 'addState').and.callThrough();

    ctrl.addState('Fourth State');

    expect(explorationStatesService.addState).toHaveBeenCalledWith(
      'Fourth State', null);
  });

  it('should refresh warnings', function() {
    spyOn(explorationWarningsService, 'updateWarnings');

    ctrl.refreshWarnings();

    expect(explorationWarningsService.updateWarnings).toHaveBeenCalled();
  });

  it('should save state content', function() {
    stateEditorService.setActiveStateName('First State');
    expect(explorationStatesService.getState('First State').content).toEqual(
      SubtitledHtml.createFromBackendDict({
        content_id: 'content',
        html: 'First State Content'
      }));

    var displayedValue = SubtitledHtml.createFromBackendDict({
      content_id: 'content',
      html: 'First State Content Changed'
    });
    ctrl.saveStateContent(displayedValue);

    expect(explorationStatesService.getState('First State').content).toEqual(
      displayedValue);
    expect(ctrl.interactionIsShown).toBe(true);
  });

  it('should save state interaction id', function() {
    stateEditorService.setActiveStateName('First State');
    stateEditorService.setInteraction(
      explorationStatesService.getState('First State').interaction);

    expect(stateEditorService.interaction.id).toBe('TextInput');

    var newInteractionId = 'Continue';
    ctrl.saveInteractionId(newInteractionId);

    expect(stateEditorService.interaction.id).toBe(newInteractionId);
  });

  it('should save state next content id index', function() {
    stateEditorService.setActiveStateName('First State');
    expect(
      explorationStatesService.getState('First State').nextContentIdIndex
    ).toEqual(0);

    ctrl.saveNextContentIdIndex(2);
    expect(
      explorationStatesService.getState('First State').nextContentIdIndex
    ).toBe(2);
  });

  it('should save linked skill id', function() {
    stateEditorService.setActiveStateName('First State');
    expect(
      explorationStatesService.getState('First State').linkedSkillId
    ).toEqual(null);

    ctrl.saveLinkedSkillId('skill_id1');
    expect(
      explorationStatesService.getState('First State').linkedSkillId
    ).toBe('skill_id1');
  });

  it('should save interaction answer groups', function() {
    stateEditorService.setActiveStateName('First State');
    stateEditorService.setInteraction(
      explorationStatesService.getState('First State').interaction);

    expect(stateEditorService.interaction.answerGroups).toEqual([
      answerGroupObjectFactory.createFromBackendDict({
        rule_specs: [],
        outcome: {
          dest: 'unused',
          dest_if_really_stuck: null,
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
      rule_specs: [],
      outcome: {
        dest: 'Second State',
        dest_if_really_stuck: null,
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

  it('should save interaction default outcome', function() {
    stateEditorService.setActiveStateName('First State');
    stateEditorService.setInteraction(
      explorationStatesService.getState('First State').interaction);

    expect(stateEditorService.interaction.defaultOutcome).toEqual(
      outcomeObjectFactory.createFromBackendDict({
        dest: 'default',
        dest_if_really_stuck: null,
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
      dest_if_really_stuck: null,
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

  it('should save interaction customization args', function() {
    stateEditorService.setActiveStateName('First State');
    stateEditorService.setInteraction(
      explorationStatesService.getState('First State').interaction);

    expect(stateEditorService.interaction.customizationArgs).toEqual({
      rows: { value: 1 },
      placeholder: { value: new SubtitledUnicode('', 'ca_placeholder') },
      catchMisspellings: {
        value: false
      }
    });

    var displayedValue = {
      placeholder: {
        value: new SubtitledUnicode('Placeholder value', 'ca_placeholder')
      },
      rows: {
        value: 2
      },
      catchMisspellings: {
        value: false
      }
    };
    ctrl.saveInteractionCustomizationArgs(displayedValue);

    expect(stateEditorService.interaction.customizationArgs).toEqual(
      displayedValue);
  });

  it('should save interaction solution', function() {
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

  it('should save interaction hints', function() {
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

  it('should save solicit answer details', function() {
    stateEditorService.setActiveStateName('First State');
    stateEditorService.setSolicitAnswerDetails(
      explorationStatesService.getState('First State').solicitAnswerDetails);

    expect(stateEditorService.solicitAnswerDetails).toBe(false);

    ctrl.saveSolicitAnswerDetails(true);

    expect(stateEditorService.solicitAnswerDetails).toBe(true);
  });

  it('should save card is checkpoint on change', function() {
    stateEditorService.setActiveStateName('Second State');
    stateEditorService.setCardIsCheckpoint(
      explorationStatesService.getState('Second State').cardIsCheckpoint);

    expect(stateEditorService.cardIsCheckpoint).toBe(false);

    stateCardIsCheckpointService.displayed = true;
    ctrl.onChangeCardIsCheckpoint();

    expect(stateEditorService.cardIsCheckpoint).toBe(true);
  });

  it('should mark all audio as needing update when closing modal',
    fakeAsync(() => {
      spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.resolve()
      } as NgbModalRef);
      stateEditorService.setActiveStateName('First State');

      expect(
        explorationStatesService.getState('First State')
          .recordedVoiceovers.voiceoversMapping.feedback_1.en.needsUpdate).toBe(
        false);
      expect(
        explorationStatesService.getState('First State')
          .writtenTranslations.translationsMapping.feedback_1.en.needsUpdate)
        .toBe(false);

      ctrl.showMarkAllAudioAsNeedingUpdateModalIfRequired(['feedback_1']);
      tick();
      $scope.$apply();

      expect(
        explorationStatesService.getState('First State')
          .recordedVoiceovers.voiceoversMapping.feedback_1.en.needsUpdate).toBe(
        true);
      expect(
        explorationStatesService.getState('First State')
          .writtenTranslations.translationsMapping.feedback_1.en.needsUpdate)
        .toBe(true);

      flush();
    }));

  it('should not mark all audio as needing update when dismissing modal',
    function() {
      spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.reject()
      } as NgbModalRef);
      stateEditorService.setActiveStateName('First State');

      expect(
        explorationStatesService.getState('First State')
          .recordedVoiceovers.voiceoversMapping.feedback_1.en.needsUpdate).toBe(
        false);
      expect(
        explorationStatesService.getState('First State')
          .writtenTranslations.translationsMapping.feedback_1.en.needsUpdate)
        .toBe(false);

      ctrl.showMarkAllAudioAsNeedingUpdateModalIfRequired(['feedback_1']);
      $scope.$apply();

      expect(
        explorationStatesService.getState('First State')
          .recordedVoiceovers.voiceoversMapping.feedback_1.en.needsUpdate).toBe(
        false);
      expect(
        explorationStatesService.getState('First State')
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

    mockRefreshStateEditorEventEmitter.emit();

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

  it('should start tutorial if in tutorial mode on page load', () => {
    spyOn(ctrl, 'startTutorial');
    editabilityService.onStartTutorial();
    $scope.$apply();
    ctrl.initStateEditor();
    $scope.$apply();
    expect(ctrl.startTutorial).toHaveBeenCalled();
  });

  it('should check if exploration is editable', () => {
    spyOn(editabilityService, 'isEditable').and.returnValue(true);
    expect(ctrl.isEditable()).toBe(true);
  });

  it('should not start tutorial if not in tutorial mode on page load', () => {
    spyOn(ctrl, 'startTutorial');
    editabilityService.onEndTutorial();
    $scope.$apply();
    ctrl.initStateEditor();
    $scope.$apply();
    expect(ctrl.startTutorial).not.toHaveBeenCalled();
  });

  it('should finish tutorial if finish tutorial button is clicked', () => {
    var registerFinishTutorialEventSpy = (
      spyOn(siteAnalyticsService, 'registerFinishTutorialEvent'));
    spyOn(editabilityService, 'onEndTutorial');
    editabilityService.onStartTutorial();
    $scope.$apply();
    ctrl.initStateEditor();
    $scope.$apply();
    ctrl.onFinishTutorial();
    expect(registerFinishTutorialEventSpy).toHaveBeenCalled();
    expect(editabilityService.onEndTutorial).toHaveBeenCalled();
    expect(ctrl.tutorialInProgress).toBe(false);
  });

  it('should skip tutorial if skip tutorial button is clicked', () => {
    var registerSkipTutorialEventSpy = (
      spyOn(siteAnalyticsService, 'registerSkipTutorialEvent'));
    spyOn(editabilityService, 'onEndTutorial');
    editabilityService.onStartTutorial();
    $scope.$apply();
    ctrl.initStateEditor();
    $scope.$apply();
    ctrl.onSkipTutorial();
    expect(registerSkipTutorialEventSpy).toHaveBeenCalled();
    expect(editabilityService.onEndTutorial).toHaveBeenCalled();
    expect(ctrl.tutorialInProgress).toBe(false);
  });

  // The describe block below tests all the possible functions
  // included on ctrl.EDITOR_TUTORIAL_OPTIONS array, which manipulates
  // with JQuery the 'save from tutorial' button.
  describe('when testing functions for JQuery manipulation from' +
    ' ctrl.EDITOR_TUTORIAL_OPTIONS array', () => {
    it('should change element scroll top when calling fn property' +
      ' function on index 1 of ctrl.EDITOR_TUTORIAL_OPTIONS array',
    () => {
      var element = angular.element('div');
      spyOn(window, '$').and.returnValue(element);

      var animateSpy = spyOn(element, 'animate').and.callThrough();

      ctrl.EDITOR_TUTORIAL_OPTIONS[1].fn(false);

      expect(animateSpy).toHaveBeenCalledWith({
        scrollTop: 20
      }, 1000);
    });

    it('should not change element scroll top when calling fn property' +
      ' function on index 1 of EDITOR_TUTORIAL_OPTIONS array', () => {
      var element = angular.element('div');
      spyOn(window, '$').and.returnValue(element);

      var animateSpy = spyOn(element, 'animate').and.callThrough();

      ctrl.EDITOR_TUTORIAL_OPTIONS[1].fn(true);

      expect(animateSpy).toHaveBeenCalledWith({
        scrollTop: 0
      }, 1000);
    });

    it('should change state interaction element scroll top when calling' +
      ' fn property function on index 3 of EDITOR_TUTORIAL_OPTIONS array',
    () => {
      var element = angular.element('div');
      spyOn(window, '$').and.returnValue(element);
      var animateSpy = spyOn(element, 'animate').and.callThrough();
      spyOn(angular, 'element')
        .withArgs('#tutorialStateContent').and.returnValue({
          // This throws "Type '{ top: number; }' is not assignable to type
          // 'JQLite | Coordinates'.". We need to suppress this error because
          // the actual 'offset' functions returns more properties than the
          // function we've defined. We have only returned the properties we
          // need in 'offset' function.
          // @ts-expect-error
          offset: () => ({
            top: 5
          })
        });

      ctrl.EDITOR_TUTORIAL_OPTIONS[3].fn(false);

      expect(animateSpy).toHaveBeenCalledWith({
        scrollTop: (5 - 200)
      }, 1000);
    });

    it('should change state content element scroll top when calling fn' +
      ' property function on index 3 of EDITOR_TUTORIAL_OPTIONS array',
    () => {
      var element = angular.element('div');
      spyOn(window, '$').and.returnValue(element);
      var animateSpy = spyOn(element, 'animate').and.callThrough();
      spyOn(angular, 'element')
        .withArgs('#tutorialStateInteraction').and.returnValue({
          // This throws "Type '{ top: number; }' is not assignable to type
          // 'JQLite | Coordinates'.". We need to suppress this error because
          // the actual 'offset' functions returns more properties than the
          // function we've defined. We have only returned the properties we
          // need in 'offset' function.
          // @ts-expect-error
          offset: () => ({
            top: 20
          })
        });

      ctrl.EDITOR_TUTORIAL_OPTIONS[3].fn(true);

      expect(animateSpy).toHaveBeenCalledWith({
        scrollTop: (20 - 200)
      }, 1000);
    });

    it('should change preview tab element scroll top when calling fn' +
      ' property function on index 5 of EDITOR_TUTORIAL_OPTIONS array',
    () => {
      var element = angular.element('div');
      spyOn(window, '$').and.returnValue(element);
      var animateSpy = spyOn(element, 'animate').and.callThrough();
      spyOn(angular, 'element')
        .withArgs('#tutorialPreviewTab').and.returnValue({
          // This throws "Type '{ top: number; }' is not assignable to type
          // 'JQLite | Coordinates'.". We need to suppress this error because
          // the actual 'offset' functions returns more properties than the
          // function we've defined. We have only returned the properties we
          // need in 'offset' function.
          // @ts-expect-error
          offset: () => ({
            top: 5
          })
        });

      ctrl.EDITOR_TUTORIAL_OPTIONS[5].fn(true);

      expect(animateSpy).toHaveBeenCalledWith({
        scrollTop: (5 - 200)
      }, 1000);
    });

    it('should change state interaction element scroll top when calling' +
      ' fn property function on index 5 of EDITOR_TUTORIAL_OPTIONS array',
    () => {
      var element = angular.element('div');
      spyOn(window, '$').and.returnValue(element);
      var animateSpy = spyOn(element, 'animate').and.callThrough();
      spyOn(angular, 'element')
        .withArgs('#tutorialStateInteraction').and.returnValue({
          // This throws "Type '{ top: number; }' is not assignable to type
          // 'JQLite | Coordinates'.". We need to suppress this error because
          // the actual 'offset' functions returns more properties than the
          // function we've defined. We have only returned the properties we
          // need in 'offset' function.
          // @ts-expect-error
          offset: () => ({
            top: 20
          })
        });

      ctrl.EDITOR_TUTORIAL_OPTIONS[5].fn(false);

      expect(animateSpy).toHaveBeenCalledWith({
        scrollTop: (20 - 200)
      }, 1000);
    });

    it('should change preview tabn element scroll top when calling fn' +
      ' property function on index 7 of EDITOR_TUTORIAL_OPTIONS array',
    () => {
      var element = angular.element('div');
      spyOn(window, '$').and.returnValue(element);
      var animateSpy = spyOn(element, 'animate').and.callThrough();
      spyOn(angular, 'element')
        .withArgs('#tutorialPreviewTab').and.returnValue({
          // This throws "Type '{ top: number; }' is not assignable to type
          // 'JQLite | Coordinates'.". We need to suppress this error because
          // the actual 'offset' functions returns more properties than the
          // function we've defined. We have only returned the properties we
          // need in 'offset' function.
          // @ts-expect-error
          offset: () => ({
            top: 5
          })
        });

      ctrl.EDITOR_TUTORIAL_OPTIONS[7].fn(true);

      expect(animateSpy).toHaveBeenCalledWith({
        scrollTop: (5 - 200)
      }, 1000);
    });

    it('should change state interaction element scroll top when calling' +
      ' fn property function on index 7 of EDITOR_TUTORIAL_OPTIONS array',
    () => {
      var element = angular.element('div');
      spyOn(window, '$').and.returnValue(element);
      var animateSpy = spyOn(element, 'animate').and.callThrough();
      spyOn(angular, 'element')
        .withArgs('#tutorialStateInteraction').and.returnValue({
          // This throws "Type '{ top: number; }' is not assignable to type
          // 'JQLite | Coordinates'.". We need to suppress this error because
          // the actual 'offset' functions returns more properties than the
          // function we've defined. We have only returned the properties we
          // need in 'offset' function.
          // @ts-expect-error
          offset: () => ({
            top: 20
          })
        });

      ctrl.EDITOR_TUTORIAL_OPTIONS[7].fn(false);

      expect(animateSpy).toHaveBeenCalledWith({
        scrollTop: (20 - 200)
      }, 1000);
    });

    it('should not remove save button element at index 9 when the user' +
      ' does have edit permissions', () => {
      spyOn(userExplorationPermissionsService, 'getPermissionsAsync').and
        .returnValue($q.resolve({
          canEdit: true
        }));
      ctrl.removeTutorialSaveButtonIfNoPermissions();
      $scope.$apply();
      expect(ctrl.EDITOR_TUTORIAL_OPTIONS[9].heading).toBe('Save');
    });

    it('should remove save button element at index 9 when the user does' +
      ' not have edit permissions', () => {
      spyOn(userExplorationPermissionsService, 'getPermissionsAsync').and
        .returnValue($q.resolve({
          canEdit: false
        }));
      ctrl.removeTutorialSaveButtonIfNoPermissions();
      $scope.$apply();
      expect(ctrl.EDITOR_TUTORIAL_OPTIONS[9].heading).not.toBe('Save');
    });
  });
});
