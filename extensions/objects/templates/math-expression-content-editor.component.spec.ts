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
 * @fileoverview Unit tests for math expression content editor.
 */

import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { MathExpressionContentEditorComponent } from './math-expression-content-editor.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import 'mathjaxConfig.ts';
import { ExternalRteSaveService } from 'services/external-rte-save.service';
import { ImageUploadHelperService } from 'services/image-upload-helper.service';
import { AlertsService } from 'services/alerts.service';
import { SimpleChanges } from '@angular/core';

describe('MathExpressionContentEditorComponent', () => {
  let component: MathExpressionContentEditorComponent;
  let fixture: ComponentFixture<MathExpressionContentEditorComponent>;
  const originalMathJax = window.MathJax;
  let externalRteSaveService: ExternalRteSaveService;
  let alertsService: AlertsService;
  let mockOnExternalRteSaveEventEmitter = new EventEmitter();
  let svgElement: {
    setAttribute: (txt: string, temp: string) => void;
    outerHTML: string;
  };

  const mockMathJaxHub = {
    Queue: (func: () => void) => {
      if (typeof func === 'function') {
        func();
      }
      return;
    }
  };
  const mockMathJs = {
    Hub: mockMathJaxHub
  };

  var mockImageUploadHelperService = {
    generateMathExpressionImageFilename:
    (height: string, width: string, verticalPadding: string) => {
      return 'mathImg_' +
      '12345' +
      '_height_' + height +
      '_width_' + width +
      '_vertical_' + verticalPadding +
      '.' + 'svg';
    }
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [MathExpressionContentEditorComponent],
      providers: [
        {
          provide: ImageUploadHelperService,
          useValue: mockImageUploadHelperService
        },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    alertsService = TestBed.inject(AlertsService);
    externalRteSaveService = TestBed.inject(ExternalRteSaveService);
    fixture = TestBed.createComponent(MathExpressionContentEditorComponent);
    component = fixture.componentInstance;
    // The equation used for testing is x/y.
    component.value = {
      raw_latex: '\\frac{x}{y}',
      svg_filename:
        'mathImg_20210704_134601_dqejngn3mj_' +
        'height_3d205_width_1d784_vertical_1d306.svg',
      svgFile:
        'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcm' +
        'cvMjAwMC9zdmciIHdpZHRoPSIxLjc4NGV4IiBoZWlnaHQ9IjMuMjA1ZXgiIHZpZX' +
        'dCb3g9IjAgLTgxNy4zIDc2OCAxMzc5LjciIGZvY3VzYWJsZT0iZmFsc2UiIHN0eW' +
        'xlPSJ2ZXJ0aWNhbC1hbGlnbjogLTEuMzA2ZXg7Ij48ZyBzdHJva2U9ImN1cnJlbn' +
        'RDb2xvciIgZmlsbD0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjAiIHRyYW' +
        '5zZm9ybT0ibWF0cml4KDEgMCAwIC0xIDAgMCkiPjxnIHRyYW5zZm9ybT0idHJhbn' +
        'NsYXRlKDEyMCwwKSI+PHJlY3Qgc3Ryb2tlPSJub25lIiB3aWR0aD0iNTI4IiBoZW' +
        'lnaHQ9IjYwIiB4PSIwIiB5PSIyMjAiLz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZS' +
        'g1OSw0MjApIj48cGF0aCBzdHJva2Utd2lkdGg9IjEwIiB0cmFuc2Zvcm09InNjYW' +
        'xlKDAuNzA3KSIgZD0iTTUyIDI4OVE1OSAzMzEgMTA2IDM4NlQyMjIgNDQyUTI1Ny' +
        'A0NDIgMjg2IDQyNFQzMjkgMzc5UTM3MSA0NDIgNDMwIDQ0MlE0NjcgNDQyIDQ5NC' +
        'A0MjBUNTIyIDM2MVE1MjIgMzMyIDUwOCAzMTRUNDgxIDI5MlQ0NTggMjg4UTQzOS' +
        'AyODggNDI3IDI5OVQ0MTUgMzI4UTQxNSAzNzQgNDY1IDM5MVE0NTQgNDA0IDQyNS' +
        'A0MDRRNDEyIDQwNCA0MDYgNDAyUTM2OCAzODYgMzUwIDMzNlEyOTAgMTE1IDI5MC' +
        'A3OFEyOTAgNTAgMzA2IDM4VDM0MSAyNlEzNzggMjYgNDE0IDU5VDQ2MyAxNDBRND' +
        'Y2IDE1MCA0NjkgMTUxVDQ4NSAxNTNINDg5UTUwNCAxNTMgNTA0IDE0NVE1MDQgMT' +
        'Q0IDUwMiAxMzRRNDg2IDc3IDQ0MCAzM1QzMzMgLTExUTI2MyAtMTEgMjI3IDUyUT' +
        'E4NiAtMTAgMTMzIC0xMEgxMjdRNzggLTEwIDU3IDE2VDM1IDcxUTM1IDEwMyA1NC' +
        'AxMjNUOTkgMTQzUTE0MiAxNDMgMTQyIDEwMVExNDIgODEgMTMwIDY2VDEwNyA0Nl' +
        'Q5NCA0MUw5MSA0MFE5MSAzOSA5NyAzNlQxMTMgMjlUMTMyIDI2UTE2OCAyNiAxOT' +
        'QgNzFRMjAzIDg3IDIxNyAxMzlUMjQ1IDI0N1QyNjEgMzEzUTI2NiAzNDAgMjY2ID' +
        'M1MlEyNjYgMzgwIDI1MSAzOTJUMjE3IDQwNFExNzcgNDA0IDE0MiAzNzJUOTMgMj' +
        'kwUTkxIDI4MSA4OCAyODBUNzIgMjc4SDU4UTUyIDI4NCA1MiAyODlaIi8+PC9nPj' +
        'xnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDg2LC0zNDUpIj48cGF0aCBzdHJva2Utd2' +
        'lkdGg9IjEwIiB0cmFuc2Zvcm09InNjYWxlKDAuNzA3KSIgZD0iTTIxIDI4N1EyMS' +
        'AzMDEgMzYgMzM1VDg0IDQwNlQxNTggNDQyUTE5OSA0NDIgMjI0IDQxOVQyNTAgMz' +
        'U1UTI0OCAzMzYgMjQ3IDMzNFEyNDcgMzMxIDIzMSAyODhUMTk4IDE5MVQxODIgMT' +
        'A1UTE4MiA2MiAxOTYgNDVUMjM4IDI3UTI2MSAyNyAyODEgMzhUMzEyIDYxVDMzOS' +
        'A5NFEzMzkgOTUgMzQ0IDExNFQzNTggMTczVDM3NyAyNDdRNDE1IDM5NyA0MTkgND' +
        'A0UTQzMiA0MzEgNDYyIDQzMVE0NzUgNDMxIDQ4MyA0MjRUNDk0IDQxMlQ0OTYgND' +
        'AzUTQ5NiAzOTAgNDQ3IDE5M1QzOTEgLTIzUTM2MyAtMTA2IDI5NCAtMTU1VDE1Ni' +
        'AtMjA1UTExMSAtMjA1IDc3IC0xODNUNDMgLTExN1E0MyAtOTUgNTAgLTgwVDY5IC' +
        '01OFQ4OSAtNDhUMTA2IC00NVExNTAgLTQ1IDE1MCAtODdRMTUwIC0xMDcgMTM4IC' +
        '0xMjJUMTE1IC0xNDJUMTAyIC0xNDdMOTkgLTE0OFExMDEgLTE1MyAxMTggLTE2MF' +
        'QxNTIgLTE2N0gxNjBRMTc3IC0xNjcgMTg2IC0xNjVRMjE5IC0xNTYgMjQ3IC0xMj' +
        'dUMjkwIC02NVQzMTMgLTlUMzIxIDIxTDMxNSAxN1EzMDkgMTMgMjk2IDZUMjcwIC' +
        '02UTI1MCAtMTEgMjMxIC0xMVExODUgLTExIDE1MCAxMVQxMDQgODJRMTAzIDg5ID' +
        'EwMyAxMTNRMTAzIDE3MCAxMzggMjYyVDE3MyAzNzlRMTczIDM4MCAxNzMgMzgxUT' +
        'E3MyAzOTAgMTczIDM5M1QxNjkgNDAwVDE1OCA0MDRIMTU0UTEzMSA0MDQgMTEyID' +
        'M4NVQ4MiAzNDRUNjUgMzAyVDU3IDI4MFE1NSAyNzggNDEgMjc4SDI3UTIxIDI4NC' +
        'AyMSAyODdaIi8+PC9nPjwvZz48L2c+PC9zdmc+',
      mathExpressionSvgIsBeingProcessed: false
    };
    window.MathJax = mockMathJs as typeof MathJax;
    svgElement = {
      setAttribute: (txt: string, temp: string) => {
        return;
      },
      outerHTML: '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ' +
      'width="1.784ex" height="3.205ex" viewBox="0 -817.3 768 1379.7" ' +
      'role="img" focusable="false" xmlns="http://www.w3.org/2000/svg" ' +
      'style="vertical-align: -1.306ex;"><g stroke="currentColor" ' +
      'fill="currentColor" stroke-width="0" transform="matrix' +
      '(1 0 0 -1 0 0)"><g transform="translate(120,0)"><rect ' +
      'stroke="none" width="528" height="60" x="0" y="220"></rect>' +
      '<g transform="translate(59,420)"><path stroke-width="10" ' +
      'transform="scale(0.707)" d="M52 289Q59 331 106 386T222 442Q257' +
      ' 442 286 424T329 379Q371 442 430 442Q467 442 494 420T522 361Q522' +
      ' 332 508 314T481 292T458 288Q439 288 427 299T415 328Q415 374 465 ' +
      '391Q454 404 425 404Q412 404 406 402Q368 386 350 336Q290 115 290' +
      ' 78Q290 50 306 38T341 26Q378 26 414 59T463 140Q466 150 469 151T485' +
      ' 153H489Q504 153 504 145Q504 144 502 134Q486 77 440 33T333 -11Q263 ' +
      '-11 227 52Q186 -10 133 -10H127Q78 -10 57 16T35 71Q35 103 54 123T99 ' +
      '143Q142 143 142 101Q142 81 130 66T107 46T94 41L91 40Q91 39 97 36T113 ' +
      '29T132 26Q168 26 194 71Q203 87 217 139T245 247T261 313Q266 340 266 ' +
      '352Q266 380 251 392T217 404Q177 404 142 372T93 290Q91 281 88 280T72 ' +
      '278H58Q52 284 52 289Z"></path></g><g transform="translate(86,-345)">' +
      '<path stroke-width="10" transform="scale(0.707)" d="M21 287Q21 301 ' +
      '36 335T84 406T158 442Q199 442 224 419T250 355Q248 336 247 334Q247 ' +
      '331 231 288T198 191T182 105Q182 62 196 45T238 27Q261 27 281 38T312' +
      ' 61T339 94Q339 95 344 114T358 173T377 247Q415 397 419 404Q432 431 ' +
      '462 431Q475 431 483 424T494 412T496 403Q496 390 447 193T391 -23Q363 ' +
      '-106 294 -155T156 -205Q111 -205 77 -183T43 -117Q43 -95 50 -80T69 ' +
      '-58T89 -48T106 -45Q150 -45 150 -87Q150 -107 138 -122T115 -142T102 ' +
      '-147L99 -148Q101 -153 118 -160T152 -167H160Q177 -167 186 -165Q219 ' +
      '-156 247 -127T290 -65T313 -9T321 21L315 17Q309 13 296 6T270 -6Q250 ' +
      '-11 231 -11Q185 -11 150 11T104 82Q103 89 103 113Q103 170 138 262T173 ' +
      '379Q173 380 173 381Q173 390 173 393T169 400T158 404H154Q131 404 112 ' +
      '385T82 344T65 302T57 280Q55 278 41 278H27Q21 284 21 287Z"></path></g>' +
      '</g></g></svg>'
    };
    spyOn(HTMLDivElement.prototype, 'getElementsByTagName')
    // This throws "Argument of type 'HTMLElement[]' is not assignable
    // to parameter of type 'HTMLCollectionOf<Element>'.
    // Type 'HTMLElement[]' is missing the following properties from type
    // 'HTMLCollectionOf<Element>': item, namedItem."
    // We need to suppress this error because we need to return a mock element
    // for testing purposes.
    // @ts-expect-error
      .and.returnValue([svgElement]);
    component.alwaysEditable = true;
  });

  afterEach(() => {
    window.MathJax = originalMathJax;
    component.ngOnDestroy();
  });

  it('should initialise component when user clicks \'math expression\' in' +
  ' the rich text editor', () => {
    const component = TestBed.createComponent(
      MathExpressionContentEditorComponent).componentInstance;
    component.ngOnInit();
    component.active = true;
    spyOn(component.valueChanged, 'emit');

    component.ngOnInit();

    expect(component.svgString).toBe('');
    expect(component.numberOfElementsInQueue).toBe(0);
    expect(component.value.mathExpressionSvgIsBeingProcessed).toBe(true);
    expect(component.valueChanged.emit).toHaveBeenCalledWith(component.value);
  });

  it('should let the user edit the existing expression when user' +
  ' clicks the \'math expression\' in the text editor', () => {
    spyOn(component.valueChanged, 'emit');

    component.ngOnInit();

    expect(component.localValue.label).toBe(component.value.raw_latex);
    expect(component.numberOfElementsInQueue).toBe(0);
    expect(component.value.mathExpressionSvgIsBeingProcessed).toBe(false);
    expect(component.valueChanged.emit).toHaveBeenCalledWith(component.value);
    expect(component.svgString).toBe(svgElement.outerHTML);
  });

  it('should close editor if the expression is not editable on initialisation',
    () => {
      spyOn(component, 'closeEditor');
      component.alwaysEditable = false;

      component.ngOnInit();

      expect(component.closeEditor).toHaveBeenCalled();
    });

  it('should process and save math expression as an svg when user' +
  ' clicks \'Done\'', () => {
    spyOnProperty(externalRteSaveService, 'onExternalRteSave').and.returnValue(
      mockOnExternalRteSaveEventEmitter
    );
    spyOn(component, 'replaceValue');
    component.localValue.label = '\\frac{x}{y}';
    component.active = true;
    component.ngOnInit();

    mockOnExternalRteSaveEventEmitter.emit();

    expect(component.value.svgFile).toBe(
      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcm' +
      'cvMjAwMC9zdmciIHdpZHRoPSIxLjc4NGV4IiBoZWlnaHQ9IjMuMjA1ZXgiIHZpZX' +
      'dCb3g9IjAgLTgxNy4zIDc2OCAxMzc5LjciIGZvY3VzYWJsZT0iZmFsc2UiIHN0eW' +
      'xlPSJ2ZXJ0aWNhbC1hbGlnbjogLTEuMzA2ZXg7Ij48ZyBzdHJva2U9ImN1cnJlbn' +
      'RDb2xvciIgZmlsbD0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjAiIHRyYW' +
      '5zZm9ybT0ibWF0cml4KDEgMCAwIC0xIDAgMCkiPjxnIHRyYW5zZm9ybT0idHJhbn' +
      'NsYXRlKDEyMCwwKSI+PHJlY3Qgc3Ryb2tlPSJub25lIiB3aWR0aD0iNTI4IiBoZW' +
      'lnaHQ9IjYwIiB4PSIwIiB5PSIyMjAiLz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZS' +
      'g1OSw0MjApIj48cGF0aCBzdHJva2Utd2lkdGg9IjEwIiB0cmFuc2Zvcm09InNjYW' +
      'xlKDAuNzA3KSIgZD0iTTUyIDI4OVE1OSAzMzEgMTA2IDM4NlQyMjIgNDQyUTI1Ny' +
      'A0NDIgMjg2IDQyNFQzMjkgMzc5UTM3MSA0NDIgNDMwIDQ0MlE0NjcgNDQyIDQ5NC' +
      'A0MjBUNTIyIDM2MVE1MjIgMzMyIDUwOCAzMTRUNDgxIDI5MlQ0NTggMjg4UTQzOS' +
      'AyODggNDI3IDI5OVQ0MTUgMzI4UTQxNSAzNzQgNDY1IDM5MVE0NTQgNDA0IDQyNS' +
      'A0MDRRNDEyIDQwNCA0MDYgNDAyUTM2OCAzODYgMzUwIDMzNlEyOTAgMTE1IDI5MC' +
      'A3OFEyOTAgNTAgMzA2IDM4VDM0MSAyNlEzNzggMjYgNDE0IDU5VDQ2MyAxNDBRND' +
      'Y2IDE1MCA0NjkgMTUxVDQ4NSAxNTNINDg5UTUwNCAxNTMgNTA0IDE0NVE1MDQgMT' +
      'Q0IDUwMiAxMzRRNDg2IDc3IDQ0MCAzM1QzMzMgLTExUTI2MyAtMTEgMjI3IDUyUT' +
      'E4NiAtMTAgMTMzIC0xMEgxMjdRNzggLTEwIDU3IDE2VDM1IDcxUTM1IDEwMyA1NC' +
      'AxMjNUOTkgMTQzUTE0MiAxNDMgMTQyIDEwMVExNDIgODEgMTMwIDY2VDEwNyA0Nl' +
      'Q5NCA0MUw5MSA0MFE5MSAzOSA5NyAzNlQxMTMgMjlUMTMyIDI2UTE2OCAyNiAxOT' +
      'QgNzFRMjAzIDg3IDIxNyAxMzlUMjQ1IDI0N1QyNjEgMzEzUTI2NiAzNDAgMjY2ID' +
      'M1MlEyNjYgMzgwIDI1MSAzOTJUMjE3IDQwNFExNzcgNDA0IDE0MiAzNzJUOTMgMj' +
      'kwUTkxIDI4MSA4OCAyODBUNzIgMjc4SDU4UTUyIDI4NCA1MiAyODlaIi8+PC9nPj' +
      'xnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDg2LC0zNDUpIj48cGF0aCBzdHJva2Utd2' +
      'lkdGg9IjEwIiB0cmFuc2Zvcm09InNjYWxlKDAuNzA3KSIgZD0iTTIxIDI4N1EyMS' +
      'AzMDEgMzYgMzM1VDg0IDQwNlQxNTggNDQyUTE5OSA0NDIgMjI0IDQxOVQyNTAgMz' +
      'U1UTI0OCAzMzYgMjQ3IDMzNFEyNDcgMzMxIDIzMSAyODhUMTk4IDE5MVQxODIgMT' +
      'A1UTE4MiA2MiAxOTYgNDVUMjM4IDI3UTI2MSAyNyAyODEgMzhUMzEyIDYxVDMzOS' +
      'A5NFEzMzkgOTUgMzQ0IDExNFQzNTggMTczVDM3NyAyNDdRNDE1IDM5NyA0MTkgND' +
      'A0UTQzMiA0MzEgNDYyIDQzMVE0NzUgNDMxIDQ4MyA0MjRUNDk0IDQxMlQ0OTYgND' +
      'AzUTQ5NiAzOTAgNDQ3IDE5M1QzOTEgLTIzUTM2MyAtMTA2IDI5NCAtMTU1VDE1Ni' +
      'AtMjA1UTExMSAtMjA1IDc3IC0xODNUNDMgLTExN1E0MyAtOTUgNTAgLTgwVDY5IC' +
      '01OFQ4OSAtNDhUMTA2IC00NVExNTAgLTQ1IDE1MCAtODdRMTUwIC0xMDcgMTM4IC' +
      '0xMjJUMTE1IC0xNDJUMTAyIC0xNDdMOTkgLTE0OFExMDEgLTE1MyAxMTggLTE2MF' +
      'QxNTIgLTE2N0gxNjBRMTc3IC0xNjcgMTg2IC0xNjVRMjE5IC0xNTYgMjQ3IC0xMj' +
      'dUMjkwIC02NVQzMTMgLTlUMzIxIDIxTDMxNSAxN1EzMDkgMTMgMjk2IDZUMjcwIC' +
      '02UTI1MCAtMTEgMjMxIC0xMVExODUgLTExIDE1MCAxMVQxMDQgODJRMTAzIDg5ID' +
      'EwMyAxMTNRMTAzIDE3MCAxMzggMjYyVDE3MyAzNzlRMTczIDM4MCAxNzMgMzgxUT' +
      'E3MyAzOTAgMTczIDM5M1QxNjkgNDAwVDE1OCA0MDRIMTU0UTEzMSA0MDQgMTEyID' +
      'M4NVQ4MiAzNDRUNjUgMzAyVDU3IDI4MFE1NSAyNzggNDEgMjc4SDI3UTIxIDI4NC' +
      'AyMSAyODdaIi8+PC9nPjwvZz48L2c+PC9zdmc+');
    expect(component.value.svg_filename)
      .toBe('mathImg_12345_height_3d205_width_1d784_vertical_1d306.svg');
    expect(component.replaceValue).toHaveBeenCalledWith('\\frac{x}{y}');
  });

  it('should alert user when SVG validation fails', () => {
    spyOn(component.valueChanged, 'emit');
    spyOn(alertsService, 'addWarning');
    spyOnProperty(externalRteSaveService, 'onExternalRteSave').and.returnValue(
      mockOnExternalRteSaveEventEmitter
    );
    component.ngOnInit();
    component.svgString = '';

    mockOnExternalRteSaveEventEmitter.emit();

    expect(component.value.raw_latex).toBe('');
    expect(component.value.svg_filename).toBe('');
    expect(alertsService.addWarning)
      .toHaveBeenCalledWith('SVG failed validation.');
  });

  it('should update local value when user types in the expression editor',
    fakeAsync(() => {
      spyOn(component.valueChanged, 'emit');
      component.value.raw_latex = '';
      component.ngOnInit();
      flush();
      component.debouncedUpdate$.next('\\frac{x}{y}');
      tick(1000);
      expect(component.value.raw_latex).toBe('\\frac{x}{y}');
      expect(component.valueChanged.emit).toHaveBeenCalledWith(component.value);
    }));


  it('should set active true when user open editor', () => {
    component.active = false;
    component.alwaysEditable = true;

    component.openEditor();

    expect(component.active).toBe(true);
  });

  it('should not let user open editor if the expression is not always editable',
    () => {
      component.active = false;
      component.alwaysEditable = false;

      component.openEditor();

      // The user should not be able to open the user if the expression is not
      // always editable. Therefore we test if the value does not change.
      expect(component.active).toBe(false);
    });

  it('should set active false when user closes editor', () => {
    component.active = true;
    component.alwaysEditable = true;

    component.closeEditor();

    expect(component.active).toBe(false);
  });

  it('should not change active value if the expression is not always editable',
    () => {
      component.active = true;
      component.alwaysEditable = false;

      component.closeEditor();

      // The value of the variable 'active' should not change if the
      // expression is not always editable. Therefore we test if the value of
      // has not changed.
      expect(component.active).toBe(true);
    });

  it('should replace with the old value if the user clicks \'Close\'' +
  'in the experession editor', () => {
    component.localValue.label = '\\frac{x}{y}';
    component.active = true;
    component.alwaysEditable = true;
    spyOn(component.valueChanged, 'emit');

    expect(component.value.raw_latex).toBe('\\frac{x}{y}');

    component.replaceValue('\\frac{a}{b}');

    expect(component.value.raw_latex).toBe('\\frac{a}{b}');
    expect(component.localValue.label).toBe('\\frac{a}{b}');
    expect(component.active).toBe(false);
    expect(component.valueChanged.emit).toHaveBeenCalledWith(component.value);
  });

  it('should not replace raw latex value when the expression is not' +
  ' always editable', () => {
    component.localValue.label = '\\frac{x}{y}';
    component.active = true;
    component.alwaysEditable = false;
    spyOn(component.valueChanged, 'emit');

    expect(component.value.raw_latex).toBe('\\frac{x}{y}');

    component.replaceValue('\\frac{a}{b}');

    expect(component.value.raw_latex).toBe('\\frac{x}{y}');
    expect(component.localValue.label).toBe('\\frac{x}{y}');
    expect(component.active).toBe(true);
    expect(component.valueChanged.emit).not.toHaveBeenCalled();
  });

  it('should update raw latex when the user is typing', () => {
    const changes: SimpleChanges = {
      value: {
        previousValue: {
          raw_latex: '\\frac{a}{b}'
        },
        currentValue: {
          raw_latex: '\\frac{x}{y}'
        },
        firstChange: false,
        isFirstChange: () => false
      }
    };
    component.localValue.label = '\\frac{a}{b}';

    component.ngOnChanges(changes);

    expect(component.localValue.label).toBe('\\frac{x}{y}');
  });
});
