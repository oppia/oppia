// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview This script is used to generate an Angular route to module mapping.
 */

import path from 'path';
import fs from 'fs';
import {Route} from '@angular/router';
import {
  CallExpression,
  ObjectLiteralExpression,
  SourceFile,
  ts,
} from 'ts-morph';
import {
  project,
  ROOT_DIRECTORY,
  getDecoratorNodesByTextFromSourceFile,
  resolveModuleRelativeToRoot,
  AngularDecorators,
  getValueFromLiteralStringOrBinaryExpression,
} from './typescript-ast-utilities';

// List of routing module file paths.
const ROUTING_MODULE_FILE_PATHS = [
  path.resolve(
    ROOT_DIRECTORY,
    'core/templates/pages/oppia-root/routing/app.routing.module.ts'
  ),
  path.resolve(
    ROOT_DIRECTORY,
    'core/templates/pages/lightweight-oppia-root/routing/app.routing.module.ts'
  ),
];

/**
 * Extends two maps while avoiding duplicates.
 */
const extendMap = (
  map1: Map<Route, string>,
  map2: Map<Route, string>
): Map<Route, string> => {
  const extendedMap = new Map([...map1]);
  for (const [key, value] of map2) {
    if (!extendedMap.has(key)) {
      extendedMap.set(key, value);
    }
  }
  return extendedMap;
};

/**
 * Gets the path in the route object AST node.
 */
const getPathFromRouteObjectNode = (
  routeObjectNode: ObjectLiteralExpression
): string | undefined => {
  const pathProperty = routeObjectNode
    .getPropertyOrThrow('path')
    .asKindOrThrow(ts.SyntaxKind.PropertyAssignment)
    .getInitializerOrThrow();
  if (pathProperty.isKind(ts.SyntaxKind.PropertyAccessExpression)) {
    const referenceDefinition = pathProperty
      .findReferences()[0]
      .getDefinition();
    const displayParts = referenceDefinition.getDisplayParts();
    return displayParts[displayParts.length - 1].getText().slice(1, -1);
  }
  return getValueFromLiteralStringOrBinaryExpression(pathProperty);
};

/**
 * Gets the module in the route object AST node.
 */
const getModuleFromRouteObjectNode = (
  routeObjectNode: ObjectLiteralExpression
): string | undefined => {
  const loadChildrenProperty = routeObjectNode.getProperty('loadChildren');
  if (loadChildrenProperty === undefined) {
    return undefined;
  }
  const loadChildrenInitializer = loadChildrenProperty
    .asKindOrThrow(ts.SyntaxKind.PropertyAssignment)
    .getInitializerOrThrow()
    .asKindOrThrow(ts.SyntaxKind.ArrowFunction);
  const loadChildrenCallArgument = loadChildrenInitializer
    .getBody()
    .getChildAtIndexIfKindOrThrow(0, ts.SyntaxKind.PropertyAccessExpression)
    .getChildAtIndexIfKindOrThrow(0, ts.SyntaxKind.CallExpression)
    .getArguments()[0];
  return getValueFromLiteralStringOrBinaryExpression(loadChildrenCallArgument);
};

/**
 * Gets the path match property in the route object AST node.
 */
const getPathMatchFromRouteObjectNode = (
  routeObjectNode: ObjectLiteralExpression
): string | undefined => {
  const pathMatchProperty = routeObjectNode.getProperty('pathMatch');
  if (pathMatchProperty === undefined) {
    return undefined;
  }
  return pathMatchProperty
    .asKindOrThrow(ts.SyntaxKind.PropertyAssignment)
    .getInitializerOrThrow()
    .asKindOrThrow(ts.SyntaxKind.StringLiteral)
    .getLiteralText();
};

/**
 * Gets the children property in the route object AST node.
 */
const getChildrenFromRouteObjectNode = (
  routeObjectNode: ObjectLiteralExpression
): ObjectLiteralExpression[] | undefined => {
  const childrenProperty = routeObjectNode.getProperty('children');
  if (childrenProperty === undefined) {
    return undefined;
  }
  return childrenProperty
    .asKindOrThrow(ts.SyntaxKind.PropertyAssignment)
    .getInitializerOrThrow()
    .asKindOrThrow(ts.SyntaxKind.ArrayLiteralExpression)
    .getElements() as ObjectLiteralExpression[];
};

/**
 * Extends the route to module mapping with a list of route nodes.
 */
const extendRouteToModuleMappingWithRouteNodes = (
  routeToModuleMapping: Map<Route, string> = new Map(),
  routeNodes: ObjectLiteralExpression[] = [],
  parentRoutePath?: string,
  parentRoutingModuleFilePath?: string
): Map<Route, string> => {
  for (const routeNode of routeNodes) {
    routeToModuleMapping = extendMap(
      routeToModuleMapping,
      convertRouteNodeToMap(
        routeNode,
        parentRoutePath,
        parentRoutingModuleFilePath
      )
    );
  }
  return routeToModuleMapping;
};

/**
 * Converts a route object AST node to a map element.
 */
const convertRouteNodeToMap = (
  routeNode: ObjectLiteralExpression,
  parentRoutePath?: string,
  parentRoutingModuleFilePath?: string
): Map<Route, string> => {
  let routeToModuleMapping: Map<Route, string> = new Map();
  const path = getPathFromRouteObjectNode(routeNode);
  if (path === undefined) {
    throw new Error('No path was found in the route object.');
  }

  const module = getModuleFromRouteObjectNode(routeNode);
  const pathMatch = getPathMatchFromRouteObjectNode(routeNode);
  const childrenRouteNodes = getChildrenFromRouteObjectNode(routeNode);
  const routePath = parentRoutePath ? `${parentRoutePath}/${path}` : path;

  if (childrenRouteNodes) {
    routeToModuleMapping = extendRouteToModuleMappingWithRouteNodes(
      routeToModuleMapping,
      childrenRouteNodes,
      routePath,
      parentRoutingModuleFilePath
    );
  }
  if (module) {
    const containingFile = routeNode.getSourceFile().getFilePath();
    const resolvedModule = resolveModuleRelativeToRoot(module, containingFile);
    routeToModuleMapping.set(
      {
        path: routePath,
        pathMatch: pathMatch,
      },
      parentRoutingModuleFilePath || resolvedModule
    );
    const childRouteToModuleMapping = getRouteToModuleMappingFromRoutingModule(
      resolvedModule,
      routePath,
      parentRoutingModuleFilePath || resolvedModule
    );
    routeToModuleMapping = extendMap(
      routeToModuleMapping,
      childRouteToModuleMapping
    );
  }
  return routeToModuleMapping;
};

/**
 * Gets the route AST nodes from a routing module file.
 */
const getRouteNodesFromRoutingModuleSourceFile = (
  routingModuleSourceFile: SourceFile
): ObjectLiteralExpression[] | undefined => {
  const angularModuleDecorationNode = getDecoratorNodesByTextFromSourceFile(
    routingModuleSourceFile,
    AngularDecorators.Module
  );
  if (angularModuleDecorationNode.length === 0) {
    throw new Error(
      'No Angular Module decoration was found in the file: ' +
        routingModuleSourceFile.getFilePath()
    );
  }
  const angularModuleObjectArgument =
    angularModuleDecorationNode[0].getArguments()[0];
  if (
    !angularModuleObjectArgument.isKind(ts.SyntaxKind.ObjectLiteralExpression)
  ) {
    throw new Error(
      'The Angular Module decoration in the file: ' +
        `${routingModuleSourceFile.getFilePath()} does not have an object argument.`
    );
  }
  const importsProperty =
    angularModuleObjectArgument.getPropertyOrThrow('imports');
  const importsArray = importsProperty.getFirstChildByKindOrThrow(
    ts.SyntaxKind.ArrayLiteralExpression
  );
  const routerModuleCallExpression = importsArray
    .getElements()
    .filter(element => {
      return (
        element.getText().includes('RouterModule.forRoot') ||
        (element.getText().includes('RouterModule.forChild') &&
          element.getKind() === ts.SyntaxKind.CallExpression)
      );
    })[0] as CallExpression;
  if (routerModuleCallExpression === undefined) {
    return undefined;
  }
  const routesArgument = routerModuleCallExpression.getArguments()[0];
  if (routesArgument.isKind(ts.SyntaxKind.ArrayLiteralExpression)) {
    return routesArgument.getElements() as ObjectLiteralExpression[];
  }
  if (routesArgument.isKind(ts.SyntaxKind.Identifier)) {
    const routesVariable =
      routingModuleSourceFile.getVariableDeclarationOrThrow(
        routesArgument.getText()
      );
    return routesVariable
      .getInitializerIfKindOrThrow(ts.SyntaxKind.ArrayLiteralExpression)
      .getElements() as ObjectLiteralExpression[];
  }
  return undefined;
};

/**
 * Gets the Angular route to module mapping from a routing module file.
 */
const getRouteToModuleMappingFromRoutingModule = (
  routingModuleFilePath: string,
  parentRoutePath?: string,
  parentRoutingModuleFilePath?: string
): Map<Route, string> => {
  let routeToModuleMapping: Map<Route, string> = new Map();
  const routingModuleSourceFile = project.addSourceFileAtPath(
    routingModuleFilePath
  );
  const routingModuleRouteNodes = getRouteNodesFromRoutingModuleSourceFile(
    routingModuleSourceFile
  );
  if (routingModuleRouteNodes === undefined) {
    return routeToModuleMapping;
  }

  routeToModuleMapping = extendRouteToModuleMappingWithRouteNodes(
    routeToModuleMapping,
    routingModuleRouteNodes,
    parentRoutePath,
    parentRoutingModuleFilePath
  );

  return routeToModuleMapping;
};

/**
 * Validates the route to module mapping by checking that all
 * modules defined exist in the codebase.
 */
const validateRouteToModuleMapping = (
  routeToModuleMapping: Map<Route, string>
): void => {
  for (const module of routeToModuleMapping.values()) {
    if (!fs.existsSync(path.resolve(ROOT_DIRECTORY, module))) {
      throw new Error(
        `The module: ${module} defined in the route to module mapping does ` +
          'not exist in the codebase. Please ensure that it exists or remove it ' +
          'from the route to module mapping by removing it from the manual route to ' +
          'module mapping or the routing module file.'
      );
    }
  }
};

/**
 * Gets the full codebase's route to module mapping.
 */
export const getRouteToModuleMapping = (): Map<Route, string> => {
  let routeToModuleMapping: Map<Route, string> = new Map([]);

  for (const routingModuleFilePath of ROUTING_MODULE_FILE_PATHS) {
    const routingModuleRouteToModuleMapping =
      getRouteToModuleMappingFromRoutingModule(routingModuleFilePath);
    routeToModuleMapping = extendMap(
      routeToModuleMapping,
      routingModuleRouteToModuleMapping
    );
  }
  validateRouteToModuleMapping(routeToModuleMapping);
  return routeToModuleMapping;
};

/**
 * Gets all of the page modules covered by the route mapping.
 */
export const getPageModulesCoveredByRouteMapping = (): string[] => {
  const routeToModuleMapping = getRouteToModuleMapping();
  return [...routeToModuleMapping.values()];
};

/**
 * Gets all of the page modules in the codebase.
 */
export const getPageModules = (): string[] => {
  const pageModulesCoveredByRouteMapping =
    getPageModulesCoveredByRouteMapping();
  return [...pageModulesCoveredByRouteMapping];
};
