// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the parameter changes editor (which is shown in
 * both the exploration settings tab and the state editor page).
 */

import { Component, Injector, Input, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { Subscription } from 'rxjs';
import { ExplorationParamSpecsService } from '../services/exploration-param-specs.service';
import { ParamChange, ParamChangeObjectFactory } from 'domain/exploration/ParamChangeObjectFactory';
import { EditabilityService } from 'services/editability.service';
import { AlertsService } from 'services/alerts.service';
import { ExplorationStatesService } from '../services/exploration-states.service';
import { ExternalSaveService } from 'services/external-save.service';
import { AppConstants } from 'app.constants';
import { StateParamChangesService } from 'components/state-editor/state-editor-properties-services/state-param-changes.service';
import { ExplorationParamChangesService } from '../services/exploration-param-changes.service';
import cloneDeep from 'lodash/cloneDeep';
import { ParamSpecs } from 'domain/exploration/ParamSpecsObjectFactory';
import { CdkDragSortEvent, moveItemInArray} from '@angular/cdk/drag-drop';

@Component({
  selector: 'param-changes-editor',
  templateUrl: './param-changes-editor.component.html'
})
export class ParamChangesEditorComponent implements OnInit, OnDestroy {
  @Input() paramChangesServiceName: string;
  @Input() postSaveHook: () => void;
  @Input() currentlyInSettingsTab: boolean;

  SERVICE_MAPPING = {
    explorationParamChangesService: ExplorationParamChangesService,
    stateParamChangesService: StateParamChangesService,
  };

  directiveSubscriptions = new Subscription();
  isParamChangesEditorOpen: boolean;
  paramNameChoices: { id: string; text: string }[];
  warningText: string;
  HUMAN_READABLE_ARGS_RENDERERS: {
    Copier: (value) => void;
    RandomSelector: (value) => void;
  };

  PREAMBLE_TEXT = {
    Copier: 'to',
    RandomSelector: 'to one of'
  };

  paramChangesService: (
     ExplorationParamChangesService | StateParamChangesService);

  constructor(
     private alertsService: AlertsService,
     private externalSaveService: ExternalSaveService,
     private explorationStatesService: ExplorationStatesService,
     private explorationParamSpecsService: ExplorationParamSpecsService,
     private paramChangeObjectFactory: ParamChangeObjectFactory,
     public editabilityService: EditabilityService,
     private urlInterpolationService: UrlInterpolationService,
     private injector: Injector,
  ) {}

  drop(event: CdkDragSortEvent<ParamChange[]>): void {
    moveItemInArray(
       this.paramChangesService.displayed as ParamChange[], event.previousIndex,
       event.currentIndex);
  }

  openParamChangesEditor(): void {
    if (!this.editabilityService.isEditable()) {
      return;
    }

    this.isParamChangesEditorOpen = true;
    this.paramNameChoices = this.generateParamNameChoices();

    if ((this.paramChangesService.displayed as ParamChange[]).length === 0) {
      this.addParamChange();
    }
  }

  addParamChange(): void {
    let newParamName = (
       this.paramNameChoices.length > 0 ?
         this.paramNameChoices[0].id : 'x');
    let newParamChange = this.paramChangeObjectFactory.createDefault(
      newParamName);
    // Add the new param name to this.paramNameChoices, if necessary,
    // so that it shows up in the dropdown.
    if ((
       this.explorationParamSpecsService.displayed as ParamSpecs).addParamIfNew(
      newParamChange.name, null)) {
      this.paramNameChoices = this.generateParamNameChoices();
    }
    (this.paramChangesService.displayed as ParamChange[]).push(newParamChange);
  }

  generateParamNameChoices(): {id: string; text: string}[] {
    return (
      this.explorationParamSpecsService.displayed as ParamSpecs
    ).getParamNames().sort()
      .map((paramName) => {
        return {
          id: paramName,
          text: paramName
        };
      });
  }

  onChangeGeneratorType(paramChange: ParamChange): void {
    paramChange.resetCustomizationArgs();
  }

  areDisplayedParamChangesValid(): boolean {
    let paramChanges = this.paramChangesService.displayed;

    if (paramChanges && (paramChanges as ParamChange[]).length) {
      for (let i = 0; i < (paramChanges as ParamChange[]).length; i++) {
        let paramName = paramChanges[i].name;
        if (paramName === '') {
          this.warningText = 'Please pick a non-empty parameter name.';
          return false;
        }

        if (AppConstants.INVALID_PARAMETER_NAMES.indexOf(paramName) !== -1) {
          this.warningText = (
            'The parameter name \'' + paramName + '\' is reserved.');
          return false;
        }

        let ALPHA_CHARS_REGEX = /^[A-Za-z]+$/;
        if (!ALPHA_CHARS_REGEX.test(paramName)) {
          this.warningText = (
            'Parameter names should use only alphabetic characters.');
          return false;
        }

        let generatorId = paramChanges[i].generatorId;
        let customizationArgs = paramChanges[i].customizationArgs;

        if (!this.PREAMBLE_TEXT.hasOwnProperty(generatorId)) {
          this.warningText =
             'Each parameter should have a generator id.';
          return false;
        }

        if (generatorId === 'RandomSelector' &&
             customizationArgs.list_of_values.length === 0) {
          this.warningText = (
            'Each parameter should have at least one possible value.');
          return false;
        }
      }
    }

    this.warningText = '';
    return true;
  }

  saveParamChanges(): void {
    // Validate displayed value.
    if (!this.areDisplayedParamChangesValid()) {
      this.alertsService.addWarning('Invalid parameter changes.');
      return;
    }

    this.isParamChangesEditorOpen = false;

    // Update paramSpecs manually with newly-added param names.
    this.explorationParamSpecsService.restoreFromMemento();
    (this.paramChangesService.displayed as ParamChange[]).forEach((
        paramChange) => {
      (this.explorationParamSpecsService.displayed as ParamSpecs).addParamIfNew(
        paramChange.name, null);
    });

    this.explorationParamSpecsService.saveDisplayedValue();

    this.paramChangesService.saveDisplayedValue();
    if (!this.currentlyInSettingsTab) {
      this.explorationStatesService.saveStateParamChanges(
        (this.paramChangesService as StateParamChangesService).stateName,
        cloneDeep(this.paramChangesService.displayed as ParamChange[]));
    }
    if (this.postSaveHook) {
      this.postSaveHook();
    }
  }

  deleteParamChange(index: number): void {
    if (index < 0 ||
         index >= (this.paramChangesService.displayed as []).length) {
      this.alertsService.addWarning(
        'Cannot delete parameter change at position ' + index +
         ': index out of range');
    }

    // This ensures that any new parameter names that have been added
    // before the deletion are added to the list of possible names in
    // the select2 dropdowns. Otherwise, after the deletion, the
    // dropdowns may turn blank.
    (this.paramChangesService.displayed as ParamChange[]).forEach(
      (paramChange) => {
        (
          this.explorationParamSpecsService.displayed as ParamSpecs
        ).addParamIfNew(paramChange.name, null);
      });
    this.paramNameChoices = this.generateParamNameChoices();

    (this.paramChangesService.displayed as []).splice(index, 1);
  }

  cancelEdit(): void {
    this.paramChangesService.restoreFromMemento();
    this.isParamChangesEditorOpen = false;
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  ngOnInit(): void {
    this.paramChangesService = (
      this.injector.get(this.SERVICE_MAPPING[this.paramChangesServiceName]));

    this.isParamChangesEditorOpen = false;
    this.warningText = '';
    this.directiveSubscriptions.add(
      this.externalSaveService.onExternalSave.subscribe(
        () => {
          if (this.isParamChangesEditorOpen) {
            this.saveParamChanges();
          }
        }));

    // This is a local letiable that is used by the select2 dropdowns
    // for choosing parameter names. It may not accurately reflect the
    // content of ExplorationParamSpecsService, since it's possible that
    // temporary parameter names may be added and then deleted within
    // the course of a single "parameter changes" edit.
    this.paramNameChoices = [];
    this.HUMAN_READABLE_ARGS_RENDERERS = {
      Copier: (customizationArgs) => {
        return 'to ' + customizationArgs.value;
      },
      RandomSelector: (customizationArgs) => {
        let result = 'to one of [';
        for (
          let i = 0; i < customizationArgs.list_of_values.length; i++) {
          if (i !== 0) {
            result += ', ';
          }
          result += String(customizationArgs.list_of_values[i]);
        }
        result += '] at random';
        return result;
      }
    };
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('paramChangesEditor',
   downgradeComponent({
     component: ParamChangesEditorComponent
   }) as angular.IDirectiveFactory);
