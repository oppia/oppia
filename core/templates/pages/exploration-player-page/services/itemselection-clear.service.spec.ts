// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Item selection clear service.
 */

import { TestBed } from '@angular/core/testing';
import {ItemSelectionClearService} from 'pages/exploration-player-page/services/itemselection-clear.service';
import { EventEmitter } from '@angular/core';

describe('ItemSelectionClearService', () => {
  let service: ItemSelectionClearService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ItemSelectionClearService],
    });
    service = TestBed.inject(ItemSelectionClearService);
  });

  it('should initialize with an EventEmitter', () => {
    expect(service.clearSelections).toBeInstanceOf(EventEmitter);
  });

  it('should emit an event when clear method is called', () => {
    spyOn(service.clearSelections, 'emit');
    service.clear();
    expect(service.clearSelections.emit).toHaveBeenCalled();
  });
});
