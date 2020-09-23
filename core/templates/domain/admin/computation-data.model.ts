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
 * @fileoverview Frontend model for computation data.
 */

export interface ComputationDataBackendDict {
  'last_stopped_msec': number;
  'is_startable': boolean;
  'status_code': string;
  'last_started_msec': number;
  'is_stoppable': boolean;
  'last_finished_msec': number;
  'active_realtime_layer_index': string;
  'computation_type': string;
}

export class ComputationData {
  lastStoppedMsec: number;
  isStartable: boolean;
  statusCode: string;
  lastStartedMsec: number;
  isStoppable: boolean;
  lastFinishedMsec: number;
  activeRealtimeLayerIndex: string;
  computationType: string;

  constructor(
      lastStoppedMsec: number, isStartable: boolean, statusCode: string,
      lastStartedMsec: number, isStoppable: boolean, lastFinishedMsec: number,
      activeRealtimeLayerIndex: string, computationType: string) {
    this.lastStoppedMsec = lastStoppedMsec;
    this.isStartable = isStartable;
    this.statusCode = statusCode;
    this.lastStartedMsec = lastStartedMsec;
    this.isStoppable = isStoppable;
    this.lastFinishedMsec = lastFinishedMsec;
    this.activeRealtimeLayerIndex = activeRealtimeLayerIndex;
    this.computationType = computationType;
  }

  static createFromBackendDict(
      backendDict: ComputationDataBackendDict): ComputationData {
    return new ComputationData(
      backendDict.last_stopped_msec, backendDict.is_startable,
      backendDict.status_code, backendDict.last_started_msec,
      backendDict.is_stoppable, backendDict.last_finished_msec,
      backendDict.active_realtime_layer_index, backendDict.computation_type);
  }
}
