// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utility class to interact with Graph Interaction.
 */

import puppeteer, {ElementHandle} from 'puppeteer';
import isElementClickable from '../../../functions/is-element-clickable';

const graphContainerSelector = '.e2e-test-graph-input-viz-container';
const graphVertexSelector = '.e2e-test-graph-vertex';
const graphEdgeSelector = '.e2e-test-graph-edge';

const graphButtonSelectorPrefix = '.e2e-test';
const graphButtonSelectorSuffix = 'button';
const resetGraphButtonSelector = '.e2e-test-reset-graph-button';

const graphButtonSelectors = {
  moveButton: '.e2e-test-Move-button',
  deleteButton: '.e2e-test-Delete-button',
  addNodeButton: '.e2e-test-Add-Node-button',
  addEdgeButton: '.e2e-test-Add-Edge-button',
};

export class GraphViz {
  parentPage: puppeteer.Page;
  context: puppeteer.ElementHandle<Element> | puppeteer.Page;

  /**
   * Constructs a GraphViz object.
   * @param page The puppeteer page object.
   * @param context The puppeteer context object.
   */
  constructor(
    page: puppeteer.Page,
    context?: puppeteer.ElementHandle<Element>
  ) {
    this.parentPage = page;
    this.context = context ?? this.parentPage;
  }

  async expectGraphInteractionToBePresent(): Promise<void> {
    await this.parentPage.waitForSelector(graphContainerSelector, {
      visible: true,
    });
  }

  /**
   * Gets the graph container.
   * @returns The graph container.
   */
  async getGraphContainer(): Promise<ElementHandle<Element>> {
    const graphContainer = await this.context.waitForSelector(
      graphContainerSelector
    );
    if (!graphContainer) {
      throw new Error('Graph container not found.');
    }
    return graphContainer;
  }

  /**
   * Clicks on a graph button.
   * @param buttonName The name of the button to click.
   */
  async clickOnGraphButton(
    buttonName: 'Add Edge' | 'Add Node' | 'Delete' | 'Move'
  ): Promise<void> {
    const graphContainer = await this.getGraphContainer();
    const button = await graphContainer.$(
      `${graphButtonSelectorPrefix}-${buttonName.replace(' ', '-')}-${graphButtonSelectorSuffix}`
    );

    if (!button) {
      throw new Error(`Button ${buttonName} not found.`);
    }
    await button.click();
  }

  /**
   * Clears the graph.
   */
  async clearGraph(): Promise<void> {
    const graphContainer = await this.getGraphContainer();

    const graphVertices = await graphContainer.$$(graphVertexSelector);
    await this.clickOnGraphButton('Delete');
    if (graphVertices) {
      for (const vertex of graphVertices) {
        await vertex.click();
      }
    }

    const graphVerticesAfterClear =
      await graphContainer.$$(graphVertexSelector);
    if (graphVerticesAfterClear) {
      expect(graphVerticesAfterClear.length).toBe(0);
    }
  }

  /**
   * Adds a vertex to the graph.
   * @param {number} xInPercentage - The x coordinate of the vertex in percentage.
   * @param {number} yInPercentage - The y coordinate of the vertex in percentage.
   */
  async addNode(
    xInPercentage: number,
    yInPercentage: number
  ): Promise<ElementHandle<Element>> {
    if (
      xInPercentage < 0 ||
      yInPercentage < 0 ||
      xInPercentage > 100 ||
      yInPercentage > 100
    ) {
      throw new Error(
        `Vertex coordinates must be between 0 and 100. Found (${xInPercentage}, ${yInPercentage})`
      );
    }

    const graphContainer = await this.getGraphContainer();
    await this.parentPage.waitForFunction(
      (element: HTMLElement) => {
        const {width, height} = element.getBoundingClientRect();
        return width > 0 && height > 0;
      },
      {},
      graphContainer
    );

    const initalVertices = await graphContainer.$$(graphVertexSelector);
    const box = await graphContainer?.boundingBox();
    if (!box) {
      throw new Error('Graph container not found.');
    }

    const x = box?.x + (box?.width * xInPercentage) / 100;
    const y = box?.y + (box?.height * yInPercentage) / 100;

    await this.parentPage.waitForSelector(graphButtonSelectors.addNodeButton, {
      visible: true,
    });
    await this.clickOnGraphButton('Add Node');
    await this.parentPage.waitForTimeout(500);
    await this.parentPage.mouse.click(x, y);
    await this.parentPage.waitForTimeout(2000);

    try {
      await this.parentPage.waitForFunction(
        (
          selector: string,
          numberOfElements: number,
          parentElement: HTMLElement
        ) => {
          const elements = Array.from(parentElement.querySelectorAll(selector));
          return elements.length === numberOfElements;
        },
        {},
        graphVertexSelector,
        initalVertices.length + 1,
        graphContainer
      );
    } catch (error) {
      const currentVertices = await graphContainer.$$(graphVertexSelector);
      throw new Error(
        `Expected ${initalVertices.length + 1} vertices, but found ${currentVertices.length}.\n` +
          `Tried adding a node at position (${x}, ${y}).\n` +
          `${error.type}: ${error.message}`
      );
    }

    const currentVertices = await graphContainer.$$(graphVertexSelector);
    return currentVertices[currentVertices.length - 1];
  }

  /**
   * Waits until the vertex is hovered.
   * @param vertex The vertex to wait for.
   */
  async waitUntilNodeIsHovered(vertex: ElementHandle<Element>): Promise<void> {
    try {
      await this.parentPage.waitForFunction(
        (element: HTMLElement) => {
          return element.style.fill === 'aqua' || element.style.fill === 'red';
        },
        {},
        vertex
      );
    } catch (error) {
      throw new Error(
        `Vertex ${vertex} is not hovered.\n` + `${error.message}`
      );
    }
  }

  /**
   * Adds an edge between two vertices.
   * @param vertexA The first vertex.
   * @param vertexB The second vertex.
   * @returns The added edge.
   */
  async addEdge(
    vertexA: puppeteer.ElementHandle<Element>,
    vertexB: puppeteer.ElementHandle<Element>,
    mobileViewport: boolean = false
  ): Promise<ElementHandle<Element>> {
    const boundingBoxA = await vertexA.boundingBox();
    const boundingBoxB = await vertexB.boundingBox();

    if (!boundingBoxA || !boundingBoxB) {
      throw new Error('Vertex not found.');
    }

    // Get inital edges.
    const graphContainer = await this.getGraphContainer();
    const initalEdges = await graphContainer.$$(graphEdgeSelector);

    // Calculate positions of the vertices.
    const startX = boundingBoxA.x + boundingBoxA.width / 2;
    const startY = boundingBoxA.y + boundingBoxA.height / 2;
    const endX = boundingBoxB.x + boundingBoxB.width / 2;
    const endY = boundingBoxB.y + boundingBoxB.height / 2;

    await this.clickOnGraphButton('Add Edge');
    await vertexA.hover();
    await this.waitUntilNodeIsHovered(vertexA);
    // Wait alteast for 2 seconds as it takes time.
    await this.parentPage.waitForTimeout(2000);
    mobileViewport ? await vertexA.click() : await this.parentPage.mouse.down();

    // Smooth Drag.
    await vertexB.hover();
    await this.waitUntilNodeIsHovered(vertexB);
    mobileViewport ? await vertexB.click() : await this.parentPage.mouse.up();
    await this.parentPage.waitForTimeout(2000);
    await this.parentPage.mouse.up();

    try {
      await this.parentPage.waitForFunction(
        (selector: string, numberOfElement: number) => {
          const elements = document.querySelectorAll(selector);
          return elements.length === numberOfElement;
        },
        {},
        graphEdgeSelector,
        initalEdges.length + 1
      );
    } catch (error) {
      const currentEdges = await graphContainer.$$(graphEdgeSelector);
      throw new Error(
        `Expected ${initalEdges.length + 1} edges, but found ${currentEdges.length}.` +
          `Tried creating an edge between (${startX}, ${startY}) and (${endX}, ${endY}).`
      );
    }

    const currentEdges = await graphContainer.$$(graphEdgeSelector);
    return currentEdges[currentEdges.length - 1];
  }

  /**
   * Adds four vertices in the center of the graph.
   */
  async addFourVerticesInCenter(): Promise<ElementHandle<Element>[]> {
    const v1 = await this.addNode(55, 50);
    const v2 = await this.addNode(65, 20);
    const v3 = await this.addNode(55, 90);
    const v4 = await this.addNode(65, 90);

    return [v1, v2, v3, v4];
  }

  /**
   * Creates a simple star network.
   */
  async createASimpleStarNetwork(
    mobileViewport: boolean = false
  ): Promise<void> {
    await this.clearGraph();

    const [v1, v2, v3, v4] = await this.addFourVerticesInCenter();

    await this.addEdge(v1, v2, mobileViewport);
    await this.addEdge(v1, v3, mobileViewport);
    await this.addEdge(v1, v4, mobileViewport);
  }

  /**
   * Gets the vertices of the graph.
   * @returns The vertices of the graph.
   */
  async getVertices(): Promise<ElementHandle<Element>[]> {
    const graphContainer = await this.getGraphContainer();
    await graphContainer.waitForSelector(graphVertexSelector);
    const vertices = await graphContainer.$$(graphVertexSelector);
    return vertices;
  }

  /**
   * Gets the edges of the graph.
   * @returns The edges of the graph.
   */
  async getEdges(): Promise<ElementHandle<Element>[]> {
    const graphContainer = await this.getGraphContainer();
    const edges = await graphContainer.$$(graphEdgeSelector);
    return edges;
  }

  /**
   * Resets the graph.
   */
  async resetGraph(): Promise<void> {
    const resetGraphButton = await this.parentPage.waitForSelector(
      resetGraphButtonSelector
    );
    await this.parentPage.waitForFunction(
      isElementClickable,
      {},
      resetGraphButton
    );
    await this.parentPage.click(resetGraphButtonSelector);

    await this.parentPage.waitForFunction(
      (selector: string, parentSelector: string) => {
        const container = document.querySelector(parentSelector);
        if (!container) {
          return false;
        }
        const elements = container.querySelectorAll(selector);
        return elements.length === 0;
      },
      {},
      graphEdgeSelector,
      graphContainerSelector
    );
  }

  /**
   * Moves the node to the given position.
   * @param {ElementHandle<Element>} node - The node to move.
   * @param {number} xInPercentage - The x coordinate of the node in percentage.
   * @param {number} yInPercentage - The y coordinate of the node in percentage.
   */
  async moveNode(
    node: ElementHandle<Element>,
    xInPercentage: number,
    yInPercentage: number
  ): Promise<void> {
    const graphContainer = await this.getGraphContainer();
    const box = await graphContainer?.boundingBox();
    if (!box) {
      throw new Error('Graph container not found.');
    }

    const x = box?.x + (box?.width * xInPercentage) / 100;
    const y = box?.y + (box?.height * yInPercentage) / 100;

    await this.parentPage.waitForSelector(graphButtonSelectors.addNodeButton, {
      visible: true,
    });

    await this.clickOnGraphButton('Move');
    await node.hover();
    await this.waitUntilNodeIsHovered(node);
    await this.parentPage.mouse.down();
    await this.parentPage.waitForTimeout(1000);
    await this.parentPage.mouse.move(x, y);
    await this.parentPage.mouse.up();
    await this.parentPage.waitForTimeout(1000);
  }

  /**
   * Removes a node from the graph.
   * @param {ElementHandle<Element>} node - The node to remove.
   */
  async removeNode(node: ElementHandle<Element>): Promise<void> {
    await this.clickOnGraphButton('Delete');
    await node.hover();
    await this.waitUntilNodeIsHovered(node);
    await this.parentPage.waitForTimeout(1000);
    await this.parentPage.mouse.down();
    await this.parentPage.waitForTimeout(1000);
    await this.parentPage.mouse.up();
    await this.parentPage.waitForTimeout(1000);
  }

  /**
   * Gets the coordinates of the node.
   * @param {ElementHandle<Element>} node - The node to get the coordinates of.
   * @returns {Promise<number[]>} The coordinates of the node.
   */
  async getNodeCoordinates(node: ElementHandle<Element>): Promise<number[]> {
    const boundingBox = await node.boundingBox();
    if (!boundingBox) {
      throw new Error('Node not found.');
    }

    return [boundingBox.x, boundingBox.y];
  }
}
