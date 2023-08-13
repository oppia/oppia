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
 * @fileoverview Unit tests for parameter name editor.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ParameterNameEditorComponent } from './parameter-name-editor.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ParamSpecsObjectFactory } from 'domain/exploration/ParamSpecsObjectFactory';
import { ExplorationParamSpecsService } from 'pages/exploration-editor-page/services/exploration-param-specs.service';

describe('StateHintsEditorComponent', () => {
  let component: ParameterNameEditorComponent;
  let fixture: ComponentFixture<ParameterNameEditorComponent>;
  let paramSpecsObjectFactory: ParamSpecsObjectFactory;
  let explorationParamSpecsService: ExplorationParamSpecsService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        ParameterNameEditorComponent
      ],
      providers: [
        ParamSpecsObjectFactory,
        ExplorationParamSpecsService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParameterNameEditorComponent);
    component = fixture.componentInstance;

    paramSpecsObjectFactory = TestBed.inject(ParamSpecsObjectFactory);
    explorationParamSpecsService = TestBed.inject(ExplorationParamSpecsService);

    explorationParamSpecsService.init(
      // This throws "Type object is not assignable to type
      // 'string'." We need to suppress this error
      // because of the need to test validations.
      // @ts-ignore
      paramSpecsObjectFactory.createFromBackendDict({
        y: {
          obj_type: 'UnicodeString'
        },
        a: {
          obj_type: 'UnicodeString'
        }
      }) as string);
    fixture.detectChanges();
  });

  it('should initialise component when user open editor', () => {
    component.ngOnInit();

    expect(component.availableParamNames).toEqual(['y', 'a']);
    expect(component.value).toBe('y');
    expect(component.SCHEMA).toEqual({
      type: 'unicode',
      choices: ['y', 'a']
    });
  });

  it('should set value null if the available param names is empty', () => {
    spyOn(
      explorationParamSpecsService.savedMemento,
      'getParamNames'
    ).and.returnValue([]);

    component.ngOnInit();

    expect(component.value).toBeNull();
  });

  it('should get schema', () => {
    expect(component.getSchema())
      .toEqual(component.SCHEMA);
  });

  it('should update value when user enter new local value', () => {
    component.value = 'y';

    component.updateValue('a');

    expect(component.value).toBe('a');
  });
});
