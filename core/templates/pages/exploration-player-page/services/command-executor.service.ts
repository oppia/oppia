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
 * @fileoverview A service that maintains a record of the state of the player,
 *  like engine service.
 */


require('services/contextual/window-ref.service.ts');
require(
  'pages/exploration-player-page/services/window-wrapper-message.service');
require('./window-wrapper-message.service');
angular.module('oppia').factory('CommandExecutorService', [
  'WindowRef', 'WindowWrapperMessageService',
  function(WindowRef, WindowWrapperMessageService) {
    var setElementsOnPage = 0;
    var hostname = '';
    var cachedOuterFrameMessage = '';
    var sendParentReadyState = function(windowRef) {
      WindowWrapperMessageService.postMessageToParent(
        'Ready to receive hostname', '*');
    };
    var initialize = function() {
      WindowWrapperMessageService.addEventListener(
        'message', (event) => {
          var messageArray = event.data.split(' ');
          var command = messageArray[0];
          var message = '';
          for (var i = 1; i < messageArray.length; i++) {
            message = message + messageArray[i] + ' ';
          }
          message = message.substr(0, message.length - 1);
          if ((command !== 'HOSTNAME' && hostname === '')) {
            return;
          } else if (command === 'CONTINUE' || command === 'SUBMIT') {
            commandToFunctionMap[command](WindowRef);
          } else if (command === 'HOSTNAME') {
            hostname = message;
            if (cachedOuterFrameMessage !== '' &&
            cachedOuterFrameMessage !== undefined) {
              WindowWrapperMessageService.postMessageToParent(
                cachedOuterFrameMessage, hostname);
            }
          } else {
            commandToFunctionMap[command](WindowRef, message);
          }
        });
    };

    var sendStateToOuterFrame = function(id) {
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
      setElementsOnPage = 0;
      if (!(id in stateToCommand)) {
        return;
      }
      if (hostname === '') {
        cachedOuterFrameMessage = stateToCommand[id];
      } else {
        WindowWrapperMessageService.postMessageToParent(stateToCommand[id],
          hostname);
      }
    };
    var continueClick = function(windowRef) {
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
      setElementsOnPage = 0;
    };

    var fillTextBox = function(windowRef, text) {
      var box = windowRef.nativeWindow.document.getElementsByClassName(
        'form-control')[0];
      box.value = text;
      var evt = document.createEvent('HTMLEvents');
      evt.initEvent('change', false, true);
      box.dispatchEvent(evt);
      var button = windowRef.nativeWindow.document.getElementsByClassName(
        'oppia-learner-confirm-button')[0] as HTMLElement;
      button.click();
    };

    var addToSet = function(windowRef, message) {
      var elements = message.split(' ');
      if (!setElementsOnPage) {
        setElementsOnPage = 0;
      }
      for (var i = 0; i < elements.length; i++) {
        if (setElementsOnPage === 0) {
          var box = windowRef.nativeWindow.document.querySelectorAll(
            '.form-control')[0] as HTMLInputElement;
          box.value = elements[i];
          setElementsOnPage += 1;
        } else {
          var addButton = windowRef.nativeWindow.document.querySelectorAll(
            '.oppia-add-list-entry'
          )[0] as HTMLElement;
          addButton.click();
          setElementsOnPage += 1;
          var box = windowRef.nativeWindow.document.querySelectorAll(
            '.form-control')[setElementsOnPage - 1] as HTMLInputElement;
          box.value = elements[i];
        }
        var evt = document.createEvent('HTMLEvents');
        evt.initEvent('change', false, true);
        box.dispatchEvent(evt);
      }
    };

    var removeFromSet = function(windowRef, element) {
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
      setElementsOnPage -= 1;
    };

    var submit = function(windowRef) {
      var button = windowRef.nativeWindow.document.getElementsByClassName(
        'oppia-learner-confirm-button')[0] as HTMLElement;
      button.click();
      setElementsOnPage = 0;
    };

    var enterFraction = function(windowRef, fraction) {
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
    };

    var selectItemBullet = function(windowRef, message) {
      message = Number(message);
      var button = windowRef.nativeWindow.document.getElementsByClassName(
        'multiple-choice-outer-radio-button')[message - 1] as HTMLElement;
      button.click();
    };

    var selectItemCheckbox = function(windowRef, message) {
      message = Number(message);
      var button = windowRef.nativeWindow.document.getElementsByClassName(
        'item-selection-input-checkbox')[message - 1] as HTMLElement;
      button.click();
    };

    var commandToFunctionMap = {
      CONTINUE: continueClick,
      ENTER_TEXT_NUMBER_UNITS: fillTextBox,
      ADD_SET: addToSet,
      REMOVE_SET: removeFromSet,
      ENTER_FRACTION: enterFraction,
      SELECT_ITEM_BULLET: selectItemBullet,
      SELECT_ITEM_CHECKBOX: selectItemCheckbox,
      SUBMIT: submit,
    };

    return {
      sendParentReadyState: function(windowRef) {
        sendParentReadyState(windowRef);
      },
      initialize: function() {
        initialize();
      },
      sendStateToOuterFrame: function(id) {
        sendStateToOuterFrame(id);
      },
      getHostname: function() {
        return hostname;
      },
      getCachedOuterFrameMessage: function() {
        return cachedOuterFrameMessage;
      }
    };
  }]);
