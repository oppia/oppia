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

import {Component, Input, ViewChild, OnInit} from '@angular/core';
import {AbstractControl, NgForm} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {AppConstants} from 'app.constants';
import cloneDeep from 'lodash/cloneDeep';
import {AlertsService} from 'services/alerts.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {PageContextService} from 'services/page-context.service';
import {ExternalRteSaveService} from 'services/external-rte-save.service';
import {ImageLocalStorageService} from 'services/image-local-storage.service';
import {ImageUploadHelperService} from 'services/image-upload-helper.service';
import {ServicesConstants} from 'services/services.constants';
import {FormBuilder, FormGroup} from '@angular/forms';
import {Subscription} from 'rxjs';
import {HtmlLengthService} from 'services/html-length.service';

const CALCULATION_TYPE_CHARACTER = 'character';

const typedCloneDeep = <T>(obj: T): T => cloneDeep(obj);

type ComponentSpecsType = typeof ServicesConstants.RTE_COMPONENT_SPECS;

type ConvertStringLiteralsToString<T> = T extends string
  ? string
  : T extends object
    ? {[K in keyof T]: ConvertStringLiteralsToString<T[K]>}
    : T;

export type CustomizationArgsSpecsType = {
  [K in keyof ComponentSpecsType]: ComponentSpecsType[K]['customization_arg_specs'][number][];
}[keyof ComponentSpecsType];

export type CustomizationArgsForRteType = {
  [K in CustomizationArgsSpecsType[number]['name']]: ConvertStringLiteralsToString<
    Extract<CustomizationArgsSpecsType[number], {name: K}>['default_value']
  >;
};

type CustomizationArgsNameAndValueArray = {
  [K in keyof ComponentSpecsType]: {
    name: ComponentSpecsType[K]['customization_arg_specs'][number]['name'];
    value: ComponentSpecsType[K]['customization_arg_specs'][number]['name'] extends 'math_content'
      ? ConvertStringLiteralsToString<
          ComponentSpecsType[K]['customization_arg_specs'][number]['default_value']
        > & {
          svgFile: string | null;
          mathExpressionSvgIsBeingProcessed: boolean;
        }
      : ConvertStringLiteralsToString<
          ComponentSpecsType[K]['customization_arg_specs'][number]['default_value']
        >;
  }[];
}[keyof ComponentSpecsType];

export type RteComponentId = {
  [K in keyof ComponentSpecsType]: ComponentSpecsType[K]['frontend_id'];
}[keyof ComponentSpecsType];

@Component({
  selector: 'oppia-rte-helper-modal',
  templateUrl: './rte-helper-modal.component.html',
})
export class RteHelperModalComponent implements OnInit {
  @Input() componentId!: RteComponentId;
  @Input() customizationArgSpecs!: CustomizationArgsSpecsType;
  @Input() attrsCustomizationArgsDict!: CustomizationArgsForRteType;
  @Input() componentIsNewlyCreated!: boolean;
  modalIsLoading: boolean = true;
  errorMessage: string = '';

  tmpCustomizationArgs: CustomizationArgsNameAndValueArray =
    [] as unknown as CustomizationArgsNameAndValueArray;
  @ViewChild('schemaForm') schemaForm!: NgForm;
  public customizationArgsForm!: FormGroup;
  customizationArgsFormSubscription!: Subscription;

  COMPONENT_ID_COLLAPSIBLE = 'collapsible';
  COMPONENT_ID_COLLAPSIBLE_HEADING = 'collapsible_heading';
  COMPONENT_ID_COLLAPSIBLE_CONTENT = 'collapsible_content';
  COMPONENT_ID_WORKEDEXAMPLE = 'workedexample';
  COMPONENT_ID_IMAGE = 'image';
  COMPONENT_ID_LINK = 'link';
  COMPONENT_ID_MATH = 'math';
  COMPONENT_ID_SKILLREVIEW = 'skillreview';
  COMPONENT_ID_TABS = 'tabs';
  COMPONENT_ID_TABS_HEADING = 'tabs_heading';
  COMPONENT_ID_TABS_CONTENT = 'tabs_content';
  COMPONENT_ID_VIDEO = 'video';

  CHARACTER_LIMITS: Record<string, number> = {
    collapsible_heading: 200,
    collapsible_content: 500,
    link: 200,
    tabs_heading: 200,
    tabs_content: 500,
    workedexample: 1500,
    default: 500,
  };

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private externalRteSaveService: ExternalRteSaveService,
    private alertsService: AlertsService,
    private fb: FormBuilder,
    private assetsBackendApiService: AssetsBackendApiService,
    private pageContextService: PageContextService,
    private imageLocalStorageService: ImageLocalStorageService,
    private imageUploadHelperService: ImageUploadHelperService,
    private htmlLengthService: HtmlLengthService
  ) {}

  ngOnInit(): void {
    for (let i = 0; i < this.customizationArgSpecs.length; i++) {
      const caName = this.customizationArgSpecs[i].name;
      if (caName === 'math_content') {
        const mathValueDict = {
          name: caName,

          value: this.attrsCustomizationArgsDict.hasOwnProperty(caName)
            ? typedCloneDeep(
                (this.attrsCustomizationArgsDict as Record<string, unknown>)[
                  caName
                ]
              )
            : this.customizationArgSpecs[i].default_value,
        } as Extract<
          CustomizationArgsNameAndValueArray[number],
          {name: 'math_content'}
        >;
        mathValueDict.value.svgFile = null;
        mathValueDict.value.mathExpressionSvgIsBeingProcessed = false;

        (
          this.tmpCustomizationArgs as unknown as {
            name: string;
            value: unknown;
          }[]
        ).push(mathValueDict);
      } else {
        const tmpCustomizationArg = {
          name: caName,

          value: this.attrsCustomizationArgsDict.hasOwnProperty(caName)
            ? typedCloneDeep(
                (this.attrsCustomizationArgsDict as Record<string, unknown>)[
                  caName
                ]
              )
            : this.customizationArgSpecs[i].default_value,
        } as Extract<
          CustomizationArgsNameAndValueArray[number],
          {name: string}
        >;

        (
          this.tmpCustomizationArgs as unknown as {
            name: string;
            value: unknown;
          }[]
        ).push(tmpCustomizationArg);
      }
    }

    const formGroupControls: Record<string, AbstractControl> = {};

    this.customizationArgSpecs.forEach((_: unknown, index: number) => {
      formGroupControls[index] = this.fb.control(
        (this.tmpCustomizationArgs as unknown as {value: unknown}[])[index]
          .value
      );
    });

    this.customizationArgsForm = this.fb.group(formGroupControls);

    this.customizationArgsFormSubscription =
      this.customizationArgsForm.valueChanges.subscribe(value => {
        this.onCustomizationArgsFormChange(value);
      });

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
    this.customizationArgsFormSubscription.unsubscribe();
  }

  delete(): void {
    this.ngbActiveModal.dismiss(true);
    this.customizationArgsFormSubscription.unsubscribe();
  }

  onCustomizationArgsFormChange(value: Record<string, unknown>): void {
    this.clearRteErrorMessage();
    if (this.componentId === this.COMPONENT_ID_MATH) {
      const val0 = value['0'] as {
        raw_latex: string;
        mathExpressionSvgIsBeingProcessed: boolean;
      };
      const rawLatex: string = val0.raw_latex;
      const mathExpressionSvgIsBeingProcessed: boolean =
        val0.mathExpressionSvgIsBeingProcessed;
      if (mathExpressionSvgIsBeingProcessed || rawLatex === '') {
        this.updateRteErrorMessage(
          'Waiting for math expression SVG to be processed...'
        );
        return;
      }
    } else if (this.componentId === this.COMPONENT_ID_VIDEO) {
      const start = value['1'] as number;
      const end = value['2'] as number;
      if (value['0'] === '') {
        this.updateRteErrorMessage(
          'Please ensure that the Youtube URL or id is valid.'
        );
        return;
      }
      if (start !== 0 && start >= end) {
        this.updateRteErrorMessage(
          'Please ensure that the start time of the video is earlier than the end time.'
        );
        return;
      }
    } else if (this.componentId === this.COMPONENT_ID_TABS) {
      const tabs = value['0'] as {title: string; content: string}[];
      for (let tabIndex = 0; tabIndex < tabs.length; tabIndex++) {
        if (tabs[tabIndex].title === '') {
          this.updateRteErrorMessage(
            'Please ensure that the title of tab ' +
              (tabIndex + 1) +
              ' is filled.'
          );
          break;
        } else if (tabs[tabIndex].content === '') {
          this.updateRteErrorMessage(
            'Please ensure that the content of tab ' +
              (tabIndex + 1) +
              ' is filled.'
          );
          break;
        } else {
          if (
            this.isContentLengthExceeded(
              tabs[tabIndex].content,
              this.COMPONENT_ID_TABS_CONTENT
            )
          ) {
            this.updateRteErrorMessage(
              `The content of tab ${tabIndex + 1} is too long. ` +
                `Please use at most ${this.getCharacterLimit(this.COMPONENT_ID_TABS_CONTENT)} characters.`
            );
            break;
          }

          if (
            this.isContentLengthExceeded(
              tabs[tabIndex].title,
              this.COMPONENT_ID_TABS_HEADING
            )
          ) {
            this.updateRteErrorMessage(
              `The title of tab ${tabIndex + 1} is too long. ` +
                `Please use at most ${this.getCharacterLimit(this.COMPONENT_ID_TABS_HEADING)} characters.`
            );
            break;
          }
          this.updateRteErrorMessage('');
        }
      }
    } else if (this.componentId === this.COMPONENT_ID_LINK) {
      let url: string = (value['0'] as string) ?? '';
      let text: string = (value['1'] as string) ?? '';

      if (this.isContentLengthExceeded(url, this.COMPONENT_ID_LINK)) {
        this.updateRteErrorMessage(
          `The URL is too long. Please use at most ${this.getCharacterLimit(this.COMPONENT_ID_LINK)} characters.`
        );
        return;
      }

      if (this.isContentLengthExceeded(text, this.COMPONENT_ID_LINK)) {
        this.updateRteErrorMessage(
          `The link text is too long. Please use at most ${this.getCharacterLimit(this.COMPONENT_ID_LINK)} characters.`
        );
        return;
      }

      if (!text || !text.trim()) {
        value['1'] = url;
        text = url;
      } else {
        const suffixes = ['.com', '.org', '.edu', '.gov'];
        const textLooksLikeUrl = suffixes.some(suffix => text.endsWith(suffix));
        if (!textLooksLikeUrl) {
          this.clearRteErrorMessage();
        } else {
          const prefixes = ['https://', 'http://', 'www.'];
          for (const prefix of prefixes) {
            if (url.startsWith(prefix)) {
              url = url.substring(prefix.length);
            }
            if (text.startsWith(prefix)) {
              text = text.substring(prefix.length);
            }
          }
          if (url !== text) {
            this.updateRteErrorMessage(
              'It seems like clicking on this link will lead the user to a ' +
                'different URL than the text specifies. Please change the text.'
            );
            return;
          }
        }
      }
    } else if (this.componentId === this.COMPONENT_ID_COLLAPSIBLE) {
      const heading = value['0'] as string;
      const content = value['1'] as string;
      if (
        heading &&
        this.isContentLengthExceeded(
          heading,
          this.COMPONENT_ID_COLLAPSIBLE_HEADING
        )
      ) {
        this.updateRteErrorMessage(
          `The heading is too long. Please use at most ${this.getCharacterLimit(this.COMPONENT_ID_COLLAPSIBLE_HEADING)} characters.`
        );
        return;
      }

      if (
        content &&
        this.isContentLengthExceeded(
          content,
          this.COMPONENT_ID_COLLAPSIBLE_CONTENT
        )
      ) {
        this.updateRteErrorMessage(
          `The content is too long. Please use at most ${this.getCharacterLimit(this.COMPONENT_ID_COLLAPSIBLE_CONTENT)} characters.`
        );
        return;
      }
    } else if (this.componentId === this.COMPONENT_ID_WORKEDEXAMPLE) {
      const question = value['0'] as string;
      const answer = value['1'] as string;
      if (
        question &&
        this.isContentLengthExceeded(question, this.COMPONENT_ID_WORKEDEXAMPLE)
      ) {
        this.updateRteErrorMessage(
          `The question is too long. Please use at most ${this.getCharacterLimit(this.COMPONENT_ID_WORKEDEXAMPLE)} characters.`
        );
        return;
      } else if (question === '') {
        this.updateRteErrorMessage(
          'Please ensure the worked example has a question.'
        );
      }

      if (
        answer &&
        this.isContentLengthExceeded(answer, this.COMPONENT_ID_WORKEDEXAMPLE)
      ) {
        this.updateRteErrorMessage(
          `The answer is too long. Please use at most ${this.getCharacterLimit(this.COMPONENT_ID_WORKEDEXAMPLE)} characters.`
        );
        return;
      } else if (answer === '') {
        this.updateRteErrorMessage(
          'Please ensure the worked example has an answer.'
        );
      }
    }
  }

  isContentLengthExceeded(content: string, componentId: string): boolean {
    if (!content) {
      return false;
    }

    return Boolean(
      this.htmlLengthService.computeHtmlLength(
        content,
        CALCULATION_TYPE_CHARACTER
      ) > this.getCharacterLimit(componentId)
    );
  }

  getCharacterLimit(componentId: string): number {
    return this.CHARACTER_LIMITS[componentId] || this.CHARACTER_LIMITS.default;
  }

  isErrorMessageNonempty(): boolean {
    return !!(this.errorMessage && this.errorMessage !== '');
  }

  updateRteErrorMessage(errorMessage: string): void {
    this.errorMessage = errorMessage;
  }

  clearRteErrorMessage(): void {
    this.errorMessage = '';
  }

  save(): void {
    const formValues = this.customizationArgsForm.value;
    for (const index in formValues) {
      (this.tmpCustomizationArgs as unknown as {value: unknown}[])[
        index
      ].value = formValues[index];
    }
    this.externalRteSaveService.onExternalRteSave.emit();

    const customizationArgsDict: Record<string, unknown> = {};

    if (this.componentId === this.COMPONENT_ID_MATH) {
      const tmpMathArgs = this.tmpCustomizationArgs as unknown as Extract<
        CustomizationArgsNameAndValueArray[number],
        {name: 'math_content'}
      >[];
      const svgFile = tmpMathArgs[0].value.svgFile;
      const svgFileName = tmpMathArgs[0].value.svg_filename;
      const rawLatex = tmpMathArgs[0].value.raw_latex;

      if (!rawLatex || !svgFileName) {
        this.alertsService.addWarning(
          'The rawLatex or svgFileName for a Math expression should not be empty.'
        );
        this.ngbActiveModal.dismiss('cancel');
        return;
      }

      if (!svgFile) {
        this.alertsService.addWarning('Math SVG file is missing.');
        this.ngbActiveModal.dismiss('cancel');
        return;
      }

      const resampledFile =
        this.imageUploadHelperService.convertImageDataToImageFile(
          svgFile
        ) as File;

      let maxAllowedFileSize;
      if (
        this.pageContextService.getEntityType() ===
        AppConstants.ENTITY_TYPE.BLOG_POST
      ) {
        maxAllowedFileSize = 1 * 1024 * 1024;
      } else {
        maxAllowedFileSize = 100 * 1024;
      }

      if (resampledFile.size > maxAllowedFileSize) {
        this.alertsService.addInfoMessage(
          `The SVG file generated exceeds ${maxAllowedFileSize / 1024} KB. ` +
            'Please split the expression into smaller ones.',
          5000
        );
        this.ngbActiveModal.dismiss('cancel');
        return;
      }

      if (
        this.pageContextService.getImageSaveDestination() ===
        AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE
      ) {
        this.imageLocalStorageService.saveImage(svgFileName, svgFile);
        customizationArgsDict[tmpMathArgs[0].name] = {
          raw_latex: rawLatex,
          svg_filename: svgFileName,
        };
        this.ngbActiveModal.close(customizationArgsDict);
        return;
      }

      this.assetsBackendApiService
        .saveMathExpressionImage(
          resampledFile,
          svgFileName,
          this.pageContextService.getEntityType(),
          this.pageContextService.getEntityId()
        )
        .then(
          response => {
            customizationArgsDict[tmpMathArgs[0].name] = {
              raw_latex: rawLatex,
              svg_filename: response.filename,
            };
            this.ngbActiveModal.close(customizationArgsDict);
          },
          errorResponse => {
            this.alertsService.addWarning(
              errorResponse.error || 'Error communicating with server.'
            );
            this.ngbActiveModal.dismiss('cancel');
          }
        );
    } else {
      for (
        let i = 0;
        i < (this.tmpCustomizationArgs as unknown as unknown[]).length;
        i++
      ) {
        const arg = (
          this.tmpCustomizationArgs as unknown as {
            name: string;
            value: unknown;
          }[]
        )[i];
        let value = arg.value;
        if (
          this.componentId === this.COMPONENT_ID_VIDEO &&
          arg.name === 'video_id'
        ) {
          value = this.extractVideoIdFromVideoUrl((value ?? '').toString());
        }
        customizationArgsDict[arg.name] = value;
      }
      this.ngbActiveModal.close(customizationArgsDict);
      this.customizationArgsFormSubscription.unsubscribe();
    }
  }

  extractVideoIdFromVideoUrl(url: string): string {
    const videoUrl = url.split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
    return videoUrl[2] !== undefined
      ? videoUrl[2].split(/[^0-9a-z_\-]/i)[0]
      : videoUrl[0];
  }
}
