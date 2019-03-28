// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Interaction object factory.
 */

describe('Interaction object factory', function() {
  var iof = null;
  var oof = null;
  var agof = null;
  var hof = null;
  var sof = null;
  var testInteraction = null;
  var answerGroupsDict = null;
  var defaultOutcomeDict = null;
  var solutionDict = null;
  var hintsDict = null;
  var interactionDict = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    iof = $injector.get('InteractionObjectFactory');
    oof = $injector.get('OutcomeObjectFactory');
    agof = $injector.get('AnswerGroupObjectFactory');
    hof = $injector.get('HintObjectFactory');
    sof = $injector.get('SolutionObjectFactory');
    defaultOutcomeDict = {
      dest: 'dest_default',
      feedback: {
        content_id: 'default_outcome',
        html: ''
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null
    };
    answerGroupsDict = [{
      rule_specs: [],
      outcome: {
        dest: 'dest_1',
        feedback: {
          content_id: 'outcome_1',
          html: ''
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null
      },
      training_data: ['training_data'],
      tagged_misconception_id: 1
    }];
    hintsDict = [
      {
        hint_content: {
          html: '<p>First Hint</p>',
          content_id: 'content_id1'
        }
      },
      {
        hint_content: {
          html: '<p>Second Hint</p>',
          content_id: 'content_id2'
        }
      }
    ];

    solutionDict = {
      answer_is_exclusive: false,
      correct_answer: 'This is a correct answer!',
      explanation: {
        content_id: 'solution',
        html: 'This is the explanation to the answer'
      }
    };

    interactionDict = {
      answer_groups: answerGroupsDict,
      confirmed_unclassified_answers: [],
      customization_args: {
        customArg: {
          value: 'custom_value'
        }
      },
      default_outcome: defaultOutcomeDict,
      hints: hintsDict,
      id: 'interaction_id',
      solution: solutionDict
    };

    testInteraction = iof.createFromBackendDict(interactionDict);
  }));

  it('should correctly set the new ID', function() {
    expect(testInteraction.id).toEqual('interaction_id');
    testInteraction.setId('new_interaction_id');
    expect(testInteraction.id).toEqual('new_interaction_id');
  });

  it('should correctly set the new answer group', function() {
    var newAnswerGroup = {
      rule_specs: [],
      outcome: {
        dest: 'dest_3',
        feedback: {
          content_id: 'outcome_3',
          html: ''
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null
      },
      training_data: ['training_data'],
      tagged_misconception_id: 1
    };
    expect(testInteraction.answerGroups).toEqual([agof.createFromBackendDict({
      rule_specs: [],
      outcome: {
        dest: 'dest_1',
        feedback: {
          content_id: 'outcome_1',
          html: ''
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null
      },
      training_data: ['training_data'],
      tagged_misconception_id: 1
    })]);
    newAnswerGroup = agof.createFromBackendDict(newAnswerGroup);
    testInteraction.setAnswerGroups([newAnswerGroup]);
    expect(testInteraction.answerGroups).toEqual([newAnswerGroup]);
  });

  it('should correctly set the new default outcome', function() {
    var newDefaultOutcomeDict = {
      dest: 'dest_default_new',
      feedback: {
        content_id: 'default_outcome_new',
        html: ''
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null
    };
    newDefaultOutcome = oof.createFromBackendDict(newDefaultOutcomeDict);
    expect(testInteraction.defaultOutcome).toEqual(
      oof.createFromBackendDict({
        dest: 'dest_default',
        feedback: {
          content_id: 'default_outcome',
          html: ''
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null
      }));
    testInteraction.setDefaultOutcome(newDefaultOutcome);
    expect(testInteraction.defaultOutcome).toEqual(newDefaultOutcome);
  });

  it('should correctly set the new customization args', function() {
    var newCustomizationArgs = {
      customArgNew: {
        value: 'custom_value_new'
      }
    };
    expect(testInteraction.customizationArgs).toEqual({
      customArg: {
        value: 'custom_value'
      }
    });
    testInteraction.setCustomizationArgs(newCustomizationArgs);
    expect(testInteraction.customizationArgs).toEqual(newCustomizationArgs);
  });

  it('should correctly set the new solution', function() {
    var newSolutionDict = {
      answer_is_exclusive: false,
      correct_answer: 'This is a new correct answer!',
      explanation: {
        content_id: 'solution_new',
        html: 'This is the new explanation to the answer'
      }
    };
    newSolution = sof.createFromBackendDict(newSolutionDict);
    expect(testInteraction.solution).toEqual(
      sof.createFromBackendDict({
        answer_is_exclusive: false,
        correct_answer: 'This is a correct answer!',
        explanation: {
          content_id: 'solution',
          html: 'This is the explanation to the answer'
        }
      }));
    testInteraction.setSolution(newSolution);
    expect(testInteraction.solution).toEqual(newSolution);
  });

  it('should correctly set the new hint', function() {
    var newHintDict = {
      hint_content: {
        html: '<p>New Hint</p>',
        content_id: 'content_id_new'
      }
    };
    newHint = hof.createFromBackendDict(newHintDict);
    expect(testInteraction.hints).toEqual(hintsDict.map(function(hintDict) {
      return hof.createFromBackendDict(hintDict);
    }));
    testInteraction.setHints([newHint]);
    expect(testInteraction.hints).toEqual([newHint]);
  });

  it('should correctly copy from other interaction', function() {
    var newAnswerGroups = [{
      rule_specs: [],
      outcome: {
        dest: 'dest_1_new',
        feedback: {
          content_id: 'outcome_1_new',
          html: ''
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null
      },
      training_data: ['training_data_new'],
      tagged_misconception_id: 2
    }];
    var newDefaultOutcome = {
      dest: 'dest_default_new',
      feedback: {
        content_id: 'default_outcome_new',
        html: ''
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null
    };
    var newHintDict = [
      {
        hint_content: {
          html: '<p>New Hint</p>',
          content_id: 'content_id1_new'
        }
      }
    ];
    var newSolutionDict = {
      answer_is_exclusive: false,
      correct_answer: 'This is a new correct answer!',
      explanation: {
        content_id: 'solution_new',
        html: 'This is the new explanation to the answer'
      }
    };
    var otherInteractionDict = {
      answer_groups: newAnswerGroups,
      confirmed_unclassified_answers: [],
      customization_args: {
        customArg: {
          value: 'custom_arg'
        }
      },
      default_outcome: newDefaultOutcome,
      hints: newHintDict,
      id: 'interaction_id_new',
      solution: newSolutionDict
    };
    var otherInteraction = iof.createFromBackendDict(otherInteractionDict);
    testInteraction.copy(otherInteraction);
    expect(testInteraction).toEqual(otherInteraction);
    otherInteraction.customizationArgs.customArg.value = 'custom_arg_new';
    expect(testInteraction).toEqual(iof.createFromBackendDict({
      answer_groups: newAnswerGroups,
      confirmed_unclassified_answers: [],
      customization_args: {
        customArg: {
          value: 'custom_arg'
        }
      },
      default_outcome: newDefaultOutcome,
      hints: newHintDict,
      id: 'interaction_id_new',
      solution: newSolutionDict
    }));
  });
});
