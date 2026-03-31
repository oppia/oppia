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
 * @fileoverview Unit tests for WarningsAndAlertsComponent.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {ToastrService} from 'ngx-toastr';
import {AlertsService} from 'services/alerts.service';
import {AlertMessageComponent} from './alert-message.component';

describe('Alert Message Component', () => {
  let fixture: ComponentFixture<AlertMessageComponent>;
  let componentInstance: AlertMessageComponent;
  let numOfCalls: number = 0;

  class MockToastrService {
    info(content: string, title: string, conf: object): object {
      return {
        onHidden: {
          toPromise: () => {
            return {
              then: (callb: () => void) => {
                callb();
              },
            };
          },
        },
      };
    }

    success(content: string, title: string, conf: object): object {
      return {
        onHidden: {
          toPromise: () => {
            return {
              then: (callb: () => void) => {
                callb();
              },
            };
          },
        },
      };
    }
  }

  class MockAlertsService {
    deleteMessage(messageObject: object): void {
      numOfCalls++;
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AlertMessageComponent],
      providers: [
        {
          provide: ToastrService,
          useClass: MockToastrService,
        },
        {
          provide: AlertsService,
          useClass: MockAlertsService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AlertMessageComponent);
    componentInstance = fixture.componentInstance;
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should initialize', () => {
    componentInstance.messageObject = {
      type: 'info',
      content: 'Test',
      timeout: 0,
    };
    componentInstance.ngOnInit();
    expect(numOfCalls).toEqual(1);
    componentInstance.messageObject = {
      type: 'success',
      content: 'Test',
      timeout: 0,
    };
    componentInstance.ngOnInit();
    expect(numOfCalls).toEqual(2);
  });
});
