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
 * @fileoverview Directive unit tests for the "click hexbins" visualization.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {DebugElement, NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  waitForAsync,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {ImagePreloaderService} from 'pages/exploration-player-page/services/image-preloader.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {ContextService} from 'services/context.service';
import {
  Hexbin,
  OppiaVisualizationClickHexbinsComponent,
} from './oppia-visualization-click-hexbins.directive';

describe('Oppia click hexbins visualization', function () {
  let component: OppiaVisualizationClickHexbinsComponent;
  let fixture: ComponentFixture<OppiaVisualizationClickHexbinsComponent>;
  let imagePreloaderService: ImagePreloaderService;
  let assetsBackendApiService: AssetsBackendApiService;
  let bannerDe: DebugElement;
  let bannerEl: HTMLElement;
  let tooltipTarget = {
    x: 0,
    y: 0,
    length: 10,
  } as Hexbin;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [OppiaVisualizationClickHexbinsComponent],
      providers: [
        AssetsBackendApiService,
        ContextService,
        ImagePreloaderService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OppiaVisualizationClickHexbinsComponent);
    component = fixture.componentInstance;
    imagePreloaderService = TestBed.inject(ImagePreloaderService);
    assetsBackendApiService = TestBed.inject(AssetsBackendApiService);

    spyOn(imagePreloaderService, 'getDimensionsOfImage').and.returnValue({
      width: 10,
      height: 5,
    });
    spyOn(assetsBackendApiService, 'getImageUrlForPreview').and.returnValue(
      'url'
    );

    component.tooltipTarget = tooltipTarget;
    component.data = [
      {answer: {clickPosition: [0.03, 0.03], clickedRegions: []}, frequency: 2},
      {answer: {clickPosition: [0.5, 0.5], clickedRegions: []}, frequency: 1},
    ];
    component.interactionArgs = {
      imageAndRegions: {
        value: {imagePath: 'solar-system.png'},
      },
    };

    bannerDe = fixture.debugElement;
    bannerEl = bannerDe.nativeElement;

    fixture.detectChanges();
  });

  it('should group the two answers as two distinct hexagons', () => {
    expect(bannerEl.querySelectorAll('.click-hexbin-hexagon').length).toEqual(
      2
    );
  });

  it('should be hidden by default', () => {
    expect(
      bannerEl.querySelectorAll('.click-hexbin-chart-tooltip').length
    ).toEqual(0);
  });

  it('should showTooltip', fakeAsync(() => {
    spyOn(component, 'getNumClicks').and.returnValue(2);

    component.showTooltip(tooltipTarget);
    tick();

    component.hideTooltip(tooltipTarget);
    tick();

    expect(component.tooltipTarget).toBe(null);
    expect(component.getTooltipNumClicks()).toEqual(2);
  }));

  it('should intialize component', fakeAsync(() => {
    component.ngOnInit();
    tick();

    expect(component.getTooltipStyle()).toEqual({
      left: '0px',
      top: '0px',
    });
  }));
});
