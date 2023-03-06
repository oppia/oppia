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
 * @fileoverview A file that contains Event Bus Service and Event Bus Group.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { OperatorFunction, Subject, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { BaseEvent } from './app-events';

// Type unknown is used here because we don't know the type of the data
// that will be passed with the event.
export type Newable<T> = new(message: unknown) => T;

@Injectable({
  providedIn: 'root'
})
export class EventBusService {
  // Subjects are used for the event passing mechanism.
  private _subject$ = new Subject<BaseEvent>();

  private _errorHandler(error: Error): void {
    error.message = 'Error in event bus\n' + error.message;
    throw error;
  }

  /**
  * This function will listen to messages of specific event types as specified
  * by the first param.
  * @param eventType The event that is to be listened for.
  * @param action The action that is to be run when the event occurs.
  * @param callbackContext Callback context if any.
  *
  * @returns A subscription to the event asked for.
  */
  on<T extends BaseEvent>(
      eventType: Newable<T>,
      action: (event: T) => void,
      callbackContext = null): Subscription {
    return this._subject$.pipe(
      filter(
        (event: T): boolean => {
          return (event instanceof eventType);
        }
      ) as OperatorFunction<BaseEvent, T>).subscribe(
      (event: T): void => {
        try {
          action.call(callbackContext, event);
        // We use unknown type because we are unsure of the type of error
        // that was thrown. Since the catch block cannot identify the
        // specific type of error, we are unable to further optimise the
        // code by introducing more types of errors.
        } catch (error: unknown) {
          if (error instanceof Error) {
            this._errorHandler(error);
          } else {
            throw error;
          }
        }
      }
    );
  }

  /**
  * A function to trigger a particular event.
  * @param event OppiaEvent that we want to trigger.
  */
  emit<T extends BaseEvent>(event: T): void {
    this._subject$.next(event);
  }
}

angular.module('oppia').factory(
  'EventBusService', downgradeInjectable(EventBusService));

/**
* This class is a wrapper around the EventBusService. This is not supposed to
* be DI'ed in a component/ service. This is used to keep track of subscriptions
* and unsubscribe all of them at once.
*/
export class EventBusGroup {
  private eventBus: EventBusService;
  private subscriptions: Subscription;

  constructor(eventBus: EventBusService) {
    this.eventBus = eventBus;
    this.subscriptions = new Subscription();
  }

  public emit(event: BaseEvent): EventBusGroup {
    this.eventBus.emit(event);
    return (this);
  }


  public on<T extends BaseEvent>(
      eventType: Newable<T>,
      action: (event: T) => void,
      callbackContext = null): void {
    this.subscriptions.add(
      this.eventBus.on<T>(eventType, action, callbackContext)
    );
  }

  public unsubscribe(): void {
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
  }
}
