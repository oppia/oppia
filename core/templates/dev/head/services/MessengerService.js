// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for sending messages to a parent iframe. All outbound
 * communication with a parent iframe should pass through here. (This
 * communication should be outbound only; reverse communication should NOT
 * be attempted due to cross-domain security issues.)
 */

oppia.factory('MessengerService', ['$log', '$window', function($log, $window) {
  var isPositiveInteger = function(n) {
    return (typeof n === 'number' && n % 1 === 0 && n > 0);
  };
  var isBoolean = function(b) {
    return typeof b === 'boolean';
  };

  var SUPPORTED_HASHDICT_VERSIONS = [
    '0.0.0', '0.0.1', '0.0.2', '0.0.3'
  ];

  var MESSAGE_VALIDATORS = {
    heightChange: function(payload) {
      return isPositiveInteger(payload.height) && isBoolean(payload.scroll);
    },
    explorationLoaded: function() {
      return true;
    },
    stateTransition: function(payload) {
      return Boolean(payload.oldStateName) || Boolean(payload.newStateName);
    },
    explorationReset: function(payload) {
      return Boolean(payload.stateName);
    },
    explorationCompleted: function() {
      return true;
    }
  };

  var getPayload = {
    heightChange: function(data) {
      return {
        height: data.height,
        scroll: data.scroll
      };
    },
    explorationLoaded: function(data) {
      return {
        explorationVersion: data.explorationVersion,
        explorationTitle: data.explorationTitle
      };
    },
    stateTransition: function(data) {
      return {
        explorationVersion: data.explorationVersion,
        oldStateName: data.oldStateName,
        jsonAnswer: data.jsonAnswer,
        newStateName: data.newStateName
      };
    },
    explorationCompleted: function(data) {
      return {
        explorationVersion: data.explorationVersion
      };
    },
    // DEPRECATED
    explorationReset: function(data) {
      return {
        stateName: data
      };
    }
  };

  var messenger = {
    HEIGHT_CHANGE: 'heightChange',
    EXPLORATION_LOADED: 'explorationLoaded',
    STATE_TRANSITION: 'stateTransition',
    EXPLORATION_RESET: 'explorationReset',
    EXPLORATION_COMPLETED: 'explorationCompleted',
    sendMessage: function(messageTitle, messageData) {
      // TODO(sll): For the stateTransition and explorationCompleted events,
      // we now send paramValues in the messageData. We should broadcast these
      // to the parent page as well.
      // TODO(sll): Delete/deprecate 'reset exploration' from the list of
      // events sent to a container page.

      // Only send a message to the parent if the oppia window is iframed and
      // a hash is passed in.
      var rawHash = $window.location.hash.substring(1);
      if ($window.parent !== $window && rawHash &&
          MESSAGE_VALIDATORS.hasOwnProperty(messageTitle)) {
        // Protractor tests may prepend a / to this hash, which we remove:
        var hash = (rawHash.charAt(0) === '/') ? rawHash.substring(1) : rawHash;
        var hashParts = hash.split('&');
        var hashDict = {};
        for (var i = 0; i < hashParts.length; i++) {
          if (hashParts[i].indexOf('=') === -1) {
            $log.error('Invalid hash for embedding: ' + hash);
            return;
          }

          var separatorLocation = hashParts[i].indexOf('=');
          hashDict[hashParts[i].substring(0, separatorLocation)] = (
            hashParts[i].substring(separatorLocation + 1));
        }

        if (!hashDict.version || !hashDict.secret) {
          $log.error('Invalid hash for embedding: ' + hash);
          return;
        }

        if (SUPPORTED_HASHDICT_VERSIONS.indexOf(hashDict.version) !== -1) {
          $log.info('Posting message to parent: ' + messageTitle);

          var payload = getPayload[messageTitle](messageData);
          if (!MESSAGE_VALIDATORS[messageTitle](payload)) {
            $log.error('Error validating payload: ' + payload);
            return;
          }

          $log.info(payload);

          var objToSendToParent = {
            title: messageTitle,
            payload: payload
          };
          if (hashDict.version === '0.0.0') {
            // Ensure backwards-compatibility.
            objToSendToParent.sourceTagId = hashDict.tagid;
            objToSendToParent.secret = hashDict.secret;
          }

          // The targetOrigin needs to be * because any page can iframe an
          // exploration.
          $window.parent.postMessage(JSON.stringify(objToSendToParent), '*');
        } else {
          $log.error('Unknown version for embedding: ' + hashDict.version);
          return;
        }
      }
    }
  };

  return messenger;
}]);
