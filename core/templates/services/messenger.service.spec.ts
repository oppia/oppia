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
 * @fileoverview Unit tests for sending messages to a parent iframe. All
 * outbound communication with a parent iframe should pass through here. (This
 * communication should be outbound only; reverse communication should NOT
 * be attempted due to cross-domain security issues.)
 */

import { TestBed } from '@angular/core/testing';
import { MessengerService } from './messenger.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { LoggerService } from './contextual/logger.service';
import { ServicesConstants } from './services.constants';

describe('BannerComponent', () => {
  let messengerService: MessengerService;
  let mockWindowRef: MockWindowRef;
  let loggerService: LoggerService;

  class MockWindowRef {
    _window = {
      location: {
        _href: '',
        _hash: '',
        get href(): string {
          return this._href;
        },
        set href(val) {
          this._href = val;
        },
        get hash(): string {
          return this._hash;
        },
        set hash(val) {
          this._hash = val;
        }
      },
      parent: {
        postMessage: () => {}
      }
    };

    get nativeWindow() {
      return this._window;
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: WindowRef,
          useClass: MockWindowRef
        },
      ]
    });
    mockWindowRef = TestBed.inject(WindowRef) as unknown as MockWindowRef;
  });

  beforeEach(() => {
    messengerService = TestBed.inject(MessengerService);
    loggerService = TestBed.inject(LoggerService);
  });

  it('should post height change when the user changes the height of the' +
  'exploration player', () => {
    spyOn(mockWindowRef._window.parent, 'postMessage');
    mockWindowRef.nativeWindow.location.hash =
      '/version=0.0.2&secret=secret1&tagid=1';

    messengerService.sendMessage(
      ServicesConstants.MESSENGER_PAYLOAD.HEIGHT_CHANGE, {
        height: 100,
        scroll: true
      });

    expect(mockWindowRef._window.parent.postMessage).toHaveBeenCalledWith(
      '{"title":"heightChange",' +
      '"payload":{"height":100,"scroll":true},' +
      '"sourceTagId":null,"secret":null}', '*');
  });


  it('should post exploration loaded when the exploration completes loading' +
  ' in the exploration player', () => {
    spyOn(mockWindowRef._window.parent, 'postMessage');
    mockWindowRef.nativeWindow.location.hash =
      '/version=0.0.2&secret=secret1&tagid=1';

    messengerService.sendMessage(
      ServicesConstants.MESSENGER_PAYLOAD.EXPLORATION_LOADED, {
        explorationVersion: 1,
        explorationTitle: 'exploration title'
      });

    expect(mockWindowRef._window.parent.postMessage).toHaveBeenCalledWith(
      '{"title":"explorationLoaded",' +
      '"payload":{"explorationVersion":1,' +
      '"explorationTitle":"exploration title"},' +
      '"sourceTagId":null,"secret":null}', '*');
  });

  it('should post state transition when the exploration state changes' +
  ' in the exploration player', () => {
    spyOn(mockWindowRef._window.parent, 'postMessage');
    mockWindowRef.nativeWindow.location.hash =
      '/version=0.0.2&secret=secret1&tagid=1';

    messengerService.sendMessage(
      ServicesConstants.MESSENGER_PAYLOAD.STATE_TRANSITION, {
        explorationVersion: 1,
        oldStateName: 'old state',
        jsonAnswer: '{answer: 0}',
        newStateName: 'new state'
      });

    expect(mockWindowRef._window.parent.postMessage).toHaveBeenCalledWith(
      '{"title":"stateTransition","payload":{"explorationVersion":1,' +
      '"oldStateName":"old state","jsonAnswer":"{answer: 0}",' +
      '"newStateName":"new state"},"sourceTagId":null,"secret":null}', '*');
  });

  it('should post exploration completed when the exploration is completed' +
  ' in the exploration player', () => {
    spyOn(mockWindowRef._window.parent, 'postMessage');
    mockWindowRef.nativeWindow.location.hash =
      '/version=0.0.2&secret=secret1&tagid=1';

    messengerService.sendMessage(
      ServicesConstants.MESSENGER_PAYLOAD.EXPLORATION_COMPLETED, {
        explorationVersion: 1
      });

    expect(mockWindowRef._window.parent.postMessage).toHaveBeenCalledWith(
      '{"title":"explorationCompleted","payload":{"explorationVersion":1},' +
      '"sourceTagId":null,"secret":null}', '*');
  });

  it('should post exploration reset when the exploration is reset' +
  ' in the exploration player', () => {
    spyOn(mockWindowRef._window.parent, 'postMessage');
    mockWindowRef.nativeWindow.location.hash =
      '/version=0.0.2&secret=secret1&tagid=1';

    messengerService.sendMessage(
      ServicesConstants.MESSENGER_PAYLOAD.EXPLORATION_RESET, {
        stateName: 'state name'
      });

    expect(mockWindowRef._window.parent.postMessage).toHaveBeenCalledWith(
      '{"title":"explorationReset","payload":{"stateName":' +
      '{"stateName":"state name"}},"sourceTagId":null,"secret":null}', '*');
  });

  it('should post \'Secret\' and \'Tag Id\' if the version is \'0.0.0\'',
    () => {
      spyOn(mockWindowRef._window.parent, 'postMessage');
      mockWindowRef.nativeWindow.location.hash =
        '/version=0.0.0&secret=secret1&tagid=1';

      messengerService.sendMessage(
        ServicesConstants.MESSENGER_PAYLOAD.HEIGHT_CHANGE, {
          height: 100,
          scroll: true
        });

      expect(mockWindowRef._window.parent.postMessage).toHaveBeenCalledWith(
        '{"title":"heightChange",' +
        '"payload":{"height":100,"scroll":true},' +
        '"sourceTagId":"1","secret":"secret1"}', '*');
    });

  it('should post message when height of exploration window changes', () => {
    spyOn(loggerService, 'error').and.stub();
    mockWindowRef.nativeWindow.location.hash =
      '/version0.0.0';

    messengerService.sendMessage(
      ServicesConstants.MESSENGER_PAYLOAD.HEIGHT_CHANGE, {
        height: 100,
        scroll: true
      });

    expect(loggerService.error)
      .toHaveBeenCalledWith('Invalid hash for embedding: version0.0.0');
  });

  it('should throw error when an invalid version or secret is' +
  ' presenti in the url', () => {
    spyOn(loggerService, 'error').and.stub();
    mockWindowRef.nativeWindow.location.hash =
      '/version=0.0.0';

    messengerService.sendMessage(
      ServicesConstants.MESSENGER_PAYLOAD.HEIGHT_CHANGE, {
        height: 100,
        scroll: true
      });

    expect(loggerService.error)
      .toHaveBeenCalledWith('Invalid hash for embedding: version=0.0.0');
  });

  it('should thow error when hasdict version is not supported', () => {
    spyOn(loggerService, 'error').and.stub();
    mockWindowRef.nativeWindow.location.hash =
      '/version=0.0.0&secret=secret1&tagid=1';

    messengerService.sendMessage(
      ServicesConstants.MESSENGER_PAYLOAD.HEIGHT_CHANGE, {
        height: 100,
        scroll: 100
      });

    expect(loggerService.error)
      .toHaveBeenCalledWith('Error validating payload: [object Object]');
  });

  it('should throw error when version of embedding is unknown', () => {
    spyOn(loggerService, 'error').and.stub();
    mockWindowRef.nativeWindow.location.hash =
      '/version=0.0.10&secret=secret1&tagid=1';

    messengerService.sendMessage(
      ServicesConstants.MESSENGER_PAYLOAD.HEIGHT_CHANGE, {
        height: 100,
        scroll: true
      });

    expect(loggerService.error)
      .toHaveBeenCalledWith('Unknown version for embedding: 0.0.10');
  });
});
