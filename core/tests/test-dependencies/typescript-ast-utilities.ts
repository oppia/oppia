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
 * @fileoverview Utilities to work with TypeScript AST.
 */

import path from 'path';
import fs from 'fs';
import {Decorator, Node, Project, SourceFile, ts} from 'ts-morph';

/**
 * Gets the root directory of the project by traversing up the directory tree
 * until a package.json file is found.
 */
export const ROOT_DIRECTORY = (() => {
  let current = __dirname;
  while (!fs.existsSync(path.join(current, 'package.json'))) {
    current = path.dirname(current);
  }
  return current;
})();

export const project = new Project({
  tsConfigFilePath: path.join(ROOT_DIRECTORY, 'tsconfig.json'),
  skipFileDependencyResolution: true,
});

export enum AngularDecorators {
  Component = 'Component',
  Directive = 'Directive',
  Pipe = 'Pipe',
  Module = 'NgModule',
}

type ResolvedModuleWithFailedLookupLocations =
  ts.ResolvedModuleWithFailedLookupLocations & {
    failedLookupLocations: string[];
  };

/**
 * List of types that are defined in node.
 */
const NODE_TYPE_ROOTS = ['fs', 'console', 'path', 'child_process'];

/**
 * Checks if a module is a node module.
 */
export const isNodeModule = (modulePath: string): boolean => {
  return modulePath.includes('node_modules');
};

/**
 * Gets the potential module lookup locations using the TypeScript compiler.
 */
const getPotentialModuleLookupLocations = (
  modulePath: string,
  containingFile: string
): string[] => {
  const failedLookup = ts.resolveModuleName(
    modulePath,
    containingFile,
    project.getCompilerOptions(),
    project.getModuleResolutionHost()
  ) as ResolvedModuleWithFailedLookupLocations;

  return failedLookup.failedLookupLocations
    .filter(location => location.endsWith('.ts'))
    .map(location => location.replace('.ts', ''));
};

/**
 * Fallback module resolution when TypeScript compiler fails to resolve a module.
 * Looks through potential module lookup locations and returns the location where
 * the module is found.
 */
const fallbackResolveModule = (
  modulePath: string,
  containingFile: string
): ts.ResolvedModuleFull => {
  const potentialModuleLookupLocations = getPotentialModuleLookupLocations(
    modulePath,
    containingFile
  );

  for (const location of potentialModuleLookupLocations) {
    if (fs.existsSync(location)) {
      return {
        resolvedFileName: location,
        extension: path.extname(location),
      };
    }
  }
  throw new Error(
    `Failed to resolve module ${modulePath} at ${containingFile}.`
  );
};

/**
 * Resolves a module path with Webpack resolution.
 */
const resolveModuleUsingWebpack = (
  modulePath: string,
  containingFile: string
): ts.ResolvedModuleFull => {
  const resolved = ts.resolveModuleName(
    'core/templates/' + modulePath,
    containingFile,
    project.getCompilerOptions(),
    project.getModuleResolutionHost()
  );
  if (resolved.resolvedModule === undefined) {
    return fallbackResolveModule(modulePath, containingFile);
  }
  return resolved.resolvedModule;
};

/**
 *
 * Resolves a module path.
 */
export const resolveModule = (
  modulePath: string,
  containingFile: string
): ts.ResolvedModuleFull => {
  if (NODE_TYPE_ROOTS.includes(modulePath)) {
    return {
      resolvedFileName: `node_modules/@types/node/${modulePath}.d.ts`,
      extension: '.d.ts',
    };
  }
  const resolved = ts.resolveModuleName(
    modulePath,
    containingFile,
    project.getCompilerOptions(),
    project.getModuleResolutionHost()
  );
  if (resolved.resolvedModule === undefined) {
    return resolveModuleUsingWebpack(modulePath, containingFile);
  }
  return resolved.resolvedModule;
};

/**
 * Returns the path relative to the root directory.
 */
export const getRelativePathToRootDirectory = (filePath: string): string => {
  return path.relative(ROOT_DIRECTORY, filePath);
};

/**
 * Resolves a module path relative to the root directory.
 */
export const resolveModuleRelativeToRoot = (
  modulePath: string,
  containingFile: string
): string => {
  const resolvedModule = resolveModule(modulePath, containingFile);
  return getRelativePathToRootDirectory(resolvedModule.resolvedFileName);
};

/**
 * Gets the text of a decoration node.
 */
export const getDecoratorNodeText = (decorator: Decorator): string => {
  const callExpression = decorator.getCallExpression();
  if (callExpression === undefined) {
    return decorator.getFullText();
  }
  return callExpression.getExpression().getFullText();
};

/**
 * Gets all decoration nodes by text from a source file.
 */
export const getDecoratorNodesByTextFromSourceFile = (
  sourceFile: SourceFile,
  text: string
): Decorator[] => {
  return sourceFile
    .getDescendantsOfKind(ts.SyntaxKind.Decorator)
    .filter(decorator => {
      const decorationText = getDecoratorNodeText(decorator);
      return decorationText === text;
    });
};

/**
 * Gets the value from a literal string or binary expression node.
 */
export const getValueFromLiteralStringOrBinaryExpression = (
  node: Node
): string | undefined => {
  if (node.isKind(ts.SyntaxKind.StringLiteral)) {
    return node.getLiteralText();
  }
  if (node.isKind(ts.SyntaxKind.BinaryExpression)) {
    return eval(node.getText());
  }
  return undefined;
};
