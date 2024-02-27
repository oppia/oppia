// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for RteHelperModal.
 */

import { Component, Input, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import cloneDeep from 'lodash/cloneDeep';
import { AlertsService } from 'services/alerts.service';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { ContextService } from 'services/context.service';
import { ExternalRteSaveService } from 'services/external-rte-save.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { ImageUploadHelperService } from 'services/image-upload-helper.service';
import { ServicesConstants } from 'services/services.constants';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { FormBuilder, FormGroup } from '@angular/forms';

const typedCloneDeep = <T>(obj: T): T => cloneDeep(obj);

type ComponentSpecsType = typeof ServicesConstants.RTE_COMPONENT_SPECS;

// ConvertStringLiteralsToString recursively converts all string literals in a
// type to the string type.
// It uses conditional types to check if T is a string, an object, or
// something else.
type ConvertStringLiteralsToString<T> = T extends string
  ? string // If T is a string, return the string type.
  : T extends object
  ? // // If T is an object, map each key K of T to a new object with the same
    // key but a value of ConvertStringLiteralsToString<T[K]>.
    { [K in keyof T]: ConvertStringLiteralsToString<T[K]> }
  : T; // If T is not a string or an object, return T unchanged.

// CustomizationArgsSpecsType extracts the customization_arg_specs array from
// each component in ComponentSpecsType.
// It uses mapped types to iterate over each key K in ComponentSpecsType, and
// then indexes into the object using [number] to represent any index in the
// array.
export type CustomizationArgsSpecsType = {
  [K in keyof ComponentSpecsType]:
  ComponentSpecsType[K]['customization_arg_specs'][number][];
  // Finally, use [keyof ComponentSpecsType] to create a union of all the array
  // types.
}[keyof ComponentSpecsType];
// CustomizationArgsForRteType maps the customization_arg_specs array to an
// object with keys as 'name' and values as the 'default_value'.
// It uses mapped types and Extract to achieve this.
export type CustomizationArgsForRteType = {
  [K in CustomizationArgsSpecsType[number]['name']]:
  ConvertStringLiteralsToString<
    // Extract is used to find the correct customization_arg_specs object that
    // has the 'name' property equal to K.
    Extract<CustomizationArgsSpecsType[number], { name: K }>['default_value']
  >
};

// CustomizationArgsNameAndValueArray creates an array of objects with 'name'
// and 'value' properties for each component.
// The 'name' property comes from the customization_arg_specs, while the 'value'
// property is derived from the 'default_value'.
type CustomizationArgsNameAndValueArray = {
  [K in keyof ComponentSpecsType]: {
    // Extract the 'name' property from the customization_arg_specs array.
    name: ComponentSpecsType[K]['customization_arg_specs'][number]['name'];
    value: (
      // Check if the 'name' property is equal to 'math_content' using a
      // conditional type.
      ComponentSpecsType[K][
        'customization_arg_specs'][number]['name'] extends 'math_content' ?
      ConvertStringLiteralsToString<
        ComponentSpecsType[K][
          'customization_arg_specs'][number]['default_value']
      > & {
      svgFile: string | null;
      mathExpressionSvgIsBeingProcessed: boolean;
    } :
    // If the 'name' property is not equal to 'math_content', create a type with
    // the 'default_value' converted to a string.
    ConvertStringLiteralsToString<
      ComponentSpecsType[K]['customization_arg_specs'][number]['default_value']
    >);
  }[];
  // Finally, use [keyof ComponentSpecsType] to create a union.
}[keyof ComponentSpecsType];

@Component({
  selector: 'oppia-rte-helper-modal',
  templateUrl: './rte-helper-modal.component.html',
})
export class RteHelperModalComponent {
  @Input() customizationArgSpecs: CustomizationArgsSpecsType;
  @Input() attrsCustomizationArgsDict: CustomizationArgsForRteType;
  @Input() componentIsNewlyCreated: boolean;
  modalIsLoading: boolean = true;
  currentRteIsMathExpressionEditor: boolean = false;
  currentRteIsLinkEditor: boolean = false;
  tmpCustomizationArgs: CustomizationArgsNameAndValueArray = [];
  @ViewChild('schemaForm') schemaForm!: NgForm;
  public customizationArgsForm: FormGroup;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private externalRteSaveService: ExternalRteSaveService,
    private alertsService: AlertsService,
    private fb: FormBuilder,
    private assetsBackendApiService: AssetsBackendApiService,
    private contextService: ContextService,
    private focusManagerService: FocusManagerService,
    private imageLocalStorageService: ImageLocalStorageService,
    private imageUploadHelperService: ImageUploadHelperService
  ) {}

  ngOnInit(): void {
    this.focusManagerService.setFocus('tmpFocusPoint');
    for (let i = 0; i < this.customizationArgSpecs.length; i++) {
      const caName = this.customizationArgSpecs[i].name;
      if (caName === 'math_content') {
        this.currentRteIsMathExpressionEditor = true;
        // Typescript is not able to infer the correct type of mathValueDict.
        // Hence we manually typecast it to the correct type. When we use
        // typeof caName, it returns a string literal type which is
        // 'math_content'. This helps it narrow down the type of dict to the
        // one corresponding to math content. (i.e. properties like svgFile, etc
        // )
        // TODO(#18219): Remove the typecast once Typescript is able to infer
        // the correct type.
        const mathValueDict = {
          name: caName,
          value: this.attrsCustomizationArgsDict.hasOwnProperty(caName) ?
            typedCloneDeep(this.attrsCustomizationArgsDict[caName]) :
            this.customizationArgSpecs[i].default_value,
        } as Extract<
          CustomizationArgsNameAndValueArray[number],
          { name: typeof caName }
        >;
        // If the component being created or edited is math rich text component,
        // we need to pass this extra attribute svgFile to the math RTE editor.
        // The math RTE editor will auto-generate the svgFile based on the
        // rawLatex value and then this file can be saved to the backend when
        // the user clicks on the save button.
        mathValueDict.value.svgFile = null;
        mathValueDict.value.mathExpressionSvgIsBeingProcessed = false;
        (
          this.tmpCustomizationArgs as Extract<
            CustomizationArgsNameAndValueArray[number],
            { name: typeof caName }
          >[]
        ).push(mathValueDict);
      } else {
        // Typescript ends up inferring the union type to be never instead of
        // the correct type. Hence we manually typecast it to the correct type.
        // TODO(#18219): Remove the typecast once Typescript is able to infer
        // the correct type.
        const tmpCustomizationArg = {
          name: caName,
          value: this.attrsCustomizationArgsDict.hasOwnProperty(caName) ?
            angular.copy(this.attrsCustomizationArgsDict[caName]) :
            this.customizationArgSpecs[i].default_value,
        } as Extract<
          CustomizationArgsNameAndValueArray[number],
          { name: typeof caName }
        >;
        (
          this.tmpCustomizationArgs as Extract<
            CustomizationArgsNameAndValueArray[number],
            { name: typeof caName }
          >[]
        ).push(tmpCustomizationArg);
      }
    }
    // Infer that the RTE component is a Link if it contains the `url` and
    // `text` customization arg names
    // TODO(#18219): Remove the typecast once Typescript is able to infer
    // the correct type..
    const customizationArgNames = (
      this.customizationArgSpecs as { name: string }[]
    ).map((x) => x.name);
    if (
      customizationArgNames.includes('url') &&
      customizationArgNames.includes('text')
    ) {
      this.currentRteIsLinkEditor = true;
    }

    const formGroupControls = {};
    this.customizationArgSpecs.forEach((_, index) => {
      formGroupControls[index] = this.fb.control(
        this.tmpCustomizationArgs[index].value
      );
    });

    this.customizationArgsForm = this.fb.group(formGroupControls);

    setTimeout(() => {
      this.modalIsLoading = false;
    });
  }

  cancel(): void {
    if (this.componentIsNewlyCreated) {
      this.ngbActiveModal.dismiss(true);
    } else {
      this.ngbActiveModal.dismiss(false);
    }
  }

  delete(): void {
    this.ngbActiveModal.dismiss(true);
  }

  disableSaveButtonForMathRte(): boolean {
    // This method disables the save button when the Math SVG has not yet
    // been generated but being processed.
    if (!this.currentRteIsMathExpressionEditor) {
      return false;
    } else {
      // We know that this is a math rich text component. Hence we can make the
      // the type more specific.
      const { value } = this.tmpCustomizationArgs[0] as Extract<
        CustomizationArgsNameAndValueArray[number],
        { name: 'math_content' }
      >;
      return value.mathExpressionSvgIsBeingProcessed || value.raw_latex === '';
    }
  }

  disableSaveButtonForLinkRte(): boolean {
    // This method disables the save button when the `text` field for the
    // Link RTE looks like a URL but it does not match the `url`. Otherwise,
    // creators can make the `url` a malicious website and make the `text`
    // a safe website.
    if (!this.currentRteIsLinkEditor) {
      return false;
    }
    // We know that this is a link rich text component. Hence we can make the
    // the type more specific.
    const tmpCustomizationArgs = this.tmpCustomizationArgs as Extract<
      CustomizationArgsNameAndValueArray[number],
      { name: 'url' | 'text' }
    >[];
    let url: string = tmpCustomizationArgs[0].value;
    let text: string = tmpCustomizationArgs[1].value;

    // First check if the `text` looks like a URL.
    const suffixes = ['.com', '.org', '.edu', '.gov'];
    let textLooksLikeUrl = false;
    for (const suffix of suffixes) {
      if (text.endsWith(suffix)) {
        textLooksLikeUrl = true;
      }
    }
    if (!textLooksLikeUrl) {
      return false;
    }
    // If the text looks like a URL, strip the leading 'http://' or
    // 'https://' or 'www.'.
    const prefixes = ['https://', 'http://', 'www.'];
    for (const prefix of prefixes) {
      if (url.startsWith(prefix)) {
        url = url.substring(prefix.length);
      }
      if (text.startsWith(prefix)) {
        text = text.substring(prefix.length);
      }
    }
    // After the cleanup, if the strings are not equal, then we do not
    // allow the lesson creator to save it.
    return url !== text;
  }

  save(): void {
    for (let index in this.customizationArgsForm.value) {
      this.tmpCustomizationArgs[index].value = (
        this.customizationArgsForm.value[index]);
    }
    this.externalRteSaveService.onExternalRteSave.emit();

    const customizationArgsDict: {
      [Prop in keyof CustomizationArgsForRteType]?:
      CustomizationArgsForRteType[Prop]
    } = {};
    // For the case of the math rich text components, we need to handle the
    // saving of the generated SVG file here because the process of saving
    // the SVG is asynchronous and the saving of SVG to the backend is to
    // be done only after the user clicks on the save button.
    // The saving of SVGs to the backend cannot be done in the math RTE editor
    // because the control is passed to this function as soon as the user
    // clicks on the save button.
    if (this.currentRteIsMathExpressionEditor) {
      // The tmpCustomizationArgs is guaranteed to have only one element for
      // the case of math rich text component.
      // We know that this is a math rich text component. Hence we can make the
      // the type more specific.
      const tmpCustomizationArgs = this.tmpCustomizationArgs as Extract<
        CustomizationArgsNameAndValueArray[number],
        { name: 'math_content' }
      >[];
      const svgFile = tmpCustomizationArgs[0].value.svgFile;
      const svgFileName = tmpCustomizationArgs[0].value.svg_filename;
      const rawLatex = tmpCustomizationArgs[0].value.raw_latex;
      if (rawLatex === '' || svgFileName === '') {
        this.alertsService.addWarning(
          'The rawLatex or svgFileName for a Math expression should not ' +
            'be empty.'
        );
        this.ngbActiveModal.dismiss('cancel');
        return;
      }
      const resampledFile =
        this.imageUploadHelperService.convertImageDataToImageFile(svgFile);

      let maxAllowedFileSize;
      if (
        this.contextService.getEntityType() ===
        AppConstants.ENTITY_TYPE.BLOG_POST
      ) {
        const ONE_MB_IN_BYTES = 1 * 1024 * 1024;
        maxAllowedFileSize = ONE_MB_IN_BYTES;
      } else {
        const HUNDRED_KB_IN_BYTES = 100 * 1024;
        maxAllowedFileSize = HUNDRED_KB_IN_BYTES;
      }
      if (resampledFile.size > maxAllowedFileSize) {
        this.alertsService.addInfoMessage(
          `The SVG file generated exceeds ${maxAllowedFileSize / 1024}` +
            ' KB. Please split the expression into smaller ones.' +
            "   Example: x^2 + y^2 + z^2 can be split as 'x^2 + y^2' " +
            "and '+ z^2'",
          5000
        );
        this.ngbActiveModal.dismiss('cancel');
        return;
      }
      if (
        this.contextService.getImageSaveDestination() ===
        AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE
      ) {
        this.imageLocalStorageService.saveImage(svgFileName, svgFile);
        const mathContentDict = {
          raw_latex: tmpCustomizationArgs[0].value.raw_latex,
          svg_filename: svgFileName,
        };
        const caName = tmpCustomizationArgs[0].name;
        customizationArgsDict[caName] = mathContentDict;
        this.ngbActiveModal.close(customizationArgsDict);
        return;
      }
      this.assetsBackendApiService
        .saveMathExpressionImage(
          resampledFile,
          svgFileName,
          this.contextService.getEntityType(),
          this.contextService.getEntityId()
        )
        .then(
          (response) => {
            const mathContentDict = {
              raw_latex: tmpCustomizationArgs[0].value.raw_latex,
              svg_filename: response.filename,
            };
            const caName = tmpCustomizationArgs[0].name;
            customizationArgsDict[caName] = mathContentDict;
            this.ngbActiveModal.close(customizationArgsDict);
          },
          (errorResponse) => {
            this.alertsService.addWarning(
              errorResponse.error || 'Error communicating with server.'
            );
            this.ngbActiveModal.dismiss('cancel');
          }
        );
    } else {
      for (let i = 0; i < this.tmpCustomizationArgs.length; i++) {
        const caName = this.tmpCustomizationArgs[i].name;
        if (caName === 'video_id') {
          const temp = this.tmpCustomizationArgs[i].value;
          customizationArgsDict[caName] = this.extractVideoIdFromVideoUrl(
            temp.toString()
          );
        } else if (caName === 'text' && this.currentRteIsLinkEditor) {
          // Set the link `text` to the link `url` if the `text` is empty.
          (
            customizationArgsDict as {
              [Prop in CustomizationArgsNameAndValueArray[number]['name']]:
                CustomizationArgsNameAndValueArray[number]['value'];
            }
          )[caName] =
            this.tmpCustomizationArgs[i].value ||
            this.tmpCustomizationArgs[i - 1].value;
        } else {
          (
            customizationArgsDict as {
              [Prop in CustomizationArgsNameAndValueArray[number]['name']]:
                CustomizationArgsNameAndValueArray[number]['value'];
            }
          )[caName] = this.tmpCustomizationArgs[i].value;
        }
      }
      this.ngbActiveModal.close(customizationArgsDict);
    }
  }

  extractVideoIdFromVideoUrl(url: string): string {
    const videoUrl = url.split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
    return videoUrl[2] !== undefined ?
      videoUrl[2].split(/[^0-9a-z_\-]/i)[0] :
      videoUrl[0];
  }
}
