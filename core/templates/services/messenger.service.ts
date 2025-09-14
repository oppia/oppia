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

import {Injectable} from '@angular/core';

import {LoggerService} from 'services/contextual/logger.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {ServicesConstants} from 'services/services.constants';

interface HeightChangeData {
  height: number;
  scroll: number;
}

interface ExplorationLoadedData {
  explorationVersion: number;
  explorationTitle: string;
}

interface StateTransitionData {
  explorationVersion: number;
  oldStateName: string;
  jsonAnswer: string;
  newStateName: string;
}

interface ExplorationCompletedData {
  explorationVersion: number;
}

interface ExplorationResetData {
  stateName: string;
}

interface MessageValidatorsType {
  heightChange: (payload: HeightChangeData) => boolean;
  explorationLoaded: () => boolean;
  stateTransition: (payload: StateTransitionData) => boolean;
  explorationReset: (payload: ExplorationResetData) => boolean;
  explorationCompleted: () => boolean;
}

interface GetPayloadType {
  heightChange: (data: HeightChangeData) => HeightChangeData;
  explorationLoaded: (data: ExplorationLoadedData) => ExplorationLoadedData;
  stateTransition: (data: StateTransitionData) => StateTransitionData;
  explorationCompleted: (
    data: ExplorationCompletedData
  ) => ExplorationCompletedData;
  explorationReset: (data: string) => ExplorationResetData;
}

type MessageTitles =
  (typeof ServicesConstants.MESSENGER_PAYLOAD)[keyof typeof ServicesConstants.MESSENGER_PAYLOAD];

type PayloadType =
  | HeightChangeData
  | ExplorationCompletedData
  | StateTransitionData
  | ExplorationResetData;

// The 'secret' and 'tagId' sent to the parent will be 'null' if the supported
// hash version is not '0.0.0'. They are used to ensure backwards-compatibility.
interface HashDict {
  version: string;
  secret: string | null;
  tagid: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class MessengerService {
  constructor(
    private loggerService: LoggerService,
    private windowRef: WindowRef
  ) {}

  SUPPORTED_HASHDICT_VERSIONS: Set<string> = new Set([
    '0.0.0',
    '0.0.1',
    '0.0.2',
    '0.0.3',
  ]);

  MESSAGE_VALIDATORS: MessageValidatorsType = {
    heightChange(payload: HeightChangeData): boolean {
      const {height, scroll} = payload;
      return (
        Number.isInteger(height) && height > 0 && typeof scroll === 'boolean'
      );
    },
    explorationLoaded(): boolean {
      return true;
    },
    stateTransition(payload: StateTransitionData): boolean {
      return Boolean(payload.oldStateName) || Boolean(payload.newStateName);
    },
    explorationReset(payload: ExplorationResetData): boolean {
      return Boolean(payload.stateName);
    },
    explorationCompleted(): boolean {
      return true;
    },
  };

  getPayload: GetPayloadType = {
    heightChange(data: HeightChangeData): HeightChangeData {
      return {
        height: data.height,
        scroll: data.scroll,
      };
    },
    explorationLoaded(data: ExplorationLoadedData): ExplorationLoadedData {
      return {
        explorationVersion: data.explorationVersion,
        explorationTitle: data.explorationTitle,
      };
    },
    stateTransition(data: StateTransitionData): StateTransitionData {
      return {
        explorationVersion: data.explorationVersion,
        oldStateName: data.oldStateName,
        jsonAnswer: data.jsonAnswer,
        newStateName: data.newStateName,
      };
    },
    explorationCompleted(
      data: ExplorationCompletedData
    ): ExplorationCompletedData {
      return {
        explorationVersion: data.explorationVersion,
      };
    },
    // ---- DEPRECATED ----
    explorationReset(data: string): ExplorationResetData {
      return {
        stateName: data,
      };
    },
  };

  /**
   * Sends a message to the parent iframe.
   * @param messageTitle - The title of the message.
   * @param messageData - The data of the message. It is of type
   *   Object since it can have different properties based on the messageTitle.
   */
  sendMessage(messageTitle: MessageTitles, messageData: Object): void {
    // TODO(sll): For the stateTransition and explorationCompleted events,
    // we now send paramValues in the messageData. We should broadcast these
    // to the parent page as well.
    // TODO(sll): Delete/deprecate 'reset exploration' from the list of
    // events sent to a container page.

    // Only send a message to the parent if the oppia window is iframed and
    // a hash is passed in.
    let window = this.windowRef.nativeWindow;
    let rawHash = window.location.hash.substring(1);
    if (
      window.parent !== window &&
      rawHash &&
      this.MESSAGE_VALIDATORS.hasOwnProperty(messageTitle)
    ) {
      // Protractor tests may prepend a / to this hash, which we remove.
      let hash = rawHash.charAt(0) === '/' ? rawHash.substring(1) : rawHash;
      let hashParts = hash.split('&');
      let hashDict: HashDict = {
        version: '',
        secret: null,
        tagid: null,
      };
      for (let i = 0; i < hashParts.length; i++) {
        if (hashParts[i].indexOf('=') === -1) {
          this.loggerService.error('Invalid hash for embedding: ' + hash);
          return;
        }

        let separatorLocation = hashParts[i].indexOf('=');
        const _hashProp = hashParts[i].substring(
          0,
          separatorLocation
        ) as keyof HashDict;
        hashDict[_hashProp] = hashParts[i].substring(separatorLocation + 1);
      }

      if (!hashDict.version || !hashDict.secret) {
        this.loggerService.error('Invalid hash for embedding: ' + hash);
        return;
      }

      if (this.SUPPORTED_HASHDICT_VERSIONS.has(hashDict.version)) {
        this.loggerService.info('Posting message to parent: ' + messageTitle);
        let payload: PayloadType;
        let isValidMessage: boolean;
        switch (messageTitle) {
          case ServicesConstants.MESSENGER_PAYLOAD.EXPLORATION_COMPLETED:
            payload = this.getPayload.explorationCompleted(
              messageData as ExplorationCompletedData
            );
            isValidMessage = this.MESSAGE_VALIDATORS.explorationCompleted();
            break;
          case ServicesConstants.MESSENGER_PAYLOAD.EXPLORATION_LOADED:
            payload = this.getPayload.explorationLoaded(
              messageData as ExplorationLoadedData
            );
            isValidMessage = this.MESSAGE_VALIDATORS.explorationLoaded();
            break;
          case ServicesConstants.MESSENGER_PAYLOAD.EXPLORATION_RESET:
            payload = this.getPayload.explorationReset(messageData as string);
            isValidMessage = this.MESSAGE_VALIDATORS.explorationReset(payload);
            break;
          case ServicesConstants.MESSENGER_PAYLOAD.HEIGHT_CHANGE:
            payload = this.getPayload.heightChange(
              messageData as HeightChangeData
            );
            isValidMessage = this.MESSAGE_VALIDATORS.heightChange(payload);
            break;
          case ServicesConstants.MESSENGER_PAYLOAD.STATE_TRANSITION:
            payload = this.getPayload.stateTransition(
              messageData as StateTransitionData
            );
            isValidMessage = this.MESSAGE_VALIDATORS.stateTransition(
              payload as StateTransitionData
            );
            break;
        }

        if (!isValidMessage) {
          this.loggerService.error('Error validating payload: ' + payload);
          return;
        }

        this.loggerService.info(payload.toString());

        let objToSendToParent: {
          title: string;
          payload: PayloadType;
          sourceTagId: string | null;
          secret: string | null;
        } = {
          title: messageTitle,
          payload: payload,
          sourceTagId: null,
          secret: null,
        };
        if (hashDict.version === '0.0.0') {
          // Ensure backwards-compatibility.
          objToSendToParent.sourceTagId = hashDict.tagid;
          objToSendToParent.secret = hashDict.secret;
        }

        // The targetOrigin needs to be * because any page can iframe an
        // exploration.
        window.parent.postMessage(JSON.stringify(objToSendToParent), '*');
      } else {
        this.loggerService.error(
          'Unknown version for embedding: ' + hashDict.version
        );
        return;
      }
    }
  }
}
