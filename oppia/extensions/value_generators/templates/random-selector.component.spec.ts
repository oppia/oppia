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
 * @fileoverview Unit tests for random selector value generator.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, waitForAsync, TestBed} from '@angular/core/testing';
import {RandomSelectorComponent} from './random-selector.component';

describe('RandomSelector component', function () {
  let component: RandomSelectorComponent;
  let fixture: ComponentFixture<RandomSelectorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [RandomSelectorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RandomSelectorComponent);
    component = fixture.componentInstance;

    component.generatorId = 'generatorId';
    component.initArgs = 'generatorId';
    component.objType = 'objType';
    component.customizationArgs = {
      // This throws "Argument of type 'null' is not assignable to
      // parameter of type 'AnswerGroup[]'." We need to suppress this error
      // because of the need to test validations. This happens because
      // the value of the property is null.
      // @ts-ignore
      list_of_values: null,
      // This throws "Argument of type 'null' is not assignable to
      // parameter of type 'AnswerGroup[]'." We need to suppress this error
      // because of the need to test validations. This happens because
      // the value of the property is null.
      // @ts-ignore
      value: null,
    };
  });

  it('should initialise component', () => {
    component.customizationArgs = {
      list_of_values: ['test'],
      // This throws "Argument of type 'null' is not assignable to
      // parameter of type 'AnswerGroup[]'." We need to suppress this error
      // because of the need to test validations. This happens because
      // the value of the property is null.
      // @ts-ignore
      value: null,
    };

    component.ngOnInit();

    expect(component.SCHEMA).toEqual({
      type: 'list',
      items: {
        type: 'unicode',
      },
      ui_config: {
        add_element_text: 'Add New Choice',
      },
    });
    expect(component.getTemplateUrl()).toBe(
      '/value_generator_handler/generatorId'
    );
    expect(component.generatorId).toBe('generatorId');
    expect(component.customizationArgs.list_of_values).toEqual(['test']);
  });

  it(
    'should initialise list_of_values as an empty array when list_of_values' +
      ' is not defined',
    () => {
      component.ngOnInit();

      expect(component.customizationArgs.list_of_values).toEqual([]);
    }
  );
});
