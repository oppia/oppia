// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for collection editor routing service.
 */

import {WindowRef} from 'services/contextual/window-ref.service';
import {CollectionEditorRoutingService} from './collection-editor-routing.service';

class MockWindowRef {
  nativeWindow = {
    location: {
      hash: '#edit',
    },
  };
}

describe('Collection editor routing service', () => {
  let cers = new CollectionEditorRoutingService(
    new MockWindowRef() as WindowRef
  );

  it('should create', () => {
    expect(cers).toBeDefined();
  });

  it('should navigate to edit tab', () => {
    cers.navigateToEditTab();
    expect(cers.getActiveTabName()).toEqual('edit');
  });

  it('should navigate to settings tab', () => {
    cers.navigateToSettingsTab();
    expect(cers.getActiveTabName()).toEqual('settings');
  });

  it('should navigate to history tab', () => {
    cers.navigateToHistoryTab();
    expect(cers.getActiveTabName()).toEqual('history');
  });

  it('should navigate to stats tab', () => {
    cers.navigateToStatsTab();
    expect(cers.getActiveTabName()).toEqual('stats');
  });

  it('should emit events when tab is changed', () => {
    let viewUpdateSpy = jasmine.createSpy('View update spy');

    cers.updateViewEventEmitter.subscribe(viewUpdateSpy);

    cers.navigateToSettingsTab();
    expect(viewUpdateSpy).toHaveBeenCalled();
  });
});
