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
 * @fileoverview Unit tests for all interaction validators.
 *
 * NOTE TO DEVELOPERS: Many of the exploration validators simply defer their
 * validation to the baseValidator. As a result, they require no additional
 * testing. You will see some test suites in this file which simply have a
 * single test for the validator along the lines of "it should be able to
 * perform basic validation." These simple tests are to ensure the policy of the
 * validator is to defer validation to the baseValidator, since it has its own
 * tests to ensure it is working properly.
 */

import { AppConstants } from 'app.constants';
// TODO(#7222): Remove the following block of unnnecessary imports once
// interaction validators is upgraded to Angular 8.
import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { baseInteractionValidationService } from
  'interactions/base-interaction-validation.service';
import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Interaction validator', function() {
  var bivs, WARNING_TYPES, agof;

  var currentState, otherState, goodOutcomeDest, goodOutcomeFeedback;
  var badOutcome, goodAnswerGroups;
  var agof, oof;

  beforeEach(function() {
    angular.mock.module('oppia');
  });
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'AnswerGroupObjectFactory', new AnswerGroupObjectFactory(
        new OutcomeObjectFactory()));
    $provide.value(
      'baseInteractionValidationService',
      new baseInteractionValidationService());
    $provide.value(
      'OutcomeObjectFactory', new OutcomeObjectFactory());
  }));

  beforeEach(angular.mock.inject(function($injector, $rootScope) {
    bivs = $injector.get('baseInteractionValidationService');
    WARNING_TYPES = AppConstants.WARNING_TYPES;
    agof = $injector.get('AnswerGroupObjectFactory');
    oof = $injector.get('OutcomeObjectFactory');

    currentState = 'First State';
    otherState = 'Second State';
    goodOutcomeDest = oof.createFromBackendDict({
      dest: otherState,
      dest_if_really_stuck: null,
      feedback: {
        html: '',
        audio_translations: {}
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null
    });
    goodOutcomeFeedback = oof.createFromBackendDict({
      dest: currentState,
      dest_if_really_stuck: null,
      feedback: {
        html: 'Feedback',
        audio_translations: {}
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null
    });
    badOutcome = oof.createFromBackendDict({
      dest: currentState,
      dest_if_really_stuck: null,
      feedback: {
        html: '',
        audio_translations: {}
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null
    });

    goodAnswerGroups = [
      agof.createNew([], goodOutcomeDest, false, null),
      agof.createNew([], goodOutcomeFeedback, false, null)
    ];
  }));

  describe('baseValidator', function() {
    it('should have no warnings for good answer groups with no ' +
        'confusing outcomes', function() {
      var warnings = bivs.getAnswerGroupWarnings(
        goodAnswerGroups, currentState);
      expect(warnings).toEqual([]);
    });

    it('should have a warning for an answer group with a confusing outcome',
      function() {
        var answerGroups = [
          agof.createNew([], goodOutcomeDest, false, null),
          agof.createNew([], badOutcome, false, null),
          agof.createNew([], goodOutcomeFeedback, false, null)
        ];
        var warnings = bivs.getAnswerGroupWarnings(answerGroups, currentState);
        expect(warnings).toEqual([{
          type: WARNING_TYPES.ERROR,
          message: 'Please specify what Oppia should do in Oppia response 2.'
        }]);
      }
    );

    it('should have a warning for an answer group with a self-loop labelled' +
    ' as correct', function() {
      goodOutcomeFeedback.labelledAsCorrect = true;
      var answerGroups = [
        agof.createNew([], goodOutcomeFeedback, false, null)
      ];
      var warnings = bivs.getAnswerGroupWarnings(answerGroups, currentState);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message:
            'In answer group 1, self-loops should not be labelled as correct.'
      }]);
    });

    it('should have a warning for a correct answer group with destIfStuck',
      function() {
        goodOutcomeDest.labelledAsCorrect = true;
        goodOutcomeDest.destIfReallyStuck = 'destIfReallyStuck';
        const answerGroups = [
          agof.createNew([], goodOutcomeDest, false, null)
        ];
        const warnings = bivs.getAnswerGroupWarnings(
          answerGroups, currentState);
        expect(warnings).toEqual([{
          type: WARNING_TYPES.ERROR,
          message:
              'The answer group 1 is labelled as \'correct\', ' +
              'but includes a \'destination for really stuck learners\'. ' +
              'The latter is unnecessary and should be removed.'
        }]);
      }
    );

    it('should not have any warnings for a non-confusing default outcome',
      function() {
        var warnings = bivs.getDefaultOutcomeWarnings(
          goodOutcomeDest, currentState);
        expect(warnings).toEqual([]);

        warnings = bivs.getDefaultOutcomeWarnings(
          goodOutcomeFeedback, currentState);
        expect(warnings).toEqual([]);
      }
    );

    it('should have a warning for a confusing default outcome', function() {
      var warnings = bivs.getDefaultOutcomeWarnings(badOutcome, currentState);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: 'Please add feedback for the user in the [All other ' +
          'answers] rule.'
      }]);
    });

    it('should have a warning for a default outcome with a self-loop' +
    ' labelled as correct', function() {
      goodOutcomeFeedback.labelledAsCorrect = true;
      var warnings = bivs.getDefaultOutcomeWarnings(
        goodOutcomeFeedback, currentState);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: (
          'In the [All other answers] group, self-loops should not be ' +
          'labelled as correct.')
      }]);
    });

    it('should not have any warnings for no answer groups and a null default ' +
        'outcome.', function() {
      var warnings = bivs.getAllOutcomeWarnings([], null, currentState);
      expect(warnings).toEqual([]);
    });

    it('should be able to concatenate warnings for both answer groups and ' +
        'the default outcome', function() {
      var badAnswerGroups = [
        agof.createNew([], goodOutcomeDest, false, null),
        agof.createNew([], badOutcome, false, null),
        agof.createNew([], badOutcome, false, null)
      ];
      var warnings = bivs.getAllOutcomeWarnings(
        badAnswerGroups, badOutcome, currentState);
      expect(warnings).toEqual([{
        type: WARNING_TYPES.ERROR,
        message: 'Please specify what Oppia should do in Oppia response 2.'
      }, {
        type: WARNING_TYPES.ERROR,
        message: 'Please specify what Oppia should do in Oppia response 3.'
      }, {
        type: WARNING_TYPES.ERROR,
        message: (
          'Please add feedback for the user in the [All other answers] rule.')
      }
      ]);
    });
  });

  describe('customizationValidator', function() {
    it('should not throw for no arguments', function() {
      bivs.requireCustomizationArguments({}, []);
    });

    it('should throw a warning for a missing top-level field', function() {
      expect(function() {
        bivs.requireCustomizationArguments({}, ['levelone']);
      }).toThrowError(
        'Expected customization arguments to have property: levelone'
      );
    });

    it('should throw warnings for multiple missing top-level fields',
      function() {
        var expectedArgs = ['first', 'second'];
        expect(function() {
          bivs.requireCustomizationArguments({}, expectedArgs);
        }).toThrowError(
          'Expected customization arguments to have properties: first, second'
        );
      }
    );
  });

  describe('HTMLValidator', function() {
    it('should categorize completely empty string as empty', function() {
      const html = '   ';

      expect(bivs.isHTMLEmpty(html)).toBeTrue();
    });

    it('should categorize balanced HTML tags as empty if the remaining ' +
        'string is empty', function() {
      const html = '  <strong>   <em>  </em></strong>';

      expect(bivs.isHTMLEmpty(html)).toBeTrue();
    });

    it('should categorize balanced HTML tags as not empty if the remaining ' +
        'string is not empty', function() {
      const html = '  <strong>  info <em>  </em></strong>';

      expect(bivs.isHTMLEmpty(html)).toBeFalse();
    });

    it('should categorize imbalanced HTML tags as not empty', function() {
      const html = '<strong>';

      expect(bivs.isHTMLEmpty(html)).toBeFalse();
    });

    it('should categorize unfilled list as empty', function() {
      const html = '<ul><li>&nbsp;</li><li>    <strong>  </strong></li></ul>';

      expect(bivs.isHTMLEmpty(html)).toBeTrue();
    });
  });
});
