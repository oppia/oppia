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
            is_trainable: false
          }
        });
        $provide.constant('ENABLE_ML_CLASSIFIERS', false);
      });
    });

    beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

    var EXPLICIT_CLASSIFICATION, DEFAULT_OUTCOME_CLASSIFICATION;
    var acs, sof, oof, acrof, stateName, state;
    beforeEach(inject(function($injector) {
      acs = $injector.get('AnswerClassificationService');
      sof = $injector.get('StateObjectFactory');
      oof = $injector.get('OutcomeObjectFactory');
      acrof = $injector.get('AnswerClassificationResultObjectFactory');
      EXPLICIT_CLASSIFICATION = $injector.get('EXPLICIT_CLASSIFICATION');
      DEFAULT_OUTCOME_CLASSIFICATION = $injector.get(
        'DEFAULT_OUTCOME_CLASSIFICATION');

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
              feedback: {
                html: '',
                audio_translations: {}
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
            rule_specs: [{
              inputs: {
                x: 10
              },
              rule_type: 'Equals'
            }]
          }, {
            outcome: {
              dest: 'outcome 2',
              feedback: {
                html: '',
                audio_translations: {}
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
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
            }]
          }],
          default_outcome: {
            dest: 'default',
            feedback: {
              html: '',
              audio_translations: {}
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null
          },
          hints: []
        },
        param_changes: []
      });
    }));

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
      expect(function() {
        acs.getMatchingClassificationResult(explorationId, stateName, state, 0);
      }).toThrow();
    });

    it('should return the first matching answer group and first matching rule' +
       'spec', function() {
      expect(
        acs.getMatchingClassificationResult(
          explorationId, stateName, state, 10, rules)
      ).toEqual(acrof.createNew(
        oof.createNew('outcome 1', '', []), 0, 0, EXPLICIT_CLASSIFICATION
      ));

      expect(
        acs.getMatchingClassificationResult(
          explorationId, stateName, state, 5, rules)
      ).toEqual(acrof.createNew(
        oof.createNew('outcome 2', '', []), 1, 0, EXPLICIT_CLASSIFICATION
      ));

      expect(
        acs.getMatchingClassificationResult(
          explorationId, stateName, state, 6, rules)
      ).toEqual(acrof.createNew(
        oof.createNew('outcome 2', '', []), 1, 1, EXPLICIT_CLASSIFICATION
      ));
    });

    it('should return the default rule if no answer group matches', function() {
      expect(
        acs.getMatchingClassificationResult(
          explorationId, stateName, state, 7, rules)
      ).toEqual(acrof.createNew(
        oof.createNew('default', '', []), 2, 0, DEFAULT_OUTCOME_CLASSIFICATION
      ));
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
              feedback: {
                html: '',
                audio_translations: {}
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
            rule_specs: [{
              inputs: {
                x: 10
              },
              rule_type: 'Equals'
            }]
          }],
          default_outcome: {
            dest: 'default',
            feedback: {
              html: '',
              audio_translations: {}
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null
          },
          hints: []
        },
        param_changes: []
      });

      expect(function() {
        acs.getMatchingClassificationResult(
          explorationId, stateName, state, 0);
      }).toThrow();
    });
  });

describe('Answer classification service with string classifier enabled',
  function() {
    beforeEach(module('oppia'));

    beforeEach(function() {
      module(function($provide) {
        $provide.constant('INTERACTION_SPECS', {
          TrainableInteraction: {
            is_trainable: true
          },
          UntrainableInteraction: {
            is_trainable: false
          }
        });
        $provide.constant('ENABLE_ML_CLASSIFIERS', true);
        $provide.factory('PredictionSampleService', [function() {
          return {
            predict: function(classifierData, answer) {
              return 1;
            }
          };
        }]);
      });
    });

    beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

    var EXPLICIT_CLASSIFICATION, DEFAULT_OUTCOME_CLASSIFICATION,
      STATISTICAL_CLASSIFICATION;
    var acs, scms, sof, oof, acrof, $stateName, state, state2,
      registryService, stateClassifierMapping;
    beforeEach(inject(function($injector) {
      acs = $injector.get('AnswerClassificationService');
      scms = $injector.get('StateClassifierMappingService');
      sof = $injector.get('StateObjectFactory');
      oof = $injector.get('OutcomeObjectFactory');
      acrof = $injector.get('AnswerClassificationResultObjectFactory');
      EXPLICIT_CLASSIFICATION = $injector.get('EXPLICIT_CLASSIFICATION');
      DEFAULT_OUTCOME_CLASSIFICATION = $injector.get(
        'DEFAULT_OUTCOME_CLASSIFICATION');
      STATISTICAL_CLASSIFICATION = $injector.get('STATISTICAL_CLASSIFICATION');
      registryService = $injector.get('PredictionAlgorithmRegistryService');

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
              feedback: {
                html: '',
                audio_translations: {}
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
            rule_specs: [{
              inputs: {
                x: 10
              },
              rule_type: 'Equals'
            }]
          }, {
            outcome: {
              dest: 'outcome 2',
              feedback: {
                html: '',
                audio_translations: {}
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
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
            }]
          }],
          default_outcome: {
            dest: 'default',
            feedback: {
              html: '',
              audio_translations: {}
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null
          },
          hints: []
        },
        param_changes: []
      });

      stateClassifierMapping = {
        stateName: {
          algorithm_id: 'TestClassifier',
          classifier_data: {},
          data_schema_version: 1
        }
      };
      scms.init(stateClassifierMapping);

      registryService.setMapping({
        TestClassifier: {
          v1: 'PredictionSampleService'
        }
      });

      state2 = angular.copy(state);
      state2.interaction.id = 'UntrainableInteraction';
    }));

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
      expect(
        acs.getMatchingClassificationResult(
          explorationId, stateName, state, 0, rules)
      ).toEqual(
        acrof.createNew(
          state.interaction.answerGroups[1].outcome, 1, 0,
          STATISTICAL_CLASSIFICATION)
      );
    });

    it('should return the default rule if no answer group matches and ' +
       'interaction is not trainable', function() {
      expect(
        acs.getMatchingClassificationResult(
          explorationId, stateName, state2, 0, rules)
      ).toEqual(acrof.createNew(
        oof.createNew('default', '', []), 2, 0, DEFAULT_OUTCOME_CLASSIFICATION
      ));
    });
  }
);
