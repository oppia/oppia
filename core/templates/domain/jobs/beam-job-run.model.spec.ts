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
 * @fileoverview Unit tests for BeamJobRun.
 */

import { BeamJobRun } from 'domain/jobs/beam-job-run.model';

describe('Beam Job Run', () => {
  it('should copy values from arguments', () => {
    const beamJobRun = new BeamJobRun(
      '123', 'FooJob', 'RUNNING', 123, 456, true);

    expect(beamJobRun.jobId).toEqual('123');
    expect(beamJobRun.jobName).toEqual('FooJob');
    expect(beamJobRun.jobState).toEqual('RUNNING');
    expect(beamJobRun.jobStartedOnMsecs).toEqual(123);
    expect(beamJobRun.jobUpdatedOnMsecs).toEqual(456);
    expect(beamJobRun.jobIsSynchronous).toBeTrue();
  });

  it('should copy values from backend dict', () => {
    const beamJobRun = BeamJobRun.createFromBackendDict({
      job_id: '123',
      job_name: 'FooJob',
      job_state: 'RUNNING',
      job_started_on_msecs: 123,
      job_updated_on_msecs: 456,
      job_is_synchronous: true,
    });

    expect(beamJobRun.jobId).toEqual('123');
    expect(beamJobRun.jobName).toEqual('FooJob');
    expect(beamJobRun.jobState).toEqual('RUNNING');
    expect(beamJobRun.jobStartedOnMsecs).toEqual(123);
    expect(beamJobRun.jobUpdatedOnMsecs).toEqual(456);
    expect(beamJobRun.jobIsSynchronous).toBeTrue();
  });

  describe('That is running', () => {
    const beamJobRun = new BeamJobRun('123', 'FooJob', 'RUNNING', 0, 0, true);

    it('should return the appropriate material tooltip', () => {
      expect(beamJobRun.getJobStatusTooltipString()).toEqual('Running...');
    });

    it('should return the appropriate material icon code', () => {
      expect(beamJobRun.getJobStatusMaterialIconCode()).toEqual('run_circle');
    });

    it('should return the appropriate material theme color', () => {
      expect(beamJobRun.getJobStatusMaterialThemeColor()).toEqual('accent');
    });

    it('should recognize whether it is in terminal state', () => {
      expect(beamJobRun.inTerminalState()).toBeFalse();
    });

    it('should recognize whether it is still running', () => {
      expect(beamJobRun.isRunning()).toBeTrue();
    });

    it('should recognize whether it can be cancelled', () => {
      expect(beamJobRun.canBeCancelled()).toBeTrue();
    });

    it('should recognize whether it has output', () => {
      expect(beamJobRun.hasOutput()).toBeFalse();
    });
  });

  describe('That is done', () => {
    const beamJobRun = new BeamJobRun('123', 'FooJob', 'DONE', 0, 0, true);

    it('should return the appropriate material tooltip', () => {
      expect(beamJobRun.getJobStatusTooltipString()).toEqual('Done!');
    });

    it('should return the appropriate material icon code', () => {
      expect(beamJobRun.getJobStatusMaterialIconCode()).toEqual('check_circle');
    });

    it('should return the appropriate material theme color', () => {
      expect(beamJobRun.getJobStatusMaterialThemeColor()).toEqual('primary');
    });

    it('should recognize whether it is in terminal state', () => {
      expect(beamJobRun.inTerminalState()).toBeTrue();
    });

    it('should recognize whether it is still running', () => {
      expect(beamJobRun.isRunning()).toBeFalse();
    });

    it('should recognize whether it can be cancelled', () => {
      expect(beamJobRun.canBeCancelled()).toBeFalse();
    });

    it('should recognize whether it has output', () => {
      expect(beamJobRun.hasOutput()).toBeTrue();
    });
  });

  describe('That is failed', () => {
    const beamJobRun = new BeamJobRun('123', 'FooJob', 'FAILED', 0, 0, true);

    it('should return the appropriate material tooltip', () => {
      expect(beamJobRun.getJobStatusTooltipString()).toEqual('Failed!');
    });

    it('should return the appropriate material icon code', () => {
      expect(beamJobRun.getJobStatusMaterialIconCode()).toEqual('error');
    });

    it('should return the appropriate material theme color', () => {
      expect(beamJobRun.getJobStatusMaterialThemeColor()).toEqual('warn');
    });

    it('should recognize whether it is in terminal state', () => {
      expect(beamJobRun.inTerminalState()).toBeTrue();
    });

    it('should recognize whether it is still running', () => {
      expect(beamJobRun.isRunning()).toBeFalse();
    });

    it('should recognize whether it can be cancelled', () => {
      expect(beamJobRun.canBeCancelled()).toBeFalse();
    });

    it('should recognize whether it has output', () => {
      expect(beamJobRun.hasOutput()).toBeTrue();
    });
  });

  describe('That is cancelled', () => {
    const beamJobRun = new BeamJobRun('123', 'FooJob', 'CANCELLED', 0, 0, true);

    it('should return the appropriate material tooltip', () => {
      expect(beamJobRun.getJobStatusTooltipString()).toEqual('Cancelled');
    });

    it('should return the appropriate material icon code', () => {
      expect(beamJobRun.getJobStatusMaterialIconCode()).toEqual('cancel');
    });

    it('should return the appropriate material theme color', () => {
      expect(beamJobRun.getJobStatusMaterialThemeColor()).toBeNull();
    });

    it('should recognize whether it is in terminal state', () => {
      expect(beamJobRun.inTerminalState()).toBeTrue();
    });

    it('should recognize whether it is still running', () => {
      expect(beamJobRun.isRunning()).toBeFalse();
    });

    it('should recognize whether it can be cancelled', () => {
      expect(beamJobRun.canBeCancelled()).toBeFalse();
    });

    it('should recognize whether it has output', () => {
      expect(beamJobRun.hasOutput()).toBeFalse();
    });
  });

  describe('That is unknown', () => {
    const beamJobRun = new BeamJobRun('123', 'FooJob', 'UNKNOWN', 0, 0, true);

    it('should return the appropriate material tooltip', () => {
      expect(beamJobRun.getJobStatusTooltipString()).toEqual('Unknown');
    });

    it('should return the appropriate material icon code', () => {
      expect(beamJobRun.getJobStatusMaterialIconCode()).toEqual('help');
    });

    it('should return the appropriate material theme color', () => {
      expect(beamJobRun.getJobStatusMaterialThemeColor()).toEqual('warn');
    });

    it('should recognize whether it is in terminal state', () => {
      expect(beamJobRun.inTerminalState()).toBeFalse();
    });

    it('should recognize whether it is still running', () => {
      expect(beamJobRun.isRunning()).toBeTrue();
    });

    it('should recognize whether it can be cancelled', () => {
      expect(beamJobRun.canBeCancelled()).toBeTrue();
    });

    it('should recognize whether it has output', () => {
      expect(beamJobRun.hasOutput()).toBeFalse();
    });
  });

  describe('That is updated', () => {
    const beamJobRun = new BeamJobRun('123', 'FooJob', 'UPDATED', 0, 0, true);

    it('should return the appropriate material tooltip', () => {
      expect(beamJobRun.getJobStatusTooltipString()).toEqual('Updated');
    });

    it('should return the appropriate material icon code', () => {
      expect(beamJobRun.getJobStatusMaterialIconCode())
        .toEqual('published_with_changes');
    });

    it('should return the appropriate material theme color', () => {
      expect(beamJobRun.getJobStatusMaterialThemeColor()).toEqual('primary');
    });

    it('should recognize whether it is in terminal state', () => {
      expect(beamJobRun.inTerminalState()).toBeTrue();
    });

    it('should recognize whether it is still running', () => {
      expect(beamJobRun.isRunning()).toBeFalse();
    });

    it('should recognize whether it can be cancelled', () => {
      expect(beamJobRun.canBeCancelled()).toBeFalse();
    });

    it('should recognize whether it has output', () => {
      expect(beamJobRun.hasOutput()).toBeFalse();
    });
  });

  describe('That is draining', () => {
    const beamJobRun = new BeamJobRun('123', 'FooJob', 'DRAINING', 0, 0, true);

    it('should return the appropriate material tooltip', () => {
      expect(beamJobRun.getJobStatusTooltipString()).toEqual('Draining...');
    });

    it('should return the appropriate material icon code', () => {
      expect(beamJobRun.getJobStatusMaterialIconCode())
        .toEqual('hourglass_top');
    });

    it('should return the appropriate material theme color', () => {
      expect(beamJobRun.getJobStatusMaterialThemeColor()).toEqual('accent');
    });

    it('should recognize whether it is in terminal state', () => {
      expect(beamJobRun.inTerminalState()).toBeFalse();
    });

    it('should recognize whether it is still running', () => {
      expect(beamJobRun.isRunning()).toBeTrue();
    });

    it('should recognize whether it can be cancelled', () => {
      expect(beamJobRun.canBeCancelled()).toBeTrue();
    });

    it('should recognize whether it has output', () => {
      expect(beamJobRun.hasOutput()).toBeFalse();
    });
  });

  describe('That is drained', () => {
    const beamJobRun = new BeamJobRun('123', 'FooJob', 'DRAINED', 0, 0, true);

    it('should return the appropriate material tooltip', () => {
      expect(beamJobRun.getJobStatusTooltipString()).toEqual('Drained');
    });

    it('should return the appropriate material icon code', () => {
      expect(beamJobRun.getJobStatusMaterialIconCode())
        .toEqual('hourglass_bottom');
    });

    it('should return the appropriate material theme color', () => {
      expect(beamJobRun.getJobStatusMaterialThemeColor()).toBeNull();
    });

    it('should recognize whether it is in terminal state', () => {
      expect(beamJobRun.inTerminalState()).toBeTrue();
    });

    it('should recognize whether it is still running', () => {
      expect(beamJobRun.isRunning()).toBeFalse();
    });

    it('should recognize whether it can be cancelled', () => {
      expect(beamJobRun.canBeCancelled()).toBeFalse();
    });

    it('should recognize whether it has output', () => {
      expect(beamJobRun.hasOutput()).toBeTrue();
    });
  });

  describe('That is stopped', () => {
    const beamJobRun = new BeamJobRun('123', 'FooJob', 'STOPPED', 0, 0, true);

    it('should return the appropriate material tooltip', () => {
      expect(beamJobRun.getJobStatusTooltipString()).toEqual('Paused');
    });

    it('should return the appropriate material icon code', () => {
      expect(beamJobRun.getJobStatusMaterialIconCode()).toEqual('pause_circle');
    });

    it('should return the appropriate material theme color', () => {
      expect(beamJobRun.getJobStatusMaterialThemeColor()).toEqual('accent');
    });

    it('should recognize whether it is in terminal state', () => {
      expect(beamJobRun.inTerminalState()).toBeFalse();
    });

    it('should recognize whether it is still running', () => {
      expect(beamJobRun.isRunning()).toBeTrue();
    });

    it('should recognize whether it can be cancelled', () => {
      expect(beamJobRun.canBeCancelled()).toBeTrue();
    });

    it('should recognize whether it has output', () => {
      expect(beamJobRun.hasOutput()).toBeFalse();
    });
  });

  describe('That is pending', () => {
    const beamJobRun = new BeamJobRun('123', 'FooJob', 'PENDING', 0, 0, true);

    it('should return the appropriate material tooltip', () => {
      expect(beamJobRun.getJobStatusTooltipString()).toEqual('Pending...');
    });

    it('should return the appropriate material icon code', () => {
      expect(beamJobRun.getJobStatusMaterialIconCode()).toEqual('pending');
    });

    it('should return the appropriate material theme color', () => {
      expect(beamJobRun.getJobStatusMaterialThemeColor()).toEqual('accent');
    });

    it('should recognize whether it is in terminal state', () => {
      expect(beamJobRun.inTerminalState()).toBeFalse();
    });

    it('should recognize whether it is still running', () => {
      expect(beamJobRun.isRunning()).toBeTrue();
    });

    it('should recognize whether it can be cancelled', () => {
      expect(beamJobRun.canBeCancelled()).toBeTrue();
    });

    it('should recognize whether it has output', () => {
      expect(beamJobRun.hasOutput()).toBeFalse();
    });
  });

  describe('That is cancelling', () => {
    const beamJobRun = (
      new BeamJobRun('123', 'FooJob', 'CANCELLING', 0, 0, true));

    it('should return the appropriate material tooltip', () => {
      expect(beamJobRun.getJobStatusTooltipString()).toEqual('Cancelling...');
    });

    it('should return the appropriate material icon code', () => {
      expect(beamJobRun.getJobStatusMaterialIconCode()).toEqual('pending');
    });

    it('should return the appropriate material theme color', () => {
      expect(beamJobRun.getJobStatusMaterialThemeColor()).toBeNull();
    });

    it('should recognize whether it is in terminal state', () => {
      expect(beamJobRun.inTerminalState()).toBeFalse();
    });

    it('should recognize whether it is still running', () => {
      expect(beamJobRun.isRunning()).toBeTrue();
    });

    it('should recognize whether it can be cancelled', () => {
      expect(beamJobRun.canBeCancelled()).toBeFalse();
    });

    it('should recognize whether it has output', () => {
      expect(beamJobRun.hasOutput()).toBeFalse();
    });
  });
});
