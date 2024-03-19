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
 * @fileoverview Unit tests for valueGeneratorEditor.
 */

import {NO_ERRORS_SCHEMA, SimpleChange} from '@angular/core';
import {ComponentFixture, waitForAsync, TestBed} from '@angular/core/testing';
import {BrowserDynamicTestingModule} from '@angular/platform-browser-dynamic/testing';
import {CopierComponent} from 'value_generators/templates/copier.component';
import {RandomSelectorComponent} from 'value_generators/templates/random-selector.component';
import {ValueGeneratorEditorComponent} from './value-generator-editor.component';

describe('Value Generator Editor Component', function () {
  let component: ValueGeneratorEditorComponent;
  let fixture: ComponentFixture<ValueGeneratorEditorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        ValueGeneratorEditorComponent,
        RandomSelectorComponent,
        CopierComponent,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideModule(BrowserDynamicTestingModule, {
        set: {
          entryComponents: [CopierComponent, RandomSelectorComponent],
        },
      })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ValueGeneratorEditorComponent);
    component = fixture.componentInstance;

    component.generatorId = 'copier';
    component.initArgs = 'initArgs';
    component.objType = 'objType';
    component.customizationArgs = {
      value: 'value',
      list_of_values: ['list_of_values'],
    };

    fixture.detectChanges();
    component.ngAfterViewInit();
  });

  it('should initialize the component', () => {
    component.generatorId = 'random-selector';
    component.ngOnChanges({
      generatorId: {
        currentValue: 'currentValue',
        previousValue: 'previousValue',
      },
    } as {generatorId: SimpleChange});

    expect(component).toBeDefined();
  });

  it('should render RandomSelectorComponent', () => {
    component.generatorId = 'random-selector';
    component.ngAfterViewInit();

    const bannerElement: HTMLElement = fixture.nativeElement;
    expect(bannerElement.querySelector('random-selector')).toBeDefined();
  });
});
