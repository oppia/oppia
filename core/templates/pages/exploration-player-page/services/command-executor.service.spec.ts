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
 * @fileoverview Unit tests for ExplorationPlayerStateService.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// exploration-player-state.service.ts is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require(
  'pages/exploration-player-page/services/command-executor.service');
require('services/contextual/window-ref.service.ts');
require(
  'pages/exploration-player-page/services/window-wrapper-message.service.ts');

describe('Exploration Player State Service', () => {
  let ces = null;
  let spy = null;
  let wwms = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', ($provide) => {
    let ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector) {
    ces = $injector.get('CommandExecutorService');
    wwms = $injector.get('WindowWrapperMessageService');
    spy = spyOn(wwms, 'addEventListener');
  }));

  it('should register the host', () => {
    ces.initialize();
    expect(spy).toHaveBeenCalled();
    expect(spy.calls.mostRecent().args[0]).toEqual('message');
    var listener = spy.calls.mostRecent().args[1];
    var messageEvent = new MessageEvent('message', {
      data: 'HOSTNAME mockWindow'
    });
    listener(messageEvent);
    expect(ces.getHostname()).toEqual('mockWindow');
  });

  it('should click continue', () => {
    ces.initialize();
    expect(spy).toHaveBeenCalled();
    expect(spy.calls.mostRecent().args[0]).toEqual('message');
    var listener = spy.calls.mostRecent().args[1];
    var messageEvent = new MessageEvent('message', {
      data: 'HOSTNAME mockWindow'
    });
    listener(messageEvent);
    expect(ces.getHostname()).toEqual('mockWindow');
    var ClickContinueButton = jasmine.createSpy('fakeClickContinueButton');
    ces.registerCallback('CONTINUE', ClickContinueButton);
    var messageEvent = new MessageEvent('message', {
      data: 'CONTINUE'
    });
    listener(messageEvent, 'CONTINUE');
    expect(ClickContinueButton).toHaveBeenCalled();
  });

  it('should attempt to send parent ready state', () => {
    ces.initialize();
    wwms.postMessageToParent = jasmine.createSpy('parentMessage spy');
    ces.sendParentReadyState();
    expect(wwms.postMessageToParent)
      .toHaveBeenCalled();
  });

  it('should mimic send state to outer frame', () => {
    ces.initialize();
    expect(spy).toHaveBeenCalled();
    expect(spy.calls.mostRecent().args[0]).toEqual('message');
    var listener = spy.calls.mostRecent().args[1];
    var messageEvent = new MessageEvent('message', {
      data: 'HOSTNAME mockWindow'
    });
    listener(messageEvent);
    wwms.postMessageToParent =
    jasmine.createSpy('parentMessage spy');
    ces.sendInteractionToOuterFrame('Continue');
    expect(wwms.postMessageToParent)
      .toHaveBeenCalledWith('CONTINUE', 'mockWindow');
  });

  it('should send the cached message after hostname load',
    () => {
      ces.initialize();
      ces.sendInteractionToOuterFrame('SetInput');
      expect(ces.getCachedOuterFrameMessage()).toEqual('SET_OPERATION');
      expect(spy).toHaveBeenCalled();
      expect(spy.calls.mostRecent().args[0]).toEqual('message');
      var listener = spy.calls.mostRecent().args[1];
      wwms.postMessageToParent =
      jasmine.createSpy('parentMessage spy');
      var messageEvent = new MessageEvent('message', {
        data: 'HOSTNAME mockWindow'
      });
      listener(messageEvent);
      expect(ces.getHostname()).toEqual('mockWindow');
      expect(wwms.postMessageToParent)
        .toHaveBeenCalledWith('SET_OPERATION', 'mockWindow');
    });

  it('should not send any message', () => {
    ces.initialize();
    var emptyVal = ces.sendInteractionToOuterFrame('START_STATE');
    expect(emptyVal).toEqual(undefined);
  });

  it('should do nothing because hostname not set', () => {
    var clickedContinueButton = false;
    ces.initialize();
    expect(spy).toHaveBeenCalled();
    expect(spy.calls.mostRecent().args[0]).toEqual('message');
    var listener = spy.calls.mostRecent().args[1];
    var ClickContinueButton = jasmine.createSpy('fakeClickContinueButton',
      function(interaction) {
        clickedContinueButton = true;
      });
    ces.registerCallback('CONTINUE', ClickContinueButton);
    var messageEvent = new MessageEvent('message', {
      data: 'CONTINUE'
    });
    listener(messageEvent);
    expect(clickedContinueButton).toEqual(false);
  });

  it('should do nothing because it isn\'t initialized', () => {
    var sentParentBool = false;
    ces.sendInteractionToOuterFrame('CONTINUE');
    wwms.postMessageToParent =
    jasmine.createSpy('parentMessage spy',
      function(interaction) {
        sentParentBool = true;
      });
    expect(sentParentBool).toEqual(false);
  });
});
