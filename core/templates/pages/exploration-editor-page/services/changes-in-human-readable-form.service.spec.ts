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
 * @fileoverview Unit test for the Changes in human readable form service.
 */

import { ChangesInHumanReadableFormService } from
  'pages/exploration-editor-page/services/changes-in-human-readable-form.service.ts'; // eslint-disable-line
import { UtilsService } from 'services/utils.service';

describe('Changes In Human Readable Form Service', () => {
  let changes: ChangesInHumanReadableFormService = null;
  let uts: UtilsService = null;

  beforeEach(() => {
    uts = new UtilsService();
    changes = new ChangesInHumanReadableFormService(uts, document);
  });

  it('makes rules list human readable', () => {
    let dummyAnswerGroup = {
      rules: [{
        type: 'Equals',
        inputs: {
          x: ['Choice 1']
        },
      }]
    };
    expect(changes.makeRulesListHumanReadable(dummyAnswerGroup)[0].textContent)
      .toEqual('Type: Equals<p>Value: Choice 1</p>');
  });

  it('gets state property value', () => {
    let dummyArrayOfStrings = ['a', 'b', 'c'];
    let dummyObject = {a: 'b'};

    expect(changes.getStatePropertyValue(dummyArrayOfStrings)).toEqual('c');
    expect(changes.getStatePropertyValue(dummyObject)).toEqual({a: 'b'});
  });

  it('gets relative changes to groups', () => {
    let dummyChangeObjectArrayAdded = {
      old_value: ['a', 'b', 'c'],
      new_value: ['a', 'b', 'c', 'd']
    };

    let dummyChangeObjectArrayEdited = {
      old_value: ['a', 'b', 'c'],
      new_value: ['a', 'b', 'e']
    };

    let dummyChangeObjectArrayDeleted = {
      old_value: ['a', 'b', 'c'],
      new_value: ['a', 'b']
    };

    let dummyChangeObjectAdded = {
      old_value: {},
      new_value: {a: 'b'}
    };
    let dummyChangeObjectEdited = {
      old_value: {a: 'c'},
      new_value: {a: 'b'}
    };
    let dummyChangeObjectDeleted = {
      old_value: {a: 'b'},
      new_value: {}
    };

    expect(changes.getRelativeChangeToGroups(dummyChangeObjectAdded))
      .toEqual('added');
    expect(changes.getRelativeChangeToGroups(dummyChangeObjectEdited))
      .toEqual('edited');
    expect(changes.getRelativeChangeToGroups(dummyChangeObjectDeleted))
      .toEqual('deleted');

    expect(changes.getRelativeChangeToGroups(dummyChangeObjectArrayAdded))
      .toEqual('added');
    expect(changes.getRelativeChangeToGroups(dummyChangeObjectArrayEdited))
      .toEqual('edited');
    expect(changes.getRelativeChangeToGroups(dummyChangeObjectArrayDeleted))
      .toEqual('deleted');
  });

  it('makes add state lost changes human readable', () => {
    let dummyLostChangesAdd = [
      {
        cmd: 'add_state',
        state_name: 'Introduction'
      }
    ];

    expect(changes.makeHumanReadable(dummyLostChangesAdd).innerText)
      .toEqual('Added state: Introduction');
  });

  it('makes rename state lost changes human readable', () => {
    let dummyLostChangesRename = [
      {
        cmd: 'rename_state',
        old_state_name: 'Introduction',
        new_state_name: 'Home'
      }
    ];

    expect(changes.makeHumanReadable(dummyLostChangesRename).innerText)
      .toEqual('Renamed state: Introduction to Home');
  });

  it('makes delete state lost changes human readable', () => {
    let dummyLostChangesDelete = [
      {
        cmd: 'delete_state',
        state_name: 'Home'
      }
    ];

    expect(changes.makeHumanReadable(dummyLostChangesDelete).innerText)
      .toEqual('Deleted state: Home');
  });

  it('makes edit state content lost changes human readable', () => {
    let dummyLostChangesEditContent = [
      {
        cmd: 'edit_state_property',
        state_name: 'Introduction',
        old_value: {},
        new_value: {html: 'NEW'},
        property_name: 'content'
      }
    ];

    expect(changes.makeHumanReadable(dummyLostChangesEditContent).innerHTML)
      .toEqual('<li>Edits to state: Introduction<div class="state-edit-desc">' +
      '<strong>Edited content: </strong><div class="content">NEW</div>' +
      '</div></li>');
  });

  it('makes edit state widget id lost changes human readable', () => {
    let dummyLostChangesEditWidgetId1 = [
      {
        cmd: 'edit_state_property',
        state_name: 'Introduction',
        old_value: null,
        new_value: ['a', 'b', 'c'],
        property_name: 'widget_id'
      }
    ];
    let dummyLostChangesEditWidgetId2 = [
      {
        cmd: 'edit_state_property',
        state_name: 'Introduction',
        old_value: ['a', 'b', 'c', 'd'],
        new_value: ['a', 'b', 'c'],
        property_name: 'widget_id'
      }
    ];

    expect(changes.makeHumanReadable(dummyLostChangesEditWidgetId1).innerHTML)
      .toEqual('<li>Edits to state: Introduction<div class="state-edit-desc">' +
      '<strong>Added Interaction: </strong>c</div></li>');
    expect(changes.makeHumanReadable(dummyLostChangesEditWidgetId2).innerHTML)
      .toEqual('<li>Edits to state: Introduction<div class="state-edit-desc">' +
      '<strong>Deleted Interaction: </strong>d</div></li>');
  });

  it('makes edit state widget custom args lost changes human readable', () => {
    let dummyLostChangesEditWidgetCustomizationArgs1 = [
      {
        cmd: 'edit_state_property',
        state_name: 'Introduction',
        old_value: {},
        new_value: {a: 'b'},
        property_name: 'widget_customization_args'
      }
    ];
    let dummyLostChangesEditWidgetCustomizationArgs2 = [
      {
        cmd: 'edit_state_property',
        state_name: 'Introduction',
        old_value: {a: 'b'},
        new_value: {},
        property_name: 'widget_customization_args'
      }
    ];
    let dummyLostChangesEditWidgetCustomizationArgs3 = [
      {
        cmd: 'edit_state_property',
        state_name: 'Introduction',
        old_value: {a: 'b'},
        new_value: {a: 'c'},
        property_name: 'widget_customization_args'
      }
    ];

    expect(changes.makeHumanReadable(
      dummyLostChangesEditWidgetCustomizationArgs1).innerHTML)
      .toEqual('<li>Edits to state: Introduction<div class="state-edit-desc">' +
      'Added Interaction Customizations</div></li>');
    expect(changes.makeHumanReadable(
      dummyLostChangesEditWidgetCustomizationArgs2).innerHTML)
      .toEqual('<li>Edits to state: Introduction<div class="state-edit-desc">' +
      'Removed Interaction Customizations</div></li>');
    expect(changes.makeHumanReadable(
      dummyLostChangesEditWidgetCustomizationArgs3).innerHTML)
      .toEqual('<li>Edits to state: Introduction<div class="state-edit-desc">' +
      'Edited Interaction Customizations</div></li>');
  });

  it('makes edit state answer groups lost changes human readable', () => {
    let dummyLostChangesEditAnswerGroups1 = [
      {
        cmd: 'edit_state_property',
        state_name: 'Introduction',
        old_value: {},
        new_value: {
          rules: [],
          outcome: {
            dest: 'Home',
            feedback: {
              html: '<p>Outcome</p>'
            }
          },
        },
        property_name: 'answer_groups'
      }
    ];
    let dummyLostChangesEditAnswerGroups2 = [
      {
        cmd: 'edit_state_property',
        state_name: 'Introduction',
        old_value: {
          rules: [],
          outcome: {
            dest: 'Home',
            feedback: {
              html: '<p>Outcome</p>'
            }
          }
        },
        new_value: {
          rules: [],
          outcome: {
            dest: 'EndExploration',
            feedback: {
              html: '<p>Outcome</p>'
            }
          },
        },
        property_name: 'answer_groups'
      }
    ];
    let dummyLostChangesEditAnswerGroups3 = [
      {
        cmd: 'edit_state_property',
        state_name: 'Introduction',
        old_value: {
          rules: [],
          outcome: {
            dest: 'Home',
            feedback: {
              html: '<p>Outcome</p>'
            }
          },
        },
        new_value: {},
        property_name: 'answer_groups'
      }
    ];

    expect(changes.makeHumanReadable(
      dummyLostChangesEditAnswerGroups1).innerText)
      .toEqual('Edits to state: IntroductionAdded answer group: <p class=' +
      '"sub-edit"><i>Destination: </i>Home</p><div class="sub-edit"><i>' +
      'Feedback: </i><div class="feedback"><p>Outcome</p></div></div>');
    expect(changes.makeHumanReadable(
      dummyLostChangesEditAnswerGroups2).innerText)
      .toEqual('Edits to state: IntroductionEdited answer group: <p class=' +
      '"sub-edit"><i>Destination: </i>EndExploration</p><div class="' +
      'sub-edit"><i>Feedback: </i><div class="feedback"><p>Outcome</p>' +
      '</div></div>');
    expect(changes.makeHumanReadable(
      dummyLostChangesEditAnswerGroups3).innerText)
      .toEqual('Edits to state: IntroductionDeleted answer group');
  });

  it('makes edit state default outcomes lost changes human readable', () => {
    let dummyLostChangesEditDefaultOutcome1 = [
      {
        cmd: 'edit_state_property',
        state_name: 'Introduction',
        old_value: {},
        new_value: {
          rules: [],
          dest: 'Home',
          feedback: {
            html: '<p>Outcome</p>'
          }
        },
        property_name: 'default_outcome'
      }
    ];
    let dummyLostChangesEditDefaultOutcome2 = [
      {
        cmd: 'edit_state_property',
        state_name: 'Introduction',
        old_value: {
          rules: [],
          dest: 'Home',
          feedback: {
            html: '<p>Outcome</p>'
          }
        },
        new_value: {
          rules: [],
          dest: 'EndExploration',
          feedback: {
            html: '<p>Outcome</p>'
          }
        },
        property_name: 'default_outcome'
      }
    ];
    let dummyLostChangesEditDefaultOutcome3 = [
      {
        cmd: 'edit_state_property',
        state_name: 'Introduction',
        old_value: {
          rules: [],
          dest: 'Home',
          feedback: {
            html: '<p>Outcome</p>'
          }
        },
        new_value: {},
        property_name: 'default_outcome'
      }
    ];

    expect(changes.makeHumanReadable(
      dummyLostChangesEditDefaultOutcome1).innerText)
      .toEqual('Edits to state: IntroductionAdded default outcome: ' +
      '<p class="sub-edit"><i>Destination: </i>Home</p><div class="sub-edit' +
      '"><i>Feedback: </i><div class="feedback"><p>Outcome</p></div></div>');
    expect(changes.makeHumanReadable(
      dummyLostChangesEditDefaultOutcome2).innerText)
      .toEqual('Edits to state: IntroductionEdited default outcome: ' +
      '<p class="sub-edit"><i>Destination: </i>EndExploration</p><div ' +
      'class="sub-edit"><i>Feedback: </i><div class="feedback"><p>Outcome' +
      '</p></div></div>');
    expect(changes.makeHumanReadable(
      dummyLostChangesEditDefaultOutcome3).innerText)
      .toEqual('Edits to state: IntroductionDeleted default outcome');
  });

  it('makes error lost changes human readable', () => {
    let dummyLostChangesError = [
      {
        cmd: 'edit_state_property',
        state_name: 'Introduction',
        old_value: {},
        new_value: {
          outcome: {
            dest: 'Home',
            feedback: {
              html: '<p>Outcome</p>'
            }
          },
        },
        property_name: 'answer_groups'
      }
    ];

    expect(changes.makeHumanReadable(dummyLostChangesError).innerHTML)
      .toEqual('Error: Could not recover lost changes.');
  });
});
