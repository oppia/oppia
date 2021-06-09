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
 * @fileoverview Unit tests for the oppia noninteractive svg diagram component.
 */

import { AppConstants } from 'app.constants';
import { ComponentFixture, waitForAsync, TestBed } from '@angular/core/testing';
import { NoninteractiveSvgdiagram } from './oppia-noninteractive-svgdiagram.component';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { ImagePreloaderService } from 'pages/exploration-player-page/services/image-preloader.service';
import { ContextService } from 'services/context.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SimpleChanges, SimpleChange } from '@angular/core';
import { SvgSanitizerService } from 'services/svg-sanitizer.service';

describe('oppiaNoninteractiveSvgdiagram', () => {
  let component: NoninteractiveSvgdiagram;
  let fixture: ComponentFixture<NoninteractiveSvgdiagram>;
  let contextService: ContextService;
  const mockAssetsBackendApiService = {
    getImageUrlForPreview: function(contentType, contentId, filename) {
      return 'imageUrl:' + contentType + '_' + contentId + '_' + filename;
    }
  };
  const mockImagePreloaderService = {
    getDimensionsOfImage: function() {
      return {
        width: 450,
        height: 350
      };
    }
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(
      {
        imports: [HttpClientTestingModule],
        declarations: [NoninteractiveSvgdiagram],
        providers: [
          {
            provide: AssetsBackendApiService,
            useValue: mockAssetsBackendApiService
          },
          {
            provide: ImagePreloaderService,
            useValue: mockImagePreloaderService
          }
        ]
      }
    ).compileComponents();
  }));

  beforeEach(() => {
    contextService = TestBed.inject(ContextService);
    fixture = TestBed.createComponent(
      NoninteractiveSvgdiagram);
    component = fixture.componentInstance;
    component.svgFilenameWithValue = '&quot;svgFilename.svg&quot;';
    component.altWithValue = '&quot;altText&quot;';
    spyOn(contextService, 'getEntityType').and.returnValue('exploration');
    spyOn(contextService, 'getEntityId').and.returnValue('1');
    spyOn(contextService, 'getImageSaveDestination').and.returnValue(
      AppConstants.IMAGE_SAVE_DESTINATION_SERVER);
    fixture.detectChanges();
  });

  it('should run update on change', () => {
    component.svgFilenameWithValue = undefined;
    component.altWithValue = undefined;
    component.ngOnInit();
    component.svgFilenameWithValue = '&quot;svgFilename.svg&quot;';
    component.altWithValue = '&quot;altText&quot;';
    let changes: SimpleChanges = {};
    changes.svgFilenameWithValue = new SimpleChange(
      undefined,
      '&quot;svgFilename.svg&quot;',
      true
    );
    changes.svgFilenameWithValue = new SimpleChange(
      undefined,
      '&quot;altText&quot;',
      true
    );
    component.ngOnChanges(changes);
    expect(component.filename).toBe('svgFilename.svg');
    expect(component.svgAltText).toBe('altText');
    expect(component.svgUrl).toBe('imageUrl:exploration_1_svgFilename.svg');
  });

  it('should fetch the svg file', () => {
    component.ngOnInit();
    expect(component.filename).toBe('svgFilename.svg');
    expect(component.svgAltText).toBe('altText');
    expect(component.svgUrl).toBe('imageUrl:exploration_1_svgFilename.svg');
    component.svgFilenameWithValue = '&quot;&quot;';
    component.ngOnInit();
    expect(component.filename).toBe('');
  });
});

describe(
  'OppiaNoninteractiveSvgdiagram with image save destination as local storage',
  () => {
    let component: NoninteractiveSvgdiagram;
    let fixture: ComponentFixture<NoninteractiveSvgdiagram>;
    let contextService: ContextService;

    const mockImageLocalStorageService = {
      getRawImageData: function() {
        return 'imageUrl:exploration_1_svgFilename.svg';
      }
    };
    const mockImagePreloaderService = {
      getDimensionsOfImage: function() {
        return {
          width: 450,
          height: 350
        };
      }
    };

    const mockSvgSanitizerService = {
      getTrustedSvgResourceUrl: (url) => url
    };

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule(
        {
          imports: [HttpClientTestingModule],
          declarations: [NoninteractiveSvgdiagram],
          providers: [
            {
              provide: ImageLocalStorageService,
              useValue: mockImageLocalStorageService
            },
            {
              provide: ImagePreloaderService,
              useValue: mockImagePreloaderService
            },
            {
              provide: SvgSanitizerService,
              useValue: mockSvgSanitizerService
            }
          ]
        }
      ).compileComponents();
    }));

    beforeEach(() => {
      contextService = TestBed.inject(ContextService);
      fixture = TestBed.createComponent(
        NoninteractiveSvgdiagram);
      component = fixture.componentInstance;
      component.svgFilenameWithValue = '&quot;svgFilename.svg&quot;';
      component.altWithValue = '&quot;altText&quot;';
      spyOn(contextService, 'getImageSaveDestination').and.returnValue(
        AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE);
      fixture.detectChanges();
    });

    it('should fetch the svg file', () => {
      component.ngOnInit();
      expect(component.filename).toBe('svgFilename.svg');
      expect(component.svgAltText).toBe('altText');
      expect(component.svgUrl).toBe('imageUrl:exploration_1_svgFilename.svg');
    });
  });
