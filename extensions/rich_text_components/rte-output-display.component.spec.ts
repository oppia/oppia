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
 * @fileoverview Spec for rte output component.
 */

import {DOCUMENT} from '@angular/common';
import {DebugElement, SimpleChanges} from '@angular/core';
import {
  ComponentFixture,
  discardPeriodicTasks,
  fakeAsync,
  flush,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {EventEmitter} from '@angular/core';
import {OppiaRteParserService} from 'services/oppia-rte-parser.service';
import {RichTextComponentsModule} from './rich-text-components.module';
import {RteOutputDisplayComponent} from './rte-output-display.component';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {FeatureStatusChecker} from 'domain/feature-flag/feature-status-summary.model';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {AutomaticVoiceoverHighlightService} from '../../core/templates/services/automatic-voiceover-highlight-service';
import {EntityVoiceoversService} from '../../core/templates/services/entity-voiceovers.services';
import {PageContextService} from '../../core/templates/services/page-context.service';
import {TranslationTabActiveContentIdService} from '../../core/templates/pages/exploration-editor-page/translation-tab/services/translation-tab-active-content-id.service';
import {VoiceoverPlayerService} from '../../core/templates/pages/exploration-player-page/services/voiceover-player.service';
import {LocalStorageService} from '../../core/templates/services/local-storage.service';
import {AudioPlayerService} from 'services/audio-player.service';
import {
  EntityVoiceovers,
  EntityVoiceoversBackendDict,
} from 'domain/voiceover/entity-voiceovers.model';

class MockPlatformFeatureService {
  get status() {
    // Return a plain JS object; avoid TypeScript type assertion to keep Jest parser happy.
    return {
      AutomaticVoiceoverRegenerationFromExp: {
        isEnabled: true,
      },
    };
  }
}

describe('RTE display component', () => {
  let fixture: ComponentFixture<RteOutputDisplayComponent>;
  let component: RteOutputDisplayComponent;
  let rteParserService: OppiaRteParserService;
  let platformFeatureService: PlatformFeatureService;
  let automaticVoiceoverHighlightService: AutomaticVoiceoverHighlightService;
  let entityVoiceoversService: EntityVoiceoversService;
  let pageContextService: PageContextService;
  let translationTabActiveContentIdService: TranslationTabActiveContentIdService;
  let voiceoverPlayerService: VoiceoverPlayerService;
  let localStorageService: LocalStorageService;
  let audioplayerService: AudioPlayerService;

  // Type helper for accessing private/protected members in tests.
  type ComponentWithPrivates = RteOutputDisplayComponent & {
    normalizeSpacingInHtml: (html: string) => string;
    _updateNode: () => void;
    _getTemplatePortal: (node: unknown) => unknown;
    rteString: string | null | undefined;
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [RichTextComponentsModule, HttpClientTestingModule],
      providers: [
        {
          provide: PlatformFeatureService,
          useClass: MockPlatformFeatureService,
        },
      ],
    }).compileComponents();
    rteParserService = TestBed.inject(OppiaRteParserService);
    platformFeatureService = TestBed.inject(PlatformFeatureService);
    automaticVoiceoverHighlightService = TestBed.inject(
      AutomaticVoiceoverHighlightService
    );
    translationTabActiveContentIdService = TestBed.inject(
      TranslationTabActiveContentIdService
    );
    voiceoverPlayerService = TestBed.inject(VoiceoverPlayerService);
    pageContextService = TestBed.inject(PageContextService);
    entityVoiceoversService = TestBed.inject(EntityVoiceoversService);
    fixture = TestBed.createComponent(RteOutputDisplayComponent);
    localStorageService = TestBed.inject(LocalStorageService);
    audioplayerService = TestBed.inject(AudioPlayerService);
    component = fixture.componentInstance;

    // Correctly spy on EventEmitter property (not as a method).
    spyOnProperty(
      entityVoiceoversService,
      'onLanguageAccentCodeChange',
      'get'
    ).and.returnValue(new EventEmitter<string>());
  }));

  afterEach(() => {
    if (component) {
      component.ngOnDestroy();
    }
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should display a rte string', fakeAsync(() => {
    let rteString =
      '<p>Hi<em>Hello</em>Hello</p>' +
      '<pre> Hello </pre>' +
      '<oppia-noninteractive-link ' +
      'url-with-value="&quot;https://oppia.org&quot;" ' +
      'text-with-value="&quot;Oppia&quot;">' +
      '</oppia-noninteractive-link>';
    let rteComponentDe: DebugElement = fixture.debugElement;

    // eslint-disable-next-line oppia/no-inner-html
    let html = fixture.nativeElement.innerHTML.replace(/<!--[^>]*-->/g, '');
    expect(html).toBe('');

    fixture.detectChanges();
    let changes: SimpleChanges = {
      rteString: {
        previousValue: '',
        currentValue: rteString,
        firstChange: true,
        isFirstChange: () => true,
      },
    };
    component.rteString = rteString;
    component.ngOnChanges(changes);
    component.ngAfterViewInit();
    fixture.detectChanges();
    flush();
    discardPeriodicTasks();

    const attrs = rteComponentDe.query(
      By.css('oppia-noninteractive-link')
    ).attributes;
    expect(attrs['url-with-value']).toBe('"https://oppia.org"');
    expect(attrs['text-with-value']).toBe('"Oppia"');
    const link = rteComponentDe.query(By.css('a')).nativeElement;
    expect(link.attributes.href.nodeValue).toEqual('https://oppia.org');
    // eslint-disable-next-line oppia/no-inner-html
    expect(link.innerHTML.replace(/\s/g, '')).toEqual('Oppia');
  }));

  it('should report errors when parsing', fakeAsync(() => {
    spyOn(rteParserService, 'constructFromDomParser').and.throwError('error');
    spyOn(
      localStorageService,
      'getLastSelectedTranslationLanguageCode'
    ).and.returnValue('en');
    let rteString =
      '<p>Hi<em>Hello</em>Hello</p>' +
      '<pre> Hello </pre>' +
      '<oppia-noninteractive-link ' +
      'url-with-value="&quot;https://oppia.org&quot;" ' +
      'text-with-value="&quot;Oppia&quot;">' +
      '</oppia-noninteractive-link>';

    expect(() => {
      // eslint-disable-next-line oppia/no-inner-html
      let html = fixture.nativeElement.innerHTML.replace(/<!--[^>]*-->/g, '');
      expect(html).toBe('');

      fixture.detectChanges();
      let changes: SimpleChanges = {
        rteString: {
          previousValue: '',
          currentValue: rteString,
          firstChange: true,
          isFirstChange: () => true,
        },
      };
      component.rteString = rteString;
      component.ngOnChanges(changes);
      component.ngAfterViewInit();
    }).toThrowError();
    discardPeriodicTasks();
  }));

  it('should not display type 3 nodes', fakeAsync(() => {
    const removeChildSpy = jasmine.createSpy('Remove child node');

    component.elementRef = {
      nativeElement: {
        childNodes: [
          {
            nodeType: 3,
            parentElement: {
              removeChild: removeChildSpy,
            },
          },
        ],
        querySelectorAll: jasmine
          .createSpy('querySelectorAll')
          .and.returnValue([]),
      },
    };
    let rteString = '<p>Hi<em>Hello</em>Hello</p>' + '<pre> Hello </pre>';

    let changes: SimpleChanges = {
      rteString: {
        previousValue: '',
        currentValue: rteString,
        firstChange: true,
        isFirstChange: () => true,
      },
    };

    component.ngOnChanges(changes);
    tick(100);

    expect(removeChildSpy).toHaveBeenCalled();
  }));

  it('should remove text nodes which are outside ng container bounds', fakeAsync(() => {
    let rteString = '<p>Hi<em>Hello</em>Hello</p>';
    spyOn(
      localStorageService,
      'getLastSelectedTranslationLanguageCode'
    ).and.returnValue('en');

    let changes: SimpleChanges = {
      rteString: {
        previousValue: '',
        currentValue: rteString,
        firstChange: true,
        isFirstChange: () => true,
      },
    };

    const node = document.createTextNode('Congratulations! You have finished');
    component.elementRef.nativeElement.parentNode.insertBefore(
      node,
      component.elementRef.nativeElement
    );
    component.rteString = rteString;

    fixture.detectChanges();

    component.ngOnChanges(changes);

    tick(100);
    fixture.detectChanges();
    discardPeriodicTasks();

    expect(component.elementRef.nativeElement.innerText).toEqual(
      'HiHelloHello'
    );
  }));

  it('should disable voiceover regeneration feature flag', fakeAsync(() => {
    spyOnProperty(platformFeatureService, 'status', 'get').and.returnValue({
      AutomaticVoiceoverRegenerationFromExp: {
        isEnabled: false,
      },
    } as FeatureStatusChecker);

    expect(
      component.isAutomaticVoiceoverRegenerationFromExpFeatureEnabled()
    ).toBeFalse();
  }));

  it('should enable voiceover regeneration feature flag', fakeAsync(() => {
    spyOnProperty(platformFeatureService, 'status', 'get').and.returnValue({
      AutomaticVoiceoverRegenerationFromExp: {
        isEnabled: true,
      },
    } as FeatureStatusChecker);

    expect(
      component.isAutomaticVoiceoverRegenerationFromExpFeatureEnabled()
    ).toBeTrue();
  }));

  it('should correctly wrap html content inside span tag for highlighting', fakeAsync(() => {
    let rteString = '<p>Hi<em>Hello</em>Hello</p>';
    let expectedOutputWrappedString =
      '<p><span id="highlightBlock1">Hi<em>Hello</em>Hello</span></p>';

    spyOn(
      localStorageService,
      'getLastSelectedTranslationLanguageCode'
    ).and.returnValue('en');
    let outputWrappedString =
      component.wrapSentencesInSpansForHighlighting(rteString);
    expect(outputWrappedString).toBe(expectedOutputWrappedString);
  }));

  it('should correctly wrap html multiple sentences inside span tag for highlighting', fakeAsync(() => {
    let rteString = '<p>Hi world! I am a content creator.</p>';
    let expectedOutputWrappedString =
      '<p><span id="highlightBlock1">Hi world!</span> ' +
      '<span id="highlightBlock2">I am a content creator.</span></p>';

    spyOn(
      localStorageService,
      'getLastSelectedTranslationLanguageCode'
    ).and.returnValue('en');
    let outputWrappedString =
      component.wrapSentencesInSpansForHighlighting(rteString);
    expect(outputWrappedString).toBe(expectedOutputWrappedString);
  }));

  it('should correctly set data for sentence highlighting during voiceover playback in ngOnInit', fakeAsync(() => {
    spyOn(
      component,
      'isManualVoiceoverAvailableForActiveContent'
    ).and.returnValue(false);
    let regenerateVoiceoverFeatureSpy = spyOn(
      component,
      'isAutomaticVoiceoverRegenerationFromExpFeatureEnabled'
    );
    spyOn(
      automaticVoiceoverHighlightService,
      'setAutomatedVoiceoversAudioOffsets'
    );
    let entityVoiceoverSpy = spyOn(
      entityVoiceoversService,
      'getActiveEntityVoiceovers'
    );
    entityVoiceoverSpy.and.returnValue({
      automatedVoiceoversAudioOffsetsMsecs: {},
    } as EntityVoiceovers);

    regenerateVoiceoverFeatureSpy.and.returnValue(false);
    component.ngOnInit();
    tick(2000);
    flush();

    expect(
      automaticVoiceoverHighlightService.setAutomatedVoiceoversAudioOffsets
    ).not.toHaveBeenCalled();
    expect(
      entityVoiceoversService.getActiveEntityVoiceovers
    ).not.toHaveBeenCalled();

    entityVoiceoverSpy.and.returnValue({
      automatedVoiceoversAudioOffsetsMsecs: {
        content0: [
          {token: 'Nic', audioOffsetMsecs: 0.0},
          {token: 'took', audioOffsetMsecs: 100.0},
          {token: 'Jaime', audioOffsetMsecs: 200.0},
          {token: 'to', audioOffsetMsecs: 300.0},
          {token: 'the', audioOffsetMsecs: 400.0},
          {token: 'arcade', audioOffsetMsecs: 500.0},
        ],
      },
    } as unknown as EntityVoiceovers);
    regenerateVoiceoverFeatureSpy.and.returnValue(true);
    component.ngOnInit();
    entityVoiceoversService.onLanguageAccentCodeChange.emit();

    tick(5000);
    flush();

    expect(
      automaticVoiceoverHighlightService.setAutomatedVoiceoversAudioOffsets
    ).toHaveBeenCalled();
    expect(
      entityVoiceoversService.getActiveEntityVoiceovers
    ).toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('should correctly set data for sentence highlighting during voiceover playback in ngOnChanges', fakeAsync(() => {
    let rteString = '<p>Hi<em>Hello</em>Hello</p>';
    let regenerateVoiceoverFeatureSpy = spyOn(
      component,
      'isAutomaticVoiceoverRegenerationFromExpFeatureEnabled'
    );
    spyOn(automaticVoiceoverHighlightService, 'setHighlightIdToSentenceMap');
    spyOn(automaticVoiceoverHighlightService, 'setActiveContentId');

    let changes: SimpleChanges = {
      rteString: {
        previousValue: '',
        currentValue: rteString,
        firstChange: true,
        isFirstChange: () => true,
      },
    };

    const node = document.createTextNode('Congratulations! You have finished');
    component.elementRef.nativeElement.parentNode.insertBefore(
      node,
      component.elementRef.nativeElement
    );
    component.rteString = rteString;

    regenerateVoiceoverFeatureSpy.and.returnValue(false);
    component.ngOnChanges(changes);
    tick(1000);

    expect(
      automaticVoiceoverHighlightService.setHighlightIdToSentenceMap
    ).not.toHaveBeenCalled();
    expect(
      automaticVoiceoverHighlightService.setActiveContentId
    ).not.toHaveBeenCalled();

    fixture.detectChanges();

    regenerateVoiceoverFeatureSpy.and.returnValue(true);
    component.ngOnChanges(changes);
    tick(1000);

    expect(
      automaticVoiceoverHighlightService.setHighlightIdToSentenceMap
    ).toHaveBeenCalled();
    expect(
      automaticVoiceoverHighlightService.setActiveContentId
    ).toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('should be able to get contentId for specific pages', fakeAsync(() => {
    let ttacSpy = spyOn(
      translationTabActiveContentIdService,
      'getActiveContentId'
    );
    let vpsSpy = spyOn(voiceoverPlayerService, 'getActiveContentId');
    let explorationPlayerPageSpy = spyOn(
      pageContextService,
      'isInExplorationPlayerPage'
    );
    let explorationEditorPageSpy = spyOn(
      pageContextService,
      'isInExplorationEditorPage'
    );
    let editorTabContextSpy = spyOn(pageContextService, 'getEditorTabContext');

    explorationPlayerPageSpy.and.returnValue(false);
    explorationEditorPageSpy.and.returnValue(true);
    editorTabContextSpy.and.returnValue('editor');
    vpsSpy.and.returnValue('undefined');
    ttacSpy.and.returnValue('contentId');

    expect(component.getActiveContentId()).toBe('contentId');

    explorationPlayerPageSpy.and.returnValue(false);
    explorationEditorPageSpy.and.returnValue(true);
    editorTabContextSpy.and.returnValue('preview');
    vpsSpy.and.returnValue('contentId');
    ttacSpy.and.returnValue('undefined');

    expect(component.getActiveContentId()).toBe('contentId');

    explorationPlayerPageSpy.and.returnValue(true);
    vpsSpy.and.returnValue('contentId');
    ttacSpy.and.returnValue('undefined');

    expect(component.getActiveContentId()).toBe('contentId');
    discardPeriodicTasks();
  }));

  it('should be able to decode HTML string', () => {
    // Use well-formed entities with semicolons to match component decoding.
    let htmlString = '&quot;Hello world, this is a sample string!&quot;';
    let expectedDecodedString = '"Hello world, this is a sample string!"';
    let decodedString = component.decodeHtmlEntities(htmlString);
    expect(decodedString).toBe(expectedDecodedString);
  });

  it('should parse latex expressions successfully', () => {
    let latexString = '\\frac{3}{4} + \\frac{5}{8}';
    let expectedString = '3/4 + 5/8';
    let parsedString = component.parseAndConvertLatex(latexString);
    expect(parsedString).toBe(expectedString);
  });

  it('should be able to get readable text from text node', () => {
    let node = document.createElement('p');
    // eslint-disable-next-line oppia/no-inner-html
    node.innerHTML = 'Hello world';
    let readableText = component.getReadableTextFromNode(node.childNodes[0]);
    expect(readableText).toBe('Hello world');
  });

  it('should be able to get readable text from non-interactive link node', () => {
    let node = document.createElement('p');
    // eslint-disable-next-line oppia/no-inner-html
    node.innerHTML =
      '<oppia-noninteractive-link ' +
      'url-with-value="&quot;https://oppia.org&quot;" ' +
      'text-with-value="&quot;Oppia&quot;">' +
      '</oppia-noninteractive-link>';
    let readableText = component.decodeHtmlEntities(
      component.getReadableTextFromNode(node.childNodes[0])
    );
    expect(readableText).toBe('Oppia');
  });

  it('should be able to get readable text from non-interactive math node', () => {
    let node = document.createElement('p');
    // eslint-disable-next-line oppia/no-inner-html
    node.innerHTML =
      '<oppia-noninteractive-math math_content-with-value="' +
      '{&amp;quot;raw_latex&amp;quot;:&amp;quot;x^2 + y^2 = z^2&amp;' +
      'quot;,&amp;quot;svg_filename&amp;quot;:&amp;quot;' +
      'mathImg_20250120_160257_55t4cfik6h_height_2d85_width_12d757_verti' +
      'cal_0d715.svg&amp;quot;}" ng-version="11.2.14">' +
      '</oppia-noninteractive-math>';
    let readableText = component.getReadableTextFromNode(node.childNodes[0]);
    expect(readableText).toBe('x^2 + y^2 = z^2');
  });

  it('should return space character for unknown tag', () => {
    let node = document.createElement('span');
    // eslint-disable-next-line oppia/no-inner-html
    node.innerHTML = ' ';
    let readableText = component.getReadableTextFromNode(node.childNodes[0]);
    expect(readableText).toBe(' ');
  });

  it('should not change bg highlight color when prev and current element are same during voiceover playback', fakeAsync(() => {
    spyOn(
      component,
      'isManualVoiceoverAvailableForActiveContent'
    ).and.returnValue(false);
    spyOn(component, 'isInPlayerOrPreviewPage').and.returnValue(true);
    spyOn(audioplayerService, 'isPlaying').and.returnValue(true);

    component.highlightIdToSentenceText = {
      highlightBlock1: 'Hello world',
    };

    let document = TestBed.inject(DOCUMENT);
    let previousElement = document.createElement('p');
    // eslint-disable-next-line oppia/no-inner-html
    previousElement.innerHTML = 'Hello world';
    previousElement.style.backgroundColor =
      component.backgroundColorOfHighlightedSentence;

    component.previousHighlightedElementId = 'highlightBlock1';

    spyOn(
      automaticVoiceoverHighlightService,
      'getCurrentSentenceIdToHighlight'
    ).and.returnValue('highlightBlock1');

    spyOn(document, 'getElementById').and.returnValue(previousElement);

    component.highlightSentenceDuringVoiceoverPlay();

    let highlightedElement = document.getElementById('highlightBlock1');
    expect((highlightedElement as HTMLElement).style.backgroundColor).toBe(
      'rgb(243, 209, 64)'
    );
  }));

  it('should highlight the current element and remove highlighting from previous element during voiceover playback', fakeAsync(() => {
    spyOn(
      component,
      'isManualVoiceoverAvailableForActiveContent'
    ).and.returnValue(false);
    spyOn(component, 'isInPlayerOrPreviewPage').and.returnValue(true);
    spyOn(audioplayerService, 'isPlaying').and.returnValue(true);

    component.highlightIdToSentenceText = {
      highlightBlock2: 'New element',
    };

    let document = TestBed.inject(DOCUMENT);

    let previousElement = document.createElement('p');
    // eslint-disable-next-line oppia/no-inner-html
    previousElement.innerHTML = 'Hello world';
    previousElement.style.backgroundColor =
      component.backgroundColorOfHighlightedSentence;

    let currentElement = document.createElement('p');
    // eslint-disable-next-line oppia/no-inner-html
    currentElement.innerHTML = 'New element';
    currentElement.style.backgroundColor = '';

    component.previousHighlightedElementId = 'highlightBlock1';

    spyOn(
      automaticVoiceoverHighlightService,
      'getCurrentSentenceIdToHighlight'
    ).and.returnValue('highlightBlock2');

    spyOn(document, 'getElementById').and.callFake((id: string) => {
      if (id === 'highlightBlock1') {
        return previousElement;
      } else if (id === 'highlightBlock2') {
        return currentElement;
      }
      return null;
    });

    component.highlightSentenceDuringVoiceoverPlay();

    expect(
      (document.getElementById('highlightBlock1') as HTMLElement).style
        .backgroundColor
    ).toBe('');
    expect(
      (document.getElementById('highlightBlock2') as HTMLElement).style
        .backgroundColor
    ).toBe('rgb(243, 209, 64)');
    expect(component.previousHighlightedElementId).toBe('highlightBlock2');
  }));

  it('should remove highlight when audio is not playing', fakeAsync(() => {
    spyOn(
      component,
      'isManualVoiceoverAvailableForActiveContent'
    ).and.returnValue(false);
    spyOn(component, 'isInPlayerOrPreviewPage').and.returnValue(true);
    spyOn(audioplayerService, 'isPlaying').and.returnValue(false);

    let document = TestBed.inject(DOCUMENT);
    let previousElement = document.createElement('p');
    // eslint-disable-next-line oppia/no-inner-html
    previousElement.innerHTML = 'Hello world';
    previousElement.style.backgroundColor =
      component.backgroundColorOfHighlightedSentence;

    component.previousHighlightedElementId = 'highlightBlock1';

    spyOn(
      automaticVoiceoverHighlightService,
      'getCurrentSentenceIdToHighlight'
    ).and.returnValue('highlightBlock1');

    spyOn(document, 'getElementById').and.returnValue(previousElement);

    component.highlightSentenceDuringVoiceoverPlay();

    expect(
      (document.getElementById('highlightBlock1') as HTMLElement).style
        .backgroundColor
    ).toBe('');
  }));

  it('should not highlight sentence when manual voiceover is available in player page', () => {
    component.previousHighlightedElementId = undefined;
    spyOn(
      component,
      'isManualVoiceoverAvailableForActiveContent'
    ).and.returnValue(true);
    spyOn(component, 'isInPlayerOrPreviewPage').and.returnValue(true);
    component.highlightSentenceDuringVoiceoverPlay();
    expect(component.previousHighlightedElementId).toBe(undefined);
  });

  it('should not highlight sentence when manual voiceover is playing in editor page', () => {
    component.previousHighlightedElementId = undefined;
    spyOn(component, 'isInPlayerOrPreviewPage').and.returnValue(false);
    spyOn(audioplayerService, 'isPlaying').and.returnValue(true);
    voiceoverPlayerService.isAutomaticVoiceoverPlaying = false;
    component.highlightSentenceDuringVoiceoverPlay();
    expect(component.previousHighlightedElementId).toBe(undefined);
  });

  it('should be able to return manual voiceover status correctly', () => {
    const voiceover = {
      filename: 'a.mp3',
      file_size_bytes: 200000,
      needs_update: false,
      duration_secs: 10.0,
    };
    let contentIdToVoiceoversMapping = {
      content0: {
        manual: voiceover,
        auto: voiceover,
      },
    };
    const entityVoiceoversBackendDict: EntityVoiceoversBackendDict = {
      entity_id: 'exp_1',
      entity_type: 'exploration',
      entity_version: 1,
      language_accent_code: 'en-US',
      voiceovers_mapping: contentIdToVoiceoversMapping,
      automated_voiceovers_audio_offsets_msecs: {},
    };
    const entityVoiceovers = EntityVoiceovers.createFromBackendDict(
      entityVoiceoversBackendDict
    );

    spyOn(component, 'getActiveContentId').and.returnValue('content0');
    spyOn(entityVoiceoversService, 'getActiveEntityVoiceovers').and.returnValue(
      entityVoiceovers
    );

    expect(component.isManualVoiceoverAvailableForActiveContent()).toBe(true);
  });

  it('should return true when page context is subtopic_preview', () => {
    spyOn(pageContextService, 'getSubtopicPreviewIsOpen').and.returnValue(true);
    expect(component.isSolutionCollapsedForWorkedexample()).toBe(true);
  });

  it('should return true when page context is studyguide', () => {
    spyOn(pageContextService, 'getPageContext').and.returnValue('studyguide');
    expect(component.isSolutionCollapsedForWorkedexample()).toBe(true);
  });

  it('should return false when page context is neither topic_editor nor studyguide', () => {
    spyOn(pageContextService, 'getPageContext').and.returnValue(
      'exploration_player'
    );
    expect(component.isSolutionCollapsedForWorkedexample()).toBe(false);
  });

  it('should normalize spacing between inline elements', () => {
    const input = '<p>time.<em>Incidentally</em></p>';
    const output = (component as ComponentWithPrivates).normalizeSpacingInHtml(
      input
    );
    expect(output).toContain('time. <em>');
  });

  it('should insert space between adjacent inline elements', () => {
    const input = '<span>Hi</span><a href="#">there</a>';
    const output = (component as ComponentWithPrivates).normalizeSpacingInHtml(
      input
    );
    expect(output).toContain('>Hi</span> <a');
  });

  it('should insert space between inline element and following text', () => {
    const input = '<em>bold</em>text';
    const output = (component as ComponentWithPrivates).normalizeSpacingInHtml(
      input
    );
    expect(output).toContain('>bold</em> text');
  });

  it('should insert space between text and following inline element', () => {
    const input = 'text<strong>bold</strong>';
    const output = (component as ComponentWithPrivates).normalizeSpacingInHtml(
      input
    );
    expect(output).toContain('text <strong>');
  });

  it('should not insert space between block elements', () => {
    const input = '<p>para1</p><p>para2</p>';
    const output = (component as ComponentWithPrivates).normalizeSpacingInHtml(
      input
    );
    expect(output).not.toContain('</p> <p>');
  });

  it('should skip spacing normalization inside PRE blocks', () => {
    const input = '<pre><code>line1\nline2</code></pre>';
    const output = (component as ComponentWithPrivates).normalizeSpacingInHtml(
      input
    );
    expect(output).toBe(input);
  });

  it('should handle nested inline elements correctly', () => {
    const input = '<span>outer<em>inner</em>text</span>';
    const output = (component as ComponentWithPrivates).normalizeSpacingInHtml(
      input
    );
    // normalizeSpacingInHtml adds spaces between inline elements.
    expect(output).toBe('<span>outer <em>inner</em> text</span>');
  });

  it('should preserve existing spaces', () => {
    const input = '<span>word1</span> <span>word2</span>';
    const output = (component as ComponentWithPrivates).normalizeSpacingInHtml(
      input
    );
    expect(output).toBe(input);
  });

  it('should handle empty elements', () => {
    const input = '<span></span><em>test</em>';
    const output = (component as ComponentWithPrivates).normalizeSpacingInHtml(
      input
    );
    expect(output).toContain('></span> <em>');
  });

  it('should handle undefined rteString gracefully in _updateNode', () => {
    (component as ComponentWithPrivates).rteString = undefined;
    expect(() =>
      (component as ComponentWithPrivates)._updateNode()
    ).not.toThrowError();
  });

  it('should handle null rteString gracefully in _updateNode', () => {
    (component as ComponentWithPrivates).rteString = null;
    expect(() =>
      (component as ComponentWithPrivates)._updateNode()
    ).not.toThrowError();
  });

  it('should handle empty rteString gracefully in _updateNode', () => {
    component.rteString = '';
    expect(() =>
      (component as ComponentWithPrivates)._updateNode()
    ).not.toThrowError();
  });

  it('should return correct values from decodeHtmlEntities', () => {
    expect(component.decodeHtmlEntities('&lt;test&gt;')).toBe('<test>');
    expect(component.decodeHtmlEntities('&amp;')).toBe('&');
    expect(component.decodeHtmlEntities('normal text')).toBe('normal text');
  });

  it('should initialize with correct default values', () => {
    expect(component.highlightIdToSentenceText).toEqual({});
    expect(component.wrapped).toBe(false);
    expect(component.previousHighlightedElementId).toBeUndefined();
    expect(component.backgroundColorOfHighlightedSentence).toBe('#f3d140');
    expect(component.index).toBe(1);
    expect(component.show).toBe(false);
  });

  it('should have correct custom Oppia tags array', () => {
    expect(component.customOppiaTags).toContain('OPPIA-NONINTERACTIVE-MATH');
    expect(component.customOppiaTags).toContain('OPPIA-NONINTERACTIVE-LINK');
    expect(component.customOppiaTags.length).toBeGreaterThan(0);
  });

  it('should return empty string for nodes with no readable text content', () => {
    const emptyNode = document.createElement('div');
    const result = component.getReadableTextFromNode(emptyNode);
    expect(result).toBe('');
  });

  it('should handle parseAndConvertLatex basic conversions', () => {
    expect(component.parseAndConvertLatex('\\frac{1}{2}')).toBe('1/2');
    expect(component.parseAndConvertLatex('\\times')).toBe('×');
    expect(component.parseAndConvertLatex('\\div')).toBe('÷');
    expect(component.parseAndConvertLatex('simple text')).toBe('simple text');
  });

  describe('getReadableTextFromNode', () => {
    it('should return text content for text nodes', () => {
      const textNode = document.createTextNode('Hello world');
      expect(component.getReadableTextFromNode(textNode)).toBe('Hello world');
    });

    it('should return text content for STRONG elements', () => {
      const strongNode = document.createElement('strong');
      strongNode.textContent = 'Bold text';
      expect(component.getReadableTextFromNode(strongNode)).toBe('Bold text');
    });

    it('should return text content for EM elements', () => {
      const emNode = document.createElement('em');
      emNode.textContent = 'Italic text';
      expect(component.getReadableTextFromNode(emNode)).toBe('Italic text');
    });

    it('should decode and parse OPPIA-NONINTERACTIVE-SKILLREVIEW', () => {
      const skillNode = document.createElement(
        'oppia-noninteractive-skillreview'
      );
      skillNode.setAttribute('text-with-value', '&quot;Review skills&quot;');
      expect(component.getReadableTextFromNode(skillNode)).toBe(
        'Review skills'
      );
    });

    it('should decode and parse OPPIA-NONINTERACTIVE-LINK', () => {
      const linkNode = document.createElement('oppia-noninteractive-link');
      linkNode.setAttribute('text-with-value', '&quot;Click here&quot;');
      expect(component.getReadableTextFromNode(linkNode)).toBe('Click here');
    });

    it('should parse latex from OPPIA-NONINTERACTIVE-MATH', () => {
      const mathNode = document.createElement('oppia-noninteractive-math');
      mathNode.setAttribute(
        'math_content-with-value',
        '{&quot;raw_latex&quot;: &quot;x^2&quot;}'
      );
      spyOn(component, 'parseAndConvertLatex').and.returnValue('x squared');
      expect(component.getReadableTextFromNode(mathNode)).toBe('x squared');
    });

    it('should return empty string for nodes with no text content', () => {
      const emptyNode = document.createElement('div');
      expect(component.getReadableTextFromNode(emptyNode)).toBe('');
    });
  });

  describe('traverseNodeAndWrapSpanTags', () => {
    it('should wrap text nodes in span tags', () => {
      const textNode = document.createTextNode('Hello. World.');
      const result = component.traverseNodeAndWrapSpanTags(textNode, /[.!?]/);
      expect(Array.isArray(result)).toBe(true);
      expect((result as Text[]).length).toBeGreaterThan(0);
    });

    it('should handle DIV nodes and wrap children', () => {
      const divNode = document.createElement('div');
      divNode.appendChild(document.createTextNode('Test sentence.'));
      expect(
        component.traverseNodeAndWrapSpanTags(divNode, /[.!?]/)
      ).toBeDefined();
    });

    it('should handle P tags', () => {
      const pNode = document.createElement('p');
      pNode.appendChild(document.createTextNode('Paragraph text.'));
      expect(
        component.traverseNodeAndWrapSpanTags(pNode, /[.!?]/)
      ).toBeDefined();
    });

    it('should handle LI tags', () => {
      const liNode = document.createElement('li');
      liNode.appendChild(document.createTextNode('List item.'));
      expect(
        component.traverseNodeAndWrapSpanTags(liNode, /[.!?]/)
      ).toBeDefined();
    });

    it('should preserve custom Oppia tags', () => {
      const mathNode = document.createElement('oppia-noninteractive-math');
      mathNode.setAttribute('math_content-with-value', '&quot;test&quot;');
      const result = component.traverseNodeAndWrapSpanTags(mathNode, /[.!?]/);
      expect(Array.isArray(result)).toBe(true);
      expect((result as Node[])[0]).toBe(mathNode);
    });

    it('should avoid unnecessary nesting', () => {
      const strongOuter = document.createElement('strong');
      const strongInner = document.createElement('strong');
      strongInner.textContent = 'Bold text.';
      strongOuter.appendChild(strongInner);
      const result = component.traverseNodeAndWrapSpanTags(
        strongOuter,
        /[.!?]/
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should preserve trailing text without punctuation', () => {
      const pNode = document.createElement('p');
      pNode.innerHTML = 'Text with punctuation. Trailing text';
      expect(
        component.traverseNodeAndWrapSpanTags(pNode, /[.!?]/)
      ).toBeDefined();
    });
  });

  describe('updateAutomatedVoiceoversAudioOffsets', () => {
    it('should update audio offsets when available', () => {
      const mockOffsets = {sentence1: 100, sentence2: 200};
      spyOn(
        entityVoiceoversService,
        'getActiveEntityVoiceovers'
      ).and.returnValue({
        automatedVoiceoversAudioOffsetsMsecs: mockOffsets,
      } as Partial<EntityVoiceovers>);
      spyOn(
        automaticVoiceoverHighlightService,
        'setAutomatedVoiceoversAudioOffsets'
      );
      spyOn(
        automaticVoiceoverHighlightService,
        'getSentencesToHighlightForTimeRanges'
      );

      component.updateAutomatedVoiceoversAudioOffsets();

      expect(
        automaticVoiceoverHighlightService.setAutomatedVoiceoversAudioOffsets
      ).toHaveBeenCalledWith(mockOffsets);
      expect(
        automaticVoiceoverHighlightService.getSentencesToHighlightForTimeRanges
      ).toHaveBeenCalled();
    });

    it('should return early when no offsets are available', () => {
      spyOn(
        entityVoiceoversService,
        'getActiveEntityVoiceovers'
      ).and.returnValue({
        automatedVoiceoversAudioOffsetsMsecs: {},
      } as Partial<EntityVoiceovers>);
      spyOn(
        automaticVoiceoverHighlightService,
        'setAutomatedVoiceoversAudioOffsets'
      );
      component.updateAutomatedVoiceoversAudioOffsets();
      expect(
        automaticVoiceoverHighlightService.setAutomatedVoiceoversAudioOffsets
      ).not.toHaveBeenCalled();
    });

    it('should handle null voiceovers gracefully', () => {
      spyOn(
        entityVoiceoversService,
        'getActiveEntityVoiceovers'
      ).and.returnValue(null);
      spyOn(
        automaticVoiceoverHighlightService,
        'setAutomatedVoiceoversAudioOffsets'
      );
      component.updateAutomatedVoiceoversAudioOffsets();
      expect(
        automaticVoiceoverHighlightService.setAutomatedVoiceoversAudioOffsets
      ).not.toHaveBeenCalled();
    });
  });

  describe('wrapSentencesInSpansForHighlighting', () => {
    it('should return original html when already wrapped', () => {
      const html = '<p>Single sentence.</p>';
      component.wrapped = true;
      expect(component.wrapSentencesInSpansForHighlighting(html)).toBe(html);
    });

    it('should wrap multiple sentences with highlight IDs', () => {
      const html = '<p>First sentence. Second sentence.</p>';
      const result = component.wrapSentencesInSpansForHighlighting(html);
      expect(result).toContain('id="highlightBlock1"');
      expect(result).toContain('First sentence');
    });

    it('should handle math tags without splitting', () => {
      const html =
        '<p>Text <oppia-noninteractive-math math_content-with-value="&quot;x^2&quot;"></oppia-noninteractive-math> more text.</p>';
      const result = component.wrapSentencesInSpansForHighlighting(html);
      expect(result).toContain('oppia-noninteractive-math');
    });

    it('should handle skillreview tags', () => {
      const html =
        '<p>Review <oppia-noninteractive-skillreview text-with-value="&quot;skills&quot;"></oppia-noninteractive-skillreview> here.</p>';
      const result = component.wrapSentencesInSpansForHighlighting(html);
      expect(result).toContain('oppia-noninteractive-skillreview');
    });

    it('should handle link tags', () => {
      const html =
        '<p>Click <oppia-noninteractive-link text-with-value="&quot;here&quot;"></oppia-noninteractive-link> to continue.</p>';
      const result = component.wrapSentencesInSpansForHighlighting(html);
      expect(result).toContain('oppia-noninteractive-link');
    });
  });

  describe('highlightSentenceDuringVoiceoverPlay', () => {
    it('should highlight sentence when voiceover is playing', fakeAsync(() => {
      // Test the highlighting logic by mocking document.getElementById
      spyOn(
        component,
        'isManualVoiceoverAvailableForActiveContent'
      ).and.returnValue(false);
      spyOn(component, 'isInPlayerOrPreviewPage').and.returnValue(true);
      spyOn(audioplayerService, 'isPlaying').and.returnValue(true);
      spyOn(
        automaticVoiceoverHighlightService,
        'getCurrentSentenceIdToHighlight'
      ).and.returnValue('highlightBlock1');

      // Create a mock element to verify highlighting.
      const mockElement = document.createElement('span');
      mockElement.id = 'highlightBlock1';
      mockElement.textContent = 'Test sentence.';

      const getElementSpy = spyOn(document, 'getElementById').and.returnValue(
        mockElement
      );

      component.highlightSentenceDuringVoiceoverPlay();

      // Verify the method was called with correct ID.
      expect(getElementSpy).toHaveBeenCalledWith('highlightBlock1');
      // Verify the element was highlighted.
      expect(mockElement.style.backgroundColor).toBe('rgb(243, 209, 64)');
      // Verify state was updated.
      expect(component.previousHighlightedElementId).toBe('highlightBlock1');
    }));

    it('should clear highlight when voiceover is not playing', fakeAsync(() => {
      spyOn(
        component,
        'isManualVoiceoverAvailableForActiveContent'
      ).and.returnValue(false);
      spyOn(component, 'isInPlayerOrPreviewPage').and.returnValue(true);
      spyOn(audioplayerService, 'isPlaying').and.returnValue(false);

      // Create a mock element that's currently highlighted.
      const mockElement = document.createElement('span');
      mockElement.id = 'highlightBlock1';
      mockElement.style.backgroundColor = 'rgb(243, 209, 64)';

      // Set up component state as if element was previously highlighted.
      component.previousHighlightedElementId = 'highlightBlock1';

      const getElementSpy = spyOn(document, 'getElementById').and.returnValue(
        mockElement
      );

      component.highlightSentenceDuringVoiceoverPlay();

      // Verify highlight was cleared.
      expect(getElementSpy).toHaveBeenCalledWith('highlightBlock1');
      expect(mockElement.style.backgroundColor).toBe('');
      // Verify state was reset.
      expect(component.previousHighlightedElementId).toBeUndefined();
    }));

    it('should switch highlight from previous to current element', fakeAsync(() => {
      spyOn(
        component,
        'isManualVoiceoverAvailableForActiveContent'
      ).and.returnValue(false);
      spyOn(component, 'isInPlayerOrPreviewPage').and.returnValue(true);
      spyOn(audioplayerService, 'isPlaying').and.returnValue(true);
      spyOn(
        automaticVoiceoverHighlightService,
        'getCurrentSentenceIdToHighlight'
      ).and.returnValue('highlightBlock2');

      // Create mock elements.
      const previousElement = document.createElement('span');
      previousElement.id = 'highlightBlock1';
      previousElement.style.backgroundColor = 'rgb(243, 209, 64)';

      const currentElement = document.createElement('span');
      currentElement.id = 'highlightBlock2';

      // Set up component state.
      component.previousHighlightedElementId = 'highlightBlock1';

      spyOn(document, 'getElementById').and.callFake((id: string) => {
        if (id === 'highlightBlock1') return previousElement;
        if (id === 'highlightBlock2') return currentElement;
        return null;
      });

      component.highlightSentenceDuringVoiceoverPlay();

      // Verify previous highlight was removed.
      expect(previousElement.style.backgroundColor).toBe('');
      // Verify new element was highlighted.
      expect(currentElement.style.backgroundColor).toBe('rgb(243, 209, 64)');
      // Verify state was updated.
      expect(component.previousHighlightedElementId).toBe('highlightBlock2');
    }));

    it('should not change highlight when previous and current are the same', fakeAsync(() => {
      spyOn(
        component,
        'isManualVoiceoverAvailableForActiveContent'
      ).and.returnValue(false);
      spyOn(component, 'isInPlayerOrPreviewPage').and.returnValue(true);
      spyOn(audioplayerService, 'isPlaying').and.returnValue(true);
      spyOn(
        automaticVoiceoverHighlightService,
        'getCurrentSentenceIdToHighlight'
      ).and.returnValue('highlightBlock1');

      const mockElement = document.createElement('span');
      mockElement.id = 'highlightBlock1';
      mockElement.style.backgroundColor = 'rgb(243, 209, 64)';

      component.previousHighlightedElementId = 'highlightBlock1';

      spyOn(document, 'getElementById').and.returnValue(mockElement);

      component.highlightSentenceDuringVoiceoverPlay();

      // Highlight should remain
      expect(mockElement.style.backgroundColor).toBe('rgb(243, 209, 64)');
      expect(component.previousHighlightedElementId).toBe('highlightBlock1');
    }));
  });

  describe('ngOnChanges', () => {
    it('should update node and highlight map when rteString changes', () => {
      const changes: SimpleChanges = {
        rteString: {
          currentValue: '<p>New content.</p>',
          previousValue: '<p>Old content.</p>',
          firstChange: false,
          isFirstChange: () => false,
        },
      };
      spyOn<any>(component, '_updateNode');
      spyOn(automaticVoiceoverHighlightService, 'setHighlightIdToSentenceMap');
      component.ngOnChanges(changes);
      expect(component['_updateNode']).toHaveBeenCalled();
    });

    it('should not update when rteString has not changed', () => {
      const changes: SimpleChanges = {
        contentId: {
          currentValue: 'new_id',
          previousValue: 'old_id',
          firstChange: false,
          isFirstChange: () => false,
        },
      };
      spyOn<any>(component, '_updateNode');
      component.ngOnChanges(changes);
      // _updateNode should NOT be called when only contentId changes
      expect(component['_updateNode']).not.toHaveBeenCalled();
    });

    it('should normalize spacing when automatic voiceover highlight is disabled', fakeAsync(() => {
      spyOnProperty(platformFeatureService, 'status', 'get').and.returnValue({
        AutomaticVoiceoverRegenerationFromExp: {isEnabled: false},
      } as FeatureStatusChecker);
      const normalizeSpy = spyOn(
        component,
        'normalizeSpacingInHtml'
      ).and.callThrough();
      const wrapSpy = spyOn(component, 'wrapSentencesInSpansForHighlighting');
      component.rteString =
        '<p>This is a long    time. <em>Incidentally</em>, it is also a bad time.</p>';
      const changes: SimpleChanges = {
        rteString: {
          previousValue: '',
          currentValue: component.rteString,
          firstChange: true,
          isFirstChange: () => true,
        },
      };
      // Initialize the view first to ensure template portals are available.
      fixture.detectChanges();
      component.ngOnChanges(changes);
      tick();
      fixture.detectChanges();
      expect(component.rteString).toContain('time. <em>Incidentally</em>');
      expect(normalizeSpy).toHaveBeenCalled();
      expect(wrapSpy).not.toHaveBeenCalled();
      discardPeriodicTasks();
    }));

    it('should wrap sentences when automatic voiceover highlight is enabled', fakeAsync(() => {
      spyOnProperty(platformFeatureService, 'status', 'get').and.returnValue({
        AutomaticVoiceoverRegenerationFromExp: {isEnabled: true},
      } as FeatureStatusChecker);
      const normalizeSpy = spyOn(component, 'normalizeSpacingInHtml');
      const wrapSpy = spyOn(
        component,
        'wrapSentencesInSpansForHighlighting'
      ).and.callThrough();
      component.rteString = '<p>Hello world.</p>';
      const changes: SimpleChanges = {
        rteString: {
          previousValue: '',
          currentValue: component.rteString,
          firstChange: true,
          isFirstChange: () => true,
        },
      };
      // Initialize the view first to ensure template portals are available.
      fixture.detectChanges();
      component.ngOnChanges(changes);
      tick();
      fixture.detectChanges();
      expect(wrapSpy).toHaveBeenCalledWith('<p>Hello world.</p>');
      expect(normalizeSpy).not.toHaveBeenCalled();
      discardPeriodicTasks();
    }));

    it('should handle node with null parentElement gracefully', fakeAsync(() => {
      const changes: SimpleChanges = {
        rteString: {
          previousValue: '',
          currentValue: '<p>Test</p>',
          firstChange: true,
          isFirstChange: () => true,
        },
      };

      // Create a text node with null parent
      const orphanNode = document.createTextNode('orphan');
      Object.defineProperty(orphanNode, 'parentElement', {
        value: null,
        writable: false,
      });

      spyOn(component.elementRef.nativeElement, 'childNodes').and.returnValue([
        orphanNode,
      ]);

      component.rteString = '<p>Test</p>';
      fixture.detectChanges();

      // Should not throw error.
      expect(() => component.ngOnChanges(changes)).not.toThrowError();
      tick();
      discardPeriodicTasks();
    }));
  });

  // Tests for TypeScript strict mode null safety fixes.
  describe('Null safety for TypeScript strict mode', () => {
    it('should return empty string when LINK has no text-with-value attribute', () => {
      const linkNode = document.createElement('oppia-noninteractive-link');
      expect(component.getReadableTextFromNode(linkNode)).toBe('');
    });

    it('should return empty string when MATH has no math_content-with-value', () => {
      const mathNode = document.createElement('oppia-noninteractive-math');
      expect(component.getReadableTextFromNode(mathNode)).toBe('');
    });

    it('should return empty string when math content has no raw_latex', () => {
      const mathNode = document.createElement('oppia-noninteractive-math');
      mathNode.setAttribute(
        'math_content-with-value',
        '{&quot;svg_filename&quot;: &quot;test.svg&quot;}'
      );
      expect(component.getReadableTextFromNode(mathNode)).toBe('');
    });

    it('should handle null element when highlighting during voiceover', fakeAsync(() => {
      spyOn(
        component,
        'isManualVoiceoverAvailableForActiveContent'
      ).and.returnValue(false);
      spyOn(component, 'isInPlayerOrPreviewPage').and.returnValue(true);
      spyOn(audioplayerService, 'isPlaying').and.returnValue(true);
      spyOn(
        automaticVoiceoverHighlightService,
        'getCurrentSentenceIdToHighlight'
      ).and.returnValue('nonexistent');

      spyOn(document, 'getElementById').and.returnValue(null);

      expect(() =>
        component.highlightSentenceDuringVoiceoverPlay()
      ).not.toThrowError();
    }));

    it('should handle null previous element when clearing highlight', fakeAsync(() => {
      spyOn(
        component,
        'isManualVoiceoverAvailableForActiveContent'
      ).and.returnValue(false);
      spyOn(component, 'isInPlayerOrPreviewPage').and.returnValue(true);
      spyOn(audioplayerService, 'isPlaying').and.returnValue(false);

      component.previousHighlightedElementId = 'nonexistent';
      spyOn(document, 'getElementById').and.returnValue(null);

      expect(() =>
        component.highlightSentenceDuringVoiceoverPlay()
      ).not.toThrowError();
      expect(component.previousHighlightedElementId).toBeUndefined();
    }));

    it('should return undefined when portal does not exist', () => {
      const node = {
        nodeType: 'component' as const,
        selector: 'oppia-noninteractive-unknown',
        attrs: {},
      };

      fixture.detectChanges();
      const result = (
        component as unknown as {
          _getTemplatePortal: (node: unknown) => unknown;
        }
      )._getTemplatePortal(node);
      expect(result).toBeUndefined();
    });

    it('should handle node with null parentElement in ngOnChanges', fakeAsync(() => {
      const changes: SimpleChanges = {
        rteString: {
          previousValue: '',
          currentValue: '<p>Test</p>',
          firstChange: true,
          isFirstChange: () => true,
        },
      };

      const orphanNode = document.createTextNode('orphan');
      Object.defineProperty(orphanNode, 'parentElement', {
        value: null,
        writable: false,
      });

      spyOn(component.elementRef.nativeElement, 'childNodes').and.returnValue([
        orphanNode,
      ]);
      component.rteString = '<p>Test</p>';
      fixture.detectChanges();

      expect(() => component.ngOnChanges(changes)).not.toThrowError();
      tick();
      discardPeriodicTasks();
    }));

    it('should clear highlight interval in ngOnDestroy', fakeAsync(() => {
      component.highlightIntervalId = window.setInterval(() => {}, 100);
      expect(component.highlightIntervalId).toBeDefined();

      component.ngOnDestroy();

      expect(component.highlightIntervalId).toBeUndefined();
      discardPeriodicTasks();
    }));
  });
});
