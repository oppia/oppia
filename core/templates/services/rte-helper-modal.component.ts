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
 * @fileoverview Component for the RTE customisation.
 */

import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import cloneDeep from 'lodash/cloneDeep';

import { AppConstants } from 'app.constants';
import { AlertsService } from 'services/alerts.service';
import { AssetsBackendApiService, SaveImageResponse } from 'services/assets-backend-api.service';
import { ContextService } from 'services/context.service';
import { ExternalRteSaveService } from 'services/external-rte-save.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { ImageUploadHelperService } from 'services/image-upload-helper.service';
import { MathExpressionContent } from './speech-synthesis-chunker.service';
import { EventBusGroup, EventBusService } from 'app-events/event-bus.service';
import { ObjectFormValidityChangeEvent } from 'app-events/app-events';

interface CustomizationArgsSpecs {
  name: string,
  description: string,
  schema: Object,
  'default_value': Object | MathExpressionContent
}

interface AttrsCustomizationArgsDict {
  [name: string]: Object | MathExpressionContent,
}

@Component({
  selector: 'oppia-rte-helper-modal',
  templateUrl: './customize-rte-modal.component.html'
})

export class RteHelperModalComponent implements OnInit {
  attrsCustomizationArgsDict: AttrsCustomizationArgsDict;
  customizationArgSpecs: CustomizationArgsSpecs[];
  modalIsLoading: boolean;
  currentRteIsMathExpressionEditor: boolean;
  tmpCustomizationArgs: {
    name: string,
    value: Object | MathExpressionContent
  }[];
  isValid: boolean;
  eventBusGroup: EventBusGroup;
  modalId = Symbol();

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private alertsService: AlertsService,
    private assetsBackendApiService: AssetsBackendApiService,
    private contextService: ContextService,
    private eventBusService: EventBusService,
    private externalRteSaveService: ExternalRteSaveService,
    private focusManagerService: FocusManagerService,
    private imageLocalStorageService: ImageLocalStorageService,
    private imageUploadHelperService: ImageUploadHelperService,
  ) {}

  private _extractVideoIdFromVideoUrl(videoUrl: string): string {
    let videoUrlParts = videoUrl.split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
    return (
      (videoUrlParts[2] !== undefined) ?
      videoUrlParts[2].split(/[^0-9a-z_\-]/i)[0] : videoUrlParts[0]);
  }

  ngOnInit(): void {
    this.isValid = true;
    const eventBusGroup: EventBusGroup = new EventBusGroup(
      this.eventBusService);
    this.eventBusGroup = eventBusGroup;
    eventBusGroup.on(
      ObjectFormValidityChangeEvent,
      event => {
        if (event.message.modalId === this.modalId) {
          this.isValid = event.message.value;
        }
      });
    // Without this code, the focus will remain in the background RTE
    // even after the modal loads. This switches the focus to a
    // temporary field in the modal which is then removed from the
    // DOM.
    // TODO(sll): Make this switch to the first input field in the
    // modal instead.
    this.modalIsLoading = true;
    const that = this;
    this.focusManagerService.setFocus('tmpFocusPoint');
    setTimeout(() => {
      that.modalIsLoading = false;
    }, 150);

    this.currentRteIsMathExpressionEditor = false;
    this.tmpCustomizationArgs = [];
    for (let i = 0; i < this.customizationArgSpecs.length; i++) {
      let caName = this.customizationArgSpecs[i].name;
      if (caName === 'math_content') {
        this.currentRteIsMathExpressionEditor = true;
        let mathValueDict = {
          name: caName,
          value: <MathExpressionContent>(
            this.attrsCustomizationArgsDict.hasOwnProperty(caName) ?
              cloneDeep(this.attrsCustomizationArgsDict[caName]) :
              this.customizationArgSpecs[i].default_value)
        };
        // If the component being created or edited is math rich text component,
        // we need to pass this extra attribute svgFile to the math RTE editor.
        // The math RTE editor will auto-generate the svgFile based on the
        // rawLatex value and then this file can be saved to the backend when
        // the user clicks on the save button.
        mathValueDict.value.svgFile = null;
        mathValueDict.value.mathExpressionSvgIsBeingProcessed = false;
        this.tmpCustomizationArgs.push(mathValueDict);
      } else {
        this.tmpCustomizationArgs.push({
          name: caName,
          value: (
            this.attrsCustomizationArgsDict.hasOwnProperty(caName) ?
              cloneDeep(this.attrsCustomizationArgsDict[caName]) :
              this.customizationArgSpecs[i].default_value)
        });
      }
    }
  }

  cancel(): void {
    this.ngbActiveModal.dismiss('cancel');
  }

  disableSaveButtonForMathRte(): boolean {
    // This method disables the save button when the Math SVG has not yet
    // been generated but being processed.
    if (!this.currentRteIsMathExpressionEditor) {
      return false;
    } else {
      let value = <MathExpressionContent> this.tmpCustomizationArgs[0].value;
      return value.mathExpressionSvgIsBeingProcessed;
    }
  }

  save(): void {
    this.externalRteSaveService.onExternalRteSave.emit();

    let customizationArgsDict = {};
    // For the case of the math rich text components, we need to handle the
    // saving of the generated SVG file here because the process of saving
    // the SVG is asynchronous and the saving of SVG to the backend is to
    // be done only after the user clicks on the save button.
    // The saving of SVGs to the backend cannot be done in the math RTE editor
    // because the control is passed to this function as soon as the user
    // clicks on the save button.
    if (this.currentRteIsMathExpressionEditor) {
      // The tmpCustomizationArgs is guranteed to have only one element for
      // the case of math rich text component.
      let mathExpressionContentValue = (
        <MathExpressionContent> this.tmpCustomizationArgs[0].value);
      let svgFile = mathExpressionContentValue.svgFile;
      let svgFileName = mathExpressionContentValue.svg_filename;
      let rawLatex = mathExpressionContentValue.raw_latex;
      if (rawLatex === '' || svgFileName === '') {
        this.alertsService.addWarning(
          'The rawLatex or svgFileName for a Math expression should not ' +
          'be empty.');
        this.ngbActiveModal.dismiss('cancel');
        return;
      }
      let resampledFile = (
        this.imageUploadHelperService.convertImageDataToImageFile(svgFile));
      const HUNDRED_KB_IN_BYTES = 100 * 1024;
      if (resampledFile.size > HUNDRED_KB_IN_BYTES) {
        this.alertsService.addInfoMessage(
          'The SVG file generated exceeds 100' +
          ' KB. Please split the expression into smaller ones.' +
          '   Example: x^2 + y^2 + z^2 can be split as \'x^2 + y^2\' ' +
          'and \'+ z^2\'', 5000);
        this.ngbActiveModal.dismiss('cancel');
        return;
      }
      if (
        this.contextService.getImageSaveDestination() ===
        AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE) {
        this.imageLocalStorageService.saveImage(svgFileName, svgFile);
        let mathExpressionContentValue = (
          <MathExpressionContent> this.tmpCustomizationArgs[0].value);
        let mathContentDict = {
          raw_latex: mathExpressionContentValue.raw_latex,
          svg_filename: svgFileName
        };
        let caName = this.tmpCustomizationArgs[0].name;
        customizationArgsDict[caName] = mathContentDict;
        this.ngbActiveModal.close(customizationArgsDict);
        return;
      }

      this.assetsBackendApiService.saveMathExpresionImage(
        resampledFile, svgFileName, this.contextService.getEntityType(),
        this.contextService.getEntityId()).then(
        (response: SaveImageResponse) => {
          let mathExpressionContentValue = (
            <MathExpressionContent> this.tmpCustomizationArgs[0].value);
          let mathContentDict = {
            raw_latex: mathExpressionContentValue.raw_latex,
            svg_filename: response.filename
          };
          let caName = this.tmpCustomizationArgs[0].name;
          customizationArgsDict[caName] = mathContentDict;
          this.ngbActiveModal.close(customizationArgsDict);
        }, (error: string) => {
          this.alertsService.addWarning(
            error || 'Error communicating with server.');
          this.ngbActiveModal.dismiss('cancel');
        });
    } else {
      for (let i = 0; i < this.tmpCustomizationArgs.length; i++) {
        let caName = this.tmpCustomizationArgs[i].name;
        if (caName === 'video_id') {
          let temp = this.tmpCustomizationArgs[i].value;
          customizationArgsDict[caName] = (
            this._extractVideoIdFromVideoUrl(temp.toString()));
        } else {
          customizationArgsDict[caName] = (
            this.tmpCustomizationArgs[i].value);
        }
      }
      this.ngbActiveModal.close(customizationArgsDict);
    }
  }

  getSchema(schema: Object): Object {
    return schema;
  }
}
