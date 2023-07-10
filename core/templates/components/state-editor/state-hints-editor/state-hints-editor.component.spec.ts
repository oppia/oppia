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
 * @fileoverview Unit test for State Hints Editor Component.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { StateHintsEditorComponent } from './state-hints-editor.component';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { fakeAsync, tick } from '@angular/core/testing';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { EditabilityService } from 'services/editability.service';
import { StateHintsService } from '../state-editor-properties-services/state-hints.service';
import { ExternalSaveService } from 'services/external-save.service';
import { StateInteractionIdService } from '../state-editor-properties-services/state-interaction-id.service';
import { StateSolutionService } from '../state-editor-properties-services/state-solution.service';
import { AlertsService } from 'services/alerts.service';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { Hint, HintBackendDict } from 'domain/exploration/hint-object.model';
import { SolutionObjectFactory } from 'domain/exploration/SolutionObjectFactory';
import { CdkDragSortEvent } from '@angular/cdk/drag-drop';

class MockStateHintsService {
  displayed = [
    {
      hintContent: SubtitledHtml.createDefault('<h1>work</h1>', '1'),
      toBackendDict(): HintBackendDict {
        return {
          hint_content: this.hintContent.toBackendDict()
        };
      }
    },
    {
      hintContent: SubtitledHtml.createDefault('<h1>work</h1>', '1'),
      toBackendDict(): HintBackendDict {
        return {
          hint_content: this.hintContent.toBackendDict()
        };
      }
    },
    {
      hintContent: SubtitledHtml.createDefault('<h1>work</h1>', '1'),
      toBackendDict(): HintBackendDict {
        return {
          hint_content: this.hintContent.toBackendDict()
        };
      }
    },
    {
      hintContent: SubtitledHtml.createDefault('<h1>work</h1>', '1'),
      toBackendDict(): HintBackendDict {
        return {
          hint_content: this.hintContent.toBackendDict()
        };
      }
    }
  ];

  getActiveHintIndex(): number {
    return 1;
  }

  saveDisplayedValue(): void {
  }

  savedMemento = [
    {
      hintContent: {
        html: null
      }
    },
    {
      hintContent: {
        html: '<p> Hint </p>'
      }
    }
  ];

  setActiveHintIndex(): void {
  }
}

describe('StateHintsEditorComponent', () => {
  let component: StateHintsEditorComponent;
  let fixture: ComponentFixture<StateHintsEditorComponent>;
  let ngbModal: NgbModal;
  let windowDimensionsService: WindowDimensionsService;
  let editabilityService: EditabilityService;
  let stateHintsService: StateHintsService;
  let stateInteractionIdService: StateInteractionIdService;
  let stateSolutionService: StateSolutionService;
  let alertsService: AlertsService;
  let solutionObjectFactory: SolutionObjectFactory;
  let ngbModalSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        StateHintsEditorComponent
      ],
      providers: [
        WindowDimensionsService,
        EditabilityService,
        {
          provide: StateHintsService,
          useClass: MockStateHintsService
        },
        NgbModal,
        ExternalSaveService,
        StateInteractionIdService,
        StateSolutionService,
        AlertsService,
        SolutionObjectFactory,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateHintsEditorComponent);
    component = fixture.componentInstance;

    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    editabilityService = TestBed.inject(EditabilityService);
    stateHintsService = TestBed.inject(StateHintsService);
    stateInteractionIdService = TestBed.inject(StateInteractionIdService);
    stateSolutionService = TestBed.inject(StateSolutionService);
    ngbModal = TestBed.inject(NgbModal);
    alertsService = TestBed.inject(AlertsService);
    solutionObjectFactory = TestBed.inject(SolutionObjectFactory);

    stateSolutionService.savedMemento = solutionObjectFactory.createNew(
      true, 'correct_answer', '<p> Hint Index 0 </p>', '0'
    );

    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(true);
    spyOn(editabilityService, 'isEditable').and.returnValue(true);
    ngbModalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
      return ({
        result: Promise.resolve()
      }) as NgbModalRef;
    });

    fixture.detectChanges();
    component.ngOnInit();
  });

  it('should change list oder', () => {
    spyOn(stateHintsService, 'saveDisplayedValue').and.callThrough();
    spyOn(component.onSaveHints, 'emit').and.callThrough();

    const event = {
      previousIndex: 1,
      currentIndex: 2,
    } as CdkDragSortEvent<Hint[]>;
    component.drop(event);

    expect(stateHintsService.saveDisplayedValue).toHaveBeenCalled();
    expect(component.onSaveHints.emit).toHaveBeenCalled();
  });

  it('should set component properties on initialization', () => {
    expect(component.hintCardIsShown).toBe(true);
    expect(component.canEdit).toBe(true);
    expect(component.getStaticImageUrl('/demo/img'))
      .toBe('/assets/images/demo/img');
  });

  it('should toggle hint card when user clicks on hint header', () => {
    expect(component.hintCardIsShown).toBe(true);

    component.toggleHintCard();

    expect(component.hintCardIsShown).toBe(false);
  });

  it('should save displayed hint value when user saves inline hint', () => {
    spyOn(stateHintsService, 'saveDisplayedValue');
    spyOn(component.onSaveHints, 'emit');

    component.onSaveInlineHint();

    expect(stateHintsService.saveDisplayedValue).toHaveBeenCalled();
    expect(component.onSaveHints.emit).toHaveBeenCalled();
  });

  it('should check if current interaction is linear', () => {
    stateInteractionIdService.savedMemento = 'TextInput';

    expect(component.isCurrentInteractionLinear()).toBe(false);

    stateInteractionIdService.savedMemento = 'Continue';

    expect(component.isCurrentInteractionLinear()).toBe(true);
  });

  it('should get hint button text', () => {
    expect(component.getHintButtonText()).toBe('+ ADD HINT');

    stateHintsService.displayed = [
      new Hint(SubtitledHtml.createDefault('<h1>work</h1>', '1')),
      new Hint(SubtitledHtml.createDefault('<h1>work</h1>', '1')),
      new Hint(SubtitledHtml.createDefault('<h1>work</h1>', '1')),
      new Hint(SubtitledHtml.createDefault('<h1>work</h1>', '1')),
      new Hint(SubtitledHtml.createDefault('<h1>work</h1>', '1'))
    ];

    expect(component.getHintButtonText()).toBe('Limit Reached');
  });

  it('should get hint summary when hint is given', () => {
    let hint = Hint.createNew('id', 'Hint');

    expect(component.getHintSummary(hint)).toBe('Hint');
  });

  it('should open delete last hint modal if only one hint exists while' +
    ' changing active hint index', fakeAsync(() => {
    spyOn(stateHintsService, 'getActiveHintIndex').and.returnValue(0);
    stateHintsService.displayed = [
      new Hint(SubtitledHtml.createDefault('', '1'))];

    component.changeActiveHintIndex(0);
    tick();

    expect(stateSolutionService.displayed).toBe(null);
    expect(stateHintsService.displayed).toEqual([]);
  }));

  it('should delete empty hint when changing active hint index',
    fakeAsync(() => {
      spyOn(stateHintsService, 'getActiveHintIndex').and.returnValue(0);
      spyOn(alertsService, 'addInfoMessage');
      stateHintsService.displayed = [
        new Hint(SubtitledHtml.createDefault('', '1')),
        new Hint(SubtitledHtml.createDefault('', '1'))
      ];
      stateSolutionService.savedMemento = null;

      component.changeActiveHintIndex(0);
      tick();

      expect(alertsService.addInfoMessage)
        .toHaveBeenCalledWith('Deleting empty hint.');
      expect(stateHintsService.displayed.length).toEqual(1);
    }));

  it('should set new hint index if no hint is opened', () => {
    spyOn(stateHintsService, 'getActiveHintIndex').and.returnValue(null);
    spyOn(stateHintsService, 'setActiveHintIndex');

    component.changeActiveHintIndex(0);

    expect(stateHintsService.setActiveHintIndex).toHaveBeenCalledWith(0);
  });

  it('should not open add hints modal if number of hint is greater than' +
    ' or equal to 5', () => {
    stateHintsService.displayed = [
      new Hint(SubtitledHtml.createDefault('<h1>work</h1>', '1')),
      new Hint(SubtitledHtml.createDefault('<h1>work</h1>', '1')),
      new Hint(SubtitledHtml.createDefault('<h1>work</h1>', '1')),
      new Hint(SubtitledHtml.createDefault('<h1>work</h1>', '1')),
      new Hint(SubtitledHtml.createDefault('<h1>work</h1>', '1'))
    ];

    component.openAddHintModal();

    expect(ngbModal.open).not.toHaveBeenCalled();
  });

  it('should open add hints modal when user clicks on add hint button',
    fakeAsync(() => {
      stateHintsService.displayed = [
        new Hint(SubtitledHtml.createDefault('<h1>work</h1>', '1'))
      ];
      ngbModalSpy.and.returnValue({
        result: Promise.resolve({
          hint: {
            hintContent: SubtitledHtml.createDefault('<h1>work</h1>', '1'),
            toBackendDict(): HintBackendDict {
              return {
                hint_content: this.hintContent.toBackendDict()
              };
            }
          }
        })
      } as NgbModalRef);

      component.openAddHintModal();
      tick();

      expect(stateHintsService.displayed.length).toEqual(2);
    }));

  it('should close add hint modal when user clicks cancel', () => {
    stateHintsService.displayed = [
      new Hint(SubtitledHtml.createDefault('<h1>work</h1>', '1'))
    ];

    ngbModalSpy.and.returnValue({
      result: Promise.reject()
    } as NgbModalRef);

    component.openAddHintModal();

    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should open delete hint modal when user clicks on' +
    ' delete hint button', fakeAsync(() => {
    spyOn(stateHintsService, 'getActiveHintIndex').and.returnValue(0);
    stateHintsService.displayed = [
      new Hint(SubtitledHtml.createDefault('<h1>work</h1>', '1'))
    ];
    stateHintsService.savedMemento = stateHintsService.displayed;

    const value = {
      index: 0,
      evt: new Event('')
    };

    component.deleteHint(value);
    tick();

    expect(ngbModal.open).toHaveBeenCalled();
    expect(stateHintsService.displayed).toEqual([]);
  }));

  it('should delete hint when user clicks on' +
    ' delete hint button', fakeAsync(() => {
    spyOn(stateHintsService, 'getActiveHintIndex').and.returnValue(0);
    stateHintsService.displayed = [
      new Hint(SubtitledHtml.createDefault('<h1>work</h1>', '0')),
      new Hint(SubtitledHtml.createDefault('<h1>work</h1>', '1'))
    ];
    stateHintsService.savedMemento = stateHintsService.displayed;

    const value = {
      index: 0,
      evt: new Event('')
    };

    component.deleteHint(value);
    tick();

    expect(stateHintsService.displayed.length).toEqual(1);
  }));

  it('should close delete hint modal when user clicks on cancel', () => {
    spyOn(alertsService, 'clearWarnings').and.callThrough();
    ngbModalSpy.and.returnValue(
      {
        result: Promise.reject()
      } as NgbModalRef
    );

    const value = {
      index: 0,
      evt: new Event('')
    };

    component.deleteHint(value);

    expect(alertsService.clearWarnings).toHaveBeenCalledTimes(1);
  });

  it('should close delete last hint modal when user clicks on cancel', () => {
    spyOn(alertsService, 'clearWarnings').and.callThrough();
    ngbModalSpy.and.returnValue(
      {
        result: Promise.reject()
      } as NgbModalRef
    );

    component.openDeleteLastHintModal();

    expect(alertsService.clearWarnings).toHaveBeenCalledTimes(1);
  });
});
