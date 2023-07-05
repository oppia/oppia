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
 * @fileoverview Unit test for Solution Editor Component.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SolutionEditor } from './solution-editor.component';
import { EditabilityService } from 'services/editability.service';
import { SolutionObjectFactory } from 'domain/exploration/SolutionObjectFactory';
import { StateCustomizationArgsService } from 'components/state-editor/state-editor-properties-services/state-customization-args.service';
import { ExplorationHtmlFormatterService } from 'services/exploration-html-formatter.service';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { StateSolutionService } from 'components/state-editor/state-editor-properties-services/state-solution.service';

class MockStateCustomizationArgsService {
  savedMemento = 'data3';
}

class MockStateInteractionIdService {
  savedMemento = 'data2';
}

class MockStateSolutionService {
  savedMemento = {
    correctAnswer: 'data1'
  };
}

class MockExplorationHtmlFormatterService {
  getAnswerHtml(x: string, y: string, z: string): string {
    return x + y + z;
  }
}

class MockEditabilityService {
  isEditable(): boolean {
    return true;
  }
}

describe('Solution editor component', () => {
  let component: SolutionEditor;
  let fixture: ComponentFixture<SolutionEditor>;
  let editabilityService: EditabilityService;
  let solutionObjectFactory: SolutionObjectFactory;
  let stateSolutionService: StateSolutionService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        SolutionEditor
      ],
      providers: [
        SolutionObjectFactory,
        {
          provide: EditabilityService,
          useClass: MockEditabilityService
        },
        {
          provide: ExplorationHtmlFormatterService,
          useClass: MockExplorationHtmlFormatterService
        },
        {
          provide: StateSolutionService,
          useClass: MockStateSolutionService
        },
        {
          provide: StateInteractionIdService,
          useClass: MockStateInteractionIdService
        },
        {
          provide: StateCustomizationArgsService,
          useClass: MockStateCustomizationArgsService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SolutionEditor);
    component = fixture.componentInstance;

    solutionObjectFactory = TestBed.inject(SolutionObjectFactory);
    editabilityService = TestBed.inject(EditabilityService);
    stateSolutionService = TestBed.inject(StateSolutionService);

    stateSolutionService.savedMemento = solutionObjectFactory.createNew(
      true, 'correct_answer', '<p> Hint Index 0 </p>', '0'
    );
    fixture.detectChanges();
  });

  it('should initalized', () => {
    spyOn(editabilityService, 'isEditable').and.callThrough();

    component.ngOnInit();

    expect(editabilityService.isEditable).toHaveBeenCalled();
    expect(component.EXPLANATION_FORM_SCHEMA).toEqual(
      {
        type: 'html',
        ui_config: {}
      }
    );
  });

  it('should open editor modal', () => {
    spyOn(component.openSolutionEditorModal, 'emit').and.stub();

    component.openEditorModal();

    expect(component.openSolutionEditorModal.emit).toHaveBeenCalled();
  });

  it('should save new solution', () => {
    let solution = solutionObjectFactory.createNew(
      true, 'answer', 'Html', 'XyzID');
    spyOn(component.saveSolution, 'emit').and.stub();

    component.updateNewSolution(solution);

    expect(component.saveSolution.emit).toHaveBeenCalledOnceWith(solution);
  });

  it('should display answer', () => {
    spyOn(component, 'getAnswerHtml').and.stub();

    component.getAnswerHtml();

    expect(component.getAnswerHtml).toHaveBeenCalled();
  });

  it('should throw error during get answer html if solution is not saved yet',
    () => {
      stateSolutionService.savedMemento = null;

      expect(() => {
        component.getAnswerHtml();
      }).toThrowError('Expected solution to be defined');
    });
});
