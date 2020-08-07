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
 * @fileoverview Oppia interaction from outer iframe with messaging commands.
 */

 //oppia-float-form-input, 

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import {WindowRef} from 'services/contextual/window-ref.service.ts';
import {WindowWrapperMessageService} from
  'pages/exploration-player-page/services/window-wrapper-message.service';
require('pages/exploration-player-page/services/exploration-engine.service.ts');
import {ServicesConstants} from 'services/services.constants';

@Injectable({providedIn: 'root'})
export class CommandExecutorService {
  private commandToFunctionMap = {
    CONTINUE: this.continueClick,
    ENTER_TEXT_NUMBER_UNITS: this.fillTextBox,
    ADD_SET: this.addToSet,
    REMOVE_SET: this.removeFromSet,
    ENTER_FRACTION: this.enterFraction,
    SELECT_ITEM_BULLET: this.selectItemBullet,
    SELECT_ITEM_CHECKBOX: this.selectItemCheckbox,
    SUBMIT: this.submit,
  };
  setElementsOnPage = 0;
  hostname = '';
  cachedOuterFrameMessage = '';
  windowWrapperMessageService = null;
  constructor(private windowRef: WindowRef) {
    this.setElementsOnPage = 0;
    this.hostname = '';
    this.cachedOuterFrameMessage = '';
    this.windowWrapperMessageService =
      new WindowWrapperMessageService(windowRef);
  }

  sendParentReadyState(windowRef) {
    this.windowWrapperMessageService.postMessageToParent(
      'Ready to receive hostname', '*');
  }

  getOuterFrameEvents(windowRef) {
    this.windowWrapperMessageService.addEventListener(
      'message', (event) => {
        var messageArray = event.data.split(' ');
        var command = messageArray[0];
        var message = '';
        for (var i = 1; i < messageArray.length; i++) {
          message = message + messageArray[i] + ' ';
        }
        message = message.substr(0, message.length - 1);
        if ((command !== 'HOSTNAME' && this.hostname === '')) {
          return;
        } else if (command === 'CONTINUE' || command === 'SUBMIT') {
          this.commandToFunctionMap[command](windowRef);
        } else if (command === 'HOSTNAME') {
          if (ServicesConstants.WHITELISTED_IFRAME_HOSTS.indexOf(message) >=
          0) {
            this.hostname = message;
          }
          if (this.cachedOuterFrameMessage !== '' &&
          this.cachedOuterFrameMessage !== undefined) {
            this.windowWrapperMessageService.postMessageToParent(
              this.cachedOuterFrameMessage, this.hostname);
          }
        } else {
          this.commandToFunctionMap[command](windowRef, message);
        }
      });
  }

  sendStateToOuterFrame(id) {
    var stateToCommand = {
      Continue: 'CONTINUE',
      FractionInput: 'ENTER_FRACTION',
      ItemSelectionInput: 'SELECT_ITEM_CHECKBOX',
      MultipleChoiceInput: 'SELECT_ITEM_BULLET',
      NumberWithUnits: 'ENTER_TEXT_NUMBER_UNITS',
      NumericExpressionInput: 'ENTER_TEXT_NUMBER_UNITS',
      SetInput: 'SET_OPERATION',
      TextInput: 'ENTER_TEXT_NUMBER_UNITS',
    };
    this.setElementsOnPage = 0;
    if (!(id in stateToCommand)) {
      return;
    }
    if (this.hostname === '') {
      this.cachedOuterFrameMessage = stateToCommand[id];
    } else {
      this.windowWrapperMessageService.postMessageToParent(stateToCommand[id],
        this.hostname);
    }
  }

  continueClick(windowRef) {
    try {
      var button = windowRef.nativeWindow.document.getElementsByClassName(
        'oppia-learner-confirm-button'
      )[0] as HTMLElement;
      button.click();
    } catch {
      var button = windowRef.nativeWindow.document.getElementsByClassName(
        'protractor-test-next-card-button')[0] as HTMLElement;
      button.click();
    }
    this.setElementsOnPage = 0;
  }

  fillTextBox(windowRef, text) {
    var box = windowRef.nativeWindow.document.getElementsByClassName(
      'form-control')[0];
    box.value = text;
    var evt = document.createEvent('HTMLEvents');
    evt.initEvent('change', false, true);
    box.dispatchEvent(evt);
    var button = windowRef.nativeWindow.document.getElementsByClassName(
      'oppia-learner-confirm-button')[0] as HTMLElement;
    button.click();
  }

  addToSet(windowRef, message) {
    var elements = message.split(' ');
    if (!this.setElementsOnPage) {
      this.setElementsOnPage = 0;
    }
    for (var i = 0; i < elements.length; i++) {
      if (this.setElementsOnPage === 0) {
        var box = windowRef.nativeWindow.document.querySelectorAll(
          '.form-control')[0] as HTMLInputElement;
        box.value = elements[i];
        this.setElementsOnPage += 1;
      } else {
        var addButton = windowRef.nativeWindow.document.querySelectorAll(
          '.oppia-add-list-entry'
        )[0] as HTMLElement;
        addButton.click();
        this.setElementsOnPage += 1;
        var box = windowRef.nativeWindow.document.querySelectorAll(
          '.form-control')[this.setElementsOnPage - 1] as HTMLInputElement;
        box.value = elements[i];
      }
      var evt = document.createEvent('HTMLEvents');
      evt.initEvent('change', false, true);
      box.dispatchEvent(evt);
    }
  }

  removeFromSet(windowRef, element) {
    var boxes = windowRef.nativeWindow.document.querySelectorAll(
      '.form-control');
    for (var i = 0; i < boxes.length; i++) {
      if (boxes[i].value === element) {
        var deleteButton =
        windowRef.nativeWindow.document.querySelectorAll(
          '.oppia-delete-list-entry-button')[i];
        deleteButton.click();
      }
    }
    this.setElementsOnPage -= 1;
  }

  submit(windowRef) {
    var button = windowRef.nativeWindow.document.getElementsByClassName(
      'oppia-learner-confirm-button')[0] as HTMLElement;
    button.click();
    this.setElementsOnPage = 0;
  }

  enterFraction(windowRef, fraction) {
    var fractionElementName =
    'form-control ng-valid-f-r-a-c-t-i-o-n_-f-o-r-m-a-t_-e-r-r-o-r';
    var fractionBox = windowRef.nativeWindow.document.getElementsByClassName(
      fractionElementName)[0];
    fractionBox.value = fraction;
    var button = windowRef.nativeWindow.document.getElementsByClassName(
      'oppia-learner-confirm-button')[0] as HTMLElement;
    button.click();
    var evt = document.createEvent('HTMLEvents');
    evt.initEvent('change', false, true);
    fractionBox.dispatchEvent(evt);
  }

  selectItemBullet(windowRef, message) {
    message = Number(message);
    var button = windowRef.nativeWindow.document.getElementsByClassName(
      'multiple-choice-outer-radio-button')[message - 1] as HTMLElement;
    button.click();
  }

  selectItemCheckbox(windowRef, message) {
    message = Number(message);
    var button = windowRef.nativeWindow.document.getElementsByClassName(
      'item-selection-input-checkbox')[message - 1] as HTMLElement;
    button.click();
  }
}

angular.module('oppia').factory(
  'CommandExecutorService',
  downgradeInjectable(CommandExecutorService));
