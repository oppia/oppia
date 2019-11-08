// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for emitting and listening to events.
 */

// Used to store key value pairs
interface Event {
    key: string;
    value: any;
}

// Start of Event Service code
import { Observable, Subject } from 'rxjs';

import { Injectable } from '@angular/core';
import { filter, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class EventService {
    protected _eventsSubject = new Subject<Event>();

    public BroadcastEvent(key: string, value?: any): void {
      this._eventsSubject.next({ key, value });
    }

    public GetEvent(key: string): Observable<any> {
      return this._eventsSubject.asObservable()
        .pipe(
          filter(e => e.key === key),
          map(e => e.value)
        );
    }
}
