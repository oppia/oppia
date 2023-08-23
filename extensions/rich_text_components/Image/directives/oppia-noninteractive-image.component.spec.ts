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
 * @fileoverview Unit tests for the Image rich-text component.
 */
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { NoninteractiveImage } from './oppia-noninteractive-image.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ContextService } from 'services/context.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { ImagePreloaderService } from 'pages/exploration-player-page/services/image-preloader.service';
import { AppConstants } from 'app.constants';
import { SvgSanitizerService } from 'services/svg-sanitizer.service';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { SimpleChanges } from '@angular/core';

describe('NoninteractiveImage', () => {
  let component: NoninteractiveImage;
  let fixture: ComponentFixture<NoninteractiveImage>;
  let contextService: ContextService;
  let imageLocalStorageService: ImageLocalStorageService;
  let imagePreloaderService: ImagePreloaderService;
  let svgSanitizerService: SvgSanitizerService;
  let assetsBackendApiService: AssetsBackendApiService;
  let htmlEscaperService: HtmlEscaperService;

  let dataUrlSvg =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjA' +
    'wMC9zdmciICB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PGNpcmNsZSBjeD0iNTAiIGN5' +
    'PSI1MCIgcj0iNDAiIHN0cm9rZT0iZ3JlZW4iIHN0cm9rZS13aWR0aD0iNCIgZmlsbD0ie' +
    'WVsbG93IiAvPjwvc3ZnPg==';

  let dataUrlPng =
    'data:image/png;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjA' +
    'wMC9zdmciICB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PGNpcmNsZSBjeD0iNTAiIGN5' +
    'PSI1MCIgcj0iNDAiIHN0cm9rZT0iZ3JlZW4iIHN0cm9rZS13aWR0aD0iNCIgZmlsbD0ie' +
    'WVsbG93IiAvPjwvc3ZnPg==';

  class mockHtmlEscaperService {
    escapedJsonToObj(data: string): string {
      return data;
    }
  }

  class MockSvgSanitizerService {
    getTrustedSvgResourceUrl(str: string): string {
      return str;
    }
  }

  let mockImageLocalStorageService = {
    getRawImageData: (filename: string) => {
      return dataUrlSvg;
    },
    saveImage: (filename: string, imageData: string) => {
      return 'Image file save.';
    },
    deleteImage: (filename: string) => {
      return 'Image file is deleted.';
    },
    isInStorage: (filename: string) => {
      return true;
    }
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [NoninteractiveImage],
      providers: [HtmlEscaperService,
        {
          provide: HtmlEscaperService,
          useClass: mockHtmlEscaperService
        },
        {
          provide: ImageLocalStorageService,
          useValue: mockImageLocalStorageService
        },
        {
          provide: SvgSanitizerService,
          useClass: MockSvgSanitizerService
        }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    htmlEscaperService = TestBed.inject(HtmlEscaperService);
    assetsBackendApiService = TestBed.inject(AssetsBackendApiService);
    svgSanitizerService = TestBed.inject(SvgSanitizerService);
    imageLocalStorageService = TestBed.inject(ImageLocalStorageService);
    imagePreloaderService = TestBed.inject(ImagePreloaderService);
    contextService = TestBed.inject(ContextService);
    fixture = TestBed.createComponent(NoninteractiveImage);
    component = fixture.componentInstance;

    component.filepathWithValue =
      'img_20210704_215434_tac36akwgg_height_691_width_392.svg';
    component.altWithValue = 'image label';
    component.captionWithValue = 'image caption';
  });

  it('should initialise component when exploration loads', fakeAsync(() => {
    spyOn(imagePreloaderService, 'inExplorationPlayer').and.returnValue(true);
    spyOn(contextService, 'getEntityType').and.returnValue('exploration');
    spyOn(imagePreloaderService, 'getImageUrlAsync').and.resolveTo(dataUrlSvg);
    spyOn(contextService, 'getExplorationId').and.returnValue('exp_id');

    component.ngOnInit();
    tick();

    expect(component.filepath)
      .toBe('img_20210704_215434_tac36akwgg_height_691_width_392.svg');
    expect(component.loadingIndicatorUrl)
      .toBe('/assets/images/activity/loadingIndicator.gif');
    expect(component.dimensions).toEqual({
      width: 392,
      height: 691
    });
    expect(component.imageContainerStyle).toEqual({
      height: '691px',
      width: '392px'
    });
    expect(component.isLoadingIndicatorShown).toBe(false);
    expect(component.isTryAgainShown).toBe(false);
    expect(component.imageUrl).toBe(dataUrlSvg);
  }));

  it('should fetch svg image from local storage when component is initialised',
    () => {
      spyOn(imagePreloaderService, 'inExplorationPlayer')
        .and.returnValue(false);
      spyOn(contextService, 'getImageSaveDestination').and.returnValue(
        AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE
      );
      spyOn(svgSanitizerService, 'getTrustedSvgResourceUrl').and
        .callFake((data) => {
          return data;
        });

      component.ngOnInit();

      expect(component.imageUrl).toBe(dataUrlSvg);
      expect(component.imageCaption).toBe('image caption');
      expect(component.imageAltText).toBe('image label');
    });

  it('should fetch png image from local storage when component is initialised',
    () => {
      spyOn(imagePreloaderService, 'inExplorationPlayer')
        .and.returnValue(false);
      spyOn(contextService, 'getImageSaveDestination').and.returnValue(
        AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE
      );
      spyOn(imageLocalStorageService, 'getRawImageData').and
        .returnValue(dataUrlPng);

      component.ngOnInit();

      expect(component.imageUrl).toBe(dataUrlPng);
      expect(component.imageCaption).toBe('image caption');
      expect(component.imageAltText).toBe('image label');
    });

  it('should load image from server when image is not present in local storage',
    () => {
      spyOn(imagePreloaderService, 'inExplorationPlayer')
        .and.returnValue(false);
      spyOn(contextService, 'getImageSaveDestination').and.returnValue(
        AppConstants.IMAGE_SAVE_DESTINATION_SERVER
      );
      spyOn(assetsBackendApiService, 'getImageUrlForPreview').and
        .returnValue(dataUrlPng);
      spyOn(contextService, 'getEntityType').and.returnValue('exploration');
      spyOn(contextService, 'getEntityId').and.returnValue('expId');

      component.ngOnInit();

      expect(component.imageUrl).toBe(dataUrlPng);
      expect(component.imageCaption).toBe('image caption');
      expect(component.imageAltText).toBe('image label');
    });

  it('should display error when the image cannot be loaded' +
    ' from the local storage and the server', () => {
    spyOn(imagePreloaderService, 'inExplorationPlayer')
      .and.returnValue(false);
    spyOn(contextService, 'getImageSaveDestination').and.returnValue(
      AppConstants.IMAGE_SAVE_DESTINATION_SERVER
    );
    spyOn(contextService, 'getEntityType').and.returnValue('exploration');
    spyOn(contextService, 'getEntityId').and.returnValue('expId');
    spyOn(assetsBackendApiService, 'getImageUrlForPreview').and
      .callFake(() => {
        throw new Error('Error thown');
      });

    expect(() => {
      component.ngOnInit();
    }).toThrowError(
      'Error thown\n' +
      'Entity type: exploration\n' +
      'Entity ID: expId\n' +
      'Filepath: img_20210704_215434_tac36akwgg_height_691_width_392.svg');
  });

  it('should preload image when the user click \'Reload Image\'',
    fakeAsync(() => {
      spyOn(imagePreloaderService, 'getImageUrlAsync')
        .and.resolveTo(dataUrlSvg);

      component.loadImage();
      tick();

      expect(component.isLoadingIndicatorShown).toBe(false);
      expect(component.isTryAgainShown).toBe(false);
      expect(component.imageUrl).toBe(dataUrlSvg);
    }));

  it('should throw error if image url is empty', fakeAsync(() => {
    spyOn(imagePreloaderService, 'getImageUrlAsync')
      .and.resolveTo(null);
    expect(() => {
      component.loadImage();
      tick();
    }).toThrowError();
  }));

  it('should display \'Reload Image\' when the image cannot be loaded',
    fakeAsync(() => {
      spyOn(imagePreloaderService, 'getImageUrlAsync')
        .and.returnValue(Promise.reject());

      component.loadImage();
      tick();

      expect(component.isLoadingIndicatorShown).toBe(false);
      expect(component.isTryAgainShown).toBe(true);
      expect(component.imageUrl).toBe('');
    }));

  it('should update values when user makes changes', () => {
    spyOn(imagePreloaderService, 'inExplorationPlayer')
      .and.returnValue(false);
    spyOn(contextService, 'getImageSaveDestination').and.returnValue(
      AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE
    );
    let changes: SimpleChanges = {
      altWithValue: {
        currentValue: 'new image label',
        previousValue: 'image label',
        firstChange: false,
        isFirstChange: () => false
      }
    };
    component.altWithValue = 'new image label';

    component.ngOnChanges(changes);

    expect(component.imageUrl).toBe(dataUrlSvg);
    expect(component.imageCaption).toBe('image caption');
    expect(component.imageAltText).toBe('new image label');
  });

  it('should not get image when filepath is not provided',
    () => {
      component.filepathWithValue = '';

      component.ngOnInit();

      expect(component.imageUrl).toBe('');
      expect(component.imageAltText).toBe('');
      expect(component.imageCaption).toBe('');
    });

  it('should not get image when alt text is not provided',
    () => {
      component.altWithValue = '';

      component.ngOnInit();

      expect(component.imageUrl).toBe('');
      expect(component.imageAltText).toBe('');
      expect(component.imageCaption).toBe('');
    });

  it('should not get image when caption text is not provided',
    () => {
      spyOn(htmlEscaperService, 'escapedJsonToObj');
      component.captionWithValue = '';

      component.ngOnInit();

      expect(component.imageUrl).toBe('');
      expect(component.imageAltText).toBe('');
      expect(component.imageCaption).toBe('');
      // This is tested to make sure the function did no continue to execute.
      expect(htmlEscaperService.escapedJsonToObj).not.toHaveBeenCalled();
    });

  it('should not get image when filepath is not empty',
    () => {
      spyOn(htmlEscaperService, 'escapedJsonToObj').and.returnValue('');
      spyOn(imagePreloaderService, 'getDimensionsOfImage');
      component.ngOnInit();

      expect(component.imageUrl).toBe('');
      expect(component.imageAltText).toBe('');
      expect(component.imageCaption).toBe('');
      // This is tested to make sure the function did no continue to execute.
      expect(imagePreloaderService.getDimensionsOfImage).not.toHaveBeenCalled();
    });

  it('should show alt text images when altTextIsDisplayed property is true',
    () => {
      spyOn(contextService, 'getEntityType').and.returnValue('exploration');
      spyOn(imagePreloaderService, 'getImageUrlAsync').and.resolveTo(
        dataUrlSvg);
      spyOn(contextService, 'getExplorationId').and.returnValue('exp_id');
      spyOn(contextService, 'getEntityId').and.returnValue('expId');

      component.altTextIsDisplayed = true;
      component.imageAltText = 'This is alt text';
      fixture.detectChanges();

      const altTextcomponent = document.querySelector('figcaption.alt-text');
      expect(altTextcomponent?.textContent).toEqual(
        'Description: ' + component.imageAltText);
    });

  it('should not show alt text images when altTextIsDisplayed property is' +
    'false', () => {
    spyOn(contextService, 'getEntityType').and.returnValue('exploration');
    spyOn(imagePreloaderService, 'getImageUrlAsync').and.resolveTo(dataUrlSvg);
    spyOn(contextService, 'getExplorationId').and.returnValue('exp_id');
    spyOn(contextService, 'getEntityId').and.returnValue('expId');

    component.altTextIsDisplayed = false;
    component.imageAltText = 'This is alt text';
    fixture.detectChanges();

    const altTextComponent = document.querySelector('figcaption.alt-text');
    expect(altTextComponent).toBeNull();
  });
});
