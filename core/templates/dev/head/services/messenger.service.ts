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

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { LoggerService } from 'services/contextual/logger.service';
import { WindowRef } from 'services/contextual/window-ref.service';

@Injectable({
  providedIn: 'root'
})
export class MessengerService {
  constructor(private log: LoggerService, private windowRef: WindowRef) {}

  isPositiveInteger(n: any): boolean {
    return (typeof n === 'number' && n % 1 === 0 && n > 0);
  }

  isBoolean(b: any): boolean {
    return typeof b === 'boolean';
  }

  SUPPORTED_HASHDICT_VERSIONS = [
    '0.0.0', '0.0.1', '0.0.2', '0.0.3'
  ];

  MESSAGE_VALIDATORS = {
    // TODO(#7165): Replace any with exact type.
    heightChange: (payload: any): boolean => {
      return this.isPositiveInteger(payload.height) &&
          this.isBoolean(payload.scroll);
    },
    explorationLoaded: (): boolean => {
      return true;
    },
    // TODO(#7165): Replace any with exact type.
    stateTransition: (payload: any): boolean => {
      return Boolean(payload.oldStateName) || Boolean(payload.newStateName);
    },
    // TODO(#7165): Replace any with exact type.
    explorationReset: (payload: any): boolean => {
      return Boolean(payload.stateName);
    },
    explorationCompleted: function(): boolean {
      return true;
    }
  };

  getPayload = {
    // TODO(#7165): Replace any with exact type.
    heightChange: function(data: any) {
      return {
        height: data.height,
        scroll: data.scroll
      };
    },
    // TODO(#7165): Replace any with exact type.
    explorationLoaded: function(data: any) {
      return {
        explorationVersion: data.explorationVersion,
        explorationTitle: data.explorationTitle
      };
    },
    // TODO(#7165): Replace any with exact type.
    stateTransition: function(data: any) {
      return {
        explorationVersion: data.explorationVersion,
        oldStateName: data.oldStateName,
        jsonAnswer: data.jsonAnswer,
        newStateName: data.newStateName
      };
    },
    // TODO(#7165): Replace any with exact type.
    explorationCompleted: function(data: any) {
      return {
        explorationVersion: data.explorationVersion
      };
    },
    // DEPRECATED
    // TODO(#7165): Replace any with exact type.
    explorationReset: function(data: any) {
      return {
        stateName: data
      };
    }
  };

  messenger = {
    HEIGHT_CHANGE: 'heightChange',
    EXPLORATION_LOADED: 'explorationLoaded',
    STATE_TRANSITION: 'stateTransition',
    EXPLORATION_RESET: 'explorationReset',
    EXPLORATION_COMPLETED: 'explorationCompleted',
    sendMessage: (messageTitle, messageData) => {
      // TODO(sll): For the stateTransition and explorationCompleted events,
      // we now send paramValues in the messageData. We should broadcast these
      // to the parent page as well.
      // TODO(sll): Delete/deprecate 'reset exploration' from the list of
      // events sent to a container page.

      // Only send a message to the parent if the oppia window is iframed and
      // a hash is passed in.
      let rawHash = this.windowRef.nativeWindow.location.hash.substring(1);
      if (this.windowRef.nativeWindow.parent !== this.windowRef.nativeWindow &&
          rawHash && this.MESSAGE_VALIDATORS.hasOwnProperty(messageTitle)) {
        // Protractor tests may prepend a / to this hash, which we remove:
        let hash =
            (rawHash.charAt(0) === '/') ? rawHash.substring(1) : rawHash;
        let hashParts = hash.split('&');
        let hashDict = {
          version: null,
          secret: null,
          tagid: null
        };
        for (let i = 0; i < hashParts.length; i++) {
          if (hashParts[i].indexOf('=') === -1) {
            this.log.error('Invalid hash for embedding: ' + hash);
            return;
          }

          let separatorLocation = hashParts[i].indexOf('=');
          hashDict[hashParts[i].substring(0, separatorLocation)] = (
            hashParts[i].substring(separatorLocation + 1));
        }

        if (!hashDict.version || !hashDict.secret) {
          this.log.error('Invalid hash for embedding: ' + hash);
          return;
        }

        if (this.SUPPORTED_HASHDICT_VERSIONS.indexOf(hashDict.version) !== -1) {
          this.log.info('Posting message to parent: ' + messageTitle);

          let payload = this.getPayload[messageTitle](messageData);
          if (!this.MESSAGE_VALIDATORS[messageTitle](payload)) {
            this.log.error('Error validating payload: ' + payload);
            return;
          }

          this.log.info(payload);

          let objToSendToParent = {
            title: messageTitle,
            payload: payload,
            sourceTagId: null,
            secret: null
          };
          if (hashDict.version === '0.0.0') {
            // Ensure backwards-compatibility.
            objToSendToParent.sourceTagId = hashDict.tagid;
            objToSendToParent.secret = hashDict.secret;
          }

          // The targetOrigin needs to be * because any page can iframe an
          // exploration.
          this.windowRef.nativeWindow.parent.postMessage(
            JSON.stringify(objToSendToParent), '*');
        } else {
          this.log.error('Unknown version for embedding: ' + hashDict.version);
          return;
        }
      }
    }
  };
}

angular.module('oppia').factory(
  'MessengerService',
  downgradeInjectable(MessengerService));
