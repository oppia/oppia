// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the Customize Interaction Modal Component.
 */

import {
  AfterContentChecked,
  ChangeDetectorRef,
  Component,
  Injector,
  OnInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {SchemaConstants} from 'components/forms/schema-based-editors/schema.constants';
import {StateCustomizationArgsService} from 'components/state-editor/state-editor-properties-services/state-customization-args.service';
import {StateInteractionIdService} from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {SubtitledUnicode} from 'domain/exploration/SubtitledUnicodeObjectFactory';
import {EditorFirstTimeEventsService} from 'pages/exploration-editor-page/services/editor-first-time-events.service';
import {ContextService} from 'services/context.service';
import {Schema} from 'services/schema-default-value.service';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import {ConfirmLeaveModalComponent} from 'pages/exploration-editor-page/modal-templates/confirm-leave-modal.component';
import {InteractionDetailsCacheService} from '../../services/interaction-details-cache.service';
import {InteractionObjectFactory} from 'domain/exploration/InteractionObjectFactory';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {AppConstants} from 'app.constants';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {ContinueValidationService} from 'interactions/Continue/directives/continue-validation.service';
import {EndExplorationValidationService} from 'interactions/EndExploration/directives/end-exploration-validation.service';
import {AlgebraicExpressionInputValidationService} from 'interactions/AlgebraicExpressionInput/directives/algebraic-expression-input-validation.service';
import {ImageClickInputValidationService} from 'interactions/ImageClickInput/directives/image-click-input-validation.service';
import {ItemSelectionInputValidationService} from 'interactions/ItemSelectionInput/directives/item-selection-input-validation.service';
import {NumberWithUnitsValidationService} from 'interactions/NumberWithUnits/directives/number-with-units-validation.service';
import {NumericExpressionInputValidationService} from 'interactions/NumericExpressionInput/directives/numeric-expression-input-validation.service';
import {NumericInputValidationService} from 'interactions/NumericInput/directives/numeric-input-validation.service';
import {DragAndDropSortInputValidationService} from 'interactions/DragAndDropSortInput/directives/drag-and-drop-sort-input-validation.service';
import {GraphInputValidationService} from 'interactions/GraphInput/directives/graph-input-validation.service';
import {SetInputValidationService} from 'interactions/SetInput/directives/set-input-validation.service';
import {CodeReplValidationService} from 'interactions/CodeRepl/directives/code-repl-validation.service';
import {MathEquationInputValidationService} from 'interactions/MathEquationInput/directives/math-equation-input-validation.service';
import {MultipleChoiceInputValidationService} from 'interactions/MultipleChoiceInput/directives/multiple-choice-input-validation.service';
import {PencilCodeEditorValidationService} from 'interactions/PencilCodeEditor/directives/pencil-code-editor-validation.service';
import {TextInputValidationService} from 'interactions/TextInput/directives/text-input-validation.service';
import {InteractiveMapValidationService} from 'interactions/InteractiveMap/directives/interactive-map-validation.service';
import {MusicNotesInputValidationService} from 'interactions/MusicNotesInput/directives/music-notes-input-validation.service';
import {FractionInputValidationService} from 'interactions/FractionInput/directives/fraction-input-validation.service';
import {RatioExpressionInputValidationService} from 'interactions/RatioExpressionInput/directives/ratio-expression-input-validation.service';
import {Warning} from 'interactions/base-interaction-validation.service';
import cloneDeep from 'lodash/cloneDeep';
import {ImageWithRegions} from 'interactions/customization-args-defs';
import {GenerateContentIdService} from 'services/generate-content-id.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';

type DefaultCustomizationArg =
  | DefaultValueHtml[]
  | DefaultValueHtml
  | DefaultValueUnicode[]
  | DefaultValueUnicode
  | DefaultValueGraph
  | ImageWithRegions
  | []
  | number
  | string
  | boolean;

interface DefaultValueHtml {
  content_id: string;
  html: string;
}

interface DefaultValueUnicode {
  content_id: string;
  unicode_str: string;
}

interface VerticesInterface {
  x: number;
  y: number;
  label: string;
}

interface EdgeInterface {
  src: number;
  dst: number;
  weight: string;
}

interface DefaultValueGraph {
  isWeighted: boolean;
  edges: EdgeInterface[];
  isDirected: boolean;
  vertices: VerticesInterface[];
  isLabeled: boolean;
}

export interface CustomizationArgSpecsInterface {
  name: string;
  default_value: DefaultCustomizationArg;
}

interface AllowedInteractionCategories {
  name: string;
  interaction_ids: string[];
}

const INTERACTION_SERVICE_MAPPING = {
  AlgebraicExpressionInputValidationService:
    AlgebraicExpressionInputValidationService,
  CodeReplValidationService: CodeReplValidationService,
  ContinueValidationService: ContinueValidationService,
  DragAndDropSortInputValidationService: DragAndDropSortInputValidationService,
  EndExplorationValidationService: EndExplorationValidationService,
  FractionInputValidationService: FractionInputValidationService,
  GraphInputValidationService: GraphInputValidationService,
  ImageClickInputValidationService: ImageClickInputValidationService,
  InteractiveMapValidationService: InteractiveMapValidationService,
  ItemSelectionInputValidationService: ItemSelectionInputValidationService,
  MathEquationInputValidationService: MathEquationInputValidationService,
  MultipleChoiceInputValidationService: MultipleChoiceInputValidationService,
  MusicNotesInputValidationService: MusicNotesInputValidationService,
  NumberWithUnitsValidationService: NumberWithUnitsValidationService,
  NumericExpressionInputValidationService:
    NumericExpressionInputValidationService,
  NumericInputValidationService: NumericInputValidationService,
  PencilCodeEditorValidationService: PencilCodeEditorValidationService,
  RatioExpressionInputValidationService: RatioExpressionInputValidationService,
  SetInputValidationService: SetInputValidationService,
  TextInputValidationService: TextInputValidationService,
};

@Component({
  selector: 'oppia-customize-interaction',
  templateUrl: './customize-interaction-modal.component.html',
})
export class CustomizeInteractionModalComponent
  extends ConfirmOrCancelModal
  implements OnInit, AfterContentChecked
{
  customizationArgSpecs: CustomizationArgSpecsInterface[];
  originalContentIdToContent: object;
  hasCustomizationArgs: boolean;
  allowedInteractionCategories: AllowedInteractionCategories[];
  explorationIsLinkedToStory: boolean;
  customizationModalReopened: boolean;
  isinteractionOpen: boolean;

  @ViewChild('customizeInteractionHeader')
  customizeInteractionHeader!: ElementRef;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private contextService: ContextService,
    private editorFirstTimeEventsService: EditorFirstTimeEventsService,
    private focusManagerService: FocusManagerService,
    private injector: Injector,
    private interactionDetailsCacheService: InteractionDetailsCacheService,
    private interactionObjectFactory: InteractionObjectFactory,
    private ngbActiveModal: NgbActiveModal,
    private ngbModal: NgbModal,
    private stateCustomizationArgsService: StateCustomizationArgsService,
    private stateEditorService: StateEditorService,
    public stateInteractionIdService: StateInteractionIdService,
    private generateContentIdService: GenerateContentIdService,
    private urlInterpolationService: UrlInterpolationService
  ) {
    super(ngbActiveModal);
  }

  getTitle(interactionId: string): string {
    return INTERACTION_SPECS[interactionId].name;
  }

  getDescription(interactionId: string): string {
    return INTERACTION_SPECS[interactionId].description;
  }

  getSchemaCallback(schema: Schema): () => Schema {
    return () => {
      return schema;
    };
  }

  getCustomizationArgsWarningsList(): Warning[] {
    const validationServiceName: string =
      INTERACTION_SPECS[this.stateInteractionIdService.displayed].id +
      'ValidationService';

    let validationService = this.injector.get(
      INTERACTION_SERVICE_MAPPING[validationServiceName]
    );
    let warningsList = validationService.getCustomizationArgsWarnings(
      this.stateCustomizationArgsService.displayed
    );
    return warningsList;
  }

  getCustomizationArgsWarningMessage(): string {
    let warningsList = this.getCustomizationArgsWarningsList();
    let warningMessage = '';
    if (warningsList.length !== 0) {
      warningMessage = warningsList[0].message;
    }
    return warningMessage;
  }

  onChangeInteractionId(newInteractionId: string): void {
    this.isinteractionOpen = false;
    this.editorFirstTimeEventsService.registerFirstSelectInteractionTypeEvent();

    let interactionSpec = INTERACTION_SPECS[newInteractionId];
    this.customizationArgSpecs = interactionSpec.customization_arg_specs;
    this.stateInteractionIdService.displayed = newInteractionId;
    this.stateCustomizationArgsService.displayed = {};
    if (this.interactionDetailsCacheService.contains(newInteractionId)) {
      this.stateCustomizationArgsService.displayed =
        this.interactionDetailsCacheService.get(newInteractionId);
    } else {
      const customizationArgsBackendDict = {};
      this.customizationArgSpecs.forEach(
        (caSpec: {
          name: string | number;
          default_value: DefaultCustomizationArg;
        }) => {
          customizationArgsBackendDict[caSpec.name] = {
            value: caSpec.default_value,
          };
        }
      );

      this.stateCustomizationArgsService.displayed =
        this.interactionObjectFactory.convertFromCustomizationArgsBackendDict(
          newInteractionId,
          customizationArgsBackendDict
        );
    }

    if (
      Object.keys(this.stateCustomizationArgsService.displayed).length === 0
    ) {
      this.save();
      this.hasCustomizationArgs = false;
    } else {
      this.hasCustomizationArgs = true;
    }

    this.stateCustomizationArgsService.onSchemaBasedFormsShown.emit();
    setTimeout(() => {
      this.customizeInteractionHeader.nativeElement.focus();
    });
  }

  returnToInteractionSelector(): void {
    this.isinteractionOpen = true;
  }

  isSaveInteractionButtonEnabled(): boolean {
    return !!(
      this.hasCustomizationArgs &&
      this.stateInteractionIdService.displayed &&
      this.getCustomizationArgsWarningsList().length === 0
    );
  }

  getSaveInteractionButtonTooltip(): string {
    if (!this.hasCustomizationArgs) {
      return 'No customization arguments';
    }
    if (!this.stateInteractionIdService.displayed) {
      return 'No interaction being displayed';
    }

    let warningsList = this.getCustomizationArgsWarningsList();
    let warningMessages = warningsList.map(warning => {
      return warning.message;
    });

    if (warningMessages.length === 0) {
      return 'Some of the form entries are invalid.';
    } else {
      return warningMessages.join(' ');
    }
  }

  cancelWithConfirm(): void {
    this.ngbModal
      .open(ConfirmLeaveModalComponent, {
        backdrop: 'static',
        keyboard: false,
      })
      .result.then(
        () => {
          this.ngbActiveModal.dismiss();
        },
        () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        }
      );
  }

  /**
   * The default values of SubtitledHtml and SubtitledUnicode objects in the
   * customization arguments have a null content_id. This function populates
   * these null content_id's with a content_id generated from traversing the
   * schema and with next content id index, ensuring a unique content_id.
   */
  populateNullContentIds(): void {
    const interactionId = this.stateInteractionIdService.displayed;

    let traverseSchemaAndAssignContentIds = (
      value: Object | Object[],
      schema: Schema,
      contentIdPrefix: string
    ): void => {
      const schemaIsSubtitledHtml =
        schema.type === SchemaConstants.SCHEMA_TYPE_CUSTOM &&
        schema.obj_type === SchemaConstants.SCHEMA_OBJ_TYPE_SUBTITLED_HTML;
      const schemaIsSubtitledUnicode =
        schema.type === SchemaConstants.SCHEMA_TYPE_CUSTOM &&
        schema.obj_type === SchemaConstants.SCHEMA_OBJ_TYPE_SUBTITLED_UNICODE;

      if (schemaIsSubtitledHtml || schemaIsSubtitledUnicode) {
        if ((value as SubtitledHtml | SubtitledUnicode).contentId === null) {
          (value as SubtitledHtml | SubtitledUnicode).contentId =
            this.generateContentIdService.getNextStateId(contentIdPrefix);
        }
      } else if (schema.type === SchemaConstants.SCHEMA_KEY_LIST) {
        for (let i = 0; i < (value as Object[]).length; i++) {
          traverseSchemaAndAssignContentIds(
            value[i],
            schema.items as Schema,
            `${contentIdPrefix}`
          );
        }
      }
    };

    const caSpecs = INTERACTION_SPECS[interactionId].customization_arg_specs;
    const caValues = this.stateCustomizationArgsService.displayed;
    for (const caSpec of caSpecs) {
      const name = caSpec.name;
      if (caValues.hasOwnProperty(name)) {
        traverseSchemaAndAssignContentIds(
          caValues[name].value,
          caSpec.schema,
          `${AppConstants.COMPONENT_NAME_INTERACTION_CUSTOMIZATION_ARGS}_${name}`
        );
      }
    }
  }

  /**
   * Extracts a mapping of content ids to the html or unicode content found
   * in the customization arguments.
   * @returns {Object} A Mapping of content ids (string) to content (string).
   */

  getContentIdToContent(): object {
    const interactionId = this.stateInteractionIdService.displayed;
    const contentIdToContent = {};

    let traverseSchemaAndCollectContent = (
      value: Object | Object[],
      schema: Schema
    ): void => {
      const schemaIsSubtitledHtml =
        schema.type === SchemaConstants.SCHEMA_TYPE_CUSTOM &&
        schema.obj_type === SchemaConstants.SCHEMA_OBJ_TYPE_SUBTITLED_HTML;
      const schemaIsSubtitledUnicode =
        schema.type === SchemaConstants.SCHEMA_TYPE_CUSTOM &&
        schema.obj_type === SchemaConstants.SCHEMA_OBJ_TYPE_SUBTITLED_UNICODE;

      if (schemaIsSubtitledHtml) {
        const subtitledHtmlValue = value as SubtitledHtml;
        contentIdToContent[subtitledHtmlValue.contentId] =
          subtitledHtmlValue.html;
      } else if (schemaIsSubtitledUnicode) {
        const subtitledUnicodeValue = value as SubtitledUnicode;
        contentIdToContent[subtitledUnicodeValue.contentId] =
          subtitledUnicodeValue.unicode;
      } else if (schema.type === SchemaConstants.SCHEMA_KEY_LIST) {
        for (let i = 0; i < (value as Object[]).length; i++) {
          traverseSchemaAndCollectContent(value[i], schema.items as Schema);
        }
      }
    };

    const caSpecs = INTERACTION_SPECS[interactionId].customization_arg_specs;
    const caValues = this.stateCustomizationArgsService.displayed;
    for (const caSpec of caSpecs) {
      const name = caSpec.name;
      if (caValues.hasOwnProperty(name)) {
        traverseSchemaAndCollectContent(caValues[name].value, caSpec.schema);
      }
    }

    return contentIdToContent;
  }

  save(): void {
    this.populateNullContentIds();
    this.editorFirstTimeEventsService.registerFirstSaveInteractionEvent();
    this.ngbActiveModal.close();
  }

  getHyphenatedLowercaseCategoryName(categoryName: string): string {
    return categoryName && categoryName.replace(/\s/g, '-').toLowerCase();
  }

  getInteractionThumbnailImageUrl(interactionId: string): string {
    return this.urlInterpolationService.getInteractionThumbnailImageUrl(
      interactionId
    );
  }

  ngAfterContentChecked(): void {
    this.changeDetectorRef.detectChanges();
  }

  ngAfterViewInit(): void {
    this.focusManagerService.setFocus('chooseInteractionHeader');
  }

  ngOnInit(): void {
    if (this.stateInteractionIdService.displayed) {
      this.isinteractionOpen = false;
    } else {
      this.isinteractionOpen = true;
    }
    this.originalContentIdToContent = {};
    if (this.stateInteractionIdService.savedMemento) {
      this.originalContentIdToContent = this.getContentIdToContent();
      // Above called with this.stateCustomizationArgsService.displayed.
    }
    this.explorationIsLinkedToStory =
      this.contextService.isExplorationLinkedToStory();
    this.editorFirstTimeEventsService.registerFirstClickAddInteractionEvent();

    if (this.stateEditorService.isInQuestionMode()) {
      this.allowedInteractionCategories = Array.prototype.concat.apply(
        [],
        AppConstants.ALLOWED_QUESTION_INTERACTION_CATEGORIES
      );
    } else if (this.contextService.isExplorationLinkedToStory()) {
      this.allowedInteractionCategories = Array.prototype.concat.apply(
        [],
        AppConstants.ALLOWED_EXPLORATION_IN_STORY_INTERACTION_CATEGORIES
      );
    } else {
      this.allowedInteractionCategories = Array.prototype.concat.apply(
        [],
        AppConstants.ALLOWED_INTERACTION_CATEGORIES
      );
    }

    if (this.stateEditorService.isInQuestionMode()) {
      this.allowedInteractionCategories = Array.prototype.concat.apply(
        [],
        AppConstants.ALLOWED_QUESTION_INTERACTION_CATEGORIES
      );
    } else if (this.contextService.isExplorationLinkedToStory()) {
      this.allowedInteractionCategories = Array.prototype.concat.apply(
        [],
        AppConstants.ALLOWED_EXPLORATION_IN_STORY_INTERACTION_CATEGORIES
      );
    } else {
      this.allowedInteractionCategories = Array.prototype.concat.apply(
        [],
        AppConstants.ALLOWED_INTERACTION_CATEGORIES
      );
    }

    if (this.stateInteractionIdService.savedMemento) {
      this.customizationModalReopened = true;
      let interactionSpec =
        INTERACTION_SPECS[this.stateInteractionIdService.savedMemento];
      this.customizationArgSpecs = interactionSpec.customization_arg_specs;

      this.stateInteractionIdService.displayed = cloneDeep(
        this.stateInteractionIdService.savedMemento
      );
      this.stateCustomizationArgsService.displayed = cloneDeep(
        this.stateCustomizationArgsService.savedMemento
      );

      // Ensure that StateCustomizationArgsService.displayed is
      // fully populated.
      for (let i = 0; i < this.customizationArgSpecs.length; i++) {
        let argName = this.customizationArgSpecs[i].name;
        if (
          !this.stateCustomizationArgsService.savedMemento.hasOwnProperty(
            argName
          )
        ) {
          throw new Error(
            `Interaction is missing customization argument ${argName}`
          );
        }
      }

      this.stateCustomizationArgsService.onSchemaBasedFormsShown.emit();
      this.hasCustomizationArgs =
        this.stateCustomizationArgsService.displayed &&
        Object.keys(this.stateCustomizationArgsService.displayed).length > 0;
    }
  }
}
