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

// TODO(#7222): Remove the following block of unnnecessary imports once
// answer-classification.service.ts is upgraded to Angular 8.
import { AnswerClassificationResultObjectFactory } from
  'domain/classifier/AnswerClassificationResultObjectFactory';
import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { ClassifierObjectFactory } from
  'domain/classifier/ClassifierObjectFactory';
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
import { StateClassifierMappingService } from
  'pages/exploration-player-page/services/state-classifier-mapping.service';
import { SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory';
import { UnitsObjectFactory } from 'domain/objects/UnitsObjectFactory';
import { VoiceoverObjectFactory } from
  'domain/exploration/VoiceoverObjectFactory';
import { WrittenTranslationObjectFactory } from
  'domain/exploration/WrittenTranslationObjectFactory';
import { WrittenTranslationsObjectFactory } from
  'domain/exploration/WrittenTranslationsObjectFactory';
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

import { TranslatorProviderForTests } from 'tests/test.extras';

require('domain/exploration/OutcomeObjectFactory.ts');
require('domain/exploration/StatesObjectFactory.ts');
require(
  'pages/exploration-player-page/services/answer-classification.service.ts');

describe('Answer classification service with string classifier disabled',
  function() {
    beforeEach(angular.mock.module('oppia'));
    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.value(
        'AnswerClassificationResultObjectFactory',
        new AnswerClassificationResultObjectFactory());
      $provide.value(
        'AnswerGroupObjectFactory', new AnswerGroupObjectFactory(
          new OutcomeObjectFactory(new SubtitledHtmlObjectFactory()),
          new RuleObjectFactory()));
      $provide.value('ClassifierObjectFactory', new ClassifierObjectFactory());
      $provide.value('FractionObjectFactory', new FractionObjectFactory());
      $provide.value(
        'HintObjectFactory', new HintObjectFactory(
          new SubtitledHtmlObjectFactory()));
      $provide.value(
        'OutcomeObjectFactory', new OutcomeObjectFactory(
          new SubtitledHtmlObjectFactory()));
      $provide.value(
        'ParamChangeObjectFactory', new ParamChangeObjectFactory());
      $provide.value(
        'ParamChangesObjectFactory', new ParamChangesObjectFactory(
          new ParamChangeObjectFactory()));
      $provide.value(
        'RecordedVoiceoversObjectFactory',
        new RecordedVoiceoversObjectFactory(new VoiceoverObjectFactory()));
      $provide.value('RuleObjectFactory', new RuleObjectFactory());
      $provide.value(
        'StateClassifierMappingService', new StateClassifierMappingService(
          new ClassifierObjectFactory()));
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
    beforeEach(function() {
      angular.mock.module(function($provide) {
        $provide.constant('INTERACTION_SPECS', {
          RuleTest: {
            is_trainable: false
          }
        });
        $provide.constant('ENABLE_ML_CLASSIFIERS', false);
      });
    });

    beforeEach(
      angular.mock.module('oppia', TranslatorProviderForTests));

    var EXPLICIT_CLASSIFICATION, DEFAULT_OUTCOME_CLASSIFICATION;
    var acs, sof, oof, acrof, stateName, state;
    beforeEach(angular.mock.inject(function($injector) {
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
          id: 'RuleTest',
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
              inputs: {
                x: 10
              },
              rule_type: 'Equals'
            }]
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
        acs.getMatchingClassificationResult(stateName, state.interaction, 0);
      }).toThrowError(
        'No interactionRulesService was available to classify the answer.');
    });

    it('should return the first matching answer group and first matching rule' +
       'spec', function() {
      expect(
        acs.getMatchingClassificationResult(
          stateName, state.interaction, 10, rules)
      ).toEqual(acrof.createNew(
        oof.createNew('outcome 1', 'feedback_1', '', []), 0, 0,
        EXPLICIT_CLASSIFICATION)
      );

      expect(
        acs.getMatchingClassificationResult(
          stateName, state.interaction, 5, rules)
      ).toEqual(acrof.createNew(
        oof.createNew('outcome 2', 'feedback_2', '', []), 1, 0,
        EXPLICIT_CLASSIFICATION)
      );

      expect(
        acs.getMatchingClassificationResult(
          stateName, state.interaction, 6, rules)
      ).toEqual(acrof.createNew(
        oof.createNew('outcome 2', 'feedback_2', '', []), 1, 1,
        EXPLICIT_CLASSIFICATION)
      );
    });

    it('should return the default rule if no answer group matches', function() {
      expect(
        acs.getMatchingClassificationResult(
          stateName, state.interaction, 7, rules)
      ).toEqual(acrof.createNew(
        oof.createNew('default', 'default_outcome', '', []), 2, 0,
        DEFAULT_OUTCOME_CLASSIFICATION)
      );
    });

    it('should fail if no answer group matches and no default rule is ' +
       'provided', function() {
      var state2 = sof.createFromBackendDict(stateName, {
        content: {
          content_id: 'content',
          html: 'content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          }
        },
        interaction: {
          id: 'RuleTest',
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
              inputs: {
                x: 10
              },
              rule_type: 'Equals'
            }]
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
            feedback_1: {}
          }
        }
      });

      expect(function() {
        acs.getMatchingClassificationResult(
          stateName, state.interaction, 0);
      }).toThrowError(
        'No interactionRulesService was available to classify the answer.');
    });
  });

describe('Answer classification service with string classifier enabled',
  function() {
    beforeEach(angular.mock.module('oppia'));
    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.value(
        'AnswerClassificationResultObjectFactory',
        new AnswerClassificationResultObjectFactory());
      $provide.value(
        'AnswerGroupObjectFactory', new AnswerGroupObjectFactory(
          new OutcomeObjectFactory(new SubtitledHtmlObjectFactory()),
          new RuleObjectFactory()));
      $provide.value('ClassifierObjectFactory', new ClassifierObjectFactory());
      $provide.value('FractionObjectFactory', new FractionObjectFactory());
      $provide.value(
        'HintObjectFactory', new HintObjectFactory(
          new SubtitledHtmlObjectFactory()));
      $provide.value(
        'OutcomeObjectFactory', new OutcomeObjectFactory(
          new SubtitledHtmlObjectFactory()));
      $provide.value(
        'ParamChangeObjectFactory', new ParamChangeObjectFactory());
      $provide.value(
        'ParamChangesObjectFactory', new ParamChangesObjectFactory(
          new ParamChangeObjectFactory()));
      $provide.value(
        'RecordedVoiceoversObjectFactory',
        new RecordedVoiceoversObjectFactory(new VoiceoverObjectFactory()));
      $provide.value('RuleObjectFactory', new RuleObjectFactory());
      $provide.value(
        'StateClassifierMappingService', new StateClassifierMappingService(
          new ClassifierObjectFactory()));
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
    beforeEach(function() {
      angular.mock.module(function($provide) {
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

    beforeEach(
      angular.mock.module('oppia', TranslatorProviderForTests));

    var EXPLICIT_CLASSIFICATION, DEFAULT_OUTCOME_CLASSIFICATION,
      STATISTICAL_CLASSIFICATION;
    var acs, scms, sof, oof, acrof, stateName, state, state2,
      registryService, stateClassifierMapping;
    beforeEach(angular.mock.inject(function($injector) {
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
          id: 'TrainableInteraction',
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
              inputs: {
                x: 10
              },
              rule_type: 'Equals'
            }]
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
          stateName, state.interaction, 0, rules)
      ).toEqual(
        acrof.createNew(
          state.interaction.answerGroups[1].outcome, 1, null,
          STATISTICAL_CLASSIFICATION)
      );
    });

    it('should return the default rule if no answer group matches and ' +
       'interaction is not trainable', function() {
      expect(
        acs.getMatchingClassificationResult(
          stateName, state2.interaction, 0, rules)
      ).toEqual(acrof.createNew(
        oof.createNew('default', 'default_outcome', '', []), 2, 0,
        DEFAULT_OUTCOME_CLASSIFICATION)
      );
    });
  }
);

describe('Answer classification service with training data classification',
  function() {
    beforeEach(angular.mock.module('oppia'));
    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.value(
        'AnswerClassificationResultObjectFactory',
        new AnswerClassificationResultObjectFactory());
      $provide.value(
        'AnswerGroupObjectFactory', new AnswerGroupObjectFactory(
          new OutcomeObjectFactory(new SubtitledHtmlObjectFactory()),
          new RuleObjectFactory()));
      $provide.value('ClassifierObjectFactory', new ClassifierObjectFactory());
      $provide.value('FractionObjectFactory', new FractionObjectFactory());
      $provide.value(
        'HintObjectFactory', new HintObjectFactory(
          new SubtitledHtmlObjectFactory()));
      $provide.value(
        'OutcomeObjectFactory', new OutcomeObjectFactory(
          new SubtitledHtmlObjectFactory()));
      $provide.value(
        'ParamChangeObjectFactory', new ParamChangeObjectFactory());
      $provide.value(
        'ParamChangesObjectFactory', new ParamChangesObjectFactory(
          new ParamChangeObjectFactory()));
      $provide.value(
        'RecordedVoiceoversObjectFactory',
        new RecordedVoiceoversObjectFactory(new VoiceoverObjectFactory()));
      $provide.value('RuleObjectFactory', new RuleObjectFactory());
      $provide.value(
        'StateClassifierMappingService', new StateClassifierMappingService(
          new ClassifierObjectFactory()));
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
    beforeEach(function() {
      angular.mock.module(function($provide) {
        $provide.constant('INTERACTION_SPECS', {
          TrainableInteraction: {
            is_trainable: true
          }
        });
        $provide.constant('ENABLE_ML_CLASSIFIERS', true);
        $provide.constant('ENABLE_TRAINING_DATA_CLASSIFICATION', true);
      });
    });

    beforeEach(
      angular.mock.module('oppia', TranslatorProviderForTests));

    var EXPLICIT_CLASSIFICATION, TRAINING_DATA_CLASSIFICATION;
    var acs, sof, oof, acrof, stateName, state, state2,
      registryService, stateClassifierMapping;
    beforeEach(angular.mock.inject(function($injector) {
      acs = $injector.get('AnswerClassificationService');
      sof = $injector.get('StateObjectFactory');
      oof = $injector.get('OutcomeObjectFactory');
      acrof = $injector.get('AnswerClassificationResultObjectFactory');
      TRAINING_DATA_CLASSIFICATION = $injector.get(
        'TRAINING_DATA_CLASSIFICATION');
      EXPLICIT_CLASSIFICATION = $injector.get('EXPLICIT_CLASSIFICATION');

      stateName = 'stateName';
      state = sof.createFromBackendDict(stateName, {
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
          id: 'TrainableInteraction',
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
            training_data: ['abc', 'input'],
            rule_specs: [{
              inputs: {
                x: 'equal'
              },
              rule_type: 'Equals'
            }]
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
            training_data: ['xyz'],
            rule_specs: [{
              inputs: {
                x: 'npu'
              },
              rule_type: 'Contains'
            }]
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
      });
    }));

    var explorationId = 'exploration';

    var rules = {
      Equals: function(answer, input) {
        return answer === input;
      },
      Contains: function(answer, input) {
        return answer.toLowerCase().indexOf(
          input.x.toLowerCase()) !== -1;
      }
    };

    it('should use training data classification if no answer group matches ' +
       'and interaction is trainable', function() {
      expect(
        acs.getMatchingClassificationResult(
          stateName, state.interaction, 'abc', rules)
      ).toEqual(
        acrof.createNew(
          state.interaction.answerGroups[0].outcome, 0, null,
          TRAINING_DATA_CLASSIFICATION)
      );

      expect(
        acs.getMatchingClassificationResult(
          stateName, state.interaction, 'xyz', rules)
      ).toEqual(
        acrof.createNew(
          state.interaction.answerGroups[1].outcome, 1, null,
          TRAINING_DATA_CLASSIFICATION)
      );
    });

    it('should perform explicit classification before doing training data ' +
      'classification', function() {
      expect(
        acs.getMatchingClassificationResult(
          stateName, state.interaction, 'input', rules)
      ).toEqual(
        acrof.createNew(
          state.interaction.answerGroups[1].outcome, 1, 0,
          EXPLICIT_CLASSIFICATION)
      );
    });
  }
);
