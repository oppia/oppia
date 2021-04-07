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
 * @fileoverview Unit tests for Event Bus Service and Event Bus Group.
 */

import { TestBed, waitForAsync } from '@angular/core/testing';
import { EventBusGroup, EventBusService } from './event-bus.service';
import { BaseEvent } from './oppia-events';

abstract class EventWithMessage<T> extends BaseEvent {
  public readonly message: T;

  constructor(message: T) {
    super();
    this.message = message;
  }
}

class CustomEvent extends EventWithMessage<string> {
  static readonly type = 'CustomEvent';
  public readonly type = CustomEvent.type;
}

describe('Event Bus Group', () => {
  let eventbusGroup: EventBusGroup;

  beforeEach(() => {
    eventbusGroup = new EventBusGroup(TestBed.inject(EventBusService));
  });

  it('should listen to an event', waitForAsync(() => {
    let value = '';
    eventbusGroup.on(CustomEvent, event => value = event.message);
    eventbusGroup.emit(new CustomEvent('Event'));
    expect(value).toBe('Event');
  }));
});
