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
import { Subject, Subscription } from 'rxjs';
import { EventBusGroup, EventBusService } from './event-bus.service';
import { BaseEvent } from './app-events';

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
  let eventBusService: EventBusService;

  beforeEach(() => {
    eventBusService = TestBed.inject(EventBusService);
    eventbusGroup = new EventBusGroup(eventBusService);
  });

  it('should listen to an event', waitForAsync(() => {
    let value = '';
    eventbusGroup.on(CustomEvent, event => value = event.message);
    eventbusGroup.emit(new CustomEvent('Event'));
    eventbusGroup.unsubscribe();
    expect(value).toBe('Event');
  }));

  it('should throw uncaught errors', waitForAsync(() => {
    spyOn(Subject.prototype, 'subscribe').and.callFake(
      (f) => {
        expect(() => f()).toThrowError('Error in event bus\nRandom Error');
        return new Subscription();
      }
    );
    eventbusGroup.on(CustomEvent, _ => {
      throw new Error('Random Error');
    });
    eventbusGroup.emit(new CustomEvent('Event'));
    eventbusGroup.unsubscribe();
  }));
});
