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
 * @fileoverview Unit tests for the DragAndDropSortInput interaction.
 */

import { NO_ERRORS_SCHEMA, ElementRef, QueryList } from '@angular/core';
import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { InteractiveDragAndDropSortInputComponent } from './oppia-interactive-drag-and-drop-sort-input.component';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { CdkDragDrop, CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';
import { InteractionSpecsKey } from 'pages/interaction-specs.constants';
import { DragAndDropAnswer } from 'interactions/answer-defs';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';

interface ContainerModel<T> {
  id: string;
  data: T[];
  index: number;
}

describe('Drag and drop sort input interactive component', () => {
  let component: InteractiveDragAndDropSortInputComponent;
  let fixture: ComponentFixture<InteractiveDragAndDropSortInputComponent>;
  let currentInteractionService: CurrentInteractionService;

  class MockInteractionAttributesExtractorService {
    getValuesFromAttributes(
        interactionId: InteractionSpecsKey, attributes: Record<string, string>
    ) {
      return {
        choices: {
          value: JSON.parse(attributes.choicesWithValue)
        },
        allowMultipleItemsInSamePosition: {
          value: JSON.parse(
            attributes.allowMultipleItemsInSamePositionWithValue)
        }
      };
    }
  }

  class MockCurrentInteractionService {
    onSubmit(
        answer: DragAndDropAnswer, rulesService: CurrentInteractionService
    ) {}

    registerCurrentInteraction(
        submitAnswerFn: Function, validateExpressionFn: Function) {
      submitAnswerFn();
    }
  }
  class DragAndDropEventClass<T> {
    createInContainerEvent(
        containerId: string, data: T[], fromIndex: number, toIndex: number
    ): CdkDragDrop<T[], T[]> {
      const event = this.createEvent(fromIndex, toIndex);
      const container = { id: containerId, data: data };
      event.container = container as CdkDropList<T[]>;
      event.previousContainer = event.container;
      event.item = { data: data[fromIndex] } as CdkDrag<T>;
      return event;
    }

    createCrossContainerEvent(
        from: ContainerModel<T>, to: ContainerModel<T>
    ): CdkDragDrop<T[], T[]> {
      const event = this.createEvent(from.index, to.index);
      event.container = this.createContainer(to);
      event.previousContainer = this.createContainer(from);
      event.item = { data: from.data[from.index] } as CdkDrag<T>;
      return event;
    }

    private createEvent(
        previousIndex: number, currentIndex: number
    ): CdkDragDrop<T[], T[]> {
      return {
        previousIndex: previousIndex,
        currentIndex: currentIndex,
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 }
      } as CdkDragDrop<T[], T[]>;
    }

    private createContainer(
        model: ContainerModel<T>
    ): CdkDropList<T[]> {
      const container = { id: model.id, data: model.data };
      return container as CdkDropList<T[]>;
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        InteractiveDragAndDropSortInputComponent,
      ],
      providers: [
        {
          provide: InteractionAttributesExtractorService,
          useClass: MockInteractionAttributesExtractorService
        },
        {
          provide: CurrentInteractionService,
          useClass: MockCurrentInteractionService
        },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    currentInteractionService = TestBed.inject(CurrentInteractionService);
    fixture = TestBed.createComponent(InteractiveDragAndDropSortInputComponent);
    component = fixture.componentInstance;
  });

  describe('when multiple items in the same position are allowed', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(
        InteractiveDragAndDropSortInputComponent);
      component = fixture.componentInstance;
      component.choicesWithValue = '[' +
        '{' +
        '    "html": "<p>choice 1</p>",' +
        '    "contentId": "ca_choices_1"' +
        '},' +
        '{' +
        '    "html": "<p>choice 2</p>",' +
        '    "contentId": "ca_choices_2"' +
        '},' +
        '{' +
        '    "html": "<p>choice 3</p>",' +
        '    "contentId": "ca_choices_3"' +
        '},' +
        '{' +
        '    "html": "<p>choice 4</p>",' +
        '    "contentId": "ca_choices_4"' +
        '}' +
    ']';
      component.allowMultipleItemsInSamePositionWithValue = 'true';
      component.savedSolution = [
        [
          'ca_choices_1'
        ],
        [
          'ca_choices_2',
          'ca_choices_3'
        ],
        [
          'ca_choices_4'
        ]
      ];
      component.dragStarted = false;
      component.hide = [];
      component.highlightedGroup = -1;
      component.noShow = -1;
      component.rootHeight = 40;
    });

    it('should initialise component when user adds interaction', () => {
      spyOn(currentInteractionService, 'registerCurrentInteraction');

      component.ngOnInit();

      expect(component.allowMultipleItemsInSamePosition).toBe(true);
      expect(component.multipleItemsInSamePositionArray).toEqual([
        [],
        [
          '<p>choice 1</p>'
        ],
        [],
        [
          '<p>choice 2</p>',
          '<p>choice 3</p>'
        ],
        [],
        [
          '<p>choice 4</p>'
        ],
        []
      ]);
      expect(component.choices).toEqual([
        '<p>choice 1</p>',
        '<p>choice 2</p>',
        '<p>choice 3</p>',
        '<p>choice 4</p>'
      ]);
      expect(
        currentInteractionService.registerCurrentInteraction
      ).toHaveBeenCalled();
    });

    it('should make a default list of lists when user did not save a solution',
      () => {
        component.savedSolution = null;
        component.ngOnInit();

        expect(component.allowMultipleItemsInSamePosition).toBe(true);
        expect(component.multipleItemsInSamePositionArray).toEqual([
          [],
          [
            '<p>choice 1</p>'
          ],
          [],
          [
            '<p>choice 2</p>'
          ],
          [],
          [
            '<p>choice 3</p>'
          ],
          [],
          [
            '<p>choice 4</p>'
          ],
          []
        ]);
      });

    it('should move items inside same list', () => {
      component.noShow = 1;
      component.hide = [1, 2, 3, 4];
      component.dragStarted = true;

      const containerData = [
        '<p>choice 1</p>',
        '<p>choice 2</p>',
      ];
      const dragAndDropEventClass = new DragAndDropEventClass<string>();
      const dragDropEvent = dragAndDropEventClass.createInContainerEvent(
        'selectedItems', containerData, 1, 0);

      component.dropItemInAnyList(dragDropEvent);

      expect(component.noShow).toBe(-1);
      expect(component.hide).toEqual([]);
      expect(component.dragStarted).toBeFalse();
    });

    it('should throw error if story url fragment is not present', () => {
      component.choicesValue = [
        {
          html: '<p>choice 1</p>',
          contentId: null
        },
        {
          html: '<p>choice 2</p>',
          contentId: 'ca_choices_2'
        },
        {
          html: '<p>choice 3</p>',
          contentId: 'ca_choices_3'
        },
        {
          html: '<p>choice 4</p>',
          contentId: 'ca_choices_4'
        },
      ] as SubtitledHtml[];

      component.choices = [
        '<p>choice 1</p>',
        '<p>choice 2</p>',
        '<p>choice 3</p>',
        '<p>choice 4</p>'
      ];

      expect(() => {
        component.getContentIdOfHtml('<p>choice 1</p>');
      }).toThrowError('contentId cannot be null');
    });

    it('should throw error if content id not exist', () => {
      component.choicesValue = [
        {
          html: '<p>choice 1</p>',
          contentId: 'ca_choices_1'
        },
        {
          html: '<p>choice 2</p>',
          contentId: 'ca_choices_2'
        },
        {
          html: '<p>choice 3</p>',
          contentId: 'ca_choices_3'
        },
        {
          html: '<p>choice 4</p>',
          contentId: 'ca_choices_4'
        },
      ] as SubtitledHtml[];

      expect(() => {
        component.getHtmlOfContentId('ca_choices_5');
      }).toThrowError('contentId not found');
    });

    it('should move items between lists', () => {
      component.noShow = 1;
      component.hide = [1, 2, 3, 4];
      component.dragStarted = true;
      component.highlightedGroup = 1;
      component.multipleItemsInSamePositionArray = [
        [],
        [
          '<p>choice 1</p>'
        ],
        [],
        [
          '<p>choice 2</p>',
          '<p>choice 3</p>',
          '<p>choice 4</p>',
          '<p>choice 5</p>'
        ],
        [],
        [
          '<p>choice 6</p>',
          '<p>choice 7</p>',
          '<p>choice 8</p>',
        ],
        []
      ];

      const from: ContainerModel<string> = {
        id: 'availableItems',
        data: component.multipleItemsInSamePositionArray[5],
        index: 0
      };
      const to: ContainerModel<string> = {
        id: 'selectedItems',
        data: component.multipleItemsInSamePositionArray[3],
        index: 3
      };
      const dragAndDropEventClass = new DragAndDropEventClass<string>();
      const dragDropEvent = (
        dragAndDropEventClass.createCrossContainerEvent(from, to));

      component.dropItemInAnyList(dragDropEvent);

      expect(component.multipleItemsInSamePositionArray).toEqual([
        [],
        [
          '<p>choice 1</p>'
        ],
        [],
        [
          '<p>choice 2</p>',
          '<p>choice 3</p>',
          '<p>choice 4</p>',
          '<p>choice 6</p>',
          '<p>choice 5</p>'
        ],
        [],
        [
          '<p>choice 7</p>',
          '<p>choice 8</p>'
        ],
        []
      ]);
      expect(component.noShow).toBe(-1);
      expect(component.hide).toEqual([]);
      expect(component.dragStarted).toBeFalse();
      expect(component.highlightedGroup).toBe(-1);
    });

    it('should move list inside list of lists', fakeAsync(() => {
      spyOn(component, 'resetArray').and.callFake(() => {});

      component.multipleItemsInSamePositionArray = [
        [],
        [
          '<p>choice 1</p>'
        ],
        [],
        [
          '<p>choice 2</p>',
          '<p>choice 3</p>'
        ],
        []
      ];
      const dragAndDropEventClass = new DragAndDropEventClass<string[]>();
      const dragDropEvent = dragAndDropEventClass.createInContainerEvent(
        'selectedlists', component.multipleItemsInSamePositionArray, 3, 0);

      component.dropList(dragDropEvent);
      tick();

      expect(component.resetArray).toHaveBeenCalled();
    }));

    it('should remove highlighted group', () => {
      component.highlightedGroup = 1;

      component.removeHighlight();

      expect(component.highlightedGroup).toBe(-1);
    });

    it('should add highlighted group if it is not set', () => {
      component.highlightedGroup = -1;

      component.addHighlight(2);

      // Value should change, when drag is started
      // and highlighted group is not yet set.
      expect(component.highlightedGroup).toBe(2);
    });

    it('should add not highlighted group if it is already set', () => {
      component.highlightedGroup = 2;
      component.dragStarted = true;

      component.addHighlight(2);

      // Value should not change, when drag started
      // and highlighted group is already set.
      expect(component.highlightedGroup).toBe(2);
    });

    it('should set root placeholder height', () => {
      spyOn(
        fixture.elementRef.nativeElement, 'getElementsByClassName'
      ).withArgs('child-dnd-2').and.returnValue([
        {
          offsetHeight: 80
        }
      ]);

      component.rootHeight = 40;
      component.setRootPlaceHolderHeight(2);

      expect(component.rootHeight).toBe(80);
    });

    it('should hide item when drag is ended', () => {
      component.dragStarted = false;
      component.multipleItemsInSamePositionArray = [
        [],
        [
          '<p>choice 1</p>'
        ],
        [],
        [
          '<p>choice 2</p>',
          '<p>choice 3</p>'
        ],
        []
      ];

      const containerData = component.multipleItemsInSamePositionArray[1];
      const dragAndDropEventClass = new DragAndDropEventClass<string>();
      const dragDropEvent = dragAndDropEventClass.createInContainerEvent(
        'selectedItems', containerData, 0, 0);
      component.hideElement(dragDropEvent);

      expect(component.noShow).toBe(1);
      expect(component.hide).toEqual([1, 2]);
      expect(component.dragStarted).toBeTrue();
    });

    it('should set focus on list items change', () => {
      spyOn(component, 'setFocus');
      component.listItems = new QueryList<ElementRef<HTMLDivElement>>();
      component.listItems.reset([
        new ElementRef(document.createElement('div')),
        new ElementRef(document.createElement('div')),
        new ElementRef(document.createElement('div'))
      ]);

      component.ngAfterViewInit();

      component.listItems.notifyOnChanges();

      expect(component.setFocus).toHaveBeenCalled();
    });

    it('should focus on the active item', () => {
      component.activeItem = 0;

      component.listItems = new QueryList<ElementRef<HTMLDivElement>>();
      component.listItems.reset([
        new ElementRef(document.createElement('div')),
        new ElementRef(document.createElement('div')),
        new ElementRef(document.createElement('div'))
      ]);
      const listItemElements = component.listItems.toArray();
      spyOn(listItemElements[0].nativeElement, 'focus');

      component.setFocus();

      expect(listItemElements[0].nativeElement.focus).toHaveBeenCalled();
    });

    it('should not hide item when drag is started', () => {
      component.dragStarted = true;

      const containerData = [
        '<p>choice 1</p>',
      ];
      const dragAndDropEventClass = new DragAndDropEventClass<string>();
      const dragDropEvent = dragAndDropEventClass.createInContainerEvent(
        'selectedItems', containerData, 0, 0);
      component.hideElement(dragDropEvent);

      expect(component.noShow).toBe(-1);
      expect(component.hide).toEqual([]);
    });

    it('should return true if child element have border', () => {
      component.noShow = -1;

      expect(component.isChildElementHaveBorder(1)).toBeTrue();
    });

    it('should return true if child element have zero height', () => {
      component.hide = [1, 2];

      expect(component.isChildElementHaveZeroHeight(1)).toBeTrue();
    });
  });

  it('should move the item down when ArrowDown key is pressed', () => {
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    const currentIndex = 0;
    component.activeItem = 0;
    component.listItems = new QueryList<ElementRef<HTMLDivElement>>();
    component.listItems.reset([
      new ElementRef(document.createElement('div')),
      new ElementRef(document.createElement('div')),
      new ElementRef(document.createElement('div'))
    ]);
    component.singleItemInSamePositionArray = [
      '<p>choice 1</p>',
      '<p>choice 2</p>',
      '<p>choice 3</p>'
    ];
    spyOn(component, 'setFocus');

    component.handleKeyDown(event, currentIndex);

    expect(component.setFocus).toHaveBeenCalled();
    expect(component.activeItem).toBe(currentIndex + 1);
  });

  it('should move item up when ArrowUp key is pressed', () => {
    const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    const currentIndex = 1;
    component.activeItem = 1;
    component.listItems = new QueryList<ElementRef<HTMLDivElement>>();
    component.listItems.reset([
      new ElementRef(document.createElement('div')),
      new ElementRef(document.createElement('div')),
      new ElementRef(document.createElement('div'))
    ]);
    component.singleItemInSamePositionArray = [
      '<p>choice 1</p>',
      '<p>choice 2</p>',
      '<p>choice 3</p>'
    ];
    spyOn(component, 'setFocus');

    component.handleKeyDown(event, currentIndex);

    expect(component.setFocus).toHaveBeenCalled();
    expect(component.activeItem).toBe(currentIndex - 1);
  });

  it('should decrement newIndex when Shift + Tab keys are pressed', () => {
    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true });
    const currentIndex = 1;
    component.activeItem = 1;
    spyOn(component, 'setFocus');

    component.handleKeyDown(event, currentIndex);

    expect(component.setFocus).toHaveBeenCalled();
    expect(component.activeItem).toBe(currentIndex - 1);
  });

  it('should increment newIndex when Tab key is pressed', () => {
    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: false });
    const currentIndex = 1;
    component.activeItem = 1;
    component.listItems = new QueryList<ElementRef<HTMLDivElement>>();
    component.listItems.reset([
      new ElementRef(document.createElement('div')),
      new ElementRef(document.createElement('div')),
      new ElementRef(document.createElement('div'))
    ]);

    spyOn(component, 'setFocus');
    component.handleKeyDown(event, currentIndex);
    expect(component.setFocus).toHaveBeenCalled();
    expect(component.activeItem).toBe(currentIndex + 1);
  });

  describe('when multiple items in the same position are not allowed', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(
        InteractiveDragAndDropSortInputComponent);
      component = fixture.componentInstance;
      component.choicesWithValue = '[' +
        '{' +
        '    "html": "<p>choice 1</p>",' +
        '    "contentId": "ca_choices_1"' +
        '},' +
        '{' +
        '    "html": "<p>choice 2</p>",' +
        '    "contentId": "ca_choices_2"' +
        '},' +
        '{' +
        '    "html": "<p>choice 3</p>",' +
        '    "contentId": "ca_choices_3"' +
        '}' +
    ']';
      component.allowMultipleItemsInSamePositionWithValue = 'false';
      component.savedSolution = [
        [
          'ca_choices_1'
        ],
        [
          'ca_choices_3',
        ],
        [
          'ca_choices_2'
        ]
      ];
      component.dragStarted = false;
      component.hide = [];
      component.highlightedGroup = -1;
      component.noShow = -1;
      component.rootHeight = 40;
    });

    it('should initialise component when user adds interaction', () => {
      component.ngOnInit();

      expect(component.allowMultipleItemsInSamePosition).toBe(false);
      expect(component.singleItemInSamePositionArray).toEqual([
        '<p>choice 1</p>',
        '<p>choice 3</p>',
        '<p>choice 2</p>'
      ]);
      expect(component.choices).toEqual([
        '<p>choice 1</p>',
        '<p>choice 2</p>',
        '<p>choice 3</p>',
      ]);
    });

    it('should make a default list when user did not save a solution',
      () => {
        component.savedSolution = null;
        component.ngOnInit();

        expect(component.allowMultipleItemsInSamePosition).toBe(false);
        expect(component.singleItemInSamePositionArray).toEqual([
          '<p>choice 1</p>',
          '<p>choice 2</p>',
          '<p>choice 3</p>'
        ]);
      });

    it('should move item inside list', () => {
      component.singleItemInSamePositionArray = [
        '<p>choice 1</p>',
        '<p>choice 2</p>',
        '<p>choice 3</p>'
      ];
      const dragAndDropEventClass = new DragAndDropEventClass<string>();
      const dragDropEvent = dragAndDropEventClass.createInContainerEvent(
        'selectedlists', component.singleItemInSamePositionArray, 2, 1);

      component.dropItemInSameList(dragDropEvent);

      expect(component.singleItemInSamePositionArray).toEqual([
        '<p>choice 1</p>',
        '<p>choice 3</p>',
        '<p>choice 2</p>'
      ]);
    });
  });
});
