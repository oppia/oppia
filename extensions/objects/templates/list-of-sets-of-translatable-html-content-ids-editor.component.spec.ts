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
 * @fileoverview Component for list of sets of translatable html content id
 * editor.
 */
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ListOfSetsOfTranslatableHtmlContentIdsEditorComponent } from './list-of-sets-of-translatable-html-content-ids-editor.component';

describe('ListOfSetsOfTranslatableHtmlContentIdsEditorComponent', () => {
  let component: ListOfSetsOfTranslatableHtmlContentIdsEditorComponent;
  let fixture:
    ComponentFixture<ListOfSetsOfTranslatableHtmlContentIdsEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ListOfSetsOfTranslatableHtmlContentIdsEditorComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed
      .createComponent(ListOfSetsOfTranslatableHtmlContentIdsEditorComponent);
    component = fixture.componentInstance;

    // Here the items are arranged such that choice 1 is on top, with choice 2
    // and 3 in the middle and choice 4 in the bottom.
    component.initArgs = {
      choices: [
        {
          id: '<p>choice1</p>',
          selectedRank: '1',
          val: 'ca_choices_1'
        },
        {
          id: '<p>choice2</p>',
          selectedRank: '2',
          val: 'ca_choices_2'
        },
        {
          id: '<p>choice3</p>',
          selectedRank: '3',
          val: 'ca_choices_3'
        },
        {
          id: '<p>choice4</p>',
          selectedRank: '4',
          val: 'ca_choices_4'
        }
      ]
    };
    component.value = [
      [
        'ca_choices_1'
      ],
      [
        'ca_choices_2'
      ],
      [
        'ca_choices_3'
      ],
      [
        'ca_choices_4'
      ]
    ];
  });

  it('should return empty list when there is no response', () => {
    spyOn(component.valueChanged, 'emit');
    // This throws "Type 'undefined' is not assignable to type 'string[][]'."
    // We need to suppress this error because of the need to test validations.
    // This throws an error because the value is undefined.
    // @ts-ignore
    component.value = undefined;

    component.ngOnInit();

    expect(component.value).toEqual(
      [['ca_choices_1'], ['ca_choices_2'], ['ca_choices_3'], ['ca_choices_4']]);
  });

  it('should initialise component when user adds response', () => {
    spyOn(component.valueChanged, 'emit');
    // This throws "Type 'undefined' is not assignable to type 'string[]'."
    // We need to suppress this error because of the need to test validations.
    // This throws an error because the value is undefined.
    // @ts-ignore
    component.value = [undefined];

    component.ngOnInit();

    expect(component.choices).toEqual([
      {
        id: '<p>choice1</p>',
        selectedRank: '1',
        val: 'ca_choices_1'
      },
      {
        id: '<p>choice2</p>',
        selectedRank: '2',
        val: 'ca_choices_2'
      },
      {
        id: '<p>choice3</p>',
        selectedRank: '3',
        val: 'ca_choices_3'
      },
      {
        id: '<p>choice4</p>',
        selectedRank: '4',
        val: 'ca_choices_4'
      }
    ]);

    expect(component.value).toEqual(
      [['ca_choices_1'], ['ca_choices_2'], ['ca_choices_3'], ['ca_choices_4']]);
    expect(component.initValues).toEqual([1, 2, 3, 4]);
    expect(component.valueChanged.emit).toHaveBeenCalledWith(component.value);
    expect(component.valueChanged.emit).toHaveBeenCalledTimes(2);
  });

  it('should initialise component when user edits response', () => {
    component.initArgs.choices[2].selectedRank = '2';
    component.initArgs.choices[3].selectedRank = '3';
    component.value = [
      [
        'ca_choices_1'
      ],
      [
        'ca_choices_2',
        'ca_choices_3'
      ],
      [
        'ca_choices_4'
      ]
    ];

    component.ngOnInit();

    expect(component.choices).toEqual([
      {
        id: '<p>choice1</p>',
        selectedRank: '1',
        val: 'ca_choices_1'
      },
      {
        id: '<p>choice2</p>',
        selectedRank: '2',
        val: 'ca_choices_2'
      },
      {
        id: '<p>choice3</p>',
        selectedRank: '2',
        val: 'ca_choices_3'
      },
      {
        id: '<p>choice4</p>',
        selectedRank: '3',
        val: 'ca_choices_4'
      }
    ]);
    expect(component.value).toEqual(
      [['ca_choices_1'], ['ca_choices_2', 'ca_choices_3'], ['ca_choices_4']]);
    expect(component.initValues).toEqual([1, 2, 2, 3]);
  });

  it('should rearrage choices when user changes position of choices', () => {
    component.ngOnInit();

    component.choices = [
      {
        id: '<p>choice1</p>',
        selectedRank: '1',
        val: 'ca_choices_1'
      },
      {
        id: '<p>choice2</p>',
        selectedRank: '2',
        val: 'ca_choices_2'
      },
      {
        id: '<p>choice3</p>',
        selectedRank: '3',
        val: 'ca_choices_3'
      },
      {
        id: '<p>choice4</p>',
        selectedRank: '3',
        val: 'ca_choices_4'
      }
    ];

    expect(component.value).toEqual([
      [
        'ca_choices_1'
      ],
      [
        'ca_choices_2'
      ],
      [
        'ca_choices_3'
      ],
      [
        'ca_choices_4'
      ]
    ]);

    component.selectItem(3);

    expect(component.value).toEqual(
      [['ca_choices_1'], ['ca_choices_2'], ['ca_choices_3', 'ca_choices_4']]);
  });

  it('should add choiceId to selected rank that is undefined when user' +
  ' adds a choice to a new position', () => {
    component.choices = [
      {
        id: '<p>choice1</p>',
        selectedRank: '1',
        val: 'ca_choices_1'
      },
      {
        id: '<p>choice2</p>',
        selectedRank: '2',
        val: 'ca_choices_2'
      },
      {
        id: '<p>choice3</p>',
        selectedRank: '3',
        val: 'ca_choices_3'
      },
      {
        id: '<p>choice4</p>',
        selectedRank: '4',
        val: 'ca_choices_4'
      }
    ];
    component.value[2] = [
      'ca_choices_3',
      'ca_choices_4'
    ];
    // This throws "Type 'undefined' is not assignable to type 'string[]'."
    // We need to suppress this error because of the need to test validations.
    // This throws an error because the value is undefined.
    // @ts-ignore
    component.value[3] = undefined;

    component.selectItem(3);

    expect(component.value).toEqual(
      [['ca_choices_1'], ['ca_choices_2'], ['ca_choices_3'], ['ca_choices_4']]);
  });

  it('should add choice as a subitem of another choice when user allots' +
  ' two choices the same positoin', () => {
    component.choices = [
      {
        id: '<p>choice1</p>',
        selectedRank: '1',
        val: 'ca_choices_1'
      },
      {
        id: '<p>choice2</p>',
        selectedRank: '2',
        val: 'ca_choices_2'
      },
      {
        id: '<p>choice3</p>',
        selectedRank: '2',
        val: 'ca_choices_3'
      },
      {
        id: '<p>choice4</p>',
        selectedRank: '3',
        val: 'ca_choices_4'
      }
    ];
    component.value[2] = [
      'ca_choices_3',
      'ca_choices_4'
    ];
    component.value = [
      [
        'ca_choices_1'
      ],
      [
        'ca_choices_2'
      ],
      [
        'ca_choices_3',
        'ca_choices_4'
      ]
    ];

    component.selectItem(2);

    expect(component.value).toEqual(
      [['ca_choices_1'], ['ca_choices_2', 'ca_choices_3'], ['ca_choices_4']]);
  });

  it('should add choice when usser assigns the choice a position', () => {
    component.choices = [
      {
        id: '<p>choice1</p>',
        selectedRank: '1',
        val: 'ca_choices_1'
      },
      {
        id: '<p>choice2</p>',
        selectedRank: '2',
        val: 'ca_choices_2'
      },
      {
        id: '<p>choice3</p>',
        selectedRank: '3',
        val: 'ca_choices_3'
      },
      {
        id: '<p>choice4</p>',
        selectedRank: '4',
        val: 'ca_choices_4'
      }
    ];
    component.value[3] = [];

    component.selectItem(3);
  });

  it('should add empty arrays in between when user skips positions', () => {
    component.choices = [
      {
        id: '<p>choice1</p>',
        selectedRank: '1',
        val: 'ca_choices_1'
      },
      {
        id: '<p>choice2</p>',
        selectedRank: '2',
        val: 'ca_choices_2'
      },
      {
        id: '<p>choice3</p>',
        selectedRank: '4',
        val: 'ca_choices_3'
      },
      {
        id: '<p>choice4</p>',
        selectedRank: '4',
        val: 'ca_choices_4'
      }
    ];
    component.value = [
      [
        'ca_choices_1'
      ],
      [
        'ca_choices_2'
      ]
    ];

    component.selectItem(3);

    expect(component.value)
      .toEqual([['ca_choices_1'], ['ca_choices_2'], [], ['ca_choices_4']]);
  });

  it('should warn user when none of the choices are in position 1', () => {
    spyOn(component.eventBusGroup, 'emit');
    component.choices = [
      {
        id: '<p>choice1</p>',
        selectedRank: '2',
        val: 'ca_choices_1'
      },
      {
        id: '<p>choice2</p>',
        selectedRank: '2',
        val: 'ca_choices_2'
      },
      {
        id: '<p>choice3</p>',
        selectedRank: '3',
        val: 'ca_choices_3'
      },
      {
        id: '<p>choice4</p>',
        selectedRank: '4',
        val: 'ca_choices_4'
      }
    ];
    component.errorMessage = '';
    component.validOrdering = true;

    component.validateOrdering();


    expect(component.errorMessage)
      .toBe('Please assign some choice at position 1.');
    expect(component.eventBusGroup.emit).toHaveBeenCalled();
    expect(component.validOrdering).toBeFalse();
  });

  it('should warn user when one of the positions in the middle are not' +
  ' occupied by a choice', () => {
    spyOn(component.eventBusGroup, 'emit');
    component.choices = [
      {
        id: '<p>choice1</p>',
        selectedRank: '1',
        val: 'ca_choices_1'
      },
      {
        id: '<p>choice2</p>',
        selectedRank: '3',
        val: 'ca_choices_2'
      },
      {
        id: '<p>choice3</p>',
        selectedRank: '3',
        val: 'ca_choices_3'
      },
      {
        id: '<p>choice4</p>',
        selectedRank: '4',
        val: 'ca_choices_4'
      }
    ];
    component.errorMessage = '';
    component.validOrdering = true;

    component.validateOrdering();


    expect(component.errorMessage)
      .toBe('Please assign some choice at position 2.');
    expect(component.eventBusGroup.emit).toHaveBeenCalled();
    expect(component.validOrdering).toBeFalse();
  });

  it('should return the choices to be displayed in the add ' +
  'response editor', () => {
    component.choices = [
      {
        id: '<p>choice1</p>',
        selectedRank: '1',
        val: 'ca_choices_1'
      },
      {
        id: '<p>choice2</p>',
        selectedRank: '2',
        val: 'ca_choices_2'
      },
      {
        id: '<p>choice3</p>',
        selectedRank: '3',
        val: 'ca_choices_3'
      }
    ];

    let choices = component.allowedChoices();

    for (var i = 1; i <= choices.length; i++) {
      expect(choices[i - 1]).toBe(i);
    }
  });
});
