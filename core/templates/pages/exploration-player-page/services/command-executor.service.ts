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
 * @fileoverview Oppia interaction from outer iframe with messaging commands.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable, HostListener } from '@angular/core';

import {WindowRef} from 'services/contextual/window-ref.service.ts';
require('pages/exploration-player-page/services/exploration-engine.service.ts');

@Injectable({providedIn: 'root'})
export class CommandExecutorService {
  private commandToFunctionMap = {
    CONTINUE: this.continueClick,
    ENTER_TEXT_NUMBER_UNITS: this.fillTextBox,
    ADD_SET: this.addSet,
    REMOVE_SET: this.removeSet,
    ENTER_FRACTION: this.enterFraction,
    SELECT_ITEM_BULLET: this.selectItemBullet,
    SUBMIT: this.submit,
    HOST_NAME: this.setHostname
  };
  setElementsOnPage = 0;
  hostname = '';
  cachedOuterFrameMessage = '';
  constructor(private windowRef: WindowRef) {
    this.getOuterFrameEvents(windowRef);
  }

  getOuterFrameEvents(windowRef) {
    windowRef.nativeWindow.addEventListener('message', (event) => {
      var messageArray = event.data.split(' ');
      var command = messageArray[0];

      var message = '';
      for (var i = 1; i < messageArray.length; i++) {
        message = message + messageArray[i] + ' ';
      }
      message = message.substr(0, message.length - 1);
      if (command === 'CONTINUE' || command === 'SUBMIT') {
        this.commandToFunctionMap[command](windowRef);
      } else {
        this.commandToFunctionMap[command](windowRef, message);
      }
    });
  }

  sendStateToOuterFrame(id) {
    var stateToCommand = {
      Continue: 'CONTINUE',
      FractionInput: 'ENTER_FRACTION',
      ItemSelectionInput: 'SELECT_ITEM_CHECKPOINT',
      MultipleChoiceInput: 'SELECT_ITEM_BULLET',
      NumberWithUnits: 'ENTER_TEXT_NUMBER_UNITS',
      NumericExpressionInput: 'ENTER_TEXT_NUMBER_UNITS',
      SetInput: 'SET_OPERATION',
      TextInput: 'ENTER_TEXT_NUMBER_UNITS',
      'default': ''
    };
    this.setElementsOnPage = 0;
    if (stateToCommand[id] === '') {
      return;
    }
    if (this.hostname === '') {
      this.cachedOuterFrameMessage = stateToCommand[id];
    } else {
      this.windowRef.nativeWindow.parent.postMessage(stateToCommand[id],
        this.hostname);
    }
  }

  setHostname(windowRef, hostname) {
    this.hostname = hostname;
    if (this.cachedOuterFrameMessage !== '') {
      windowRef.nativeWindow.parent.postMessage(this.cachedOuterFrameMessage,
        this.hostname);
    }
  }

  continueClick(windowRef) {
    try {
      var button = windowRef.nativeWindow.document.getElementsByClassName(
        'oppia-learner-confirm-button protractor-test-continue-button \
        md-button md-ink-ripple')[0] as HTMLElement;
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
      'form-control ng-pristine ng-untouched ng-valid ng-empty')[0];
    box.value = text;
    var evt = document.createEvent('HTMLEvents');
    evt.initEvent('change', false, true);
    box.dispatchEvent(evt);
    var button = windowRef.nativeWindow.document.getElementsByClassName(
      'oppia-learner-confirm-button protractor-test-submit-answer-button \
      md-button md-ink-ripple')[0] as HTMLElement;
    button.click();
  }

  addSet(windowRef, elements) {
    for (var i = 0; i < elements.length; i++) {
      var box;
      if (this.setElementsOnPage === 0) {
        var box = windowRef.nativeWindow.document.getElementsByClassName(
          'form-control ng-pristine ng-untouched ng-valid ng-empty')[0];
        box.value = elements[i];
        this.setElementsOnPage += 1;
      } else {
        var addButton = windowRef.nativeWindow.document.getElementsByClassName(
          'btn btn-secondary btn-sm protractor-\
          test-add-list-entry')[this.setElementsOnPage - 1] as HTMLElement;
        addButton.click();
        this.setElementsOnPage += 1;
        var box = windowRef.nativeWindow.document.getElementsByClassName(
          'form-control ng-pristine ng-untouched ng-valid ng-empty')[0];
        box.value = elements[i];
      }
      var evt = document.createEvent('HTMLEvents');
      evt.initEvent('change', false, true);
      box.dispatchEvent(evt);
    }
  }

  removeSet(windowRef, element) {
    var boxes = windowRef.nativeWindow.document.getElementsByClassName(
      'form-control ng-pristine ng-untouched ng-valid ng-empty');
    for (var i = 0; i < boxes.length; i++) {
      if (boxes[i].value === element) {
        var deleteButton = 
        windowRef.nativeWindow.document.getElementsByClassName(
          'material-icons md-18');
        deleteButton[i].click();
      }
    }
    this.setElementsOnPage -= 1;
  }

  enterFraction(windowRef, fraction) {
    var fractionBox = windowRef.nativeWindow.document.getElementsByClassName(
      'form-control ng-pristine ng-untouched ng-valid \
      ng-valid-f-r-a-c-t-i-o-n_-f-o-r-m-a-t_-e-r-r-o-r ng-empty')[0];
    fractionBox.value = fraction;
  }

  submit(windowRef) {
    var button = windowRef.nativeWindow.document.getElementsByClassName(
      'oppia-learner-confirm-button protractor-test-submit-answer-button \
      md-button md-ink-ripple')[0] as HTMLElement;
    button.click();
    this.setElementsOnPage = 0;
  }

  selectItemBullet(windowRef, message) {
    message = Number(message);
    var button = windowRef.nativeWindow.document.getElementsByClassName(
      'multiple-choice-outer-radio-button')[message - 1] as HTMLElement;
    button.click();
  }
}

angular.module('oppia').factory(
  'CommandExecutorService',
  downgradeInjectable(CommandExecutorService));
