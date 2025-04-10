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
 * @fileoverview Unit tests for trainingPanel.
 */

import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {Outcome} from 'domain/exploration/OutcomeObjectFactory';
import {TrainingPanelComponent} from './training-panel.component';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {ExplorationStatesService} from 'pages/exploration-editor-page/services/exploration-states.service';
import {TrainingDataService} from './training-data.service';
import {ExplorationHtmlFormatterService} from 'services/exploration-html-formatter.service';
import {ResponsesService} from '../services/responses.service';
import {GenerateContentIdService} from 'services/generate-content-id.service';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';

class MockNgbModal {
  open() {
    return {
      result: Promise.resolve(),
    };
  }
}

class MockStateEditorService {
  getActiveStateName() {
    return 'activeState';
  }
}

class MockExplorationStatesService {
  getState() {
    return null;
  }
}

class MockTrainingDataService {
  getAllPotentialOutcomes() {
    return [];
  }
}

describe('Training Panel Component', () => {
  let component: TrainingPanelComponent;
  let fixture: ComponentFixture<TrainingPanelComponent>;
  let explorationHtmlFormatterService: ExplorationHtmlFormatterService;
  let responsesService: ResponsesService;
  let generateContentIdService: GenerateContentIdService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [TrainingPanelComponent],
      providers: [
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
        {
          provide: StateEditorService,
          useClass: MockStateEditorService,
        },
        {
          provide: ExplorationStatesService,
          useClass: MockExplorationStatesService,
        },
        {
          provide: TrainingDataService,
          useClass: MockTrainingDataService,
        },
        ExplorationHtmlFormatterService,
        ResponsesService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrainingPanelComponent);
    component = fixture.componentInstance;

    explorationHtmlFormatterService = TestBed.inject(
      ExplorationHtmlFormatterService
    );
    responsesService = TestBed.inject(ResponsesService);
    generateContentIdService = TestBed.inject(GenerateContentIdService);
    generateContentIdService.init(
      () => 0,
      () => {}
    );
    spyOn(explorationHtmlFormatterService, 'getAnswerHtml').and.returnValue(
      'answerTemplate'
    );

    component.classification = {
      answerGroupIndex: 0,
      newOutcome: new Outcome(
        'dest',
        '',
        new SubtitledHtml('<p>Saved Outcome</p>', 'Id'),
        true,
        [],
        '',
        ''
      ),
    };
    component.addingNewResponse = false;
    // This throws "Argument of type 'null' is not assignable to parameter of
    // type 'InteractionAnswer'." We need to suppress this error because of the
    // need to test validations. This error is thrown because the answer is
    // null.
    // @ts-ignore
    component.answer = null;
    component.ngOnInit();

    fixture.detectChanges();
  });

  it('should initialize component properties after component is initialized', () => {
    expect(component.addingNewResponse).toBe(false);
    expect(component.allOutcomes.length).toBe(0);
    expect(component.selectedAnswerGroupIndex).toBe(0);
    expect(component.answerTemplate).toBe('answerTemplate');
  });

  it('should get name from current state', () => {
    expect(component.getCurrentStateName()).toBe('activeState');
  });

  it('should add new feedback and select it', () => {
    component.allOutcomes = [
      new Outcome(
        'dest',
        '',
        new SubtitledHtml('<p>Saved Outcome</p>', 'Id'),
        true,
        [],
        '',
        ''
      ),
      new Outcome(
        'dest',
        '',
        new SubtitledHtml('<p>Saved Outcome</p>', 'Id'),
        true,
        [],
        '',
        ''
      ),
    ];
    spyOn(responsesService, 'getAnswerGroupCount').and.returnValue(0);
    expect(component.allOutcomes.length).toBe(2);
    expect(component.selectedAnswerGroupIndex).toBe(0);
    component.confirmNewFeedback();

    expect(component.allOutcomes.length).toBe(3);
    expect(component.selectedAnswerGroupIndex).toBe(2);
  });

  it('should start to add new response and then cancel it', () => {
    component.beginAddingNewResponse();
    expect(component.addingNewResponse).toBe(true);

    component.cancelAddingNewResponse();
    expect(component.addingNewResponse).toBe(false);
    expect(component.classification.newOutcome).toBe(null);
  });
});
