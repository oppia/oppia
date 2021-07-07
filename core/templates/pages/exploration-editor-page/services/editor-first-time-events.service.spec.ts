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
 * @fileoverview Unit tests for EditorFirstTimeEventsService.
 */
import { TestBed } from '@angular/core/testing';
import { EditorFirstTimeEventsService } from
  'pages/exploration-editor-page/services/editor-first-time-events.service';
import { SiteAnalyticsService } from
  'services/site-analytics.service';

describe('Editor First Time Events Service', () => {
  let eftes: EditorFirstTimeEventsService;
  let sas: SiteAnalyticsService;

  beforeEach(() => {
    eftes = TestBed.inject(EditorFirstTimeEventsService);
    sas = TestBed.inject(SiteAnalyticsService);
  });

  it('should intialize register events', () => {
    eftes.initRegisterEvents('0');
  });

  describe('registerEditorFirstEntryEvent', () => {
    it('should not call site analytics service if init is not called', () => {
      const sasSpy = spyOn(sas, 'registerEditorFirstEntryEvent').and
        .callThrough();

      eftes.registerEditorFirstEntryEvent();
      expect(sasSpy).not.toHaveBeenCalled();
    });

    it('should call site analytics service when init was called before',
      () => {
        const sasSpy = spyOn(sas, 'registerEditorFirstEntryEvent').and
          .callThrough();
        eftes.initRegisterEvents('0');
        eftes.registerEditorFirstEntryEvent();
        expect(sasSpy).toHaveBeenCalledWith('0');
      });

    it('should not call site analytics service if it\'s was already' +
      ' called before', () => {
      eftes.initRegisterEvents('0');
      eftes.registerEditorFirstEntryEvent();

      const sasSpy = spyOn(sas, 'registerEditorFirstEntryEvent').and
        .callThrough();
      eftes.registerEditorFirstEntryEvent();
      expect(sasSpy).not.toHaveBeenCalled();
    });
  });

  describe('registerFirstOpenContentBoxEvent', () => {
    it('should not call site analytics service if init is not called', () => {
      const sasSpy = spyOn(sas, 'registerFirstOpenContentBoxEvent').and
        .callThrough();

      eftes.registerFirstOpenContentBoxEvent();
      expect(sasSpy).not.toHaveBeenCalled();
    });

    it('should call site analytics service when init was called before',
      () => {
        const sasSpy = spyOn(sas, 'registerFirstOpenContentBoxEvent').and
          .callThrough();
        eftes.initRegisterEvents('0');
        eftes.registerFirstOpenContentBoxEvent();
        expect(sasSpy).toHaveBeenCalledWith('0');
      });

    it('should not call site analytics service if it\'s was already' +
      ' called before', () => {
      eftes.initRegisterEvents('0');
      eftes.registerFirstOpenContentBoxEvent();

      const sasSpy = spyOn(sas, 'registerFirstOpenContentBoxEvent').and
        .callThrough();
      eftes.registerFirstOpenContentBoxEvent();
      expect(sasSpy).not.toHaveBeenCalled();
    });
  });

  describe('registerFirstSaveContentEvent', () => {
    it('should not call site analytics service if init is not called', () => {
      const sasSpy = spyOn(sas, 'registerFirstSaveContentEvent').and
        .callThrough();

      eftes.registerFirstSaveContentEvent();
      expect(sasSpy).not.toHaveBeenCalled();
    });

    it('should call site analytics service when init was called before',
      () => {
        const sasSpy = spyOn(sas, 'registerFirstSaveContentEvent').and
          .callThrough();
        eftes.initRegisterEvents('0');
        eftes.registerFirstSaveContentEvent();
        expect(sasSpy).toHaveBeenCalledWith('0');
      });

    it('should not call site analytics service if it\'s was already' +
      ' called before', () => {
      eftes.initRegisterEvents('0');
      eftes.registerFirstSaveContentEvent();

      const sasSpy = spyOn(sas, 'registerFirstSaveContentEvent').and
        .callThrough();
      eftes.registerFirstSaveContentEvent();
      expect(sasSpy).not.toHaveBeenCalled();
    });
  });

  describe('registerFirstClickAddInteractionEvent', () => {
    it('should not call site analytics service if init is not called', () => {
      const sasSpy = spyOn(sas, 'registerFirstClickAddInteractionEvent').and
        .callThrough();

      eftes.registerFirstClickAddInteractionEvent();
      expect(sasSpy).not.toHaveBeenCalled();
    });

    it('should call site analytics service when init was called before',
      () => {
        const sasSpy = spyOn(sas, 'registerFirstClickAddInteractionEvent').and
          .callThrough();
        eftes.initRegisterEvents('0');
        eftes.registerFirstClickAddInteractionEvent();
        expect(sasSpy).toHaveBeenCalledWith('0');
      });

    it('should not call site analytics service if it\'s was already' +
      ' called before', () => {
      eftes.initRegisterEvents('0');
      eftes.registerFirstClickAddInteractionEvent();

      const sasSpy = spyOn(sas, 'registerFirstClickAddInteractionEvent').and
        .callThrough();
      eftes.registerFirstClickAddInteractionEvent();
      expect(sasSpy).not.toHaveBeenCalled();
    });
  });

  describe('registerFirstSelectInteractionTypeEvent', () => {
    it('should not call site analytics service if init is not called', () => {
      const sasSpy = spyOn(sas, 'registerFirstSelectInteractionTypeEvent').and
        .callThrough();

      eftes.registerFirstSelectInteractionTypeEvent();
      expect(sasSpy).not.toHaveBeenCalled();
    });

    it('should call site analytics service when init was called before', () => {
      const sasSpy = spyOn(sas, 'registerFirstSelectInteractionTypeEvent').and
        .callThrough();
      eftes.initRegisterEvents('0');
      eftes.registerFirstSelectInteractionTypeEvent();
      expect(sasSpy).toHaveBeenCalledWith('0');
    });

    it('should not call site analytics service if it\'s was already' +
      ' called before', () => {
      eftes.initRegisterEvents('0');
      eftes.registerFirstSelectInteractionTypeEvent();

      const sasSpy = spyOn(sas, 'registerFirstSelectInteractionTypeEvent').and
        .callThrough();
      eftes.registerFirstSelectInteractionTypeEvent();
      expect(sasSpy).not.toHaveBeenCalled();
    });
  });

  describe('registerFirstSaveInteractionEvent', () => {
    it('should not call site analytics service if init is not called', () => {
      const sasSpy = spyOn(sas, 'registerFirstSaveInteractionEvent').and
        .callThrough();

      eftes.registerFirstSaveInteractionEvent();
      expect(sasSpy).not.toHaveBeenCalled();
    });

    it('should call site analytics service when init was called before',
      () => {
        const sasSpy = spyOn(sas, 'registerFirstSaveInteractionEvent').and
          .callThrough();
        eftes.initRegisterEvents('0');
        eftes.registerFirstSaveInteractionEvent();
        expect(sasSpy).toHaveBeenCalledWith('0');
      });

    it('should not call site analytics service if it\'s was already' +
      ' called before', () => {
      eftes.initRegisterEvents('0');
      eftes.registerFirstSaveInteractionEvent();

      const sasSpy = spyOn(sas, 'registerFirstSaveInteractionEvent').and
        .callThrough();
      eftes.registerFirstSaveInteractionEvent();
      expect(sasSpy).not.toHaveBeenCalled();
    });
  });

  describe('registerFirstSaveRuleEvent', () => {
    it('should not call site analytics service if init is not called', () => {
      const sasSpy = spyOn(sas, 'registerFirstSaveRuleEvent').and
        .callThrough();

      eftes.registerFirstSaveRuleEvent();
      expect(sasSpy).not.toHaveBeenCalled();
    });

    it('should call site analytics service when init was called before',
      () => {
        const sasSpy = spyOn(sas, 'registerFirstSaveRuleEvent').and
          .callThrough();
        eftes.initRegisterEvents('0');
        eftes.registerFirstSaveRuleEvent();
        expect(sasSpy).toHaveBeenCalledWith('0');
      });

    it('should not call site analytics service if it\'s was already' +
      ' called before', () => {
      eftes.initRegisterEvents('0');
      eftes.registerFirstSaveRuleEvent();

      const sasSpy = spyOn(sas, 'registerFirstSaveRuleEvent').and
        .callThrough();
      eftes.registerFirstSaveRuleEvent();
      expect(sasSpy).not.toHaveBeenCalled();
    });
  });

  describe('registerFirstCreateSecondStateEvent', () => {
    it('should not call site analytics service if init is not called', () => {
      const sasSpy = spyOn(sas, 'registerFirstCreateSecondStateEvent').and
        .callThrough();

      eftes.registerFirstCreateSecondStateEvent();
      expect(sasSpy).not.toHaveBeenCalled();
    });

    it('should call site analytics service when init was called before',
      () => {
        const sasSpy = spyOn(sas, 'registerFirstCreateSecondStateEvent').and
          .callThrough();
        eftes.initRegisterEvents('0');
        eftes.registerFirstCreateSecondStateEvent();
        expect(sasSpy).toHaveBeenCalledWith('0');
      });

    it('should not call site analytics service if it\'s was already' +
      ' called before', () => {
      eftes.initRegisterEvents('0');
      eftes.registerFirstCreateSecondStateEvent();

      const sasSpy = spyOn(sas, 'registerFirstCreateSecondStateEvent').and
        .callThrough();
      eftes.registerFirstCreateSecondStateEvent();
      expect(sasSpy).not.toHaveBeenCalled();
    });
  });
});
