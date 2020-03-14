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
 * @fileoverview Unit tests for ChangesInHumanReadableFormService.
 */

import { TestBed } from '@angular/core/testing';
import { ChangesInHumanReadableFormService } from
// eslint-disable-next-line max-len
  'pages/exploration-editor-page/services/changes-in-human-readable-form.service';
import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';

describe('Changes In Human Readable Form Service', () => {
  let cihrfs, oof;

  beforeEach(() => {
    cihrfs = TestBed.get(ChangesInHumanReadableFormService);
    oof = TestBed.get(OutcomeObjectFactory);
  });

  it('should make rules list human readable', () => {
    const answerGroupValue = {
      rules: [{
        type: 'Type1',
        inputs: {
          input1: 'input1',
          input2: 'input2'
        }
      }]
    };

    cihrfs.makeRulesListHumanReadable(answerGroupValue)
      .forEach((element: HTMLElement, i) => {
        const rule = answerGroupValue.rules[i];
        expect(element.outerHTML).toBe(
          '<li>' +
          '<p>Type: ' + rule.type + '</p>' +
          '<p>Value: ' + Object.keys(rule.inputs).toString() + '</p>' +
          '</li>'
        );
      });
  });

  it('should not make rules list human readable when there are no rules',
    () => {
      const answerGroupValue = {
        rules: []
      };
      expect(cihrfs.makeRulesListHumanReadable(answerGroupValue)).toEqual([]);
    });

  it('should get state property value when state is an array', () => {
    const state = ['value1', 'value2'];
    expect(cihrfs.getStatePropertyValue(state)).toBe('value2');
  });

  it('should get state property value when state is an object', () => {
    const state = {
      value1: ''
    };
    expect(cihrfs.getStatePropertyValue(state)).toBe(state);
  });

  it('should get relative change to groups when adding a new item in an array',
    () => {
      const changeObject = {
        new_value: ['value1'],
        old_value: []
      };
      expect(cihrfs.getRelativeChangeToGroups(changeObject)).toBe('added');
    });

  it('should get relative change to groups when editing an array', () => {
    const changeObject = {
      new_value: ['value2'],
      old_value: ['value1']
    };
    expect(cihrfs.getRelativeChangeToGroups(changeObject)).toBe('edited');
  });

  it('should get relative change to groups when deleting items in an array',
    () => {
      const changeObject = {
        new_value: [],
        old_value: ['value1']
      };
      expect(cihrfs.getRelativeChangeToGroups(changeObject)).toBe('deleted');
    });

  it('should get relative change to groups when deleting properties in' +
    ' an object', () => {
    const changeObject = {
      new_value: {},
      old_value: {
        property1: true
      }
    };
    expect(cihrfs.getRelativeChangeToGroups(changeObject)).toBe('deleted');
  });

  it('should get relative change to groups when editing properties in' +
    ' an object', () => {
    const changeObject = {
      new_value: {
        property1: true
      },
      old_value: {
        property1: true
      }
    };
    expect(cihrfs.getRelativeChangeToGroups(changeObject)).toBe('edited');
  });

  it('should get relative change to groups when adding properties in' +
    ' an object', () => {
    const changeObject = {
      new_value: {
        property1: 1
      },
      old_value: {}
    };
    expect(cihrfs.getRelativeChangeToGroups(changeObject)).toBe('added');
  });

  it('should make human readable when adding a state', () => {
    const lostChanges = [{
      cmd: 'add_state',
      state_name: 'State name',
    }];

    const humanReadableElement = cihrfs.makeHumanReadable(lostChanges);
    expect(humanReadableElement.outerHTML).toBe(
      '<ul>' +
      '<li>Added state: ' + lostChanges[0].state_name + '</li>' +
      '</ul>'
    );
  });

  it('should make human readable when renaming a state', () => {
    const lostChanges = [{
      cmd: 'rename_state',
      old_state_name: 'Old state name',
      new_state_name: 'New state name'
    }];

    const humanReadableElement = cihrfs.makeHumanReadable(lostChanges);
    expect(humanReadableElement.outerHTML).toBe(
      '<ul>' +
      '<li>Renamed state: ' + lostChanges[0].old_state_name +
      ' to ' + lostChanges[0].new_state_name + '</li>' +
      '</ul>'
    );
  });

  it('should make human readable when deleting a state', () => {
    const lostChanges = [{
      cmd: 'delete_state',
      state_name: 'Deleted state name'
    }];

    const humanReadableElement = cihrfs.makeHumanReadable(lostChanges);
    expect(humanReadableElement.outerHTML).toBe(
      '<ul>' +
      '<li>Deleted state: ' + lostChanges[0].state_name + '</li>' +
      '</ul>'
    );
  });

  it('should make human readable when editing a state with property content',
    () => {
      const lostChanges = [{
        cmd: 'edit_state_property',
        state_name: 'Edited state name',
        new_value: {
          html: 'newValue'
        },
        old_value: {
          html: 'oldValue'
        },
        property_name: 'content'
      }];

      const humanReadableElement = cihrfs.makeHumanReadable(lostChanges);
      expect(humanReadableElement.outerHTML).toBe(
        '<ul>' +
        '<li>Edits to state: ' + lostChanges[0].state_name +
        '<div class="state-edit-desc">' +
        '<strong>Edited content: ' +
        '<div class="content">' + lostChanges[0].new_value.html + '</div>' +
        '</strong>' +
        '</div>' +
        '</li>' +
        '</ul>'
      );
    });

  it('should make human readable when editing a state with property' +
    ' widget_id and exploration ended', () => {
    const lostChanges = [{
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: 'EndExploration',
      old_value: null,
      property_name: 'widget_id'
    }];

    const humanReadableElement = cihrfs.makeHumanReadable(lostChanges);
    expect(humanReadableElement.outerHTML).toBe(
      '<ul>' +
      '<li>Edits to state: ' + lostChanges[0].state_name +
      '<div class="state-edit-desc">' +
      'Ended Exploration' +
      '</div>' +
      '</li>' +
      '</ul>'
    );
  });

  it('should make human readable when editing a state with property' +
    ' widget_id and an interaction is added', () => {
    const lostChanges = [{
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: 'Exploration',
      old_value: null,
      property_name: 'widget_id'
    }];

    const humanReadableElement = cihrfs.makeHumanReadable(lostChanges);
    expect(humanReadableElement.outerHTML).toBe(
      '<ul>' +
      '<li>Edits to state: ' + lostChanges[0].state_name +
      '<div class="state-edit-desc">' +
      '<strong>' +
      'Added Interaction: </strong>' +
      lostChanges[0].new_value +
      '</div>' +
      '</li>' +
      '</ul>'
    );
  });

  it('should make human readable when editing a state with property' +
    ' widget_id and an interaction is deleted', () => {
    const lostChanges = [{
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: null,
      old_value: 'EndExploration',
      property_name: 'widget_id'
    }];

    const humanReadableElement = cihrfs.makeHumanReadable(lostChanges);
    expect(humanReadableElement.outerHTML).toBe(
      '<ul>' +
      '<li>Edits to state: ' + lostChanges[0].state_name +
      '<div class="state-edit-desc">' +
      '<strong>' +
      'Deleted Interaction: </strong>' +
      lostChanges[0].old_value +
      '</div>' +
      '</li>' +
      '</ul>'
    );
  });

  it('should make human readable when editing a state with property' +
    ' widget_customization_args and an interaction is added', () => {
    const lostChanges = [{
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: {
        property1: true
      },
      old_value: {},
      property_name: 'widget_customization_args'
    }];

    const humanReadableElement = cihrfs.makeHumanReadable(lostChanges);
    expect(humanReadableElement.outerHTML).toBe(
      '<ul>' +
      '<li>Edits to state: ' + lostChanges[0].state_name +
      '<div class="state-edit-desc">' +
      'Added Interaction Customizations' +
      '</div>' +
      '</li>' +
      '</ul>'
    );
  });

  it('should make human readable when editing a state with property' +
    ' widget_customization_args and an interaction is removed', () => {
    const lostChanges = [{
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: {},
      old_value: {
        property1: true
      },
      property_name: 'widget_customization_args'
    }];

    const humanReadableElement = cihrfs.makeHumanReadable(lostChanges);
    expect(humanReadableElement.outerHTML).toBe(
      '<ul>' +
      '<li>Edits to state: ' + lostChanges[0].state_name +
      '<div class="state-edit-desc">' +
      'Removed Interaction Customizations' +
      '</div>' +
      '</li>' +
      '</ul>'
    );
  });

  it('should make human readable when editing a state with property' +
    ' widget_customization_args and an interaction is edited', () => {
    const lostChanges = [{
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: {
        property1: true
      },
      old_value: {
        property1: true
      },
      property_name: 'widget_customization_args'
    }];

    const humanReadableElement = cihrfs.makeHumanReadable(lostChanges);
    expect(humanReadableElement.outerHTML).toBe(
      '<ul>' +
      '<li>Edits to state: ' + lostChanges[0].state_name +
      '<div class="state-edit-desc">' +
      'Edited Interaction Customizations' +
      '</div>' +
      '</li>' +
      '</ul>'
    );
  });

  it('should make human readable when editing a state with property' +
    ' answer_groups and a change is added', () => {
    const lostChanges = [{
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: {
        outcome: oof.createFromBackendDict({
          dest: 'outcome 2',
          feedback: {
            content_id: 'feedback_2',
            html: 'Html'
          },
        }),
        rules: [{
          type: 'Type1',
          inputs: {
            input1: 'input1',
            input2: 'input2'
          }
        }]
      },
      old_value: {},
      property_name: 'answer_groups'
    }];

    const humanReadableElement = cihrfs.makeHumanReadable(lostChanges);
    expect(humanReadableElement.outerHTML).toBe(
      '<ul>' +
      '<li>Edits to state: ' + lostChanges[0].state_name +
      '<div class="state-edit-desc answer-group">' +
      '<strong>Added answer group: </strong>' +
      '<p class="sub-edit"><i>Destination: </i>' +
      lostChanges[0].new_value.outcome.dest + '</p>' +
      '<div class="sub-edit"><i>Feedback: </i>' +
      '<div class="feedback">' +
      lostChanges[0].new_value.outcome.feedback.getHtml() +
      '</div>' +
      '</div>' +
      '<p class="sub-edit"><i>Rules: </i></p>' +
      '<ol class="rules-list">' +
      '<li>' +
      '<p>Type: ' + lostChanges[0].new_value.rules[0].type + '</p>' +
      '<p>Value: ' +
      Object.keys(lostChanges[0].new_value.rules[0].inputs).toString() +
      '</p>' +
      '</li>' +
      '</ol>' +
      '</div>' +
      '</li>' +
      '</ul>'
    );
  });

  it('should make human readable when editing a state with property' +
    ' answer_groups and a change is edited', () => {
    const lostChanges = [{
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: {
        outcome: oof.createFromBackendDict({
          dest: 'outcome 2',
          feedback: {
            content_id: 'feedback_2',
            html: 'Html'
          },
        }),
        rules: [{
          type: 'Type1',
          inputs: {
            input1: 'input1',
            input2: 'input2'
          }
        }]
      },
      old_value: {
        outcome: oof.createFromBackendDict({
          dest: 'outcome 1',
          feedback: {
            content_id: 'feedback_2',
            html: 'Html'
          },
        }),
        rules: [{
          type: 'Type1',
          inputs: {
            input1: 'input1',
            input2: 'input2'
          }
        }]
      },
      property_name: 'answer_groups'
    }];

    const humanReadableElement = cihrfs.makeHumanReadable(lostChanges);
    expect(humanReadableElement.outerHTML).toBe(
      '<ul>' +
      '<li>Edits to state: ' + lostChanges[0].state_name +
      '<div class="state-edit-desc answer-group">' +
      '<strong>Edited answer group: </strong>' +
      '<p class="sub-edit"><i>Destination: </i>' +
      lostChanges[0].new_value.outcome.dest + '</p>' +
      '<div class="sub-edit"><i>Feedback: </i>' +
      '<div class="feedback">' +
      lostChanges[0].new_value.outcome.feedback.getHtml() +
      '</div>' +
      '</div>' +
      '<p class="sub-edit"><i>Rules: </i></p>' +
      '<ol class="rules-list">' +
      '<li>' +
      '<p>Type: ' + lostChanges[0].new_value.rules[0].type + '</p>' +
      '<p>Value: ' +
      Object.keys(lostChanges[0].new_value.rules[0].inputs).toString() +
      '</p>' +
      '</li>' +
      '</ol>' +
      '</div>' +
      '</li>' +
      '</ul>'
    );
  });

  it('should make human readable when editing a state with property' +
    ' answer_groups and a change is deleted', () => {
    const lostChanges = [{
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: {},
      old_value: {
        outcome: oof.createFromBackendDict({
          dest: 'outcome 1',
          feedback: {
            content_id: 'feedback_2',
            html: 'Html'
          },
        }),
        rules: [{
          type: 'Type1',
          inputs: {
            input1: 'input1',
            input2: 'input2'
          }
        }]
      },
      property_name: 'answer_groups'
    }];

    const humanReadableElement = cihrfs.makeHumanReadable(lostChanges);
    expect(humanReadableElement.outerHTML).toBe(
      '<ul>' +
      '<li>Edits to state: ' + lostChanges[0].state_name +
      '<div class="state-edit-desc">' +
      'Deleted answer group' +
      '</div>' +
      '</li>' +
      '</ul>'
    );
  });

  it('should make human readable when editing a state with property' +
    ' default_outcome and a change is added', () => {
    const lostChanges = [{
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: oof.createFromBackendDict({
        dest: 'outcome 2',
        feedback: {
          content_id: 'feedback_2',
          html: 'Html'
        },
      }),
      old_value: {},
      property_name: 'default_outcome'
    }];

    const humanReadableElement = cihrfs.makeHumanReadable(lostChanges);
    expect(humanReadableElement.outerHTML).toBe(
      '<ul>' +
      '<li>Edits to state: ' + lostChanges[0].state_name +
      '<div class="state-edit-desc default-outcome">' +
      'Added default outcome: ' +
      '<p class="sub-edit"><i>Destination: </i>' +
      lostChanges[0].new_value.dest + '</p>' +
      '<div class="sub-edit"><i>Feedback: </i>' +
      '<div class="feedback">' +
      lostChanges[0].new_value.feedback.getHtml() +
      '</div>' +
      '</div>' +
      '</div>' +
      '</li>' +
      '</ul>'
    );
  });

  it('should make human readable when editing a state with property' +
    ' default_outcome and a change is edited', () => {
    const lostChanges = [{
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: oof.createFromBackendDict({
        dest: 'outcome 2',
        feedback: {
          content_id: 'feedback_2',
          html: 'Html'
        },
      }),
      old_value: oof.createFromBackendDict({
        dest: 'outcome 1',
        feedback: {
          content_id: 'feedback_2',
          html: 'Html'
        },
      }),
      property_name: 'default_outcome'
    }];

    const humanReadableElement = cihrfs.makeHumanReadable(lostChanges);
    expect(humanReadableElement.outerHTML).toBe(
      '<ul>' +
      '<li>Edits to state: ' + lostChanges[0].state_name +
      '<div class="state-edit-desc default-outcome">' +
      'Edited default outcome: ' +
      '<p class="sub-edit"><i>Destination: </i>' +
      lostChanges[0].new_value.dest + '</p>' +
      '<div class="sub-edit"><i>Feedback: </i>' +
      '<div class="feedback">' +
      lostChanges[0].new_value.feedback.getHtml() +
      '</div>' +
      '</div>' +
      '</div>' +
      '</li>' +
      '</ul>'
    );
  });

  it('should make human readable when editing a state with property' +
    ' default_outcome and a change is deleted', () => {
    const lostChanges = [{
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: {},
      old_value: {
        outcome: oof.createFromBackendDict({
          dest: 'outcome 1',
          feedback: {
            content_id: 'feedback_2',
            html: 'Html'
          },
        }),
        rules: [{
          type: 'Type1',
          inputs: {
            input1: 'input1',
            input2: 'input2'
          }
        }]
      },
      property_name: 'default_outcome'
    }];

    const humanReadableElement = cihrfs.makeHumanReadable(lostChanges);
    expect(humanReadableElement.outerHTML).toBe(
      '<ul>' +
      '<li>Edits to state: ' + lostChanges[0].state_name +
      '<div class="state-edit-desc">' +
      'Deleted default outcome' +
      '</div>' +
      '</li>' +
      '</ul>'
    );
  });

  it('should return html element with error description when make human' +
    ' readable throws an error', () => {
    spyOn(cihrfs, '_makeHumanReadable').and.throwError('Throwing error');

    expect(cihrfs.makeHumanReadable([]).outerHTML).toBe(
      '<div>Error: Could not recover lost changes.</div>');
  });
});
