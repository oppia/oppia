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
 * @fileoverview Unit test for Solution Explanation Editor Component.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { EditabilityService } from 'services/editability.service';
import { ContextService } from 'services/context.service';
import { SolutionExplanationEditor } from './solution-explanation-editor.component';

// eslint-disable-next-line oppia/no-test-blockers
fdescribe('Post Publish Modal Controller', function() {
  let component: SolutionExplanationEditor;
  let fixture: ComponentFixture<SolutionExplanationEditor>;
  let contextService: ContextService;
  let editabilityService: EditabilityService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        SolutionExplanationEditor
      ],
      providers: [
        ContextService,
        EditabilityService
        // {
        //   provide: WindowRef,
        //   useClass: MockWindowRef
        // }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SolutionExplanationEditor);
    component = fixture.componentInstance;

    contextService = TestBed.inject(ContextService);
    editabilityService = TestBed.inject(EditabilityService);

    spyOn(contextService, 'getEntityType').and.returnValue('question');
    spyOn(editabilityService, 'isEditable').and.returnValue(true);

    fixture.detectChanges();
  });

  it('should start', () => {
    let Work = new EventEmitter();
    spyOn()
    component.ngOnInit();
    expect(component.isEditable).toEqual(true);
    expect(component.explanationEditorIsOpen).toEqual(false);
    expect(component.EXPLANATION_FORM_SCHEMA).toEqual({
      type: 'html',
      ui_config: {
        hide_complex_extensions: true
      }
    });
  });
});
