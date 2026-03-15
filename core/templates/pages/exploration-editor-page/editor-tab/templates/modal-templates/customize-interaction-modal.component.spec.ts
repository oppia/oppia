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

import {
  ChangeDetectorRef,
  EventEmitter,
  NO_ERRORS_SCHEMA,
  ElementRef,
} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  NgbActiveModal,
  NgbModal,
  NgbModalModule,
  NgbModalRef,
  NgbModule,
} from '@ng-bootstrap/ng-bootstrap';
import {StateInteractionIdService} from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import {CustomizeInteractionModalComponent} from './customize-interaction-modal.component';
import {InteractionDetailsCacheService} from 'pages/exploration-editor-page/editor-tab/services/interaction-details-cache.service';
import {StateCustomizationArgsService} from 'components/state-editor/state-editor-properties-services/state-customization-args.service';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {EditorFirstTimeEventsService} from 'pages/exploration-editor-page/services/editor-first-time-events.service';
import {Interaction} from 'domain/exploration/interaction.model';
import {SubtitledUnicode} from 'domain/exploration/subtitled-unicode.model.ts';
import {PageContextService} from 'services/page-context.service';
import {AppConstants} from 'app.constants';
import {RatioExpressionInputValidationService} from 'interactions/RatioExpressionInput/directives/ratio-expression-input-validation.service';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import {GenerateContentIdService} from 'services/generate-content-id.service';
import {InteractionSpecsKey} from 'pages/interaction-specs.constants';

const NO_INTERACTION_ID = '' as unknown as InteractionSpecsKey;

class MockStateCustomizationArgsService {
  displayed = {
    placeholder: {
      value: {
        _contentId: 'ca_placeholder_0',
        _unicode: '2:3',
        contentId: 'ca_placeholder_0',
        unicode: '2:3',
      },
    },
    numberOfTerms: {
      value: 0,
    },
    hasOwnProperty(argName: string) {
      return true;
    },
  };

  savedMemento = {
    placeholder: {
      value: {
        _contentId: 'ca_placeholder_0',
        _unicode: '2:3',
        contentId: 'ca_placeholder_0',
        unicode: '2:3',
      },
    },
    numberOfTerms: {
      value: 0,
    },
    hasOwnProperty(argName: string) {
      return true;
    },
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
          obj_type: 'SubtitledUnicode',
        },
        default_value: {
          content_id: null,
          unicode_str: '',
        },
      },
    ],
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
  let pageContextService: PageContextService;
  let changeDetectorRef: ChangeDetectorRef;
  let fixture: ComponentFixture<CustomizeInteractionModalComponent>;
  let generateContentIdService: GenerateContentIdService;
  let interactionDetailsCacheService: InteractionDetailsCacheService;
  let ngbActiveModal: NgbActiveModal;
  let ngbModal: NgbModal;
  let ratioExpressionInputValidationService: RatioExpressionInputValidationService;
  let stateEditorService: StateEditorService;
  let stateInteractionIdService: StateInteractionIdService;
  let stateCustomizationArgsService: StateCustomizationArgsService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [NgbModalModule, NgbModule, HttpClientTestingModule],
      declarations: [CustomizeInteractionModalComponent],
      providers: [
        NgbActiveModal,
        StateInteractionIdService,
        EditorFirstTimeEventsService,
        InteractionDetailsCacheService,
        NgbModal,
        RatioExpressionInputValidationService,
        PageContextService,
        {
          provide: INTERACTION_SPECS,
          useValue: MockInteractionState,
        },
        {
          provide: ChangeDetectorRef,
          useClass: MockChangeDetectorRef,
        },
        {
          provide: StateCustomizationArgsService,
          useClass: MockStateCustomizationArgsService,
        },
        {
          provide: StateEditorService,
          useClass: MockStateEditorService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomizeInteractionModalComponent);
    component = fixture.componentInstance;

    changeDetectorRef = TestBed.inject(ChangeDetectorRef);
    pageContextService = TestBed.inject(PageContextService);
    interactionDetailsCacheService = TestBed.inject(
      InteractionDetailsCacheService
    );
    ngbModal = TestBed.inject(NgbModal);
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    stateCustomizationArgsService = TestBed.inject(
      StateCustomizationArgsService
    );
    stateEditorService = TestBed.inject(StateEditorService);
    stateInteractionIdService = TestBed.inject(StateInteractionIdService);
    ratioExpressionInputValidationService = TestBed.inject(
      RatioExpressionInputValidationService
    );
    generateContentIdService = TestBed.inject(GenerateContentIdService);
    generateContentIdService.init(
      () => 0,
      () => {}
    );

    stateInteractionIdService.displayed = 'RatioExpressionInput';
    fixture.detectChanges();
  });

  it('should return the hyphenated category name as expected', () => {
    const categoryName = 'Camel Case CATEGORY Name With Spaces';
    expect(component.getHyphenatedLowercaseCategoryName(categoryName)).toBe(
      'camel-case-category-name-with-spaces'
    );
  });

  it(
    'should get complete interaction thumbnail icon path corresponding to' +
      ' a given relative path',
    () => {
      const interactionId = 'i1';
      expect(component.getInteractionThumbnailImageUrl(interactionId)).toBe(
        '/extensions/interactions/i1/static/i1.png'
      );
    }
  );

  it('should be defined', () => {
    const warningListData = [
      {
        type: 'error',
        message:
          'The number of terms should be a non-negative integer other than 1.',
      },
    ];

    stateInteractionIdService.displayed = 'RatioExpressionInput';

    spyOn(
      ratioExpressionInputValidationService,
      'getCustomizationArgsWarnings'
    ).and.returnValue(warningListData);

    expect(component).toBeDefined();
    expect(component.getTitle('NumberWithUnits')).toBe('Number With Units');
    expect(component.getDescription('NumericInput')).toBe(
      'Allows learners to enter integers and floating point numbers.'
    );
    let result = component.getSchemaCallback({type: 'bool'});
    expect(result()).toEqual({type: 'bool'});
    expect(component.getCustomizationArgsWarningsList()).toEqual(
      warningListData
    );
    expect(component.getCustomizationArgsWarningMessage()).toBe(
      'The number of terms should be a non-negative integer other than 1.'
    );
  });

  it('should update view after chagnes', () => {
    spyOn(changeDetectorRef, 'detectChanges');

    component.ngAfterContentChecked();

    expect(changeDetectorRef.detectChanges).not.toHaveBeenCalled();
  });

  it('should update Save interaction Button when userinputs data', () => {
    component.hasCustomizationArgs = true;

    spyOn(component, 'getCustomizationArgsWarningsList').and.returnValue([]);

    expect(component.isSaveInteractionButtonEnabled()).toBe(true);
  });

  it('should open intreaction when user click on it', () => {
    spyOn(interactionDetailsCacheService, 'contains').and.returnValue(true);
    spyOn(interactionDetailsCacheService, 'get').and.returnValue(
      'RatioExpressionInput'
    );
    const mockCustomizeInteractionHeaderRef = new ElementRef(
      document.createElement('h3')
    );
    component.customizeInteractionHeader = mockCustomizeInteractionHeaderRef;

    component.onChangeInteractionId('RatioExpressionInput');

    expect(component.hasCustomizationArgs).toBe(true);
    expect(component.isinteractionOpen).toBe(false);
  });

  it('should open save intreaction when user click on it', () => {
    spyOn(interactionDetailsCacheService, 'contains').and.returnValue(true);
    spyOn(interactionDetailsCacheService, 'get').and.returnValue({});

    component.originalContentIdToContent = {};
    const mockCustomizeInteractionHeaderRef = new ElementRef(
      document.createElement('h3')
    );
    component.customizeInteractionHeader = mockCustomizeInteractionHeaderRef;
    component.onChangeInteractionId('RatioExpressionInput');

    expect(component.hasCustomizationArgs).toBe(false);
    expect(component.isinteractionOpen).toBe(false);
  });

  it('should close modal when user click close', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.callFake((dlg: unknown, opt: unknown) => {
      return {
        result: Promise.resolve(),
      } as NgbModalRef;
    });
    spyOn(ngbActiveModal, 'dismiss');

    component.cancelWithConfirm();
    tick();

    expect(ngbActiveModal.dismiss).toHaveBeenCalled();
  }));

  it('should stay in modal if user click cancel', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.callFake((dlg: unknown, opt: unknown) => {
      return {
        result: Promise.reject(),
      } as NgbModalRef;
    });
    spyOn(ngbActiveModal, 'dismiss');

    component.cancelWithConfirm();
    tick();

    expect(ngbActiveModal.dismiss).not.toHaveBeenCalled();
  }));

  it('should display interaction content', () => {
    component.isinteractionOpen = false;

    expect(component.isinteractionOpen).toBe(false);

    component.returnToInteractionSelector();

    expect(component.isinteractionOpen).toBe(true);
  });

  it('should open save intreaction when user click on it', () => {
    spyOn(interactionDetailsCacheService, 'contains').and.returnValue(false);
    spyOn(
      Interaction,
      'convertFromCustomizationArgsBackendDict'
    ).and.returnValue(false);

    component.originalContentIdToContent = {};
    const mockCustomizeInteractionHeaderRef = new ElementRef(
      document.createElement('h3')
    );
    component.customizeInteractionHeader = mockCustomizeInteractionHeaderRef;
    component.onChangeInteractionId('RatioExpressionInput');

    expect(component.hasCustomizationArgs).toBe(false);
    expect(component.isinteractionOpen).toBe(false);
  });

  it('should show proper warning message on popover', fakeAsync(() => {
    spyOn(
      ratioExpressionInputValidationService,
      'getCustomizationArgsWarnings'
    ).and.returnValue([
      {
        type: 'string',
        message: 'warning 1',
      },
      {
        type: 'string',
        message: 'warning 2',
      },
    ]);

    component.hasCustomizationArgs = false;
    tick();

    expect(component.getSaveInteractionButtonTooltip()).toBe(
      'No customization arguments'
    );

    component.hasCustomizationArgs = true;
    stateInteractionIdService.displayed = NO_INTERACTION_ID;
    tick();

    expect(component.getSaveInteractionButtonTooltip()).toBe(
      'No interaction being displayed'
    );

    component.hasCustomizationArgs = true;
    stateInteractionIdService.displayed = 'RatioExpressionInput';
    tick();

    expect(component.getSaveInteractionButtonTooltip()).toBe(
      'warning 1 warning 2'
    );
  }));

  it('should show proper popover if warningMessages array is empty', fakeAsync(() => {
    spyOn(
      ratioExpressionInputValidationService,
      'getCustomizationArgsWarnings'
    ).and.returnValue([]);

    component.hasCustomizationArgs = true;
    stateInteractionIdService.displayed = 'RatioExpressionInput';
    tick();

    expect(component.getSaveInteractionButtonTooltip()).toBe(
      'Some of the form entries are invalid.'
    );
  }));

  it(
    'should properly open modal if editor is in' +
      ' question mode and have intreaction',
    fakeAsync(() => {
      stateInteractionIdService.displayed = 'RatioExpressionInput';
      stateInteractionIdService.savedMemento = 'RatioExpressionInput';

      component.ngOnInit();
      tick();

      expect(component.allowedInteractionCategories).toEqual([
        ...AppConstants.ALLOWED_QUESTION_INTERACTION_CATEGORIES,
      ]);
      expect(component.customizationModalReopened).toBe(true);
    })
  );

  it(
    'should properly open modal if editor is not in' +
      ' question mode and linked to story',
    fakeAsync(() => {
      spyOn(stateEditorService, 'isInQuestionMode').and.returnValue(false);
      spyOn(pageContextService, 'isExplorationLinkedToStory').and.returnValue(
        true
      );
      jasmine
        .createSpy('stateCustomizationArgsService.savedMemento.hasOwnProperty')
        .and.returnValue(false);

      stateInteractionIdService.displayed = 'RatioExpressionInput';
      stateInteractionIdService.savedMemento = 'RatioExpressionInput';

      component.ngOnInit();
      tick();

      expect(component.allowedInteractionCategories).toEqual([
        ...AppConstants.ALLOWED_EXPLORATION_IN_STORY_INTERACTION_CATEGORIES,
      ]);
      expect(component.customizationModalReopened).toBe(true);
    })
  );

  it(
    'should properly open modal if editor is not in' +
      ' question mode and not linked to story',
    fakeAsync(() => {
      spyOn(stateEditorService, 'isInQuestionMode').and.returnValue(false);
      spyOn(pageContextService, 'isExplorationLinkedToStory').and.returnValue(
        false
      );

      stateInteractionIdService.displayed = NO_INTERACTION_ID;
      stateInteractionIdService.savedMemento = NO_INTERACTION_ID;

      component.ngOnInit();
      tick();

      expect(component.isinteractionOpen).toBe(true);
      expect(component.allowedInteractionCategories).toEqual([
        ...AppConstants.ALLOWED_INTERACTION_CATEGORIES,
      ]);
    })
  );

  it('should get proper contentId of DragAndDropSortInput intreaction', fakeAsync(() => {
    jasmine
      .createSpy('stateCustomizationArgsService.displayed.hasOwnProperty')
      .and.returnValue(true);

    stateInteractionIdService.displayed = 'DragAndDropSortInput';
    stateCustomizationArgsService.displayed = {
      choices: {
        value: [
          {
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
            },
          },
        ],
      },
      allowMultipleItemsInSamePosition: {
        value: false,
      },
    };

    expect(component.getContentIdToContent()).toEqual({contentId: 'html'});
  }));

  it('should skip subtitled html entries without contentId', () => {
    stateInteractionIdService.displayed = 'DragAndDropSortInput';
    stateCustomizationArgsService.displayed = {
      choices: {
        value: [
          {
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
            },
          },
        ],
      },
      allowMultipleItemsInSamePosition: {
        value: false,
      },
    };

    expect(component.getContentIdToContent()).toEqual({});
  });

  it('should skip subtitled unicode entries without contentId', () => {
    stateInteractionIdService.displayed = 'RatioExpressionInput';
    stateCustomizationArgsService.displayed = {
      placeholder: {
        value: SubtitledUnicode.createDefault('2:3', null),
      },
    };

    expect(component.getContentIdToContent()).toEqual({});
  });

  it(
    'should save and populate null for ContentIds' +
      ' for DragAndDropSortInput intreaction',
    fakeAsync(() => {
      spyOn(component, 'getContentIdToContent').and.returnValue(
        SubtitledUnicode.createDefault('unicode', 'contentId 1')
      );

      stateInteractionIdService.displayed = 'DragAndDropSortInput';
      component.originalContentIdToContent = {};
      stateCustomizationArgsService.displayed = {
        choices: {
          value: [
            {
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
              },
            },
          ],
        },
        allowMultipleItemsInSamePosition: {
          value: false,
        },
      };

      component.save();
    })
  );

  it('should show error when a saved customization arg is missing', () => {
    stateInteractionIdService.displayed = 'RatioExpressionInput';
    stateInteractionIdService.savedMemento = 'RatioExpressionInput';
    stateCustomizationArgsService.savedMemento = {};

    expect(() => {
      component.ngOnInit();
    }).toThrowError(
      'Interaction is missing customization argument placeholder'
    );
  });

  it('should return empty warnings list when no interaction is displayed', () => {
    stateInteractionIdService.displayed = NO_INTERACTION_ID;

    expect(component.getCustomizationArgsWarningsList()).toEqual([]);
  });

  it('should return empty warnings list when validation service is unmapped', () => {
    stateInteractionIdService.displayed = 'RatioExpressionInput';
    const interactionSpecs = INTERACTION_SPECS as unknown as Record<
      InteractionSpecsKey,
      {id: string}
    >;
    const originalId = interactionSpecs.RatioExpressionInput.id;
    interactionSpecs.RatioExpressionInput.id = 'UnknownValidationService';

    try {
      expect(component.getCustomizationArgsWarningsList()).toEqual([]);
    } finally {
      interactionSpecs.RatioExpressionInput.id = originalId;
    }
  });

  it('should no-op when populating null content ids without interaction id', () => {
    stateInteractionIdService.displayed = NO_INTERACTION_ID;
    spyOn(generateContentIdService, 'getNextStateId');

    component.populateNullContentIds();

    expect(generateContentIdService.getNextStateId).not.toHaveBeenCalled();
  });

  it('should return empty content map when no interaction is displayed', () => {
    stateInteractionIdService.displayed = NO_INTERACTION_ID;

    expect(component.getContentIdToContent()).toEqual({});
  });
});
