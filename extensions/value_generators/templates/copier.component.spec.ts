// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for copier value generator.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, waitForAsync, TestBed } from '@angular/core/testing';
import { CopierComponent } from './copier.component';

describe('copier value generator component', function() {
  let component: CopierComponent;
  let fixture: ComponentFixture<CopierComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        CopierComponent
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CopierComponent);
    component = fixture.componentInstance;

    component.generatorId = 'generatorId';
    component.initArgs = 'initArgs';
    component.objType = 'objType';
    component.customizationArgs = {
      value: 'value',
      list_of_values: ['list_of_values']
    };

    fixture.detectChanges();
  });

  it('should initialize the component', () => {
    expect(component).toBeDefined();
    expect(component.getTemplateUrl()).toEqual(
      '/value_generator_handler/generatorId'
    );
  });
});
