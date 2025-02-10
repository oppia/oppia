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
 * @fileoverview Script to generate a files to root files mapping for the
 * Oppia codebase.
 */

import path from 'path';
import fs from 'fs';
import {Decorator, SourceFile, ts} from 'ts-morph';
import {parseHTML} from 'linkedom';
import {
  project,
  ROOT_DIRECTORY,
  AngularDecorators,
  getRelativePathToRootDirectory,
  isNodeModule,
  getDecoratorNodesByTextFromSourceFile,
  resolveModuleRelativeToRoot,
  getDecoratorNodeText,
  getValueFromLiteralStringOrBinaryExpression,
} from './typescript-ast-utilities';
import {
  getPageModules,
  getPageModulesCoveredByRouteMapping,
} from './route-to-module-mapping-generator';

interface BaseAngularInformation {
  className: string;
}

interface AngularModuleInformation extends BaseAngularInformation {
  type: 'module';
}

interface AngularComponentInformation extends BaseAngularInformation {
  type: 'component';
  selector?: string;
  templateFilePath?: string;
}

interface AngularDirectiveOrPipeInformation extends BaseAngularInformation {
  type: 'directive' | 'pipe';
  selector?: string;
}

type AngularInformation =
  | AngularModuleInformation
  | AngularComponentInformation
  | AngularDirectiveOrPipeInformation;

const GIT_IGNORED_EXCLUSIONS = fs
  .readFileSync(path.resolve(ROOT_DIRECTORY, '.gitignore'), 'utf-8')
  .split('\n')
  .filter(line => line.trim() && !line.startsWith('#'));

const FILE_EXCLUSIONS_FOR_SEARCH = [
  ...GIT_IGNORED_EXCLUSIONS,
  'types',
  'typings',
  'scripts',
  'assets/scripts',
  'core/tests/build_sources',
  'core/tests/data',
  'core/tests/load_tests',
  'core/tests/release_sources',
  'core/tests/services_sources',
  'core/tests/test-dependencies',
  'core/templates/tests',
  'core/templates/services/UpgradedServices.ts',
  'core/templates/services/angular-services.index.ts',
  'core/templates/utility/hashes.ts',
  'webpack.*.ts',
  'angular-template-style-url-replacer.webpack-loader.js',
];

const FILE_EXTENSIONS_FOR_SEARCH = [
  '.ts',
  '.js',
  '.html',
  '.md',
  '.css',
  'CODEOWNERS',
  'AUTHORS',
  'CONTRIBUTORS',
];

const MANUALLY_MAPPED_DEPENDENCIES: Record<string, string[]> = {
  '.lighthouserc-base.js': [
    'puppeteer-login-script.js',
    'core/tests/puppeteer/lighthouse_setup.js',
  ],
  'core/tests/puppeteer-acceptance-tests/utilities/common/puppeteer-utils.ts': [
    'core/tests/puppeteer-acceptance-tests/specs/helpers/reporter.ts',
  ],
  'core/templates/pages/header_css_libs.html': [
    'core/templates/css/oppia.css',
    'core/templates/css/oppia-material.css',
  ],
  'core/templates/pages/oppia-root/index.ts': [
    'core/templates/pages/oppia-root/oppia-root.mainpage.html',
  ],
  'core/templates/pages/lightweight-oppia-root/index.ts': [
    'core/templates/pages/lightweight-oppia-root/lightweight-oppia-root.mainpage.html',
  ],
};

const LIGHTHOUSE_MODULES = [
  '.lighthouserc-performance.js',
  '.lighthouserc-accessibility.js',
];

const CI_TEST_SUITE_CONFIGS_DIRECTORY = path.resolve(
  ROOT_DIRECTORY,
  'core/tests/ci-test-suite-configs'
);

const ROOT_FILES_CONFIG_FILE = path.resolve(
  ROOT_DIRECTORY,
  'core/tests/root-files-config.json'
);

/**
 * Gets all the module imports that are called using require or import in the
 * given source file.
 */
const getCallExpressionModuleImportsFromSourceFile = (
  sourceFile: SourceFile
): string[] => {
  const importAndRequireCallExpressions = sourceFile
    .getDescendantsOfKind(ts.SyntaxKind.CallExpression)
    .filter(callExpression => {
      const expression = callExpression.getExpression();
      return (
        expression.getText() === 'require' || expression.getText() === 'import'
      );
    });

  return importAndRequireCallExpressions.map(callExpression => {
    const moduleSpecifier = callExpression.getArguments()[0];
    if (!moduleSpecifier) {
      throw new Error(
        'No module specifier found in require or import call in ' +
          `${sourceFile.getFilePath()} with ${callExpression.getText()}.`
      );
    }
    const moduleSpecifierValue =
      getValueFromLiteralStringOrBinaryExpression(moduleSpecifier);
    if (!moduleSpecifierValue) {
      throw new Error(
        'The module specifier could not be evaluated in the require or import call in' +
          `${callExpression.getText()} at ${sourceFile.getFilePath()}.`
      );
    }
    return resolveModuleRelativeToRoot(
      moduleSpecifierValue,
      sourceFile.getFilePath()
    );
  });
};

/**
 * Gets all the module imports from the given source file.
 */
const getModuleImportsFromSourceFile = (sourceFile: SourceFile): string[] => {
  const importDeclarations = sourceFile.getImportDeclarations();
  const importModules = importDeclarations.map(importDeclaration => {
    return resolveModuleRelativeToRoot(
      importDeclaration.getModuleSpecifierValue(),
      sourceFile.getFilePath()
    );
  });

  const callExpressionImportModules =
    getCallExpressionModuleImportsFromSourceFile(sourceFile);

  return [...importModules, ...callExpressionImportModules].filter(
    module => !isNodeModule(module)
  );
};

/**
 * Gets the Angular decorator type from the given decorator text.
 */
const getAngularDecoratorTypeFromDecoratorText = (
  decoratorText: string
): AngularInformation['type'] => {
  if (decoratorText === AngularDecorators.Module) {
    return 'module';
  }
  if (decoratorText === AngularDecorators.Component) {
    return 'component';
  }
  if (decoratorText === AngularDecorators.Directive) {
    return 'directive';
  }
  return 'pipe';
};

/**
 * Gets the Angular informations from the given source file.
 */
const getAngularInformationsFromSourceFile = (
  sourceFile: SourceFile
): AngularInformation[] => {
  const decorationNodes: Decorator[] = [];
  for (const decorator of Object.values(AngularDecorators)) {
    decorationNodes.push(
      ...getDecoratorNodesByTextFromSourceFile(sourceFile, decorator)
    );
  }

  return decorationNodes.map(decorationNode => {
    const decorationText = getDecoratorNodeText(decorationNode);
    const className = decorationNode
      .getParent()
      .asKindOrThrow(ts.SyntaxKind.ClassDeclaration)
      .getNameOrThrow();
    const type = getAngularDecoratorTypeFromDecoratorText(decorationText);
    if (type === 'module') {
      return {
        type,
        className,
      };
    }

    const objectArgument = decorationNode.getArguments()[0];
    if (
      !objectArgument ||
      !objectArgument.isKind(ts.SyntaxKind.ObjectLiteralExpression)
    ) {
      throw new Error(
        `No object argument found in ${decorationText} on class ` +
          `${className} in ${sourceFile.getFilePath()}`
      );
    }

    const selectorProperty = objectArgument.getProperty('selector');
    const selector = selectorProperty
      ? selectorProperty
          .asKindOrThrow(ts.SyntaxKind.PropertyAssignment)
          .getInitializerOrThrow()
          .asKindOrThrow(ts.SyntaxKind.StringLiteral)
          .getLiteralValue()
      : undefined;
    if (type === 'directive') {
      return {
        type,
        className,
        selector,
      };
    }

    const nameProperty = objectArgument.getProperty('name');
    const name = nameProperty
      ? nameProperty
          .asKindOrThrow(ts.SyntaxKind.PropertyAssignment)
          .getInitializerOrThrow()
          .asKindOrThrow(ts.SyntaxKind.StringLiteral)
          .getLiteralValue()
      : undefined;
    if (type === 'pipe') {
      return {
        type,
        className,
        selector: name,
      };
    }

    const templateUrlProperty = objectArgument.getProperty('templateUrl');
    const templateUrl = templateUrlProperty
      ? templateUrlProperty
          .asKindOrThrow(ts.SyntaxKind.PropertyAssignment)
          .getInitializerOrThrow()
          .asKindOrThrow(ts.SyntaxKind.StringLiteral)
          .getLiteralValue()
      : undefined;

    return {
      type,
      className,
      selector,
      templateFilePath: templateUrl
        ? resolveModuleRelativeToRoot(templateUrl, sourceFile.getFilePath())
        : undefined,
    };
  });
};

/**
 * Checks if a file is a frontend test file.
 */
const isFrontendTestFile = (file: string): boolean => {
  return (
    file.endsWith('.spec.ts') && !file.includes('puppeteer-acceptance-tests')
  );
};

/**
 * Gets the Angular informations from the given files.
 */
const getFileToAngularInformationsFromFiles = (
  files: string[]
): Record<string, AngularInformation[]> => {
  return files.reduce(
    (acc: Record<string, AngularInformation[]>, file: string) => {
      if (isFrontendTestFile(file)) {
        acc[file] = [];
        return acc;
      }
      const sourceFile = project.addSourceFileAtPath(file);
      const angularInformations =
        getAngularInformationsFromSourceFile(sourceFile);
      acc[file] = angularInformations;
      return acc;
    },
    {}
  );
};

/**
 * Checks if the given text contains a specific pipe selector.
 */
const isPipeSelectorPresentInText = (
  text: string,
  selector: string
): boolean => {
  return text.includes('|') && text.includes(selector);
};

/**
 * Gets the Angular dependencies from a HTML file.
 */
const getAngularDependenciesFromHtmlFile = (
  file: string,
  fileToAngularInformations: Record<string, AngularInformation[]>
): string[] => {
  const content = fs.readFileSync(file, 'utf-8');
  const {document} = parseHTML(content);

  // Here we remove all square brackets and parentheses from the attributes
  // that come from Angular binding and convert them to normal attributes so
  // that we can check if the directive's attribute is present in the element.
  document.querySelectorAll('*').forEach(element => {
    Object.entries(element.attributes).forEach(([name, attribute]) => {
      if (
        (name.startsWith('[') && name.endsWith(']')) ||
        (name.startsWith('(') && name.endsWith(')'))
      ) {
        element.removeAttribute(name);
        element.setAttribute(name.slice(1, -1), attribute.value);
      }
    });
  });

  const dependencies: string[] = [];
  for (const [dependencyFile, dependencyAngularInformations] of Object.entries(
    fileToAngularInformations
  )) {
    for (const dependencyAngularInformation of dependencyAngularInformations) {
      if (
        dependencyAngularInformation.type === 'module' ||
        dependencyAngularInformation.selector === undefined
      ) {
        continue;
      }

      const {selector, type} = dependencyAngularInformation;
      if (type === 'pipe') {
        document.querySelectorAll('*').forEach(element => {
          const text = element.textContent || '';
          if (isPipeSelectorPresentInText(text, selector)) {
            dependencies.push(dependencyFile);
          }
          for (const attribute of Object.values(element.attributes)) {
            if (isPipeSelectorPresentInText(attribute.value || '', selector)) {
              dependencies.push(dependencyFile);
            }
          }
        });
      } else if (
        (type === 'component' || type === 'directive') &&
        document.querySelector(selector)
      ) {
        dependencies.push(dependencyFile);
      }
    }
  }

  return dependencies;
};

/**
 * Gets the content dependencies from a HTML file.
 */
const getContentDependenciesFromHtmlFile = (file: string): string[] => {
  const content = fs.readFileSync(file, 'utf-8');
  const {document} = parseHTML(content);
  const dependencies: string[] = [];

  for (const line of content.split('\n')) {
    if (!line.includes('@load')) {
      continue;
    }
    const loaderModule = line
      .substring(line.indexOf('(') + 1, line.indexOf(')'))
      .split(',')[0]
      .slice(1, -1);
    const loaderModulePath = resolveModuleRelativeToRoot(loaderModule, file);
    dependencies.push(loaderModulePath);
  }

  document.querySelectorAll('[src], [href]').forEach(element => {
    if (element.tagName === 'script' || element.tagName === 'style') {
      const module =
        element.getAttribute('src') || element.getAttribute('href');
      if (module) {
        // Only add the dependency if it is resolvable since some scripts or
        // styles might be external.
        try {
          const modulePath = resolveModuleRelativeToRoot(module, file);
          dependencies.push(modulePath);
        } catch (e) {}
      }
    }
  });

  return dependencies;
};

/**
 * Gets the dependencies from a HTML file.
 */
const getDependenciesFromHtmlFile = (
  file: string,
  fileToAngularInformations: Record<string, AngularInformation[]>
): string[] => {
  return Array.from(
    new Set([
      ...getAngularDependenciesFromHtmlFile(file, fileToAngularInformations),
      ...getContentDependenciesFromHtmlFile(file),
    ])
  );
};

/**
 * Gets the dependencies from a TypeScript or JavaScript file.
 */
const getDependenciesFromTypeScriptOrJavaScriptFile = (
  file: string,
  fileToAngularInformations: Record<string, AngularInformation[]>
): string[] => {
  const sourceFile = project.addSourceFileAtPath(file);
  const dependencies: string[] = [];

  dependencies.push(...getModuleImportsFromSourceFile(sourceFile));

  const angularInformations = fileToAngularInformations[file];
  angularInformations.forEach(angularInformation => {
    // If the file is a component and has a template file path, we add the
    // template file path as a dependency.
    if (
      angularInformation.type === 'component' &&
      angularInformation.templateFilePath
    ) {
      dependencies.push(angularInformation.templateFilePath);
    }
  });

  // If the file ends with '.import.ts', we check if there is a mainpage file
  // that corresponds to it and add it as a dependency since Webpack loads
  // these.
  if (file.endsWith('.import.ts')) {
    const mainPageFilePath = file.replace('.import.ts', '.mainpage.html');
    if (fs.existsSync(path.join(ROOT_DIRECTORY, mainPageFilePath))) {
      dependencies.push(mainPageFilePath);
    }
  }

  return Array.from(new Set(dependencies));
};

/**
 * Gets the dependency mapping from the given files.
 */
const getDependencyMappingFromFiles = (
  files: string[],
  fileToAngularInformations: Record<string, AngularInformation[]>
): Record<string, string[]> => {
  return files.reduce((acc: Record<string, string[]>, file: string) => {
    acc[file] = MANUALLY_MAPPED_DEPENDENCIES[file] || [];
    if (file.endsWith('.ts') || file.endsWith('.js')) {
      const dependencies = getDependenciesFromTypeScriptOrJavaScriptFile(
        file,
        fileToAngularInformations
      );
      acc[file].push(...dependencies);
    } else if (file.endsWith('.html')) {
      const dependencies = getDependenciesFromHtmlFile(
        file,
        fileToAngularInformations
      );
      acc[file].push(...dependencies);
    }
    return acc;
  }, {});
};

/**
 * Class to generate a file to root files mapping of the files given.
 */
class RootFilesMappingGenerator {
  files: string[];
  dependencyMapping: Record<string, string[]>;
  fileToAngularInformations: Record<string, AngularInformation[]>;
  pageModules: string[];
  pageModulesCoveredByRouteMapping: string[];
  referenceCache: Record<string, string[]> = {};

  constructor(files: string[]) {
    this.files = files;
    this.fileToAngularInformations =
      getFileToAngularInformationsFromFiles(files);
    this.dependencyMapping = getDependencyMappingFromFiles(
      files,
      this.fileToAngularInformations
    );
    this.pageModules = getPageModules();
    this.pageModulesCoveredByRouteMapping =
      getPageModulesCoveredByRouteMapping();
  }

  /**
   * Checks if the given file is an Angular module.
   */
  private isFileAngularModule(file: string): boolean {
    const angularInformations = this.fileToAngularInformations[file];
    return angularInformations.some(
      angularInformation => angularInformation.type === 'module'
    );
  }

  /**
   * Gets the files that depend on the given dependency.
   */
  private getFilesWithDependency(
    dependency: string,
    ignoreModules: boolean = true
  ): string[] {
    let references: string[] = [];

    if (this.referenceCache[dependency]) {
      references = this.referenceCache[dependency];
    } else {
      references = Object.keys(this.dependencyMapping).filter(file => {
        if (isFrontendTestFile(file)) {
          return false;
        }

        const dependencies = this.dependencyMapping[file];
        return dependencies.includes(dependency);
      });
      this.referenceCache[dependency] = references;
    }

    return references.filter((reference: string) => {
      if (ignoreModules) {
        return !this.isFileAngularModule(reference);
      }
      return true;
    });
  }

  /**
   * Finds the root dependencies for the given file.
   */
  private getRootFilesOfFile(
    file: string,
    cache: Record<string, string[]> = {},
    ignoreModules: boolean = true,
    visited: Set<string> = new Set()
  ): string[] {
    if (cache[file]) {
      return cache[file];
    }
    if (visited.has(file)) {
      return [];
    }
    visited.add(file);

    let references = this.getFilesWithDependency(file, ignoreModules);
    if (references.length === 0 || this.pageModules.includes(file)) {
      return [file];
    }

    const roots: string[] = [];
    for (const reference of references) {
      roots.push(
        ...this.getRootFilesOfFile(reference, cache, ignoreModules, visited)
      );
    }

    return Array.from(new Set(roots));
  }

  /**
   * Gets the modules that correspond with the test suites.
   */
  private getTestSuiteModules(): string[] {
    const testSuiteModules: string[] = [];
    const testSuiteConfigFiles = fs
      .readdirSync(CI_TEST_SUITE_CONFIGS_DIRECTORY)
      .filter((file: string) => file.endsWith('.json'))
      .map(file => path.join(CI_TEST_SUITE_CONFIGS_DIRECTORY, file));
    for (const testSuiteConfig of testSuiteConfigFiles) {
      const config = JSON.parse(fs.readFileSync(testSuiteConfig, 'utf-8'));
      const keys = Object.keys(config);
      for (const key of keys) {
        const suites = config[key];
        for (const suite of suites) {
          testSuiteModules.push(suite.module);
        }
      }
    }
    return testSuiteModules;
  }

  /**
   * Gets the valid root files.
   */
  private getValidRootFiles(): string[] {
    const validRootFiles: string[] = [
      ...this.pageModulesCoveredByRouteMapping,
      ...this.getTestSuiteModules(),
      ...LIGHTHOUSE_MODULES,
    ];
    const rootFilesConfig = JSON.parse(
      fs.readFileSync(ROOT_FILES_CONFIG_FILE, 'utf-8')
    );
    validRootFiles.push(...rootFilesConfig.RUN_NO_TESTS_ROOT_FILES);
    validRootFiles.push(...rootFilesConfig.RUN_ALL_TESTS_ROOT_FILES);
    return validRootFiles;
  }

  /**
   * Validates the root files mapping.
   */
  private validateRootFilesMapping(
    rootFilesMapping: Record<string, string[]>
  ): void {
    const rootFiles = Array.from(
      new Set(Object.values(rootFilesMapping).flat())
    );
    const validRootFiles = this.getValidRootFiles();
    const invalidRootFiles = rootFiles.filter((rootFile: string) => {
      if (isFrontendTestFile(rootFile)) {
        return false;
      }
      return !validRootFiles.includes(rootFile);
    });
    if (invalidRootFiles.length > 0) {
      throw new Error(
        'The following invalid root files were found when generating ' +
          `the root files mapping:\n${invalidRootFiles.join('\n')}.\n` +
          'Please add them to the RUN_NO_TESTS_ROOT_FILES or RUN_ALL_TESTS_ROOT_FILES ' +
          'in the root files config at core/tests/root-files-config.json or ' +
          'ensure that they are a valid test suite module or page module. Please ' +
          'take a look at this wiki page if you need further clarification: ' +
          'https://github.com/oppia/oppia/wiki/Partial-CI-Tests-Structure.'
      );
    }
  }

  /**
   * Generates the root files mapping.
   */
  public generateRootFilesMapping(): Record<string, string[]> {
    const rootFilesMapping: Record<string, string[]> = {};

    for (const file of this.files) {
      rootFilesMapping[file] = this.getRootFilesOfFile(file, rootFilesMapping);
    }

    const modulizedRootFilesMapping: Record<string, string[]> = {};
    for (const [file, rootFiles] of Object.entries(rootFilesMapping)) {
      const modulizedRootFiles: string[] = [];
      for (const rootFile of rootFiles) {
        modulizedRootFiles.push(
          ...this.getRootFilesOfFile(rootFile, modulizedRootFilesMapping, false)
        );
      }
      modulizedRootFilesMapping[file] = Array.from(new Set(modulizedRootFiles));
    }

    this.validateRootFilesMapping(modulizedRootFilesMapping);

    return modulizedRootFilesMapping;
  }
}

const files = ts.sys
  .readDirectory(
    ROOT_DIRECTORY,
    FILE_EXTENSIONS_FOR_SEARCH,
    FILE_EXCLUSIONS_FOR_SEARCH,
    []
  )
  .reduce((acc: string[], filePath: string) => {
    acc.push(getRelativePathToRootDirectory(filePath));
    return acc;
  }, []);

const rootFilesMapping = new RootFilesMappingGenerator(
  files
).generateRootFilesMapping();
fs.writeFileSync(
  path.resolve(ROOT_DIRECTORY, 'root-files-mapping.json'),
  JSON.stringify(rootFilesMapping, null, 2)
);
