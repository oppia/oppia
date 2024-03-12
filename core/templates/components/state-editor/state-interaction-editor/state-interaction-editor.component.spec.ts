// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for 'State Interaction Editor Component'.
 */

import {EventEmitter, NO_ERRORS_SCHEMA, ElementRef} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {StateEditorService} from '../state-editor-properties-services/state-editor.service';
import {StateInteractionEditorComponent} from './state-interaction-editor.component';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {State} from 'domain/state/StateObjectFactory';
import {Interaction} from 'domain/exploration/InteractionObjectFactory';
import {ResponsesService} from 'pages/exploration-editor-page/editor-tab/services/responses.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {EditabilityService} from 'services/editability.service';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {CustomizeInteractionModalComponent} from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/customize-interaction-modal.component';
import {StateInteractionIdService} from '../state-editor-properties-services/state-interaction-id.service';
import {StateContentService} from '../state-editor-properties-services/state-content.service';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {ContextService} from 'services/context.service';
import {StateCustomizationArgsService} from '../state-editor-properties-services/state-customization-args.service';
import {StateSolutionService} from '../state-editor-properties-services/state-solution.service';
import {ExplorationHtmlFormatterService} from 'services/exploration-html-formatter.service';
import {InteractionDetailsCacheService} from 'pages/exploration-editor-page/editor-tab/services/interaction-details-cache.service';
import {GenerateContentIdService} from 'services/generate-content-id.service';

class MockNgbModal {
  modal: string;
  success: boolean = true;
  open(content, options) {
    if (this.modal === 'add_interaction') {
      return {
        result: {
          componentInstance: {},
          then: (
            successCallback: (result) => void,
            cancelCallback: () => void
          ) => {
            if (this.success) {
              successCallback({});
            } else {
              cancelCallback();
            }
          },
        },
      };
    } else if (this.modal === 'delete_interaction') {
      return {
        result: {
          then: (successCallback: () => void, errorCallback: () => void) => {
            if (this.success) {
              successCallback();
            } else {
              errorCallback();
            }
            return {
              then: (callback: () => void) => {
                callback();
              },
            };
          },
        },
      };
    }
  }
}

describe('State Interaction component', () => {
  let component: StateInteractionEditorComponent;
  let contextService: ContextService;
  let editabilityService: EditabilityService;
  let explorationHtmlFormatterService: ExplorationHtmlFormatterService;
  let fixture: ComponentFixture<StateInteractionEditorComponent>;
  let generateContentIdService: GenerateContentIdService;
  let interactionDetailsCacheService: InteractionDetailsCacheService;
  let mockNgbModal: MockNgbModal;
  let responsesService: ResponsesService;
  let stateContentService: StateContentService;
  let stateCustomizationArgsService: StateCustomizationArgsService;
  let stateEditorService: StateEditorService;
  let stateInteractionIdService: StateInteractionIdService;
  let stateSolutionService: StateSolutionService;
  let urlInterpolationService: UrlInterpolationService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [StateInteractionEditorComponent],
      providers: [
        ContextService,
        CustomizeInteractionModalComponent,
        EditabilityService,
        ExplorationHtmlFormatterService,
        InteractionDetailsCacheService,
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
        ResponsesService,
        StateContentService,
        StateCustomizationArgsService,
        StateEditorService,
        StateInteractionIdService,
        StateSolutionService,
        UrlInterpolationService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateInteractionEditorComponent);
    component = fixture.componentInstance;

    contextService = TestBed.inject(ContextService);
    editabilityService = TestBed.inject(EditabilityService);
    explorationHtmlFormatterService = TestBed.inject(
      ExplorationHtmlFormatterService
    );
    generateContentIdService = TestBed.inject(GenerateContentIdService);
    interactionDetailsCacheService = TestBed.inject(
      InteractionDetailsCacheService
    );
    mockNgbModal = TestBed.inject(NgbModal) as unknown as MockNgbModal;
    responsesService = TestBed.inject(ResponsesService);
    stateContentService = TestBed.inject(StateContentService);
    stateCustomizationArgsService = TestBed.inject(
      StateCustomizationArgsService
    );
    stateEditorService = TestBed.inject(StateEditorService);
    stateInteractionIdService = TestBed.inject(StateInteractionIdService);
    stateSolutionService = TestBed.inject(StateSolutionService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);

    fixture.detectChanges();
  });

  it(
    'should keep non-empty content when setting an interaction ' +
      'and throw error if state is undefined',
    fakeAsync(() => {
      spyOn(component, 'throwError').and.stub();
      spyOn(
        stateEditorService,
        'updateStateInteractionEditorInitialised'
      ).and.stub();

      component.ngOnInit();
      tick();
      stateEditorService.onStateEditorInitialized.emit(undefined);
      tick();

      expect(component.interactionIsDisabled).toBe(false);
      expect(
        stateEditorService.updateStateInteractionEditorInitialised
      ).toHaveBeenCalled();
    })
  );

  it(
    'should keep non-empty content when setting an interaction ' +
      'and update changed state',
    () => {
      spyOn(responsesService.onInitializeAnswerGroups, 'emit').and.stub();

      const state = new State(
        'shivam',
        'id',
        'some',
        null,
        new Interaction([], [], null, null, [], 'id', null),
        null,
        null,
        true,
        true
      );

      component.ngOnInit();
      stateEditorService.onStateEditorInitialized.emit(state);

      expect(component.interactionIsDisabled).toBe(false);
      expect(component.hasLoaded).toBe(true);
      expect(responsesService.onInitializeAnswerGroups.emit).toHaveBeenCalled();
    }
  );

  it('should show interaction when interaction is made', () => {
    const interactionCustomizationArgsValue = {
      placeholder: {
        value: null,
      },
      rows: {
        value: 0,
      },
      catchMisspellings: {
        value: false,
      },
    };
    component.interactionEditorIsShown = true;
    spyOn(urlInterpolationService, 'getStaticImageUrl').and.returnValue(
      'image'
    );
    spyOn(
      explorationHtmlFormatterService,
      'getInteractionHtml'
    ).and.returnValue('htmlValue');
    stateInteractionIdService.savedMemento = 'interactionID';

    component.toggleInteractionEditor();

    expect(component.getStaticImageUrl('image')).toEqual('image');
    expect(component.interactionEditorIsShown).toBe(false);
    expect(
      component._getInteractionPreviewTag(interactionCustomizationArgsValue)
    ).toBe('htmlValue');
  });

  it('should delete interaction when user click on delete btn', fakeAsync(() => {
    mockNgbModal.modal = 'delete_interaction';

    spyOn(stateSolutionService, 'saveDisplayedValue').and.stub();
    spyOn(mockNgbModal, 'open').and.callFake((dlg, opt) => {
      return {
        result: Promise.resolve('success'),
      } as NgbModalRef;
    });

    component.deleteInteraction();
    tick();

    expect(stateSolutionService.saveDisplayedValue).toHaveBeenCalled();
  }));

  it('should not delete interaction when user click on cancel btn', fakeAsync(() => {
    mockNgbModal.modal = 'delete_interaction';

    spyOn(stateSolutionService, 'saveDisplayedValue').and.stub();
    spyOn(mockNgbModal, 'open').and.callFake((dlg, opt) => {
      return {
        result: Promise.reject('success'),
      } as NgbModalRef;
    });

    component.deleteInteraction();
    tick();

    expect(stateSolutionService.saveDisplayedValue).not.toHaveBeenCalled();
  }));

  it('should close modal when user click cancel', fakeAsync(() => {
    const mockEventEmitter = new EventEmitter();
    generateContentIdService.init(
      () => 1,
      () => {}
    );
    mockNgbModal.modal = 'add_interaction';
    stateContentService.savedMemento = new SubtitledHtml('html', 'contentID');
    stateCustomizationArgsService.savedMemento = {
      useFractionForDivision: false,
      allowedVariables: {
        value: ['wrok', 'done'],
      },
    };
    component.interactionId = 'EndExploration';
    component.interactionIsDisabled = false;
    component.updateDefaultTerminalStateContentIfEmpty();

    spyOn(mockNgbModal, 'open').and.callFake((dlg, opt) => {
      return {
        componentInstance: {},
        result: Promise.reject('reject'),
      } as NgbModalRef;
    });
    spyOn(editabilityService, 'isEditable').and.returnValue(true);
    spyOn(contextService, 'isExplorationLinkedToStory').and.returnValue(true);
    spyOn(stateEditorService.onHandleCustomArgsUpdate, 'emit').and.stub();

    component.openInteractionCustomizerModal();
    tick();
    mockEventEmitter.emit();

    component.interactionIsDisabled = true;
    tick();
    component.openInteractionCustomizerModal();
  }));

  it('should focus on customize interaction button when tab is pressed', () => {
    const event = new KeyboardEvent('keydown', {key: 'Tab'});
    const customizeInteractionButtonRef = new ElementRef(
      document.createElement('button')
    );
    component.customizeInteractionButton = customizeInteractionButtonRef;
    spyOn(component, 'getCurrentInteractionName').and.returnValue(
      'Introduction'
    );
    component.interactionEditorIsShown = true;
    spyOn(customizeInteractionButtonRef.nativeElement, 'focus');

    component.focusOnCustomizeInteraction(event);

    expect(
      customizeInteractionButtonRef.nativeElement.focus
    ).toHaveBeenCalled();
  });

  it(
    'should focus on customize interaction title when ' +
      'shift + tab are pressed',
    () => {
      const event = new KeyboardEvent('keydown', {key: 'Tab', shiftKey: true});
      const collapseAnswersAndResponsesButtonRef = new ElementRef(
        document.createElement('button')
      );
      component.collapseAnswersAndResponsesButton =
        collapseAnswersAndResponsesButtonRef;
      spyOn(component.collapseAnswersAndResponsesButton.nativeElement, 'focus');

      component.focusOnCollapseAnswersAndResponses(event);

      expect(
        component.collapseAnswersAndResponsesButton.nativeElement.focus
      ).toHaveBeenCalled();
    }
  );

  it(
    'should open Interaction Customizer Modal ' + 'when enter is pressed',
    () => {
      const event = new KeyboardEvent('keydown', {key: 'Enter'});
      spyOn(component, 'openInteractionCustomizerModal');

      component.focusOnCollapseAnswersAndResponses(event);

      expect(component.openInteractionCustomizerModal).toHaveBeenCalled();
    }
  );

  it('should save interaction when user click save', fakeAsync(() => {
    stateInteractionIdService.displayed = 'EndExploration';
    stateInteractionIdService.savedMemento = 'InteractiveMap';
    component.DEFAULT_TERMINAL_STATE_CONTENT = 'HTML Content';
    stateContentService.savedMemento = SubtitledHtml.createDefault(
      '',
      'contentID'
    );
    stateContentService.displayed = SubtitledHtml.createDefault(
      '',
      'contentID2'
    );
    stateCustomizationArgsService.savedMemento = {
      latitude: {
        value: 35,
      },
      longitude: {
        value: 20,
      },
      zoom: {
        value: 8,
      },
    };
    stateCustomizationArgsService.displayed = {
      recommendedExplorationIds: {
        value: ['null'],
      },
    };

    mockNgbModal.modal = 'add_interaction';
    spyOn(mockNgbModal, 'open').and.callFake((dlg, opt) => {
      return {
        componentInstance: {},
        result: Promise.resolve('success'),
      } as NgbModalRef;
    });

    spyOn(interactionDetailsCacheService, 'set').and.stub();
    spyOn(stateContentService, 'saveDisplayedValue').and.stub();
    spyOn(editabilityService, 'isEditable').and.returnValue(true);
    spyOn(contextService, 'isExplorationLinkedToStory').and.returnValue(true);
    spyOn(stateEditorService.onHandleCustomArgsUpdate, 'emit').and.stub();
    spyOn(component.onSaveInteractionData, 'emit').and.stub();

    component.openInteractionCustomizerModal();
    tick();

    expect(stateEditorService.onHandleCustomArgsUpdate.emit).toHaveBeenCalled();
    expect(stateContentService.saveDisplayedValue).toHaveBeenCalled();
    expect(component.onSaveInteractionData.emit).toHaveBeenCalled();
  }));

  it('should through error when state is undefined', () => {
    expect(() => {
      component.throwError(undefined);
    }).toThrowError('Expected stateData to be defined but received undefined');
  });
});
