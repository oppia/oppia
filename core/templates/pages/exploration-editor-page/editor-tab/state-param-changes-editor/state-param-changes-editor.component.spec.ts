// Copyright 2020 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for stateParamChangesEditor component.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, async, TestBed } from '@angular/core/testing';
import { StateParamChangesService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-param-changes.service';
import { StateParamChangesEditorComponent } from
  // eslint-disable-next-line max-len
  'pages/exploration-editor-page/editor-tab/state-param-changes-editor/state-param-changes-editor.component';


let component: StateParamChangesEditorComponent;
let fixture: ComponentFixture<StateParamChangesEditorComponent>;
describe('State Param Changes Editor directive', () => {
  let stateParamChangesService: StateParamChangesService;
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [StateParamChangesEditorComponent],
      providers: [],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    stateParamChangesService =
      TestBed.get(StateParamChangesService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateParamChangesEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should evaluate controller properties', () => {
    expect(component.spcs).toEqual(stateParamChangesService);
  });
});
