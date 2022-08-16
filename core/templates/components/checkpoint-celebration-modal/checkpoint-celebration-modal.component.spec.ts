// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the checkpoint celebration modal component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, waitForAsync, TestBed } from '@angular/core/testing';
import { CheckpointCelebrationModalComponent } from './checkpoint-celebration-modal.component';
import { CheckpointCelebrationUtilityService } from 'pages/exploration-player-page/services/checkpoint-celebration-utility.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';

class MockCheckpointCelebrationUtilityService {
  isOnCheckpointedState = false;
}

describe('Placeholder test', function() {
  let component: CheckpointCelebrationModalComponent;
  let fixture: ComponentFixture<CheckpointCelebrationModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [CheckpointCelebrationModalComponent, MockTranslatePipe],
      providers: [
        {
          provide: CheckpointCelebrationUtilityService,
          useClass: MockCheckpointCelebrationUtilityService
        }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckpointCelebrationModalComponent);
    component = fixture.componentInstance;
  });

  it('should check if component is initialized', () => {
    expect(component).toBeDefined();
  });
});
