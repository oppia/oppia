import puppeteer, {ElementHandle} from 'puppeteer';
import {showMessage} from '../show-message';

const graphContainerSelector = '.e2e-test-graph-input-viz-container';
const graphVertexSelector = '.e2e-test-graph-vertex';
const graphEdgeSelector = '.e2e-test-graph-edge';

const graphButtonSelectorPrefix = '.e2e-test';
const graphButtonSelectorSuffix = 'button';

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

  /**
   * Gets the graph container.
   * @returns The graph container.
   */
  async getGraphContainer(): Promise<ElementHandle<Element>> {
    const graphContainer = await this.context.$(graphContainerSelector);
    if (!graphContainer) {
      throw new Error('Graph container not found.');
    }
    return graphContainer;
  }

  /**
   * Clicks on a graph button.
   * @param buttonName The name of the button to click.
   */
  async clickOnGraphButton(buttonName: 'Add Edge' | 'Add Node' | 'Delete') {
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
  async addVertex(
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
    await this.parentPage.mouse.move(x, y);
    await this.parentPage.mouse.down();
    await this.parentPage.mouse.up();

    const currentVertices = await graphContainer.$$(graphVertexSelector);
    expect(currentVertices.length).toBe(initalVertices.length + 1);

    return currentVertices[currentVertices.length - 1];
  }

  /**
   * Adds an edge between two vertices.
   * @param vertexA The first vertex.
   * @param vertexB The second vertex.
   * @returns The added edge.
   */
  async addEdge(
    vertexA: puppeteer.ElementHandle<Element>,
    vertexB: puppeteer.ElementHandle<Element>
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
    await this.parentPage.mouse.move(startX, startY);
    await this.parentPage.mouse.down();

    // Smooth Drag.
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      const x = startX + ((endX - startX) * i) / steps;
      const y = startY + ((endY - startY) * i) / steps;
      await this.parentPage.mouse.move(x, y);
      await this.parentPage.waitForTimeout(10);
    }
    await this.parentPage.mouse.up();
    await this.parentPage.waitForTimeout(100);

    const currentEdges = await graphContainer.$$(graphEdgeSelector);
    showMessage((boundingBoxA.x + boundingBoxA.width / 2).toString());
    showMessage((boundingBoxA.y + boundingBoxA.height / 2).toString());
    showMessage((boundingBoxB.x + boundingBoxB.width / 2).toString());
    showMessage((boundingBoxB.y + boundingBoxB.height / 2).toString());

    expect(currentEdges.length).toBe(initalEdges.length + 1);
    return currentEdges[currentEdges.length - 1];
  }

  /**
   * Adds four vertices in the center of the graph.
   */
  async addFourVerticesInCenter(): Promise<ElementHandle<Element>[]> {
    const v1 = await this.addVertex(45, 20);
    const v2 = await this.addVertex(55, 20);
    const v3 = await this.addVertex(45, 80);
    const v4 = await this.addVertex(55, 80);

    return [v1, v2, v3, v4];
  }

  /**
   * Creates a simple star network.
   */
  async createASimpleStarNetwork(): Promise<void> {
    await this.clearGraph();

    const [v1, v2, v3, v4] = await this.addFourVerticesInCenter();

    await this.addEdge(v1, v2);
    await this.addEdge(v1, v3);
    await this.addEdge(v1, v4);
  }
}
