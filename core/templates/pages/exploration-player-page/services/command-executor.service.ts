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
require(
  'pages/exploration-player-page/services/current-interaction.service.ts');
angular.module('oppia').factory('CommandExecutorService', [
  'WindowWrapperMessageService',
  function(WindowWrapperMessageService) {
    var hostname = '';
    var cachedOuterFrameMessage = '';
    var initialized = false;
    var currentInteraction = '';
    var sendParentReadyState = function() {
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
          } else if (command === 'CONTINUE') {
            commandToFunctionMap[command](currentInteraction);
          } else if (command === 'HOSTNAME') {
            hostname = message;
            if (cachedOuterFrameMessage !== '' &&
            cachedOuterFrameMessage !== undefined) {
              WindowWrapperMessageService.postMessageToParent(
                cachedOuterFrameMessage, hostname);
            }
          }
        });
      initialized = true;
    };

    var sendInteractionToOuterFrame = function(id) {
      if (!initialized) {
        return;
      }
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
      if (!(id in stateToCommand)) {
        return;
      }
      if (hostname === '') {
        cachedOuterFrameMessage = stateToCommand[id];
        currentInteraction = stateToCommand[id];
      } else {
        currentInteraction = stateToCommand[id];
        WindowWrapperMessageService.postMessageToParent(stateToCommand[id],
          hostname);
      }
    };

    var registerCallback = function(command, fn) {
      commandToFunctionMap[command] = fn;
    };

    var commandToFunctionMap = {
      CONTINUE: null,
      ENTER_TEXT_NUMBER_UNITS: null,
      ADD_SET: null,
      REMOVE_SET: null,
      ENTER_FRACTION: null,
      SELECT_ITEM_BULLET: null,
      SELECT_ITEM_CHECKBOX: null,
      SUBMIT: null,
    };

    return {
      sendParentReadyState: function() {
        sendParentReadyState();
      },
      initialize: function() {
        initialize();
      },
      sendInteractionToOuterFrame: function(id) {
        sendInteractionToOuterFrame(id);
      },
      getHostname: function() {
        return hostname;
      },
      // Will get any messages that have been cached.
      // Exists as hostname may not be known at time of message creation.
      getCachedOuterFrameMessage: function() {
        return cachedOuterFrameMessage;
      },
      // Will register a function that will handle the commands outlined
      // In the StateToCommand hashmap.
      registerCallback: function(command, fn) {
        return registerCallback(command, fn);
      }
    };
  }]);
