// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ChangesInHumanReadableForm Component.
*/

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { LostChangeBackendDict, LostChangeObjectFactory, LostChangeValue } from 'domain/exploration/LostChangeObjectFactory';
import { Outcome, OutcomeBackendDict, OutcomeObjectFactory } from 'domain/exploration/OutcomeObjectFactory';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { ChangesInHumanReadableFormComponent } from './changes-in-human-readable-form.component';

describe('Changes in Human Readable Form Component', () => {
  let component: ChangesInHumanReadableFormComponent;
  let fixture: ComponentFixture<ChangesInHumanReadableFormComponent>;
  let lostChangeObjectFactory: LostChangeObjectFactory;
  let outcomeObjectFactory: OutcomeObjectFactory;

  // This is a helper function to clean the compiled html
  // for each test, in order to make a cleaner assertion.
  const removeComments = (HTML: { toString: () => string }) => {
    return HTML
      .toString()
      // Removes Unecessary white spaces and new lines.
      .replace(/^\s+|\r\n|\n|\r|(>)\s+(<)|\s+$/gm, '$1$2')
      // Removes Comments.
      .replace(/<\!--.*?-->/gm, '')
      // Removes marker.
      .replace(/::marker/, '');
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
      ],
      declarations: [
        ChangesInHumanReadableFormComponent
      ],
      providers: [
        LostChangeObjectFactory,
        OutcomeObjectFactory
      ]
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    lostChangeObjectFactory = TestBed.inject(LostChangeObjectFactory);
    outcomeObjectFactory = TestBed.inject(OutcomeObjectFactory);

    fixture = TestBed.createComponent(ChangesInHumanReadableFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should make human readable when adding a state', () => {
    component.lostChanges = [lostChangeObjectFactory.createNew({
      cmd: 'add_state',
      state_name: 'State name',
      content_id_for_state_content: 'content_0',
      content_id_for_default_outcome: 'default_outcome_1'
    })];

    fixture.detectChanges();

    let html = fixture.debugElement.nativeElement
      .querySelector('.oppia-lost-changes').outerHTML;

    let result = removeComments(html);

    expect(result).toBe(
      '<div class="oppia-lost-changes e2e-test-oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<span> Added state: ' + component.lostChanges[0].stateName + ' </span>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });

  it('should make human readable when renaming a state', () => {
    component.lostChanges = [lostChangeObjectFactory.createNew({
      cmd: 'rename_state',
      old_state_name: 'Old state name',
      new_state_name: 'New state name'
    })];

    fixture.detectChanges();

    let html = fixture.debugElement.nativeElement
      .querySelector('.oppia-lost-changes').outerHTML;
    let result = removeComments(html);

    expect(result).toBe(
      '<div class="oppia-lost-changes e2e-test-oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<span> Renamed state: ' + component.lostChanges[0].oldStateName +
      ' to ' + component.lostChanges[0].newStateName + ' </span>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });

  it('should make human readable when deleting a state', () => {
    component.lostChanges = [lostChangeObjectFactory.createNew({
      cmd: 'delete_state',
      state_name: 'Deleted state name'
    })];

    fixture.detectChanges();

    let html = fixture.debugElement.nativeElement
      .querySelector('.oppia-lost-changes').outerHTML;

    let result = removeComments(html);
    expect(result).toBe(
      '<div class="oppia-lost-changes e2e-test-oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<span> Deleted state: ' +
      component.lostChanges[0].stateName +
      ' </span>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });

  it('should make human readable when editing a state with property content',
    () => {
      component.lostChanges = [lostChangeObjectFactory.createNew({
        cmd: 'edit_state_property',
        state_name: 'Edited state name',
        new_value: {
          html: 'newValue'
        } as LostChangeValue,
        old_value: {
          html: 'oldValue'
        } as LostChangeValue,
        property_name: 'content'
      })];

      fixture.detectChanges();

      let html = fixture.debugElement.nativeElement
        .querySelector('.oppia-lost-changes').outerHTML;

      let result = removeComments(html);
      let lostChangeValue = (
        component.lostChanges[0].newValue as LostChangeValue);
      expect(result).toBe(
        '<div class="oppia-lost-changes e2e-test-oppia-lost-changes">' +
        '<ul>' +
        '<li>' +
        '<div>' +
        '<strong>' +
        'Edits to state:' +
        '</strong> ' + component.lostChanges[0].stateName +
        ' <div>' +
        '<strong>' +
        'Edits to property:' +
        '</strong> ' + component.lostChanges[0].propertyName +
        ' </div>' +
        '<div>' +
        '<div class="state-edit-desc">' +
        '<strong>Edited content: </strong>' +
        // eslint-disable-next-line dot-notation
        '<div class="content">' + lostChangeValue[
          'html' as keyof LostChangeValue
        ] +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</li>' +
        '</ul>' +
        '</div>'
      );
    });

  it('should make human readable when editing a state with property' +
  ' widget_id and exploration ended', () => {
    component.lostChanges = [lostChangeObjectFactory.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: 'EndExploration',
      old_value: null,
      property_name: 'widget_id'
    })];

    fixture.detectChanges();

    let html = fixture.debugElement.nativeElement
      .querySelector('.oppia-lost-changes').outerHTML;

    let result = removeComments(html);
    expect(result).toBe(
      '<div class="oppia-lost-changes e2e-test-oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<div>' +
      '<strong>' +
      'Edits to state:' +
      '</strong> ' + component.lostChanges[0].stateName +
      ' <div>' +
      '<strong>' +
      'Edits to property:' +
      '</strong> ' + component.lostChanges[0].propertyName +
      ' </div>' +
      '<div class="state-edit-desc">' +
      '<span> Ended Exploration </span>' +
      '</div>' +
      '</div>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });

  it('should make human readable when editing a state with property' +
    ' widget_id and an interaction is added', () => {
    component.lostChanges = [lostChangeObjectFactory.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: 'Exploration',
      old_value: null,
      property_name: 'widget_id'
    })];

    fixture.detectChanges();

    let html = fixture.debugElement.nativeElement
      .querySelector('.oppia-lost-changes').outerHTML;

    let result = removeComments(html);
    expect(result).toBe(
      '<div class="oppia-lost-changes e2e-test-oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<div>' +
      '<strong>' +
      'Edits to state:' +
      '</strong> ' + component.lostChanges[0].stateName +
      ' <div>' +
      '<strong>' +
      'Edits to property:' +
      '</strong> ' + component.lostChanges[0].propertyName +
      ' </div>' +
      '<div class="state-edit-desc">' +
      '<span>' +
      '<strong>' +
      'Added Interaction: </strong> ' +
      component.lostChanges[0].newValue +
      ' </span>' +
      '</div>' +
      '</div>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });

  it('should make human readable when editing a state with property' +
    ' widget_id and an interaction is deleted', () => {
    component.lostChanges = [lostChangeObjectFactory.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: null,
      old_value: 'EndExploration',
      property_name: 'widget_id'
    })];

    fixture.detectChanges();

    let html = fixture.debugElement.nativeElement
      .querySelector('.oppia-lost-changes').outerHTML;

    let result = removeComments(html);
    expect(result).toBe(
      '<div class="oppia-lost-changes e2e-test-oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<div>' +
      '<strong>' +
      'Edits to state:' +
      '</strong> ' + component.lostChanges[0].stateName +
      ' <div>' +
      '<strong>' +
      'Edits to property:' +
      '</strong> ' + component.lostChanges[0].propertyName +
      ' </div>' +
      '<div class="state-edit-desc">' +
      '<span>' +
      '<strong>Deleted Interaction: </strong> ' +
      component.lostChanges[0].oldValue +
      ' </span>' +
      '</div>' +
      '</div>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });

  it('should make human readable when editing a state with property' +
  ' widget_customization_args and an interaction is added', () => {
    component.lostChanges = [lostChangeObjectFactory.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: {
        property1: true
      },
      old_value: {},
      property_name: 'widget_customization_args'
    } as LostChangeBackendDict)];

    fixture.detectChanges();

    let html = fixture.debugElement.nativeElement
      .querySelector('.oppia-lost-changes').outerHTML;

    let result = removeComments(html);
    expect(result).toBe(
      '<div class="oppia-lost-changes e2e-test-oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<div>' +
      '<strong>' +
      'Edits to state:' +
      '</strong> ' + component.lostChanges[0].stateName +
      ' <div>' +
      '<strong>' +
      'Edits to property:' +
      '</strong> ' + component.lostChanges[0].propertyName +
      ' </div>' +
      '<div class="state-edit-desc">' +
      '<span> ' +
      'Added Interaction Customizations ' +
      '</span>' +
      '</div>' +
      '</div>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });

  it('should make human readable when editing a state with property' +
  ' widget_customization_args and an interaction is removed', () => {
    component.lostChanges = [lostChangeObjectFactory.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: {},
      old_value: {
        property1: true
      },
      property_name: 'widget_customization_args'
    } as LostChangeBackendDict)];

    fixture.detectChanges();

    let html = fixture.debugElement.nativeElement
      .querySelector('.oppia-lost-changes').outerHTML;

    let result = removeComments(html);
    expect(result).toBe(
      '<div class="oppia-lost-changes e2e-test-oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<div>' +
      '<strong>' +
      'Edits to state:' +
      '</strong> ' + component.lostChanges[0].stateName +
      ' <div>' +
      '<strong>' +
      'Edits to property:' +
      '</strong> ' + component.lostChanges[0].propertyName +
      ' </div>' +
      '<div class="state-edit-desc">' +
      '<span> ' +
      'Removed Interaction Customizations ' +
      '</span>' +
      '</div>' +
      '</div>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });

  it('should make human readable when editing a state with property' +
  ' widget_customization_args and an interaction is edited', () => {
    component.lostChanges = [lostChangeObjectFactory.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: {
        property1: true
      },
      old_value: {
        property1: true
      },
      property_name: 'widget_customization_args'
    } as LostChangeBackendDict)];

    fixture.detectChanges();

    let html = fixture.debugElement.nativeElement
      .querySelector('.oppia-lost-changes').outerHTML;

    let result = removeComments(html);
    expect(result).toBe(
      '<div class="oppia-lost-changes e2e-test-oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<div>' +
      '<strong>' +
      'Edits to state:' +
      '</strong> ' + component.lostChanges[0].stateName +
      ' <div>' +
      '<strong>' +
      'Edits to property:' +
      '</strong> ' + component.lostChanges[0].propertyName +
      ' </div>' +
      '<div class="state-edit-desc">' +
      '<span> ' +
      'Edited Interaction Customizations ' +
      '</span>' +
      '</div>' +
      '</div>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });

  it('should make human readable when editing a state with property' +
  ' answer_groups and a change is added', () => {
    component.lostChanges = [lostChangeObjectFactory.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: {
        outcome: outcomeObjectFactory.createFromBackendDict({
          dest: 'outcome 2',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'feedback_2',
            html: 'Html'
          },
        } as OutcomeBackendDict),
        rules: [{
          type: 'Type1',
          inputs: {
            input1: 'input1',
            input2: 'input2'
          }
        }]
      },
      property_name: 'answer_groups'
    } as LostChangeBackendDict)];

    fixture.detectChanges();

    let html = fixture.debugElement.nativeElement
      .querySelector('.oppia-lost-changes').outerHTML;

    let result = removeComments(html);
    expect(result).toBe(
      '<div class="oppia-lost-changes e2e-test-oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<div>' +
      '<strong>' +
      'Edits to state:' +
      '</strong> ' + component.lostChanges[0].stateName +
      ' <div>' +
      '<strong>' +
      'Edits to property:' +
      '</strong> ' + component.lostChanges[0].propertyName +
      ' </div>' +
      '<div class="state-edit-desc">' +
      '<span> ' +
      'Added answer group ' +
      '</span>' +
      '</div>' +
      '</div>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });

  it('should make human readable when editing a state with property' +
  ' answer_groups and a change is edited', () => {
    component.lostChanges = [lostChangeObjectFactory.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: {
        outcome: outcomeObjectFactory.createFromBackendDict({
          dest: 'outcome 2',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'feedback_2',
            html: 'Html'
          },
        } as OutcomeBackendDict),
        rules: [{
          type: 'Type1',
          inputs: {
            input1: 'input1',
            input2: 'input2'
          }
        }]
      },
      old_value: {
        outcome: outcomeObjectFactory.createFromBackendDict({
          dest: 'outcome 1',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'feedback_2',
            html: 'Html'
          },
        } as OutcomeBackendDict),
        rules: [{
          type: 'Type1',
          inputs: {
            input1: 'input1',
            input2: 'input2'
          }
        }]
      },
      property_name: 'answer_groups'
    } as LostChangeBackendDict)];

    fixture.detectChanges();

    let html = fixture.debugElement.nativeElement
      .querySelector('.oppia-lost-changes').outerHTML;

    let result = removeComments(html);
    expect(result).toBe(
      '<div class="oppia-lost-changes e2e-test-oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<div>' +
      '<strong>' +
      'Edits to state:' +
      '</strong> ' + component.lostChanges[0].stateName +
      ' <div>' +
      '<strong>' +
      'Edits to property:' +
      '</strong> ' + component.lostChanges[0].propertyName +
      ' </div>' +
      '<div class="state-edit-desc">' +
      '<span> ' +
      'Edited answer group ' +
      '</span>' +
      '</div>' +
      '</div>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });

  it('should make human readable when editing a state with property' +
  ' answer_groups and a change is deleted', () => {
    component.lostChanges = [lostChangeObjectFactory.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: {} as LostChangeValue,
      old_value: {
        outcome: outcomeObjectFactory.createFromBackendDict({
          dest: 'outcome 1',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'feedback_2',
            html: 'Html'
          },
        } as OutcomeBackendDict),
        rules: [{
          type: 'Type1',
          inputs: {
            input1: 'input1',
            input2: 'input2'
          }
        }]
      } as LostChangeValue,
      property_name: 'answer_groups'
    })];

    fixture.detectChanges();

    let html = fixture.debugElement.nativeElement
      .querySelector('.oppia-lost-changes').outerHTML;

    let result = removeComments(html);
    expect(result).toBe(
      '<div class="oppia-lost-changes e2e-test-oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<div>' +
      '<strong>' +
      'Edits to state:' +
      '</strong> ' + component.lostChanges[0].stateName +
      ' <div>' +
      '<strong>' +
      'Edits to property:' +
      '</strong> ' + component.lostChanges[0].propertyName +
      ' </div>' +
      '<div class="state-edit-desc">' +
      '<span> ' +
      'Deleted answer group ' +
      '</span>' +
      '</div>' +
      '</div>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });

  it('should make human readable when editing a state with property' +
  ' default_outcome and a change is added', () => {
    component.lostChanges = [lostChangeObjectFactory.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: (
        outcomeObjectFactory.createFromBackendDict({
          dest: 'outcome 2',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'feedback_2',
            html: 'Html'
          } as LostChangeValue,
        } as OutcomeBackendDict)),
      old_value: {} as LostChangeValue,
      property_name: 'default_outcome'
    })];

    fixture.detectChanges();

    let html = fixture.debugElement.nativeElement
      .querySelector('.oppia-lost-changes').outerHTML;

    let result = removeComments(html);
    let lostChangeValue = (
      component.lostChanges[0].newValue as LostChangeValue) as Outcome;
    let feedbackValue = lostChangeValue.feedback as SubtitledHtml;
    expect(result).toBe(
      '<div class="oppia-lost-changes e2e-test-oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<div>' +
      '<strong>' +
      'Edits to state:' +
      '</strong> ' + component.lostChanges[0].stateName +
      ' <div>' +
      '<strong>' +
      'Edits to property:' +
      '</strong> ' + 'default_outcome' +
      ' </div>' +
      '<div>' +
      '<div class="state-edit-desc default-outcome"> ' +
      'Added default outcome: ' +
      '<p class="sub-edit">' +
      '<i>Destination: ' +
      '</i>' +
      // eslint-disable-next-line dot-notation
      lostChangeValue[
        'dest' as keyof LostChangeValue
      ] + ' </p>' +
      '<div class="sub-edit">' +
      '<i>Feedback: ' +
      '</i>' +
      '<div class="feedback"> ' +
      // eslint-disable-next-line dot-notation
      feedbackValue.html + ' </div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });

  it('should make human readable when editing a state with property' +
  ' default_outcome and a change is edited', () => {
    component.lostChanges = [lostChangeObjectFactory.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: (
        outcomeObjectFactory.createFromBackendDict({
          dest: 'outcome 2',
          feedback: {
            content_id: 'feedback_2',
            html: 'Html'
          } as LostChangeValue,
        } as OutcomeBackendDict)),
      old_value: (
        outcomeObjectFactory.createFromBackendDict({
          dest: 'outcome 1',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'feedback_2',
            html: 'Html'
          } as LostChangeValue,
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        } as OutcomeBackendDict)),
      property_name: 'default_outcome'
    })];

    fixture.detectChanges();

    let html = fixture.debugElement.nativeElement
      .querySelector('.oppia-lost-changes').outerHTML;

    let result = removeComments(html);
    let lostChangeValue = (
      component.lostChanges[0].newValue as LostChangeValue);
    expect(result).toBe(
      '<div class="oppia-lost-changes e2e-test-oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<div>' +
      '<strong>' +
      'Edits to state:' +
      '</strong> ' + component.lostChanges[0].stateName +
      ' <div>' +
      '<strong>' +
      'Edits to property:' +
      '</strong> ' + 'default_outcome' +
      ' </div>' +
      '<div>' +
      '<div class="state-edit-desc default-outcome"> ' +
      'Edited default outcome: ' +
      '<p class="sub-edit">' +
      '<i>Destination: ' +
      '</i>' +
      // eslint-disable-next-line dot-notation
      lostChangeValue[
        'dest' as keyof LostChangeValue
      ] + ' </p>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });

  it('should make human readable when editing a state with property' +
  ' default_outcome and a change is deleted', () => {
    component.lostChanges = [lostChangeObjectFactory.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: {} as LostChangeValue,
      old_value: {
        outcome: outcomeObjectFactory.createFromBackendDict({
          dest: 'outcome 1',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'feedback_2',
            html: 'Html'
          } as LostChangeValue,
        } as OutcomeBackendDict),
        rules: [{
          type: 'Type1',
          inputs: {
            input1: 'input1',
            input2: 'input2'
          }
        }]
      },
      property_name: 'default_outcome'
    })];

    fixture.detectChanges();

    let html = fixture.debugElement.nativeElement
      .querySelector('.oppia-lost-changes').outerHTML;

    let result = removeComments(html);
    expect(result).toBe(
      '<div class="oppia-lost-changes e2e-test-oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<div>' +
      '<strong>' +
      'Edits to state:' +
      '</strong> ' + component.lostChanges[0].stateName +
      ' <div>' +
      '<strong>' +
      'Edits to property:' +
      '</strong> ' + component.lostChanges[0].propertyName +
      ' </div>' +
      '<div>' +
      '<div class="state-edit-desc">' +
      ' Deleted default outcome ' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });
});
