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
 * @fileoverview Unit tests for the LearnerAction model class.
 */

import { LearnerAction, LearnerActionType } from
  'domain/statistics/learner-action.model';
import { StatisticsDomainConstants } from
  'domain/statistics/statistics-domain.constants';

describe('Learner Action Object Factory', () => {
  const LEARNER_ACTION_SCHEMA_LATEST_VERSION =
      StatisticsDomainConstants.LEARNER_ACTION_SCHEMA_LATEST_VERSION;

  it('should create a new learner action', () => {
    var answerSubmitlearnerActionObject =
      LearnerAction.createNewAnswerSubmitAction({
        state_name: {
          value: 'state'
        },
        dest_state_name: {
          value: 'dest_state'
        },
        interaction_id: {
          value: 'interaction_id'
        },
        submitted_answer: {
          value: 'answer'
        },
        feedback: {
          value: 'feedback'
        },
        time_spent_state_in_msecs: {
          value: 2
        }
      });
    var explorationStartlearnerActionObject =
      LearnerAction.createNewExplorationStartAction({
        state_name: {
          value: 'state'
        }
      });
    var explorationQuitlearnerActionObject =
      LearnerAction.createNewExplorationQuitAction({
        state_name: {
          value: 'state'
        },
        time_spent_in_state_in_msecs: {
          value: 2
        }
      });

    expect(answerSubmitlearnerActionObject.actionType).toEqual(
      LearnerActionType.AnswerSubmit
    );
    expect(answerSubmitlearnerActionObject.actionCustomizationArgs).toEqual({
      state_name: {
        value: 'state'
      },
      dest_state_name: {
        value: 'dest_state'
      },
      interaction_id: {
        value: 'interaction_id'
      },
      submitted_answer: {
        value: 'answer'
      },
      feedback: {
        value: 'feedback'
      },
      time_spent_state_in_msecs: {
        value: 2
      }
    });
    expect(answerSubmitlearnerActionObject.schemaVersion)
      .toEqual(LEARNER_ACTION_SCHEMA_LATEST_VERSION);
    expect(explorationStartlearnerActionObject.actionType).toEqual(
      LearnerActionType.ExplorationStart);
    expect(
      explorationStartlearnerActionObject.actionCustomizationArgs).toEqual({
      state_name: {
        value: 'state'
      }
    });
    expect(explorationStartlearnerActionObject.schemaVersion)
      .toEqual(LEARNER_ACTION_SCHEMA_LATEST_VERSION);
    expect(explorationQuitlearnerActionObject.actionType).toEqual(
      LearnerActionType.ExplorationQuit);
    expect(
      explorationQuitlearnerActionObject.actionCustomizationArgs).toEqual({
      state_name: {
        value: 'state'
      },
      time_spent_in_state_in_msecs: {
        value: 2
      }
    });
    expect(explorationQuitlearnerActionObject.schemaVersion)
      .toEqual(LEARNER_ACTION_SCHEMA_LATEST_VERSION);
  });

  it('should create a new learner action AnswerSubmit from a backend dict',
    () => {
      var learnerActionObject =
        LearnerAction.createFromBackendDict({
          action_type: LearnerActionType.AnswerSubmit,
          action_customization_args: {
            state_name: {value: 'string'},
            dest_state_name: {value: 'string'},
            interaction_id: {value: 'string'},
            submitted_answer: {value: 'string'},
            feedback: {value: 'string'},
            time_spent_state_in_msecs: {value: 5}
          },
          schema_version: 1
        });

      expect(learnerActionObject.actionType)
        .toEqual(LearnerActionType.AnswerSubmit);
      expect(learnerActionObject.actionCustomizationArgs).toEqual({
        state_name: {value: 'string'},
        dest_state_name: {value: 'string'},
        interaction_id: {value: 'string'},
        submitted_answer: {value: 'string'},
        feedback: {value: 'string'},
        time_spent_state_in_msecs: {value: 5}
      });
      expect(learnerActionObject.schemaVersion).toEqual(1);
    });

  it('should create a new learner action ExplorationStart from a backend dict',
    () => {
      var learnerActionObject =
        LearnerAction.createFromBackendDict({
          action_type: LearnerActionType.ExplorationStart,
          action_customization_args: {
            state_name: {
              value: 'state'
            },
          },
          schema_version: 1
        });

      expect(learnerActionObject.actionType)
        .toEqual(LearnerActionType.ExplorationStart);
      expect(learnerActionObject.actionCustomizationArgs).toEqual({
        state_name: {
          value: 'state'
        }
      });
      expect(learnerActionObject.schemaVersion).toEqual(1);
    });

  it('should create a new learner action ExplorationQuit from a backend dict',
    () => {
      var learnerActionObject =
        LearnerAction.createFromBackendDict({
          action_type: LearnerActionType.ExplorationQuit,
          action_customization_args: {
            state_name: {
              value: 'state'
            },
            time_spent_in_state_in_msecs: {
              value: 2
            }
          },
          schema_version: 1
        });

      expect(learnerActionObject.actionType)
        .toEqual(LearnerActionType.ExplorationQuit);
      expect(learnerActionObject.actionCustomizationArgs).toEqual({
        state_name: {
          value: 'state'
        },
        time_spent_in_state_in_msecs: {
          value: 2
        }
      });
      expect(learnerActionObject.schemaVersion).toEqual(1);
    });

  it('should convert a learner action to a backend dict', () => {
    var learnerActionObject =
        LearnerAction.createNewAnswerSubmitAction({
          state_name: {
            value: 'state'
          },
          dest_state_name: {
            value: 'dest_state'
          },
          interaction_id: {
            value: 'interaction_id'
          },
          submitted_answer: {
            value: 'answer'
          },
          feedback: {
            value: 'feedback'
          },
          time_spent_state_in_msecs: {
            value: 2
          }
        });

    var learnerActionDict = learnerActionObject.toBackendDict();
    expect(learnerActionDict).toEqual({
      action_type: LearnerActionType.AnswerSubmit,
      action_customization_args: {
        state_name: {
          value: 'state'
        },
        dest_state_name: {
          value: 'dest_state'
        },
        interaction_id: {
          value: 'interaction_id'
        },
        submitted_answer: {
          value: 'answer'
        },
        feedback: {
          value: 'feedback'
        },
        time_spent_state_in_msecs: {
          value: 2
        }
      },
      schema_version: 1
    });
  });

  it('should throw error on invalid backend dict', () => {
    const playthroughDict = {
      action_type: 'InvalidAction',
      action_customization_args: {},
      schema_version: 1
    };

    expect(() => {
      // This throws "Type 'string' is not assignable to type
      // '"ExplorationQuit"'.". We need to suppress this error because
      // 'playthroughDict' has an invalid value of 'action_type' property. We
      // need to do that in order to test validations.
      // @ts-expect-error
      LearnerAction.createFromBackendDict(playthroughDict);
    }).toThrowError(
      'Backend dict does not match any known action type: ' +
      JSON.stringify(playthroughDict));
  });
});
