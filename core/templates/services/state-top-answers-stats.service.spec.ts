// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for domain object which holds the list of top answer
 * statistics for a particular state.
 */

import { AngularNameService } from
  'pages/exploration-editor-page/services/angular-name.service';
import { Answer } from 'domain/exploration//AnswerStatsObjectFactory';
import { AnswerClassificationResultObjectFactory } from
  'domain/classifier/AnswerClassificationResultObjectFactory';
import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { IAnswerStatsBackendDict } from
  'domain/exploration/AnswerStatsObjectFactory';
import { ClassifierObjectFactory } from
  'domain/classifier/ClassifierObjectFactory';
import { ExplorationDraftObjectFactory } from
  'domain/exploration/ExplorationDraftObjectFactory';
import { FractionInputRulesService } from
  'interactions/FractionInput/directives/fraction-input-rules.service';
import { FractionObjectFactory } from 'domain/objects/FractionObjectFactory';
import { HintObjectFactory } from 'domain/exploration/HintObjectFactory';
import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { ParamChangeObjectFactory } from
  'domain/exploration/ParamChangeObjectFactory';
import { ParamChangesObjectFactory } from
  'domain/exploration/ParamChangesObjectFactory';
import { RecordedVoiceoversObjectFactory } from
  'domain/exploration/RecordedVoiceoversObjectFactory';
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory';
/* eslint-disable max-len */
import { SolutionValidityService } from
  'pages/exploration-editor-page/editor-tab/services/solution-validity.service';
/* eslint-enable max-len */
import { StateClassifierMappingService } from
  'pages/exploration-player-page/services/state-classifier-mapping.service';
/* eslint-disable max-len */
import { StateEditorService } from
  'components/state-editor/state-editor-properties-services/state-editor.service';
/* eslint-enable max-len */
import { SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory';
import { UnitsObjectFactory } from 'domain/objects/UnitsObjectFactory';
import { VoiceoverObjectFactory } from
  'domain/exploration/VoiceoverObjectFactory';
import { WrittenTranslationObjectFactory } from
  'domain/exploration/WrittenTranslationObjectFactory';
import { WrittenTranslationsObjectFactory } from
  'domain/exploration/WrittenTranslationsObjectFactory';
import { UtilsService } from 'services/utils.service';
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('App.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require('services/state-top-answers-stats.service.ts');

class MockAnswerStats {
  answer: Answer;
  answerHtml: string;
  frequency: number;
  isAddressed: boolean;
  constructor(
      answer: Answer, answerHtml: string, frequency: number,
      isAddressed: boolean) {
    this.answer = angular.copy(answer);
    this.answerHtml = answerHtml;
    this.frequency = frequency;
    this.isAddressed = isAddressed;
  }
  toBackendDict(): IAnswerStatsBackendDict {
    return {
      answer: angular.copy(this.answer),
      frequency: this.frequency
    };
  }
}

var joC = jasmine.objectContaining;

describe('StateTopAnswersStatsService', function() {
  var $q = null;
  var $rootScope = null;
  var $uibModal = null;
  var ChangeListService = null;
  var ContextService = null;
  var ExplorationStatesService = null;
  var ruleObjectFactory = null;
  var StateTopAnswersStatsService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('AngularNameService', new AngularNameService());
    $provide.value(
      'AnswerClassificationResultObjectFactory',
      new AnswerClassificationResultObjectFactory());
    $provide.value(
      'AnswerGroupObjectFactory', new AnswerGroupObjectFactory(
        new OutcomeObjectFactory(new SubtitledHtmlObjectFactory()),
        new RuleObjectFactory()));
    $provide.value(
      'OutcomeObjectFactory', new OutcomeObjectFactory(
        new SubtitledHtmlObjectFactory()));
    $provide.value('AnswerStatsObjectFactory', {
      createFromBackendDict: function(backendDict) {
        var answerHtml = (typeof backendDict.answer === 'string') ?
          backendDict.answer : angular.toJson(backendDict.answer);
        return new MockAnswerStats(
          backendDict.answer, answerHtml, backendDict.frequency, false);
      }
    });
    $provide.value('ClassifierObjectFactory', new ClassifierObjectFactory());
    $provide.value(
      'ExplorationDraftObjectFactory', new ExplorationDraftObjectFactory());
    $provide.value('FractionInputRulesService', new FractionInputRulesService(
      new FractionObjectFactory(), new UtilsService()));
    $provide.value('FractionObjectFactory', new FractionObjectFactory());
    $provide.value(
      'HintObjectFactory', new HintObjectFactory(
        new SubtitledHtmlObjectFactory()));
    $provide.value('ParamChangeObjectFactory', new ParamChangeObjectFactory());
    $provide.value(
      'ParamChangesObjectFactory', new ParamChangesObjectFactory(
        new ParamChangeObjectFactory()));
    $provide.value(
      'RecordedVoiceoversObjectFactory',
      new RecordedVoiceoversObjectFactory(new VoiceoverObjectFactory()));
    $provide.value('RuleObjectFactory', new RuleObjectFactory());
    $provide.value('SolutionValidityService', new SolutionValidityService());
    $provide.value(
      'StateClassifierMappingService', new StateClassifierMappingService(
        new ClassifierObjectFactory()));
    $provide.value(
      'StateEditorService', new StateEditorService(
        new SolutionValidityService()));
    $provide.value(
      'SubtitledHtmlObjectFactory', new SubtitledHtmlObjectFactory());
    $provide.value('UnitsObjectFactory', new UnitsObjectFactory());
    $provide.value('VoiceoverObjectFactory', new VoiceoverObjectFactory());
    $provide.value(
      'WrittenTranslationObjectFactory',
      new WrittenTranslationObjectFactory());
    $provide.value(
      'WrittenTranslationsObjectFactory',
      new WrittenTranslationsObjectFactory(
        new WrittenTranslationObjectFactory()));
  }));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function(
      _$q_, _$rootScope_, _$uibModal_, _ChangeListService_, _ContextService_,
      _ExplorationStatesService_, _RuleObjectFactory_,
      _StateTopAnswersStatsService_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    $uibModal = _$uibModal_;
    ChangeListService = _ChangeListService_;
    ContextService = _ContextService_;
    ExplorationStatesService = _ExplorationStatesService_;
    ruleObjectFactory = _RuleObjectFactory_;
    StateTopAnswersStatsService = _StateTopAnswersStatsService_;

    ExplorationStatesService.init({
      Hola: {
        content: {content_id: 'content', html: ''},
        param_changes: [],
        interaction: {
          answer_groups: [{
            rule_specs: [{rule_type: 'Contains', inputs: {x: 'hola'}}],
            outcome: {
              dest: 'Me Llamo',
              feedback: {content_id: 'feedback_1', html: 'buen trabajo!'},
              labelled_as_correct: true,
            },
          }],
          default_outcome: {
            dest: 'Hola',
            feedback: {content_id: 'default_outcome', html: 'try again!'},
            labelled_as_correct: false,
          },
          hints: [],
          id: 'TextInput',
        },
        classifier_model_id: 0,
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {},
          },
        },
        solicit_answer_details: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {},
          },
        },
      },
    });

    spyOn(ContextService, 'getExplorationId').and.returnValue('7');
  }));

  describe('.isInitialized', function() {
    it('begins uninitialized', function() {
      expect(StateTopAnswersStatsService.isInitialized()).toBe(false);
    });

    it('is true after call to .init', function() {
      StateTopAnswersStatsService.init({answers: {}, interaction_ids: {}});

      expect(StateTopAnswersStatsService.isInitialized()).toBe(true);
    });
  });

  describe('.init', function() {
    it('correctly identifies unaddressed issues', function() {
      StateTopAnswersStatsService.init({
        answers: {
          Hola: [
            {answer: 'hola', frequency: 7},
            {answer: 'adios', frequency: 4},
            {answer: 'que?', frequency: 2},
          ]
        },
        interaction_ids: {Hola: 'TextInput'},
      });

      var stateStats = StateTopAnswersStatsService.getStateStats('Hola');
      expect(stateStats).toContain(joC({answer: 'hola', isAddressed: true}));
      expect(stateStats).toContain(joC({answer: 'adios', isAddressed: false}));
      expect(stateStats).toContain(joC({answer: 'que?', isAddressed: false}));
    });

    it('maintains frequency in order', function() {
      StateTopAnswersStatsService.init({
        answers: {
          Hola: [
            {answer: 'hola', frequency: 7},
            {answer: 'adios', frequency: 4},
            {answer: 'que?', frequency: 2},
          ]
        },
        interaction_ids: {Hola: 'TextInput'},
      });

      expect(StateTopAnswersStatsService.getStateStats('Hola')).toEqual([
        joC({answer: 'hola', frequency: 7}),
        joC({answer: 'adios', frequency: 4}),
        joC({answer: 'que?', frequency: 2}),
      ]);
    });

    it('throws when fetching stats about non-existent states', function() {
      expect(function() {
        StateTopAnswersStatsService.getStateStats('Me Llamo');
      }).toThrowError('Me Llamo does not exist.');
    });

    it('registers handlers to ExplorationStatesService', function() {
      var expectedRegistrationFunctions = [
        spyOn(ExplorationStatesService, 'registerOnStateAddedCallback'),
        spyOn(ExplorationStatesService, 'registerOnStateDeletedCallback'),
        spyOn(ExplorationStatesService, 'registerOnStateRenamedCallback'),
        spyOn(ExplorationStatesService,
          'registerOnStateInteractionSavedCallback')
      ];

      StateTopAnswersStatsService.init({answers: {}, interaction_ids: {}});

      expectedRegistrationFunctions.forEach(function(registrationFunction) {
        expect(registrationFunction).toHaveBeenCalled();
      });
    });

    it('does not register duplicate handlers if called again', function() {
      var expectedRegistrationFunctions = [
        spyOn(ExplorationStatesService, 'registerOnStateAddedCallback'),
        spyOn(ExplorationStatesService, 'registerOnStateDeletedCallback'),
        spyOn(ExplorationStatesService, 'registerOnStateRenamedCallback'),
        spyOn(ExplorationStatesService,
          'registerOnStateInteractionSavedCallback')
      ];

      StateTopAnswersStatsService.init({answers: {}, interaction_ids: {}});
      // Second call should not add more callbacks.
      StateTopAnswersStatsService.init({answers: {}, interaction_ids: {}});

      expectedRegistrationFunctions.forEach(function(registrationFunction) {
        expect(registrationFunction.calls.count()).toEqual(1);
      });
    });
  });

  describe('.hasStateStats', function() {
    it('is false when uninitialized', function() {
      expect(StateTopAnswersStatsService.isInitialized()).toBe(false);
      expect(StateTopAnswersStatsService.hasStateStats('Hola')).toBe(false);
    });

    it('is true when the state contains answers', function() {
      StateTopAnswersStatsService.init({
        answers: {Hola: [{answer: 'hola', frequency: 3}]},
        interaction_ids: {Hola: 'TextInput'},
      });

      expect(StateTopAnswersStatsService.hasStateStats('Hola')).toBe(true);
    });

    it('is true even when the state contains no answers', function() {
      StateTopAnswersStatsService.init(
        {answers: {Hola: []}, interaction_ids: {Hola: 'TextInput'}}
      );

      expect(StateTopAnswersStatsService.hasStateStats('Hola')).toBe(true);
    });

    it('is false when the state does not exist', function() {
      StateTopAnswersStatsService.init({
        answers: {Hola: [{answer: 'hola', frequency: 3}]},
        interaction_ids: {Hola: 'TextInput'},
      });

      expect(StateTopAnswersStatsService.hasStateStats('Me Llamo')).toBe(false);
    });
  });

  describe('.getStateNamesWithStats', function() {
    it('only returns state names that have stats', function() {
      StateTopAnswersStatsService.init({
        answers: {Hola: [{answer: 'hola', frequency: 3}]},
        interaction_ids: {Hola: 'TextInput'},
      });

      expect(StateTopAnswersStatsService.getStateNamesWithStats())
        .toEqual(['Hola']);
    });
  });

  describe('Cache Maintenance', function() {
    beforeEach(function() {
      StateTopAnswersStatsService.init({
        answers: {
          Hola: [
            {answer: 'hola', frequency: 7},
            {answer: 'adios', frequency: 4},
            {answer: 'que?', frequency: 2},
          ]
        },
        interaction_ids: {Hola: 'TextInput'},
      });
    });

    describe('State Addition', function() {
      it('creates a new empty list of stats for the new state', function() {
        spyOn(ChangeListService, 'addState');
        expect(function() {
          StateTopAnswersStatsService.getStateStats('Me Llamo');
        }).toThrowError('Me Llamo does not exist.');

        ExplorationStatesService.addState('Me Llamo');
        expect(StateTopAnswersStatsService.getStateStats('Me Llamo'))
          .toEqual([]);
      });
    });

    describe('State Deletion', function() {
      it('throws an error after deleting the stats', function(done) {
        spyOn($uibModal, 'open').and.callFake(function() {
          return {result: $q.resolve()};
        });
        spyOn(ChangeListService, 'deleteState');

        ExplorationStatesService.deleteState('Hola').then(function() {
          expect(function() {
            StateTopAnswersStatsService.getStateStats('Hola');
          }).toThrowError('Hola does not exist.');
        }).then(done, done.fail);
        $rootScope.$digest();
      });
    });

    describe('State Renaming', function() {
      it('only recognizes the renamed state', function() {
        spyOn(ChangeListService, 'renameState');
        var oldStats = StateTopAnswersStatsService.getStateStats('Hola');

        ExplorationStatesService.renameState('Hola', 'Bonjour');

        expect(StateTopAnswersStatsService.getStateStats('Bonjour'))
          .toBe(oldStats);

        expect(function() {
          StateTopAnswersStatsService.getStateStats('Hola');
        }).toThrowError('Hola does not exist.');
      });
    });

    describe('State Answer Groups Changes', function() {
      beforeEach(function() {
        spyOn(ChangeListService, 'editStateProperty');
      });

      it('recognizes newly resolved answers', function() {
        expect(StateTopAnswersStatsService.getUnresolvedStateStats('Hola'))
          .toContain(joC({answer: 'adios'}));

        var newAnswerGroups = angular.copy(
          ExplorationStatesService.getState('Hola').interaction.answerGroups);
        newAnswerGroups[0].rules = [
          ruleObjectFactory.createNew('Contains', {x: 'adios'})
        ];
        ExplorationStatesService.saveInteractionAnswerGroups(
          'Hola', newAnswerGroups);

        expect(StateTopAnswersStatsService.getUnresolvedStateStats('Hola'))
          .not.toContain(joC({answer: 'adios'}));
      });

      it('recognizes newly unresolved answers', function() {
        expect(StateTopAnswersStatsService.getUnresolvedStateStats('Hola'))
          .not.toContain(joC({answer: 'hola'}));

        var newAnswerGroups = angular.copy(
          ExplorationStatesService.getState('Hola').interaction.answerGroups);
        newAnswerGroups[0].rules = [
          ruleObjectFactory.createNew('Contains', {x: 'bonjour'})
        ];
        ExplorationStatesService.saveInteractionAnswerGroups(
          'Hola', newAnswerGroups);

        expect(StateTopAnswersStatsService.getUnresolvedStateStats('Hola'))
          .toContain(joC({answer: 'hola'}));
      });

      it('removes stat answers when interaction changes', function() {
        expect(StateTopAnswersStatsService.getStateStats('Hola').length)
          .toBeGreaterThan(0);

        ExplorationStatesService.saveInteractionId('Hola', 'FractionInput');
        ExplorationStatesService.saveInteractionCustomizationArgs('Hola', {
          requireSimplestForm: false,
          allowImproperFraction: true,
          allowNonzeroIntegerPart: true,
          customPlaceholder: '',
        });

        expect(StateTopAnswersStatsService.getStateStats('Hola').length)
          .toEqual(0);
      });

      it('permits null interaction ids', function() {
        expect(StateTopAnswersStatsService.getStateStats('Hola').length)
          .toBeGreaterThan(0);

        ExplorationStatesService.saveInteractionId('Hola', null);
        ExplorationStatesService.saveInteractionCustomizationArgs('Hola', {});

        expect(StateTopAnswersStatsService.getStateStats('Hola').length)
          .toEqual(0);
      });
    });
  });
});
