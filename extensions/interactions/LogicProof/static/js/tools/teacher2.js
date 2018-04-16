// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview These functions are used to build defaultData.js. In future
    they should be made available to exploration editors to change the data
    used in an instance of the LogicProof interaction.
 */

var logicProofTeacher2 = (function() {
  // LINE TEMPLATES

  // Ensures that lineTemplate has all its operators of a matchable kind
  // occuring in a non-substituted instance so that matching a line against
  // the template will be possible, and that all other operators occur in the
  // given list. Also checks line_template is well-typed.
  var requireValidLineTemplate = function(lineTemplate, language, vocabulary) {
    // Collect expressionTemplates to check.
    var expressionTemplates = [];

    // Counts the number of expressionTemplates for which values are actually
    // provided by the student (i.e. those in the 'reader_view' entry.)
    var numAccessible = 0;
    for (var i = 0; i < lineTemplate.reader_view.length; i++) {
      if (lineTemplate.reader_view[i].format === 'expression') {
        expressionTemplates.push(lineTemplate.reader_view[i].content);
        numAccessible++;
      }
    }
    for (var i = 0; i < lineTemplate.antecedents.length; i++) {
      expressionTemplates.push(lineTemplate.antecedents[i]);
    }
    for (var i = 0; i < lineTemplate.results.length; i++) {
      expressionTemplates.push(lineTemplate.results[i]);
    }
    if (lineTemplate.hasOwnProperty('error')) {
      for (var j = 0; j < lineTemplate.error.length; j++) {
        for (var i = 0; i < lineTemplate.error[j].length; i++) {
          if (lineTemplate.error[j][i].format === 'expression') {
            expressionTemplates.push(lineTemplate.error[j][i].content);
          }
        }
      }
    }
    // Collect expressions to check.
    // 'visible' expressions are those occurring in the reader_view line with no
    // substitutions performed on them, and which are thus available to help
    // determine what the variables and atoms have been instantiated as when
    // matching against a student's line. The others are all 'invisible'. We
    // require that any element occurring invisibly also occurs visibly, so
    // that it will be possible to determine its instantiation just from what
    // the student types.
    var checkees = [];
    var types = [];
    var visible = [];
    var invisible = [];
    for (var i = 0; i < expressionTemplates.length; i++) {
      checkees.push(expressionTemplates[i].expression);
      types.push(expressionTemplates[i].type);
      if (expressionTemplates[i].substitutions.length === 0 &&
          i < numAccessible) {
        visible.push(expressionTemplates[i].expression);
      } else {
        invisible.push(expressionTemplates[i].expression);
      }
      for (var j = 0; j < expressionTemplates[i].substitutions.length; j++) {
        for (var key in expressionTemplates[i].substitutions[j]) {
          var LHS = {
            top_operator_name: key,
            top_kind_name: 'variable',
            arguments: [],
            dummies: []
          };
          var RHS = expressionTemplates[i].substitutions[j][key];
          checkees.push(LHS);
          types.push('element');
          checkees.push(RHS);
          types.push('element');
          invisible.push(LHS);
          if (i < numAccessible) {
            // FUTURE (Jacob): change back to visible (for single
            // substitutions) after writing seekSubstitute.
            invisible.push(RHS);
          } else {
            invisible.push(RHS);
          }
        }
      }
    }
    for (var i = 0; i < lineTemplate.variables.length; i++) {
      checkees.push(lineTemplate.variables[i]);
      types.push('element');
      invisible.push(lineTemplate.variables[i]);
    }

    // 1. Vocab checking
    requireNoWordsUsed(checkees, language.operators, vocabulary);
    // 2. Type checking
    var typeCheck = logicProofShared.assignTypesToExpressionArray(
      checkees, types, language, ['variable', 'atom'], true);
    if (typeCheck.length > 1) {
      throw new logicProofShared.UserError('ambiguous_typing', {});
    }
    // 3. Matchability checking
    var visibleOperators = logicProofShared.getOperatorsFromExpressionArray(
      visible);
    var hiddenOperators = logicProofShared.getOperatorsFromExpressionArray(
      invisible);
    for (var i = 0; i < hiddenOperators.length; i++) {
      if (!language.operators.hasOwnProperty(hiddenOperators[i]) &&
          visibleOperators.indexOf(hiddenOperators[i]) === -1) {
        throw new logicProofShared.UserError('hidden_operator', {
          operator: hiddenOperators[i]
        });
      }
    }
  };

  /**
   * @param {string} nameString - The name of the template, provided by the
   *        teacher.Multiple templates can have the same name. These names are
   *        then available to refer to in the MistakeTable.
   * @param {string} readerViewString - A string from the teacher that describes
   *        what lines of this form should look like when the student writes
   *        them.
   * @param {string} antecedentsString - A string from the teacher describing
   *        the antecedents a line of this form should have. These can then be
   *        referred to in the MistakeTable to check, for example, that every
   *        antecedent needed was proved on an earlier line.
   * @param {string} resultsString - Similar
   * @param {string} variablesString - Similar
   * @param {Array.<String>} errorStrings - If this LineTemplate is an instance
   *        of an incorrect deduction then the teacher supplies a list of
   *        possible critiques to show to the student. They are supplied as
   *        strings which here will be converted into LineMessages.
   * @param {Language} language - A Language object, giving the student's
   *        language.
   * @param {Vocabulary} vocabulary - A Vocabulary object giving the phrases
   *        that can be used within lines (so here within the readerViewString)
   * @return {LineTemplate}
   * @throws If the strings cannot be parsed, or the expressions in them are
   *         incorrectly typed, or they contain words reserved for use in
   *         phrases, or there is a an expression (generally in the results,
   *         antecendents or variables) that it will not be possible to deduce
   *         from what the student is required to write.
   */
  var buildLineTemplate = function(nameString, readerViewString,
      antecedentsString, resultsString, variablesString, errorStrings,
      language, vocabulary) {
    var possibleReaderViews = logicProofShared.parseLineString(
      readerViewString, language.operators, vocabulary, true);
    if (possibleReaderViews.length > 1) {
      throw new logicProofShared.UserError('ambiguous_parsing', {
        field: 'reader view'
      });
    }
    readerView = possibleReaderViews[0];
    try {
      var antecedents = logicProofParser.parse(
        antecedentsString.replace(/ /g, ''), 'listOfBooleanTemplates');
    } catch (err) {
      throw new logicProofShared.UserError('unparseable', {
        field: 'antecedents'
      });
    }
    try {
      var results = logicProofParser.parse(
        resultsString.replace(/ /g, ''), 'listOfBooleanTemplates');
    } catch (err) {
      throw new logicProofShared.UserError('unparseable', {
        field: 'results'
      });
    }
    try {
      var variables = logicProofParser.parse(
        variablesString.replace(/ /g, ''), 'listOfVariables');
    } catch (err) {
      throw new logicProofShared.UserError('unparseable', {
        field: 'variables'
      });
    }
    var errors = [];
    for (var i = 0; i < errorStrings.length; i++) {
      errors.push(parseMessage(errorStrings[i], 'line'));
    }
    var lineTemplate = {
      name: nameString,
      reader_view: readerView,
      antecedents: antecedents,
      results: results,
      variables: variables,
      error: errors
    };
    requireValidLineTemplate(lineTemplate, language, vocabulary);
    return lineTemplate;
  };

  var displayExpressionTemplate = function(template, operators) {
    var output = logicProofShared.displayExpression(
      template.expression, operators);
    for (var i = 0; i < template.substitutions.length; i++) {
      var newOutput = [];
      for (key in template.substitutions[i]) {
        newOutput.push(key + '->' + logicProofShared.displayExpression(
          template.substitutions[i][key], operators, 0));
      }
      output = output + '[' + newOutput.join(', ') + ']';
    }
    return output;
  };

  var displayExpressionTemplateArray = function(array, operators) {
    var displayedArray = [];
    for (var i = 0; i < array.length; i++) {
      displayedArray.push(displayExpressionTemplate(array[i], operators));
    }
    return displayedArray.join(', ');
  };

  // The template as seen by the teacher
  var displayLineFragmentTemplate = function(template, operators, vocabulary) {
    if (template.format === 'phrase') {
      return vocabulary[template.content][0];
    } else if (template.content.type === 'element') {
      return template.content.hasOwnProperty('kind') ?
        '{{' + displayExpressionTemplate(template.content, operators) +
          '|variable}}' :
        '{{' + displayExpressionTemplate(template.content, operators) +
          '|element}}';
    } else {
      return displayExpressionTemplate(template.content, operators);
    }
  };

  // Just gives the 'reader_view' part of the template, not the other
  // parameters like antecedents
  var displayLineTemplateReaderView = function(
      readerView, operators, vocabulary) {
    var displayedFragments = [];
    for (i = 0; i < readerView.length; i++) {
      displayedFragments.push(displayLineFragmentTemplate(
        readerView[i], operators, vocabulary));
    }
    return displayedFragments.join(' ');
  };

  // The message as seen by the teacher
  var displayMessage = function(message, operators) {
    var output = '';
    for (i = 0; i < message.length; i++) {
      if (message[i].format === 'expression') {
        if (message[i].content.type === 'element') {
          output += (message[i].content.hasOwnProperty('kind') ?
            '{{' + displayExpressionTemplate(message[i].content, operators) +
              '|variable}}' :
            '{{' + displayExpressionTemplate(message[i].content, operators) +
              '|element}}');
        } else {
          output += (
            '{{' + displayExpressionTemplate(message[i].content, operators) +
            '}}');
        }
      } else {
        output = output + message[i].content;
      }
    }
    return output;
  };

  var displayLineTemplate = function(template, operators, vocabulary) {
    var displayedMessages = [];
    for (var i = 0; i < template.error.length; i++) {
      displayedMessages.push(displayMessage(template.error[i], operators));
    }
    return {
      name: template.name,
      reader_view: displayLineTemplateReaderView(
        template.reader_view, operators, vocabulary),
      antecedents: displayExpressionTemplateArray(
        template.antecedents, operators),
      results: displayExpressionTemplateArray(
        template.results, operators),
      variables: logicProofShared.displayExpressionArray(
        template.variables, operators),
      error: displayedMessages
    };
  };

  /**
   * @param {Array} stringTable - an array of dictionaries of the form {
   *          name: a string from the teacher giving the name
   *          reader_view: likewise
   *          antecedents: likewise
   *          results: likewise
   *          variables: likewise
   *          error: an array of strings
   *        }
   * @param {Vocabulary} vocabulary - a Vocabulary object
   * @return {Array.<LineTemplate>} An array of LineTemplates
   * @throws If any line makes an error in buildLineTemplate() then we throw an
   *         array of the error messages for each line (blank if a line is
   *         fine).
   */
  var buildLineTemplateTable = function(stringTable, vocabulary) {
    var table = [];
    var failed = false;
    var failures = [];
    for (var i = 0; i < stringTable.length; i++) {
      try {
        table.push(
          buildLineTemplate(
            stringTable[i].name, stringTable[i].reader_view,
            stringTable[i].antecedents, stringTable[i].results,
            stringTable[i].variables, stringTable[i].error,
            logicProofData.BASE_STUDENT_LANGUAGE, vocabulary));
        failures.push('');
      } catch (err) {
        failed = true;
        failures.push(
          logicProofShared.renderError(
            err, logicProofTeacher.TEACHER_ERROR_MESSAGES,
            logicProofData.BASE_STUDENT_LANGUAGE));
      }
    }
    if (failed) {
      throw failures;
    } else {
      return table;
    }
  };

  var displayLineTemplateTable = function(table, vocabulary) {
    var output = [];
    for (var i = 0; i < table.length; i++) {
      output.push(
        displayLineTemplate(
          table[i],
          logicProofData.BASE_STUDENT_LANGUAGE.operators,
          vocabulary));
    }
    return output;
  };

  // MISTAKE TABLE

  /**
   * @param {MistakeEntry variation} mistakeEntry - a MistakeEntry object (but
   *        with Expressions in place of TypedExpressions) which we are to
   *        check and assign types to.
   * @param {Language} language - a Language object giving the control language.
   * @return {MistakeEntry} a proper MistakeEntry object, with
   *         TypedExpressions.
   * @throws if the mistake entry contains incorrect typings.
   */
  var validateAndTypeMistakeEntry = function(mistakeEntry, language) {
    var availableOperators = [];
    for (key in language.operators) {
      availableOperators[key] = language.operators[key];
    }
    // This is available to refer to the line number
    availableOperators.n = {
      kind: 'variable',
      typing: [{
        arguments: [],
        dummies: [],
        output: 'integer'
      }]
    };
    newLanguage = {
      operators: availableOperators,
      types: language.types,
      kinds: language.kinds
    };
    // Other than the line number, no new operators can be used.
    var typeCheck = logicProofShared.assignTypesToExpression(
      mistakeEntry.occurs, ['boolean'], newLanguage, ['constant']);
    if (typeCheck.length > 1) {
      throw new logicProofShared.UserError('ambiguous_typing', {});
    }
    mistakeEntry.occurs = typeCheck[0].typedExpression;
    for (var i = 0; i < mistakeEntry.message.length; i++) {
      for (var j = 0; j < mistakeEntry.message[i].length; j++) {
        if (mistakeEntry.message[i][j].format === 'expression') {
          var expression = mistakeEntry.message[i][j].content;
          var typeCheck = logicProofShared.assignTypesToExpression(
            expression,
            ['integer', 'string', 'formula', 'set_of_formulas', 'boolean'],
            newLanguage, ['constant']);
          if (typeCheck.length > 1) {
            throw new logicProofShared.UserError('ambiguous_typing', {});
          }
          mistakeEntry.message[i][j].content = typeCheck[0].typedExpression;
        }
      }
    }
    return mistakeEntry;
  };

  /**
   * @param {string} nameString - A string provided by the teacher giving the
   *        name of the entry; this is not used for anything but is convenient
   *        for the teacher when writing the table.
   * @param {string} occursString - A string from the teacher that represents
   *        an expression in the control language determining whether the
   *        mistake has been made by the student.
   * @param {Array.<string>} messageStrings - An array of string written by the
   *        teacher, each of which represents a possible message to give the
   *        student if they make the mistake in question.
   * @param {Language} controlLanguage - A Language object giving the control
   *        language (that which is used to write formulas describing when
   *        mistakes occur).
   * @returns {MistakeEntry}
   * @throws If the inputs are unparseable or badly typed.
   */
  var buildMistakeEntry = function(
      nameString, occursString, messageStrings, controlLanguage) {
    try {
      var occurs = logicProofParser.parse(
        occursString.replace(/ /g, ''), 'expression');
    } catch (err) {
      throw new logicProofShared.UserError('unparseable', {
        field: 'description of when this mistake occurs'
      });
    }
    var messages = [];
    for (var i = 0; i < messageStrings.length; i++) {
      messages.push(parseMessage(messageStrings[i], 'control'));
    }
    var mistakeEntry = {
      name: nameString,
      occurs: occurs,
      message: messages
    };
    return validateAndTypeMistakeEntry(mistakeEntry, controlLanguage);
  };

  // The teacher's version; the operators should be those from the control
  // language.
  var displayControlMessage = function(message, operators) {
    var output = '';
    for (var i = 0; i < message.length; i++) {
      if (message[i].format === 'string') {
        output += message[i].content;
      } else {
        output += '{{' +
          logicProofShared.displayExpression(message[i].content, operators) +
          '}}';
      }
    }
    return output;
  };

  var displayMistakeEntry = function(mistakeEntry, operators) {
    var displayedMessages = [];
    for (var i = 0; i < mistakeEntry.message.length; i++) {
      displayedMessages.push(
        displayControlMessage(mistakeEntry.message[i], operators));
    }
    return {
      name: mistakeEntry.name,
      occurs: logicProofShared.displayExpression(
        mistakeEntry.occurs, operators),
      message: displayedMessages
    };
  };

  /**
   * @param {string} name - the name of the section (e.g. layout, target)
   * @param {Array.<object>} entryStrings - an array of dictionaries of the
   *        form: {
   *          name: name string,
   *          occurs: occurs string,
   *          message: an array of message strings
   *        }
   * @param {Array} controlFunctions
   * @return {MistakeSection}
   * @throws an array of error messages, one per entry.
   */
  var buildMistakeSection = function(name, entryStrings, controlFunctions) {
    var controlLanguage = angular.copy(logicProofData.BASE_CONTROL_LANGUAGE);
    for (var i = 0; i < controlFunctions.length; i++) {
      controlLanguage.operators[controlFunctions[i].name] = {
        kind: 'prefix_function',
        typing: controlFunctions[i].typing
      };
    }

    var failed = false;
    var failures = [];
    var entries = [];
    for (var i = 0; i < entryStrings.length; i++) {
      try {
        entries.push(
          buildMistakeEntry(
            entryStrings[i].name, entryStrings[i].occurs,
            entryStrings[i].message, controlLanguage));
        failures.push('');
      } catch (err) {
        failed = true;
        failures.push(
          logicProofShared.renderError(
            err, logicProofTeacher.TEACHER_ERROR_MESSAGES, controlLanguage));
      }
    }
    if (failed) {
      throw failures;
    } else {
      return {
        name: name,
        entries: entries
      };
    }
  };

  var displayMistakeSection = function(mistakeSection, operators) {
    var displayedEntries = [];
    for (var i = 0; i < mistakeSection.entries.length; i++) {
      displayedEntries.push(
        displayMistakeEntry(mistakeSection.entries[i], operators));
    }
    return {
      name: mistakeSection.name,
      entries: displayedEntries
    };
  };

  var displayMistakeTable = function(mistakeTable) {
    var displayedSections = [];
    for (var i = 0; i < mistakeTable.length; i++) {
      displayedSections.push(
        displayMistakeSection(
          mistakeTable[i], logicProofData.BASE_CONTROL_LANGUAGE.operators));
    }
    return displayedSections;
  };

  // CONTROL FUNCTIONS

  /**
   * @param {Expression} formulaLHS - an Expression representing the
   *        left-hand-side of the definition of a formula - e.g. f(n,m).
   * @param {Expression} formulaRHS - an Expression representing the
   *        right-hand-side of such a definition - e.g. n + g(m).
   * @param {Language} language - a Language object representing the control
   *        language (the one used to describe when a student has made a
   *        mistake) including all of the previously-defined control functions.
   * @returns {Object} with the following keys:
   *   - typing: a length-1 array of the TypingRule that the function being
   *       defined has been deduced to have.
   *   - typedDefinition: a TypedExpression that is the given formulaRHS but
   *       now with types added.
   * @throws If the teacher makes a mistake such as re-using a function name or
   *         assigning invalid types.
   */
  var validateAndTypeControlFunction = function(
      formulaLHS, formulaRHS, language) {
    if (language.operators.hasOwnProperty(formulaLHS.top_operator_name)) {
      throw new logicProofShared.UserError('duplicate_function_name', {
        // eslint-disable-next-line quote-props
        'function': formulaLHS.top_operator_name
      });
    }
    if (formulaLHS.top_operator_name === 'n') {
      throw new logicProofShared.UserError('function_name_is_n', {});
    }

    var availableOperators = {};
    for (var key in language.operators) {
      availableOperators[key] = language.operators[key];
    }
    for (var i = 0; i < formulaLHS.arguments.length; i++) {
      if (language.operators.hasOwnProperty(
        formulaLHS.arguments[i].top_operator_name)) {
        throw new logicProofShared.UserError(
          'argument_is_function_name', {
            argument: formulaLHS.arguments[i].top_operator_name
          });
      } else if (availableOperators.hasOwnProperty(
        formulaLHS.arguments[i].top_operator_name)) {
        throw new logicProofShared.UserError(
          'duplicate_argument', {
            argument: formulaLHS.arguments[i].top_operator_name
          });
      } else if (
        logicProofShared.getOperatorsFromExpression(formulaRHS).indexOf(
          formulaLHS.arguments[i].top_operator_name) === -1) {
        throw new logicProofShared.UserError(
          'unused_argument', {
            argument: formulaLHS.arguments[i].top_operator_name
          });
      } else {
        availableOperators[formulaLHS.arguments[i].top_operator_name] = {
          kind: 'variable',
          // We can't tell the types of the arguments yet, but they should be
          // deducible from the RHS.
          typing: [{
            arguments: [],
            dummies: [],
            output: 'integer'
          }, {
            arguments: [],
            dummies: [],
            output: 'string'
          }, {
            arguments: [],
            dummies: [],
            output: 'formula'
          }, {
            arguments: [],
            dummies: [],
            output: 'set_of_formulas'
          }]
        };
      }
    }
    // The RHS cannot use any operator not found on the LHS or in the given list
    var typeCheck = logicProofShared.assignTypesToExpression(formulaRHS, [
      'boolean', 'integer', 'string', 'formula', 'set_of_formulas'
    ], {
      operators: availableOperators,
      kinds: language.kinds,
      types: language.types
    }, ['constant']);
    if (typeCheck.length > 1) {
      throw new logicProofShared.UserError('ambiguous_typing', {});
    }
    // Now we can work out what the typing of the formula actually is
    var argumentTypes = [];
    for (var i = 0; i < formulaLHS.arguments.length; i++) {
      argumentTypes.push({
        type: logicProofShared.seekTypeInExpression(
          typeCheck[0].typedExpression,
          formulaLHS.arguments[i].top_operator_name),
        arbitrarily_many: false
      });
    }
    return {
      typing: [{
        arguments: argumentTypes,
        dummies: [],
        output: typeCheck[0].typedExpression.type
      }],
      typedDefinition: typeCheck[0].typedExpression
    };
  };

  /**
   * @param {string} LHSstring - a string from the teacher representing the
   *        left-hand-side of the function definition.
   * @param {string} RHSstring - likewise for the right-hand-side.
   * @param {string} descriptionString - a description of what the function is
   *        supposed to mean; this is not used by the code but is convenient
   *        for the user.
   * @param {Language} controlLanguage - a Language object representing the
   *        language used to write descriptions of mistakes, and also functions
   *        such as these that help to describe mistakes.
   * @return {object} a dictionary {
   *            name: the name of the function, deduced from the LHSstring
   *            variables: the free variables in the function definition,
   *              deduced from the LHSstring.
   *            typing: a length-1 array of the TypingRule for the new function
   *            definition: a TypedExpression deduced from the RHSstring, but
   *              with types added
   *            description: the descriptionString
   *          }
   * @throws If the input cannot be parsed, or is incorrect as in
   *         validateAndTypeControlFunction().
   */
  var buildControlFunction = function(
      LHSstring, RHSstring, descriptionString, controlLanguage) {
    try {
      var formulaLHS = logicProofParser.parse(
        LHSstring.replace(/ /g, ''), 'formulaLHS');
    } catch (err) {
      throw new logicProofShared.UserError('unparseable', {
        field: 'left-hand side'
      });
    }
    try {
      var formulaRHS = logicProofParser.parse(
        RHSstring.replace(/ /g, ''), 'expression');
    } catch (err) {
      throw new logicProofShared.UserError('unparseable', {
        field: 'right-hand side'
      });
    }
    var validation = validateAndTypeControlFunction(
      formulaLHS, formulaRHS, controlLanguage);
    return {
      name: formulaLHS.top_operator_name,
      variables: formulaLHS.arguments,
      typing: validation.typing,
      definition: validation.typedDefinition,
      description: descriptionString
    };
  };

  /**
   * @param {object} controlFunction - a dictionary such as
   *        buildControlFunction() returns
   * @param {object} operators - the operators key from the control language
   * @return {
   *   LHS: the left-hand side of the formula
   *   RHS: the right-hand side
   *   description: the description
   * }
   */
  var displayControlFunction = function(controlFunction, operators) {
    var LHSExpression = {
      top_kind_name: 'prefix_function',
      top_operator_name: controlFunction.name,
      arguments: controlFunction.variables,
      dummies: []
    };
    return {
      LHS: logicProofShared.displayExpression(LHSExpression, operators),
      RHS: logicProofShared.displayExpression(
        controlFunction.definition, operators),
      description: controlFunction.description
    };
  };

  /**
   * We got through the list of control functions in turn, validating them and
   * adding them to to the list of operators and model; if one fails validation
   * we abort.
   * @param {Array.<object>} controlFunctionStrings - an array of dictionaries
   *        of the form {
   *          LHS: string representing the function LHS,
   *          RHS: string representing the function RHS,
   *          description: string describing the function
   *        }
   * @return {Array.<object>} an array of dictionaries of the kind
   *         buildControlFunction returns
   * @throws the first Error found in the table, with an additonal key 'line'
   *         that gives the number of the line in the table where this error
   *         occurred.
   */
  var buildControlFunctionTable = function(controlFunctionStrings) {
    // Copy the old control operators and model.
    var operators = {};
    for (var key in logicProofData.BASE_CONTROL_LANGUAGE.operators) {
      operators[key] = logicProofData.BASE_CONTROL_LANGUAGE.operators[key];
    }
    var controlLanguage = {
      types: logicProofData.BASE_CONTROL_LANGUAGE.types,
      kinds: logicProofData.BASE_CONTROL_LANGUAGE.kinds,
      operators: operators
    };
    var table = [];

    for (var i = 0; i < controlFunctionStrings.length; i++) {
      try {
        var built = buildControlFunction(
          controlFunctionStrings[i].LHS, controlFunctionStrings[i].RHS,
          controlFunctionStrings[i].description, controlLanguage);
      } catch (err) {
        throw {
          message: logicProofShared.renderError(
            err, logicProofTeacher.TEACHER_ERROR_MESSAGES,
            logicProofData.BASE_CONTROL_LANGUAGE),
          line: i
        };
      }
      controlLanguage.operators[built.name] = {
        kind: 'prefix_function',
        typing: built.typing
      };
      table.push(built);
    }
    return table;
  };

  var displayControlFunctionTable = function(table) {
    var displayedEntries = [];
    for (var i = 0; i < table.length; i++) {
      displayedEntries.push(displayControlFunction(
        table[i], logicProofData.BASE_CONTROL_LANGUAGE.operators));
    }
    return displayedEntries;
  };

  // UTILITIES

  var parseMessageStringFragment = function(fragmentString, typeOfMessage) {
    return (typeOfMessage === 'general') ? {
      isFixed: true,
      content: fragmentString
    } : {
      format: 'string',
      content: fragmentString
    };
  };

  var parseMessageParameterFragment = function(fragmentString, typeOfMessage) {
    if (typeOfMessage === 'general') {
      return {
        isFixed: false,
        content: fragmentString.slice(2, fragmentString.length - 2)
      };
    } else {
      try {
        return {
          format: 'expression',
          content: (typeOfMessage === 'line') ?
            logicProofParser.parse(
              fragmentString.replace(/ /g, ''), 'expressionTemplate2') :
            logicProofParser.parse(
              fragmentString.slice(2, fragmentString.length - 2).replace(
                / /g, ''),
              'expression')
        };
      } catch (err) {
        throw new logicProofShared.UserError('unparseable_fragment', {
          fragment: fragmentString
        });
      }
    }
  };

  var parseMessage = function(messageString, typeOfMessage) {
    var message = [];
    var index = 0;
    while (index < messageString.length) {
      if (messageString.slice(index, index + 2) === '{{') {
        var newIndex = messageString.indexOf('}}', index) + 2;
        if (newIndex === 1) {
          throw new logicProofShared.UserError('unmatched_{{', {});
        }
        if (messageString[newIndex] === '}') {
          newIndex++;
        }
        message.push(
          parseMessageParameterFragment(
            messageString.slice(index, newIndex), typeOfMessage));
      } else {
        var newIndex = messageString.indexOf('{{', index);
        var newIndex = (newIndex === -1) ? messageString.length : newIndex;
        message.push(
          parseMessageStringFragment(
            messageString.slice(index, newIndex), typeOfMessage));
      }
      index = newIndex;
    }
    return message;
  };

  // Checks that a given expression array contains any multi-character words
  // that are used in phrases; if so it throws an error.
  var requireNoWordsUsed = function(
      expressionArray, knownOperators, vocabulary) {
    var vocabularyWords = [];
    for (var key in vocabulary) {
      for (var i = 0; i < vocabulary[key].length; i++) {
        for (var j = 0; j < vocabulary[key][i].split(' ').length; j++) {
          if (vocabularyWords.indexOf(
            vocabulary[key][i].split(' ')[j]) === -1) {
            vocabularyWords.push(vocabulary[key][i].split(' ')[j]);
          }
        }
      }
    }
    var operatorsToCheck = logicProofShared.getOperatorsFromExpressionArray(
      expressionArray);
    for (var i = 0; i < operatorsToCheck.length; i++) {
      if (vocabularyWords.indexOf(operatorsToCheck[i]) !== -1 &&
          operatorsToCheck[i].length > 1 &&
          !knownOperators.hasOwnProperty(operatorsToCheck[i])) {
        throw new logicProofShared.UserError('forbidden_word', {
          word: operatorsToCheck[i]
        });
      }
    }
  };

  return {
    buildLineTemplate: buildLineTemplate,
    displayLineTemplate: displayLineTemplate,
    buildLineTemplateTable: buildLineTemplateTable,
    displayLineTemplateTable: displayLineTemplateTable,
    buildMistakeEntry: buildMistakeEntry,
    displayControlMessage: displayControlMessage,
    displayMistakeEntry: displayMistakeEntry,
    buildMistakeSection: buildMistakeSection,
    displayMistakeSection: displayMistakeSection,
    displayMistakeTable: displayMistakeTable,
    buildControlFunction: buildControlFunction,
    displayControlFunction: displayControlFunction,
    buildControlFunctionTable: buildControlFunctionTable,
    displayControlFunctionTable: displayControlFunctionTable,
    parseMessage: parseMessage
  };
})();
