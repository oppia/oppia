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
import {OppiaRteParserService} from 'services/oppia-rte-parser.service';
import {RichTextComponentsModule} from './rich-text-components.module';
import {RteOutputDisplayComponent} from './rte-output-display.component';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {FeatureStatusChecker} from 'domain/feature-flag/feature-status-summary.model';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {AutomaticVoiceoverHighlightService} from '../../core/templates/services/automatic-voiceover-highlight-service';
import {EntityVoiceoversService} from '../../core/templates/services/entity-voiceovers.services';
import {ContextService} from '../../core/templates/services/context.service';
import {TranslationTabActiveContentIdService} from '../../core/templates/pages/exploration-editor-page/translation-tab/services/translation-tab-active-content-id.service';
import {VoiceoverPlayerService} from '../../core/templates/pages/exploration-player-page/services/voiceover-player.service';

class MockPlatformFeatureService {
  get status(): object {
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
  let contextService: ContextService;
  let translationTabActiveContentIdService: TranslationTabActiveContentIdService;
  let voiceoverPlayerService: VoiceoverPlayerService;

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
    contextService = TestBed.inject(ContextService);
    entityVoiceoversService = TestBed.inject(EntityVoiceoversService);
    fixture = TestBed.createComponent(RteOutputDisplayComponent);
    component = fixture.componentInstance;
  }));

  // NOTE: Debugging might be a bit confusing sometimes, especially if this the
  // first time you are looking at component tests that test html. To access
  // the html of the component, you can do so by using
  // fixture.nativeElement.innerHTML. fixture.nativeElement is of type any
  // because angular supports multiple platforms including DOM. You can typecast
  // it to HTMLElement to get autocomplete and intellisense.
  it('should display a rte string', () => {
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

    const attrs = rteComponentDe.query(
      By.css('oppia-noninteractive-link')
    ).attributes;
    expect(attrs['url-with-value']).toBe('"https://oppia.org"');
    expect(attrs['text-with-value']).toBe('"Oppia"');
    const link = rteComponentDe.query(By.css('a')).nativeElement;
    expect(link.attributes.href.nodeValue).toEqual('https://oppia.org');
    // eslint-disable-next-line oppia/no-inner-html
    expect(link.innerHTML.replace(/\s/g, '')).toEqual('Oppia');
  });

  it('should report errors when parsing', fakeAsync(() => {
    spyOn(rteParserService, 'constructFromDomParser').and.throwError('error');
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
      '<p><span id="highlightBlock1">Hi</span><em><span ' +
      'id="highlightBlock2">Hello</span></em><span id="highlightBlock3">' +
      'Hello</span></p>';

    let outputWrappedString =
      component.wrapSentencesInSpansForHighlighting(rteString);
    expect(outputWrappedString).toBe(expectedOutputWrappedString);
  }));

  it('should correctly set data for sentence highlighting during voiceover playback in ngOnInit', fakeAsync(() => {
    let rteString = '<p>Hi<em>Hello</em>Hello</p>';
    let regenerateVoiceoverFeatureSpy = spyOn(
      component,
      'isAutomaticVoiceoverRegenerationFromExpFeatureEnabled'
    );
    spyOn(
      automaticVoiceoverHighlightService,
      'setAutomatedVoiceoversAudioOffsets'
    );
    spyOn(entityVoiceoversService, 'getActiveEntityVoiceovers');

    regenerateVoiceoverFeatureSpy.and.returnValue(false);
    component.ngOnInit();
    tick();
    flush();
    discardPeriodicTasks();

    expect(
      automaticVoiceoverHighlightService.setAutomatedVoiceoversAudioOffsets
    ).not.toHaveBeenCalled();
    expect(
      entityVoiceoversService.getActiveEntityVoiceovers
    ).not.toHaveBeenCalled();

    regenerateVoiceoverFeatureSpy.and.returnValue(true);
    component.ngOnInit();
    tick(1000);
    flush();
    discardPeriodicTasks();

    expect(
      automaticVoiceoverHighlightService.setAutomatedVoiceoversAudioOffsets
    ).toHaveBeenCalled();
    expect(
      entityVoiceoversService.getActiveEntityVoiceovers
    ).toHaveBeenCalled();
  }));

  it('should correctly set data for sentence highlighting during voiceover playback in ngOnChanges', fakeAsync(() => {
    let rteString = '<p>Hi<em>Hello</em>Hello</p>';
    let regenerateVoiceoverFeatureSpy = spyOn(
      component,
      'isAutomaticVoiceoverRegenerationFromExpFeatureEnabled'
    );
    spyOn(automaticVoiceoverHighlightService, 'setHighlightIdToSenetnceMap');
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
      automaticVoiceoverHighlightService.setHighlightIdToSenetnceMap
    ).not.toHaveBeenCalled();
    expect(
      automaticVoiceoverHighlightService.setActiveContentId
    ).not.toHaveBeenCalled();

    fixture.detectChanges();

    regenerateVoiceoverFeatureSpy.and.returnValue(true);
    component.ngOnChanges(changes);
    tick(1000);

    expect(
      automaticVoiceoverHighlightService.setHighlightIdToSenetnceMap
    ).toHaveBeenCalled();
    expect(
      automaticVoiceoverHighlightService.setActiveContentId
    ).toHaveBeenCalled();
  }));

  it('should be able to get contentId for specific pages', fakeAsync(() => {
    let ttacSpy = spyOn(
      translationTabActiveContentIdService,
      'getActiveContentId'
    );
    let vpsSpy = spyOn(voiceoverPlayerService, 'getActiveContentId');
    let explorationPlayerPageSpy = spyOn(
      contextService,
      'isInExplorationPlayerPage'
    );
    let explorationEditorPageSpy = spyOn(
      contextService,
      'isInExplorationEditorPage'
    );
    let editorTabContextSpy = spyOn(contextService, 'getEditorTabContext');

    // Exploration editor page (translation tab).
    explorationPlayerPageSpy.and.returnValue(false);
    explorationEditorPageSpy.and.returnValue(true);
    editorTabContextSpy.and.returnValue('editor');
    vpsSpy.and.returnValue('undefined');
    ttacSpy.and.returnValue('contentId');

    expect(component.getActiveContentId()).toBe('contentId');

    // Exploration editor page (preview tab).
    explorationPlayerPageSpy.and.returnValue(false);
    explorationEditorPageSpy.and.returnValue(true);
    editorTabContextSpy.and.returnValue('preview');
    vpsSpy.and.returnValue('contentId');
    ttacSpy.and.returnValue('undefined');

    expect(component.getActiveContentId()).toBe('contentId');

    // Exploration player page.
    explorationPlayerPageSpy.and.returnValue(true);
    vpsSpy.and.returnValue('contentId');
    ttacSpy.and.returnValue('undefined');

    expect(component.getActiveContentId()).toBe('contentId');
  }));
});
