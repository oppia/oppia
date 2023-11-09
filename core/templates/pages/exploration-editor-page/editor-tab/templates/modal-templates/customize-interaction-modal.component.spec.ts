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
 * @fileoverview Unit tests for Customize Interaction Modal.
 */

import { ChangeDetectorRef, EventEmitter, NO_ERRORS_SCHEMA, ElementRef } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal, NgbModal, NgbModalModule, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { CustomizeInteractionModalComponent } from './customize-interaction-modal.component';
import { InteractionDetailsCacheService } from 'pages/exploration-editor-page/editor-tab/services/interaction-details-cache.service';
import { StateCustomizationArgsService } from 'components/state-editor/state-editor-properties-services/state-customization-args.service';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { EditorFirstTimeEventsService } from 'pages/exploration-editor-page/services/editor-first-time-events.service';
import { InteractionObjectFactory } from 'domain/exploration/InteractionObjectFactory';
import { SubtitledUnicodeObjectFactory } from 'domain/exploration/SubtitledUnicodeObjectFactory';
import { ContextService } from 'services/context.service';
import { AppConstants } from 'app.constants';
import { RatioExpressionInputValidationService } from 'interactions/RatioExpressionInput/directives/ratio-expression-input-validation.service';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import { GenerateContentIdService } from 'services/generate-content-id.service';

class MockStateCustomizationArgsService {
  displayed = {
    placeholder: {
      value: {
        _contentId: 'ca_placeholder_0',
        _unicode: '2:3',
        contentId: 'ca_placeholder_0',
        unicode: '2:3',
      }
    },
    numberOfTerms: {
      value: 0
    },
    hasOwnProperty(argName) {
      return true;
    }
  };

  savedMemento = {
    placeholder: {
      value: {
        _contentId: 'ca_placeholder_0',
        _unicode: '2:3',
        contentId: 'ca_placeholder_0',
        unicode: '2:3',
      }
    },
    numberOfTerms: {
      value: 0
    },
    hasOwnProperty(argName) {
      return true;
    }
  };

  get onSchemaBasedFormsShown(): EventEmitter<void> {
    return new EventEmitter<void>();
  }
}

const MockInteractionState = {
  RatioExpressionInput: {
    description: 'xyz',
    id: 'RatioExpressionInput',
    customization_arg_specs: [
      {
        description: 'Custom placeholder text (optional)',
        name: 'placeholder',
        schema: {
          type: 'custom',
          obj_type: 'SubtitledUnicode'
        },
        default_value: {
          content_id: null,
          unicode_str: ''
        }
      }
    ]
  },
};

class MockChangeDetectorRef {
  detectChanges(): void {}
}

class MockStateEditorService {
  isInQuestionMode(): boolean {
    return true;
  }
}

describe('Customize Interaction Modal Component', () => {
  let component: CustomizeInteractionModalComponent;
  let contextService: ContextService;
  let changeDetectorRef: ChangeDetectorRef;
  let fixture: ComponentFixture<CustomizeInteractionModalComponent>;
  let generateContentIdService: GenerateContentIdService;
  let interactionDetailsCacheService: InteractionDetailsCacheService;
  let interactionObjectFactory: InteractionObjectFactory;
  let ngbActiveModal: NgbActiveModal;
  let ngbModal: NgbModal;
  let ratioExpressionInputValidationService:
    RatioExpressionInputValidationService;
  let stateEditorService: StateEditorService;
  let stateInteractionIdService: StateInteractionIdService;
  let subtitledUnicodeObjectFactory: SubtitledUnicodeObjectFactory;
  let stateCustomizationArgsService: StateCustomizationArgsService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        NgbModalModule,
        NgbModule
      ],
      declarations: [
        CustomizeInteractionModalComponent,
      ],
      providers: [
        NgbActiveModal,
        StateInteractionIdService,
        InteractionObjectFactory,
        EditorFirstTimeEventsService,
        InteractionDetailsCacheService,
        SubtitledUnicodeObjectFactory,
        NgbModal,
        RatioExpressionInputValidationService,
        ContextService,
        {
          provide: INTERACTION_SPECS,
          useValue: MockInteractionState
        },
        {
          provide: ChangeDetectorRef,
          useClass: MockChangeDetectorRef
        },
        {
          provide: StateCustomizationArgsService,
          useClass: MockStateCustomizationArgsService
        },
        {
          provide: StateEditorService,
          useClass: MockStateEditorService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomizeInteractionModalComponent);
    component = fixture.componentInstance;

    changeDetectorRef = TestBed.inject(ChangeDetectorRef);
    contextService = TestBed.inject(ContextService);
    interactionDetailsCacheService = TestBed.inject(
      InteractionDetailsCacheService);
    ngbModal = TestBed.inject(NgbModal);
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    interactionObjectFactory = TestBed.inject(InteractionObjectFactory);
    stateCustomizationArgsService = TestBed.inject(
      StateCustomizationArgsService);
    stateEditorService = TestBed.inject(StateEditorService);
    stateInteractionIdService = TestBed.inject(StateInteractionIdService);
    subtitledUnicodeObjectFactory = TestBed.inject(
      SubtitledUnicodeObjectFactory);
    ratioExpressionInputValidationService = TestBed.inject(
      RatioExpressionInputValidationService);
    generateContentIdService = TestBed.inject(GenerateContentIdService);
    generateContentIdService.init(() => 0, () => {});

    stateInteractionIdService.displayed = 'RatioExpressionInput';
    fixture.detectChanges();
  });

  it('should return the hyphenated category name as expected', () => {
    const categoryName = 'Camel Case CATEGORY Name With Spaces';
    expect(component.getHyphenatedLowercaseCategoryName(categoryName)).toBe(
      'camel-case-category-name-with-spaces');
  });

  it('should get complete interaction thumbnail icon path corresponding to' +
      ' a given relative path', () => {
    const interactionId = 'i1';
    expect(component.getInteractionThumbnailImageUrl(interactionId)).toBe(
      '/extensions/interactions/i1/static/i1.png');
  });

  it('should be defined', () => {
    const warningListData = [{
      type: 'error',
      message: (
        'The number of terms should be a non-negative integer other than 1.'
      )
    }];

    stateInteractionIdService.displayed = 'RatioExpressionInput';

    spyOn(ratioExpressionInputValidationService, 'getCustomizationArgsWarnings')
      .and.returnValue(warningListData);

    expect(component).toBeDefined();
    expect(component.getTitle('NumberWithUnits'))
      .toBe('Number With Units');
    expect(component.getDescription('NumericInput'))
      .toBe(
        'Allows learners to enter integers and floating point numbers.');
    let result = component.getSchemaCallback({type: 'bool'});
    expect(result()).toEqual({type: 'bool'});
    expect(component.getCustomizationArgsWarningsList())
      .toEqual(warningListData);
    expect(component.getCustomizationArgsWarningMessage()).toBe(
      'The number of terms should be a non-negative integer other than 1.');
  });

  it('should update view after chagnes', () => {
    spyOn(changeDetectorRef, 'detectChanges');

    component.ngAfterContentChecked();

    expect(changeDetectorRef.detectChanges).not.toHaveBeenCalled();
  });

  it('should update Save interaction Button when userinputs data', () => {
    component.hasCustomizationArgs = true;

    spyOn(component, 'getCustomizationArgsWarningsList').and
      .returnValue([]);

    expect(component.isSaveInteractionButtonEnabled()).toBe(true);
  });

  it('should open intreaction when user click on it', () => {
    spyOn(interactionDetailsCacheService, 'contains').and
      .returnValue(true);
    spyOn(interactionDetailsCacheService, 'get').and
      .returnValue('RatioExpressionInput');
    const mockCustomizeInteractionHeaderRef = new ElementRef(
      document.createElement('h3'));
    component.customizeInteractionHeader =
      mockCustomizeInteractionHeaderRef;

    component.onChangeInteractionId('RatioExpressionInput');

    expect(component.hasCustomizationArgs).toBe(true);
    expect(component.isinteractionOpen).toBeFalse();
  });

  it('should open save intreaction when user click on it', () => {
    spyOn(interactionDetailsCacheService, 'contains').and
      .returnValue(true);
    spyOn(interactionDetailsCacheService, 'get').and
      .returnValue({});

    component.originalContentIdToContent =
      subtitledUnicodeObjectFactory.createDefault('unicode', 'contentId');
    const mockCustomizeInteractionHeaderRef = new ElementRef(
      document.createElement('h3'));
    component.customizeInteractionHeader =
      mockCustomizeInteractionHeaderRef;
    component.onChangeInteractionId('RatioExpressionInput');

    expect(component.hasCustomizationArgs).toBe(false);
    expect(component.isinteractionOpen).toBeFalse();
  });

  it('should close modal when user click close', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return ({
        result: Promise.resolve()
      } as NgbModalRef);
    });
    spyOn(ngbActiveModal, 'dismiss');

    component.cancelWithConfirm();
    tick();

    expect(ngbActiveModal.dismiss).toHaveBeenCalled();
  }));

  it('should stay in modal if user click cancel', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return ({
        result: Promise.reject()
      } as NgbModalRef);
    });
    spyOn(ngbActiveModal, 'dismiss');

    component.cancelWithConfirm();
    tick();

    expect(ngbActiveModal.dismiss).not.toHaveBeenCalled();
  }));

  it('should display interaction content', () => {
    component.isinteractionOpen = false;

    expect(component.isinteractionOpen).toBeFalse();

    component.returnToInteractionSelector();

    expect(component.isinteractionOpen).toBeTrue();
  });

  it('should open save intreaction when user click on it', () => {
    spyOn(interactionDetailsCacheService, 'contains').and
      .returnValue(false);
    spyOn(
      interactionObjectFactory, 'convertFromCustomizationArgsBackendDict').and
      .returnValue(false);

    component.originalContentIdToContent =
      subtitledUnicodeObjectFactory.createDefault('unicode', 'contentId');
    const mockCustomizeInteractionHeaderRef = new ElementRef(
      document.createElement('h3'));
    component.customizeInteractionHeader =
      mockCustomizeInteractionHeaderRef;
    component.onChangeInteractionId('RatioExpressionInput');

    expect(component.hasCustomizationArgs).toBeFalse();
    expect(component.isinteractionOpen).toBeFalse();
  });

  it('should show proper warning message on popover', fakeAsync(() => {
    spyOn(ratioExpressionInputValidationService, 'getCustomizationArgsWarnings')
      .and.returnValue(
        [{
          type: 'string',
          message: 'warning 1'
        },
        {
          type: 'string',
          message: 'warning 2'
        }]
      );

    component.hasCustomizationArgs = false;
    tick();

    expect(component.getSaveInteractionButtonTooltip()).toBe(
      'No customization arguments');

    component.hasCustomizationArgs = true;
    stateInteractionIdService.displayed = undefined;
    tick();

    expect(component.getSaveInteractionButtonTooltip()).toBe(
      'No interaction being displayed');

    component.hasCustomizationArgs = true;
    stateInteractionIdService.displayed = 'RatioExpressionInput';
    tick();

    expect(component.getSaveInteractionButtonTooltip()).toBe(
      'warning 1 warning 2');
  }));

  it('should show proper popover if warningMessages array is empty',
    fakeAsync(() => {
      spyOn(
        ratioExpressionInputValidationService, 'getCustomizationArgsWarnings')
        .and.returnValue([]);

      component.hasCustomizationArgs = true;
      stateInteractionIdService.displayed = 'RatioExpressionInput';
      tick();

      expect(component.getSaveInteractionButtonTooltip()).toBe(
        'Some of the form entries are invalid.');
    }));

  it('should properly open modal if editor is in' +
    ' question mode and have intreaction', fakeAsync(() => {
    stateInteractionIdService.displayed = 'RatioExpressionInput';
    stateInteractionIdService.savedMemento = 'RatioExpressionInput';

    component.ngOnInit();
    tick();

    expect(component.allowedInteractionCategories).toEqual(
      Array.prototype.concat.apply(
        [], AppConstants.ALLOWED_QUESTION_INTERACTION_CATEGORIES));
    expect(component.customizationModalReopened).toBeTrue();
  }));

  it('should properly open modal if editor is not in' +
    ' question mode and linked to story', fakeAsync(() => {
    spyOn(stateEditorService, 'isInQuestionMode')
      .and.returnValue(false);
    spyOn(contextService, 'isExplorationLinkedToStory').and.returnValue(true);
    jasmine.createSpy(
      'stateCustomizationArgsService.savedMemento.hasOwnProperty')
      .and.returnValue(false);

    stateInteractionIdService.displayed = 'RatioExpressionInput';
    stateInteractionIdService.savedMemento = 'RatioExpressionInput';

    component.ngOnInit();
    tick();

    expect(component.allowedInteractionCategories).toEqual(
      Array.prototype.concat.apply(
        [], AppConstants.ALLOWED_EXPLORATION_IN_STORY_INTERACTION_CATEGORIES));
    expect(component.customizationModalReopened).toBeTrue();
  }));

  it('should properly open modal if editor is not in' +
    ' question mode and not linked to story', fakeAsync(() => {
    spyOn(stateEditorService, 'isInQuestionMode')
      .and.returnValue(false);
    spyOn(contextService, 'isExplorationLinkedToStory').and.returnValue(false);

    stateInteractionIdService.displayed = '';
    stateInteractionIdService.savedMemento = '';

    component.ngOnInit();
    tick();

    expect(component.isinteractionOpen).toBeTrue();
    expect(component.allowedInteractionCategories).toEqual(
      Array.prototype.concat.apply(
        [], AppConstants.ALLOWED_INTERACTION_CATEGORIES));
  }));

  it('should get proper contentId of DragAndDropSortInput intreaction',
    fakeAsync(() => {
      jasmine.createSpy(
        'stateCustomizationArgsService.displayed.hasOwnProperty')
        .and.returnValue(true);

      stateInteractionIdService.displayed = 'DragAndDropSortInput';
      stateCustomizationArgsService.displayed = {
        choices: {
          value: [{
            _html: 'html',
            _contentId: 'contentId',
            isEmpty(): boolean {
              return !this._html;
            },
            get contentId(): string | null {
              return this._contentId;
            },
            set contentId(contentId: string | null) {
              this._contentId = contentId;
            },
            get html(): string {
              return this._html;
            },
            set html(html: string) {
              this._html = html;
            }
          }]
        },
        allowMultipleItemsInSamePosition: {
          value: false
        }
      };

      expect(component.getContentIdToContent()).toEqual({contentId: 'html'});
    }));

  it('should save and populate null for ContentIds' +
    ' for DragAndDropSortInput intreaction', fakeAsync(() => {
    spyOn(component, 'getContentIdToContent').and.returnValue(
      subtitledUnicodeObjectFactory.createDefault('unicode', 'contentId 1')
    );

    stateInteractionIdService.displayed = 'DragAndDropSortInput';
    component.originalContentIdToContent = subtitledUnicodeObjectFactory
      .createDefault('unicode', 'contentId 2');
    stateCustomizationArgsService.displayed = {
      choices: {
        value: [{
          _html: 'html',
          _contentId: null,
          isEmpty(): boolean {
            return !this._html;
          },
          get contentId(): string | null {
            return this._contentId;
          },
          set contentId(contentId: string | null) {
            this._contentId = contentId;
          },
          get html(): string {
            return this._html;
          },
          set html(html: string) {
            this._html = html;
          }
        }]
      },
      allowMultipleItemsInSamePosition: {
        value: false
      }
    };

    component.save();
  }));

  it('should show error when a saved customization arg is missing', () => {
    stateInteractionIdService.displayed = 'RatioExpressionInput';
    stateInteractionIdService.savedMemento = 'RatioExpressionInput';
    stateCustomizationArgsService.savedMemento = {};

    expect(()=>{
      component.ngOnInit();
    }).toThrowError(
      'Interaction is missing customization argument placeholder');
  });
});
