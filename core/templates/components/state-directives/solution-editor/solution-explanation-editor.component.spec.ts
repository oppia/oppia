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

import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { EditabilityService } from 'services/editability.service';
import { ContextService } from 'services/context.service';
import { SolutionExplanationEditor } from './solution-explanation-editor.component';
import { ExternalSaveService } from 'services/external-save.service';
import { StateSolutionService } from 'components/state-editor/state-editor-properties-services/state-solution.service';

class MockStateSolutionService {
  displayed = {
    explanation: {
      _html: 'Hello world',
      contentId: 'contentId',
      get html(): string {
        return 'Hello world';
      }
    }
  };

  savedMemento = {
    explanation: {
      _html: 'Hello world 2',
      contentId: 'xyz',
      get html(): string {
        return 'Hello world 2';
      }
    }
  };

  saveDisplayedValue() {
  }
}

describe('Solution explanation editor', function() {
  let component: SolutionExplanationEditor;
  let fixture: ComponentFixture<SolutionExplanationEditor>;

  let contextService: ContextService;
  let editabilityService: EditabilityService;
  let stateSolutionService: StateSolutionService;
  let externalSaveService: ExternalSaveService;
  let externalSaveServiceEmitter = new EventEmitter<void>();

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        SolutionExplanationEditor
      ],
      providers: [
        ContextService,
        EditabilityService,
        ExternalSaveService,
        {
          provide: StateSolutionService,
          useClass: MockStateSolutionService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SolutionExplanationEditor);
    component = fixture.componentInstance;

    contextService = TestBed.inject(ContextService);
    editabilityService = TestBed.inject(EditabilityService);
    stateSolutionService = TestBed.inject(StateSolutionService);
    externalSaveService = TestBed.inject(ExternalSaveService);


    spyOnProperty(externalSaveService, 'onExternalSave')
      .and.returnValue(externalSaveServiceEmitter);
    spyOn(contextService, 'getEntityType').and.returnValue('question');
    spyOn(editabilityService, 'isEditable').and.returnValue(true);

    fixture.detectChanges();
    component.ngOnInit();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should intitalize with default values', () => {
    const schema = {
      type: 'html',
      ui_config: {
        hide_complex_extensions: true
      }
    };

    expect(component.isEditable).toEqual(true);
    expect(component.explanationEditorIsOpen).toEqual(false);
    expect(component.EXPLANATION_FORM_SCHEMA).toEqual(schema);
    expect(component.getSchema()).toEqual(schema);
    expect(component.isSolutionExplanationLengthExceeded()).toBeFalse();

    component.openExplanationEditor();
    expect(component.explanationEditorIsOpen).toBeTrue();

    component.cancelThisExplanationEdit();
    expect(component.explanationEditorIsOpen).toBeFalse();
  });

  it('should open shema based editor on user click', () => {
    const schema = {
      type: 'html',
      ui_config: {
        hide_complex_extensions: true
      }
    };

    component.openExplanationEditor();

    expect(component.getSchema()).toEqual(schema);
    expect(component.explanationEditorIsOpen).toBeTrue();

    const updatedHtml = 'updateHtml';

    component.updateExplanationHtml(updatedHtml);
    expect(stateSolutionService.displayed.explanation._html).toBe(updatedHtml);
  });

  it('should save the explanation', fakeAsync(() => {
    spyOn(component.showMarkAllAudioAsNeedingUpdateModalIfRequired, 'emit')
      .and.stub();
    spyOn(component.onSaveSolution, 'emit').and.stub();

    component.explanationEditorIsOpen = true;
    externalSaveServiceEmitter.emit();
    tick();

    expect(component.showMarkAllAudioAsNeedingUpdateModalIfRequired.emit)
      .toHaveBeenCalled();
    expect(component.onSaveSolution.emit).toHaveBeenCalled();
    expect(component.explanationEditorIsOpen).toBe(false);
  }));
});
