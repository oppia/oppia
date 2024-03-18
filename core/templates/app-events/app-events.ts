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
 * @fileoverview A file that contains class defs of all the frontend events.
 */

// The base-class for all of the events that the application pushes onto the
// MessageQueue. The only guarantee that this class makes is a read-only Type.
export abstract class BaseEvent {
  // The value of type is set inside the Event classes which extend BaseEvent.
  public readonly type!: string;
}

// The sub-class / base-class for all of the message-heavy events that this
// application pushes onto the MessageQueue. This class guarantees a message
// with a given interface.
abstract class EventWithMessage<T> extends BaseEvent {
  public readonly message: T;

  constructor(message: T) {
    super();
    this.message = message;
  }
}

/**
 * Each of the following classes has both a STATIC and an INSTANCE [type] of the
 * same value (the instance value is read from the static value). This allows
 * you to use the instance type in a discriminating union while comparing it to
 * the static type. In other words, you only have to import the one BaseEvent
 * class to get access to both values.
 */

export interface ObjectFormValidityChangeEventMessage {
  value: boolean;
  modalId: symbol;
}

export class ObjectFormValidityChangeEvent extends EventWithMessage<ObjectFormValidityChangeEventMessage> {
  static readonly type = 'ObjectFormValidityChangeEvent';
  public readonly type = ObjectFormValidityChangeEvent.type;
}
