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
 * @fileoverview Directive for the Math rich-text component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SimpleChanges } from '@angular/core';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { AppConstants } from 'app.constants';
import { ImagePreloaderService } from 'pages/exploration-player-page/services/image-preloader.service';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { ContextService } from 'services/context.service';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { SvgSanitizerService } from 'services/svg-sanitizer.service';
import { NoninteractiveMath } from './oppia-noninteractive-math.component';

describe('NoninteractiveMath', () => {
  let assetsBackendApiService: AssetsBackendApiService;
  let htmlEscaperService: HtmlEscaperService;
  let component: NoninteractiveMath;
  let svgSanitizerService: SvgSanitizerService;
  let fixture: ComponentFixture<NoninteractiveMath>;
  let imagePreloaderService: ImagePreloaderService;
  let imageLocalStorageService: ImageLocalStorageService;
  let contextService: ContextService;
  let serverImageUrl = '/exploration/expId/assets/image/' +
    'mathImg_20210721_224145_dyim6a131p_height_3d205_width' +
    '_1d784_vertical_1d306.svg';
  let explorationPlayerImageUrl =
    '/assetsdevhandler/exploration/expId/assets/image/' +
    'mathImg_20210721_224145_dyim6a131p_height_3d205_width' +
    '_1d784_vertical_1d306.svg';
  let rawImagedata =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC' +
    '9zdmciIHdpZHRoPSIxLjc4NGV4IiBoZWlnaHQ9IjMuMjA1ZXgiIHZpZXdCb3g9IjAgLTgxNy' +
    '4zIDc2OCAxMzc5LjciIGZvY3VzYWJsZT0iZmFsc2UiIHN0eWxlPSJ2ZXJ0aWNhbC1hbGlnbj' +
    'ogLTEuMzA2ZXg7Ij48ZyBzdHJva2U9ImN1cnJlbnRDb2xvciIgZmlsbD0iY3VycmVudENvbG' +
    '9yIiBzdHJva2Utd2lkdGg9IjAiIHRyYW5zZm9ybT0ibWF0cml4KDEgMCAwIC0xIDAgMCkiPj' +
    'xnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDEyMCwwKSI+PHJlY3Qgc3Ryb2tlPSJub25lIiB3aW' +
    'R0aD0iNTI4IiBoZWlnaHQ9IjYwIiB4PSIwIiB5PSIyMjAiLz48ZyB0cmFuc2Zvcm09InRyYW' +
    '5zbGF0ZSg1OSw0MjApIj48cGF0aCBzdHJva2Utd2lkdGg9IjEwIiB0cmFuc2Zvcm09InNjYW' +
    'xlKDAuNzA3KSIgZD0iTTUyIDI4OVE1OSAzMzEgMTA2IDM4NlQyMjIgNDQyUTI1NyA0NDIgMj' +
    'g2IDQyNFQzMjkgMzc5UTM3MSA0NDIgNDMwIDQ0MlE0NjcgNDQyIDQ5NCA0MjBUNTIyIDM2MV' +
    'E1MjIgMzMyIDUwOCAzMTRUNDgxIDI5MlQ0NTggMjg4UTQzOSAyODggNDI3IDI5OVQ0MTUgMz' +
    'I4UTQxNSAzNzQgNDY1IDM5MVE0NTQgNDA0IDQyNSA0MDRRNDEyIDQwNCA0MDYgNDAyUTM2OC' +
    'AzODYgMzUwIDMzNlEyOTAgMTE1IDI5MCA3OFEyOTAgNTAgMzA2IDM4VDM0MSAyNlEzNzggMj' +
    'YgNDE0IDU5VDQ2MyAxNDBRNDY2IDE1MCA0NjkgMTUxVDQ4NSAxNTNINDg5UTUwNCAxNTMgNT' +
    'A0IDE0NVE1MDQgMTQ0IDUwMiAxMzRRNDg2IDc3IDQ0MCAzM1QzMzMgLTExUTI2MyAtMTEgMj' +
    'I3IDUyUTE4NiAtMTAgMTMzIC0xMEgxMjdRNzggLTEwIDU3IDE2VDM1IDcxUTM1IDEwMyA1NC' +
    'AxMjNUOTkgMTQzUTE0MiAxNDMgMTQyIDEwMVExNDIgODEgMTMwIDY2VDEwNyA0NlQ5NCA0MU' +
    'w5MSA0MFE5MSAzOSA5NyAzNlQxMTMgMjlUMTMyIDI2UTE2OCAyNiAxOTQgNzFRMjAzIDg3ID' +
    'IxNyAxMzlUMjQ1IDI0N1QyNjEgMzEzUTI2NiAzNDAgMjY2IDM1MlEyNjYgMzgwIDI1MSAzOT' +
    'JUMjE3IDQwNFExNzcgNDA0IDE0MiAzNzJUOTMgMjkwUTkxIDI4MSA4OCAyODBUNzIgMjc4SD' +
    'U4UTUyIDI4NCA1MiAyODlaIi8+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDg2LC0zND' +
    'UpIj48cGF0aCBzdHJva2Utd2lkdGg9IjEwIiB0cmFuc2Zvcm09InNjYWxlKDAuNzA3KSIgZD' +
    '0iTTIxIDI4N1EyMSAzMDEgMzYgMzM1VDg0IDQwNlQxNTggNDQyUTE5OSA0NDIgMjI0IDQxOV' +
    'QyNTAgMzU1UTI0OCAzMzYgMjQ3IDMzNFEyNDcgMzMxIDIzMSAyODhUMTk4IDE5MVQxODIgMT' +
    'A1UTE4MiA2MiAxOTYgNDVUMjM4IDI3UTI2MSAyNyAyODEgMzhUMzEyIDYxVDMzOSA5NFEzMz' +
    'kgOTUgMzQ0IDExNFQzNTggMTczVDM3NyAyNDdRNDE1IDM5NyA0MTkgNDA0UTQzMiA0MzEgND' +
    'YyIDQzMVE0NzUgNDMxIDQ4MyA0MjRUNDk0IDQxMlQ0OTYgNDAzUTQ5NiAzOTAgNDQ3IDE5M1' +
    'QzOTEgLTIzUTM2MyAtMTA2IDI5NCAtMTU1VDE1NiAtMjA1UTExMSAtMjA1IDc3IC0xODNUND' +
    'MgLTExN1E0MyAtOTUgNTAgLTgwVDY5IC01OFQ4OSAtNDhUMTA2IC00NVExNTAgLTQ1IDE1MC' +
    'AtODdRMTUwIC0xMDcgMTM4IC0xMjJUMTE1IC0xNDJUMTAyIC0xNDdMOTkgLTE0OFExMDEgLT' +
    'E1MyAxMTggLTE2MFQxNTIgLTE2N0gxNjBRMTc3IC0xNjcgMTg2IC0xNjVRMjE5IC0xNTYgMj' +
    'Q3IC0xMjdUMjkwIC02NVQzMTMgLTlUMzIxIDIxTDMxNSAxN1EzMDkgMTMgMjk2IDZUMjcwIC' +
    '02UTI1MCAtMTEgMjMxIC0xMVExODUgLTExIDE1MCAxMVQxMDQgODJRMTAzIDg5IDEwMyAxMT' +
    'NRMTAzIDE3MCAxMzggMjYyVDE3MyAzNzlRMTczIDM4MCAxNzMgMzgxUTE3MyAzOTAgMTczID' +
    'M5M1QxNjkgNDAwVDE1OCA0MDRIMTU0UTEzMSA0MDQgMTEyIDM4NVQ4MiAzNDRUNjUgMzAyVD' +
    'U3IDI4MFE1NSAyNzggNDEgMjc4SDI3UTIxIDI4NCAyMSAyODdaIi8+PC9nPjwvZz48L2c+PC' +
    '9zdmc+';

  class mockHtmlEscaperService {
    escapedJsonToObj(answer: string): string {
      return answer;
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [NoninteractiveMath],
      providers: [
        {
          provide: HtmlEscaperService,
          useClass: mockHtmlEscaperService
        },
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    htmlEscaperService = TestBed.inject(HtmlEscaperService);
    assetsBackendApiService = TestBed.inject(AssetsBackendApiService);
    imageLocalStorageService = TestBed.inject(ImageLocalStorageService);
    contextService = TestBed.inject(ContextService);
    imagePreloaderService = TestBed.get(ImagePreloaderService);
    svgSanitizerService = TestBed.inject(SvgSanitizerService);
    fixture = TestBed.createComponent(NoninteractiveMath);
    component = fixture.componentInstance;

    component.mathContentWithValue = {
      raw_latex: '\\frac{x}{y}',
      svg_filename: 'mathImg_20210721_224145_dyim6a131p_height_3d205_width' +
      '_1d784_vertical_1d306.svg'
    };
  });

  it('should initialise component when user inserts a math equation', () => {
    spyOn(imagePreloaderService, 'inExplorationPlayer').and.returnValue(false);
    spyOn(contextService, 'getEntityType').and.returnValue(
      AppConstants.ENTITY_TYPE.EXPLORATION);
    spyOn(contextService, 'getImageSaveDestination').and.returnValue(
      AppConstants.IMAGE_SAVE_DESTINATION_SERVER);
    spyOn(imageLocalStorageService, 'isInStorage').and.returnValue(false);
    spyOn(assetsBackendApiService, 'getImageUrlForPreview').and
      .returnValue(explorationPlayerImageUrl);

    component.ngOnInit();

    expect(component.imageContainerStyle.height).toBe('3.205ex');
    expect(component.imageContainerStyle.width).toBe('1.784ex');
    expect(component.imageContainerStyle['vertical-align']).toBe('-1.306ex');
    expect(component.imageUrl).toBe(explorationPlayerImageUrl);
  });

  it('should retrieve image from local storage if present', () => {
    spyOn(imagePreloaderService, 'inExplorationPlayer').and.returnValue(false);
    spyOn(contextService, 'getEntityType').and.returnValue(
      AppConstants.ENTITY_TYPE.EXPLORATION);
    spyOn(contextService, 'getImageSaveDestination').and.returnValue(
      AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE);
    spyOn(imageLocalStorageService, 'isInStorage').and.returnValue(true);
    spyOn(svgSanitizerService, 'getTrustedSvgResourceUrl').and
      .callFake((data) => {
        return data;
      });
    spyOn(imageLocalStorageService, 'getRawImageData').and
      .returnValue(rawImagedata);

    component.ngOnInit();

    expect(component.imageContainerStyle.height).toBe('3.205ex');
    expect(component.imageContainerStyle.width).toBe('1.784ex');
    expect(component.imageContainerStyle['vertical-align']).toBe('-1.306ex');
    expect(component.imageUrl).toBe(rawImagedata);
  });

  it('should display equation when user is viewing a concept card in the' +
  ' exploration player', fakeAsync(() => {
    spyOn(imagePreloaderService, 'inExplorationPlayer').and.returnValue(true);
    spyOn(contextService, 'getEntityType').and.returnValue(
      AppConstants.ENTITY_TYPE.EXPLORATION);
    spyOn(imagePreloaderService, 'getImageUrlAsync').and
      .returnValue(Promise.resolve(serverImageUrl));

    component.ngOnInit();
    tick();

    expect(component.imageContainerStyle.height).toBe('3.205ex');
    expect(component.imageContainerStyle.width).toBe('1.784ex');
    expect(component.imageContainerStyle['vertical-align']).toBe('-1.306ex');
    expect(component.imageUrl).toBe(serverImageUrl);
  }));

  it('should throw error when retrieving from local storage fails', () => {
    spyOn(imagePreloaderService, 'inExplorationPlayer').and.returnValue(false);
    spyOn(contextService, 'getEntityType').and.returnValue(
      AppConstants.ENTITY_TYPE.EXPLORATION);
    spyOn(contextService, 'getEntityId').and.returnValue('expId');
    spyOn(contextService, 'getImageSaveDestination').and.returnValue(
      AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE);
    spyOn(imageLocalStorageService, 'isInStorage').and.returnValue(true);
    spyOn(imageLocalStorageService, 'getRawImageData').and
      .returnValue(rawImagedata);
    spyOn(svgSanitizerService, 'getTrustedSvgResourceUrl').and
      .callFake((data) => {
        throw new Error('Error');
      });

    expect(() => {
      component.ngOnInit();
    }).toThrowError(
      'Error\n' +
      'Entity type: exploration\n' +
      'Entity ID: expId\n' +
      'Filepath: mathImg_20210721_224145_dyim6a131p_height_3d205_width_1d784' +
      '_vertical_1d306.svg'
    );
  });

  it('should throw error when retrieving from server fails', () => {
    spyOn(imagePreloaderService, 'inExplorationPlayer').and.returnValue(false);
    spyOn(contextService, 'getEntityType').and.returnValue(
      AppConstants.ENTITY_TYPE.EXPLORATION);
    spyOn(contextService, 'getEntityId').and.returnValue('expId');
    spyOn(contextService, 'getImageSaveDestination').and.returnValue(
      AppConstants.IMAGE_SAVE_DESTINATION_SERVER);
    spyOn(imageLocalStorageService, 'isInStorage').and.returnValue(false);
    spyOn(assetsBackendApiService, 'getImageUrlForPreview').and
      .callFake((data) => {
        throw new Error('Error');
      });

    expect(() => {
      component.ngOnInit();
    }).toThrowError(
      'Error\n' +
      'Entity type: exploration\n' +
      'Entity ID: expId\n' +
      'Filepath: mathImg_20210721_224145_dyim6a131p_height_3d205_width_1d784' +
      '_vertical_1d306.svg'
    );
  });

  it('should not update image when \'mathContentWithValue\' is not defined ' +
  'or empty', () => {
    spyOn(htmlEscaperService, 'escapedJsonToObj');
    spyOn(imagePreloaderService, 'getDimensionsOfMathSvg');
    spyOn(imagePreloaderService, 'inExplorationPlayer');
    component.mathContentWithValue = '';

    component.ngOnInit();

    expect(htmlEscaperService.escapedJsonToObj).not.toHaveBeenCalled();
    expect(imagePreloaderService.getDimensionsOfMathSvg).not.toHaveBeenCalled();
    expect(imagePreloaderService.inExplorationPlayer).not.toHaveBeenCalled();
  });

  it('should not update image when \'mathExpressionContent\' is empty', () => {
    spyOn(htmlEscaperService, 'escapedJsonToObj').and.returnValue('');
    spyOn(imagePreloaderService, 'getDimensionsOfMathSvg');
    spyOn(imagePreloaderService, 'inExplorationPlayer');

    component.ngOnInit();

    expect(htmlEscaperService.escapedJsonToObj).toHaveBeenCalled();
    expect(imagePreloaderService.getDimensionsOfMathSvg).not.toHaveBeenCalled();
    expect(imagePreloaderService.inExplorationPlayer).not.toHaveBeenCalled();
  });

  it('should update image when usre makes changes to the equation', () => {
    const changes: SimpleChanges = {
      mathContentWithValue: {
        currentValue: {
          raw_latex: '\\frac{a}{b}',
          svg_filename:
            'mathImg_20210721_224145_dyim6a131p_height_3d205_width' +
            '_1d784_vertical_1d306.svg'
        },
        previousValue: {
          raw_latex: '\\frac{x}{y}',
          svg_filename:
            'mathImg_20210721_224145_dyim6a131p_height_3d205_width' +
            '_1d784_vertical_1d306.svg'
        },
        firstChange: false,
        isFirstChange: () => false
      }
    };
    component.mathContentWithValue = {
      raw_latex: '\\frac{a}{b}',
      svg_filename: 'mathImg_20210721_224145_dyim6a131p_height_3d205_width' +
      '_1d784_vertical_1d306.svg'
    };
    spyOn(imagePreloaderService, 'inExplorationPlayer').and.returnValue(false);
    spyOn(contextService, 'getEntityType').and.returnValue(
      AppConstants.ENTITY_TYPE.EXPLORATION);
    spyOn(contextService, 'getImageSaveDestination').and.returnValue(
      AppConstants.IMAGE_SAVE_DESTINATION_SERVER);
    spyOn(imageLocalStorageService, 'isInStorage').and.returnValue(false);
    spyOn(assetsBackendApiService, 'getImageUrlForPreview').and
      .returnValue(explorationPlayerImageUrl);

    component.ngOnChanges(changes);

    expect(component.imageContainerStyle.height).toBe('3.205ex');
    expect(component.imageContainerStyle.width).toBe('1.784ex');
    expect(component.imageContainerStyle['vertical-align']).toBe('-1.306ex');
    expect(component.imageUrl).toBe(explorationPlayerImageUrl);
  });
});
