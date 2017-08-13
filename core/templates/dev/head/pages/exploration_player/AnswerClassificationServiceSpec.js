// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the answer classification service
 */

describe('Answer classification service with string classifier disabled',
  function() {
    beforeEach(module('oppia'));

    beforeEach(function() {
      module(function($provide) {
        $provide.constant('INTERACTION_SPECS', {
          RuleTest: {
            is_interaction_trainable: false
          }
        });
        $provide.constant('ENABLE_ML_CLASSIFIERS', false);
      });
    });

    beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

    var EXPLICIT_CLASSIFICATION = 'explicit';
    var DEFAULT_OUTCOME_CLASSIFICATION = 'default_outcome';

    var acs, sof, oof, $httpBackend, successHandler, failHandler, $rootScope,
      stateName, state;
    beforeEach(inject(function($injector) {
      acs = $injector.get('AnswerClassificationService');
      sof = $injector.get('StateObjectFactory');
      oof = $injector.get('OutcomeObjectFactory');
      $httpBackend = $injector.get('$httpBackend');
      $rootScope = $injector.get('$rootScope');
      successHandler = jasmine.createSpy('success');
      failHandler = jasmine.createSpy('fail');

      stateName = 'stateName';
      state = sof.createFromBackendDict(stateName, {
        content: {
          html: 'content',
          audio_translations: {}
        },
        interaction: {
          id: 'RuleTest',
          answer_groups: [{
            outcome: {
              dest: 'outcome 1',
              feedback: [''],
              param_changes: []
            },
            rule_specs: [{
              inputs: {
                x: 10
              },
              rule_type: 'Equals'
            }],
            correct: false
          }, {
            outcome: {
              dest: 'outcome 2',
              feedback: [''],
              param_changes: []
            },
            rule_specs: [{
              inputs: {
                x: 5
              },
              rule_type: 'Equals'
            }, {
              inputs: {
                x: 7
              },
              rule_type: 'NotEquals'
            }, {
              inputs: {
                x: 6
              },
              rule_type: 'Equals'
            }, {
              inputs: {
                x: 7
              },
              rule_type: 'FuzzyMatches'
            }],
            correct: false
          }],
          default_outcome: {
            dest: 'default',
            feedback: [],
            param_changes: []
          },
          fallbacks: [],
          hints: []
        },
        param_changes: []
      });
    }));

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    var explorationId = 'exploration';

    var rules = {
      Equals: function(answer, inputs) {
        return inputs.x === answer;
      },
      NotEquals: function(answer, inputs) {
        return inputs.x !== answer;
      }
    };

    it('should fail if no frontend rules are provided', function() {
      acs.getMatchingClassificationResult(
        explorationId, stateName, state, 0, false).then(
          successHandler, failHandler);
      $rootScope.$digest();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    });

    it('should return the first matching answer group and first matching rule' +
       'spec', function() {
      acs.getMatchingClassificationResult(
        explorationId, stateName, state, 10, false, rules)
        .then(successHandler, failHandler);
      $rootScope.$digest();
      expect(successHandler).toHaveBeenCalledWith({
        outcome: oof.createNew('outcome 1', [''], []),
        answerGroupIndex: 0,
        ruleIndex: 0,
        classificationCategorization: EXPLICIT_CLASSIFICATION
      });
      expect(failHandler).not.toHaveBeenCalled();

      acs.getMatchingClassificationResult(
        explorationId, stateName, state, 5, false, rules)
        .then(successHandler, failHandler);
      $rootScope.$digest();
      expect(successHandler).toHaveBeenCalledWith({
        outcome: oof.createNew('outcome 2', [''], []),
        answerGroupIndex: 1,
        ruleIndex: 0,
        classificationCategorization: EXPLICIT_CLASSIFICATION
      });
      expect(failHandler).not.toHaveBeenCalled();

      acs.getMatchingClassificationResult(
        explorationId, stateName, state, 6, false, rules)
        .then(successHandler, failHandler);
      $rootScope.$digest();
      expect(successHandler).toHaveBeenCalledWith({
        outcome: oof.createNew('outcome 2', [''], []),
        answerGroupIndex: 1,
        ruleIndex: 1,
        classificationCategorization: EXPLICIT_CLASSIFICATION
      });
      expect(failHandler).not.toHaveBeenCalled();
    });

    it('should return the default rule if no answer group matches', function() {
      acs.getMatchingClassificationResult(
        explorationId, stateName, state, 7, false, rules)
        .then(successHandler, failHandler);
      $rootScope.$digest();
      expect(successHandler).toHaveBeenCalledWith({
        outcome: oof.createNew('default', [], []),
        answerGroupIndex: 2,
        ruleIndex: 0,
        classificationCategorization: DEFAULT_OUTCOME_CLASSIFICATION
      });
      expect(failHandler).not.toHaveBeenCalled();
    });

    it('should fail if no answer group matches and no default rule is ' +
       'provided', function() {
      var state2 = sof.createFromBackendDict(stateName, {
        content: {
          html: 'content',
          audio_translations: {}
        },
        interaction: {
          id: 'RuleTest',
          answer_groups: [{
            outcome: {
              dest: 'outcome 1',
              feedback: [''],
              param_changes: []
            },
            rule_specs: [{
              inputs: {
                x: 10
              },
              rule_type: 'Equals'
            }],
            correct: false
          }],
          default_outcome: {
            dest: 'default',
            feedback: [],
            param_changes: []
          },
          fallbacks: [],
          hints: []
        },
        param_changes: []
      });

      acs.getMatchingClassificationResult(
        explorationId, stateName, state, 0, false).then(
          successHandler, failHandler);
      $rootScope.$digest();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    });
  });

describe('Answer classification service with string classifier enabled',
  function() {
    beforeEach(module('oppia'));

    beforeEach(function() {
      module(function($provide) {
        $provide.constant('INTERACTION_SPECS', {
          TrainableInteraction: {
            is_interaction_trainable: true
          },
          UntrainableInteraction: {
            is_interaction_trainable: false
          }
        });
        $provide.constant('ENABLE_ML_CLASSIFIERS', true);
      });
    });

    beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

    var EXPLICIT_CLASSIFICATION = 'explicit';
    var DEFAULT_OUTCOME_CLASSIFICATION = 'default_outcome';

    var acs, scms, sof, oof, $httpBackend, successHandler, failHandler,
      $rootScope, stateName, state, state2, stateClassifierMapping;
    beforeEach(inject(function($injector) {
      acs = $injector.get('AnswerClassificationService');
      scms = $injector.get('StateClassifierMappingService');
      sof = $injector.get('StateObjectFactory');
      oof = $injector.get('OutcomeObjectFactory');
      $httpBackend = $injector.get('$httpBackend');
      $rootScope = $injector.get('$rootScope');
      successHandler = jasmine.createSpy('success');
      failHandler = jasmine.createSpy('fail');

      stateName = 'stateName';
      state = sof.createFromBackendDict(stateName, {
        content: {
          html: 'content',
          audio_translations: {}
        },
        interaction: {
          id: 'TrainableInteraction',
          answer_groups: [{
            outcome: {
              dest: 'outcome 1',
              feedback: [''],
              param_changes: []
            },
            rule_specs: [{
              inputs: {
                x: 10
              },
              rule_type: 'Equals'
            }],
            correct: false
          }, {
            outcome: {
              dest: 'outcome 2',
              feedback: [''],
              param_changes: []
            },
            rule_specs: [{
              inputs: {
                x: 5
              },
              rule_type: 'Equals'
            }, {
              inputs: {
                x: 7
              },
              rule_type: 'Equals'
            }, {
              inputs: {
                x: 7
              },
              rule_type: 'FuzzyMatches'
            }],
            correct: false
          }],
          default_outcome: {
            dest: 'default',
            feedback: [],
            param_changes: []
          },
          fallbacks: [],
          hints: []
        },
        param_changes: []
      });

      stateClassifierMapping = {
        stateName: {
          algorithm_id: 'LDAStringClassifier',
          classifier_data: {}
        }
      };
      scms.init(stateClassifierMapping);

      state2 = angular.copy(state);
      state2.interaction.id = 'UntrainableInteraction';
    }));

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    var explorationId = 'exploration';

    var rules = {
      Equals: function(answer, inputs) {
        return inputs.x === answer;
      },
      NotEquals: function(answer, inputs) {
        return inputs.x !== answer;
      }
    };

    it('should query the prediction service if no answer group matches and ' +
       'interaction is trainable', function() {
      // The prediction result is the same as default until there is a mapping
      // in PredictionAlgorithmRegistryService.
      var expectedClassificationResult = {
        outcome: oof.createNew('default', [], []),
        answerGroupIndex: 2,
        ruleIndex: 0,
        classificationCategorization: DEFAULT_OUTCOME_CLASSIFICATION
      };
      acs.getMatchingClassificationResult(
        explorationId, stateName, state, 0, false, rules)
        .then(successHandler, failHandler);
      $rootScope.$apply();

      expect(successHandler).toHaveBeenCalledWith(expectedClassificationResult);
      expect(failHandler).not.toHaveBeenCalled();
    });

    it('should return the default rule if no answer group matches and ' +
       'interaction is not trainable', function() {
      acs.getMatchingClassificationResult(
        explorationId, stateName, state2, 0, false, rules)
        .then(successHandler, failHandler);
      $rootScope.$digest();
      expect(successHandler).toHaveBeenCalledWith({
        outcome: oof.createNew('default', [], []),
        answerGroupIndex: 2,
        ruleIndex: 0,
        classificationCategorization: DEFAULT_OUTCOME_CLASSIFICATION
      });
      expect(failHandler).not.toHaveBeenCalled();
    });
  }
);
