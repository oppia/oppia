var teacher = (function() {
  //////////////////////////////  QUESTION   /////////////////////////////////////////////////

 /** 
  * @param assumptionsString: typed by the teacher to describe the assumptions the
  *        the student is allowed to make.
  * @param targetString: typed by the teacher to describe what the student is 
  *        supposed to prove.
  * @param language: A Language object in which expressions are written.
  * @param vocabulary: A vocabulary object, the words from which the teacher is
  *        not allowed to use as function names.
  * @result {
  *           operators: the operators occurring in the question including both
  *             ordinary ones (like &) and specific ones (like f).
  *           assumptions: an array of Expressions, which will form the 
  *             'assumptions' key in the widget.
  *           results: an array of length one built from the targetString which
  *             will form the 'results' key in the widget.
  *         }
  * @raises If the given strings cannot be parsed, or are mal-typed or use
  *         words that are reserved for the vocabulary.
  */
  var buildQuestion = function(assumptionsString, targetString, vocabulary) {
    if (assumptionsString.replace(/ /g, '') === '') {
      var assumptions = [];
    } else {
      try {var assumptions = parser.parse(assumptionsString.replace(/ /g, ''), 'listOfExpressions');}
        catch(err) {
          var error = new shared.UserError('unparseable', {field: 'assumptions'});
          throw {
            message: shared.renderError(error, TEACHER_ERROR_MESSAGES, sharedData.BASE_STUDENT_LANGUAGE)
          };
        }
    }
    try {var target = parser.parse(targetString.replace(/ /g, ''), 'expression');}
      catch(err) {
        var error = new shared.UserError('unparseable', {field: 'target'});
        throw {
          message: shared.renderError(error, TEACHER_ERROR_MESSAGES, sharedData.BASE_STUDENT_LANGUAGE)
        };
      }
    var expressions = [];
    var types = ['boolean'];
    for (var i = 0; i < assumptions.length; i++) {
      expressions.push(assumptions[i]);
      types.push('boolean');
    }
    expressions.push(target);

    try {
      var typing = shared.assignTypesToExpressionArray(
        expressions, types, sharedData.BASE_STUDENT_LANGUAGE, ['variable', 'constant', 'prefix_function']
      );
      if (typing.length > 1) {
        throw new shared.UserError('ambiguous_typing', {});
      }
      requireNoWordsUsed(expressions, sharedData.BASE_STUDENT_LANGUAGE.operators, vocabulary);
    }
    catch (err) {
      throw {
        message: shared.renderError(err, TEACHER_ERROR_MESSAGES, sharedData.BASE_STUDENT_LANGUAGE)
      };
    }
    return {
    	operators: typing[0].operators,
    	assumptions: assumptions,
    	results: [target]
    };
  };


/////////////////////  LINE TEMPLATES  /////////////////////////////////////////////////

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
    if(lineTemplate.hasOwnProperty('error')) {
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
    // determine what the variables & atoms have been instantiated as when
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
      if (expressionTemplates[i].substitutions.length === 0 && i < numAccessible) {
        visible.push(expressionTemplates[i].expression);
      } else {
        invisible.push(expressionTemplates[i].expression);
      }
      for (var j = 0; j < expressionTemplates[i].substitutions.length; j++) {
        for (var key in expressionTemplates[i].substitutions[j]) {
          var LHS = {
            operator: key,
            kind: 'variable',
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
            // FUTURE: change back to visible (for single substitutions) after writing seekSubstitute
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
    var typeCheck = shared.assignTypesToExpressionArray(checkees, types, language, ['variable', 'atom'], true);
    if (typeCheck.length > 1) {
      throw new shared.UserError('ambiguous_typing', {});
    }
    // 3. Matchability checking
    var visibleOperators = shared.getOperatorsFromExpressionArray(visible);
    var hiddenOperators = shared.getOperatorsFromExpressionArray(invisible);
    for (var i = 0; i < hiddenOperators.length; i++) {
      if (!language.operators.hasOwnProperty(hiddenOperators[i]) && visibleOperators.indexOf(hiddenOperators[i]) === -1) {
        throw new shared.UserError('hidden_operator', {operator: hiddenOperators[i]});
      }
    }
  };

 /**
  * @param nameString: The name of the template, provided by the teacher
  *        Multiple templates can have the same name. These names are then
  *        available to refer to in the MistakeTable.
  * @param readerViewString: A string from the teacher that describes what lines
  *        of this form should look like when the student writes them.
  * @param antecedentsString: A string from the teacher describing the
  *        antecedents a line of this form should have. These can then be 
  *        referred to in the MistakeTable to check, for example, that every
  *        antecedent needed was proved on an earlier line.
  * @param resultsString: Similar
  * @param variablesString: Similar
  * @param errorStrings: If this LineTemplate is an instance of an incorrect
  *        deduction then the teacher supplies a list of possible critiques to
  *        show to the student. They are supplied as strings which here will
  *        be converted into LineMessages.
  * @param language: A Language object, giving the student's language.
  * @param vocabulary: A Vocabulary object giving the phrases that can be used
  *        within lines (so here within the readerViewString)
  * @result A LineTemplate object.
  * @raises If the strings cannot be parsed, or the expressions in them are
  *         incorrectly typed, or they contain words reserved for use in
  *         phrases, or there is a an expression (generally in the results,
  *         antecendents or variables) that it will not be possible to deduce
  *         from what the student is required to write.
  */
  var buildLineTemplate = function(nameString, readerViewString, antecedentsString, resultsString, variablesString, errorStrings, language, vocabulary) {
    var possibleReaderViews = shared.parseLineString(readerViewString, language.operators, vocabulary, true);
    if (possibleReaderViews.length > 1) {
      console.log(readerViewString);
      throw new shared.UserError('ambiguous_parsing', {field: 'reader view'});
    }
    readerView = possibleReaderViews[0];
    try {var antecedents = parser.parse(antecedentsString.replace(/ /g, ''), 'listOfBooleanTemplates');}
    catch(err) {throw new shared.UserError('unparseable', {field: 'antecedents'})}
    try {var results = parser.parse(resultsString.replace(/ /g, ''), 'listOfBooleanTemplates');}
    catch(err) {throw new shared.UserError('unparseable', {field: 'results'})}
    try {var variables = parser.parse(variablesString.replace(/ /g, ''), 'listOfVariables');}
    catch(err) {throw new shared.UserError('unparseable', {field: 'variables'})}
    var errors = []
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
    var output = shared.displayExpression(template.expression, operators);
    for (var  i = 0; i < template.substitutions.length; i++) {
      var newOutput = [];
      for (key in template.substitutions[i]) {
        newOutput.push(key + '->' + shared.displayExpression(template.substitutions[i][key], operators, 0));
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
  }

  // The template as seen by the teacher
  var displayLineFragmentTemplate = function(template, operators, vocabulary) {
    if (template.format === 'phrase') {
      return vocabulary[template.content][0];
    } else if (template.content.type === 'element') {
      return template.content.hasOwnProperty('kind') ?
        '{{' + displayExpressionTemplate(template.content, operators) + '|variable}}' :
        '{{' + displayExpressionTemplate(template.content, operators) + '|element}}';
    } else {
    return displayExpressionTemplate(template.content, operators);
    }
  };

  // Just gives the 'reader_view' part of the template, not the other parameters like antecedents
  var displayLineTemplateReaderView = function(readerView, operators, vocabulary) {
    var displayedFragments = [];
    for (i = 0; i < readerView.length; i++) {
      displayedFragments.push(displayLineFragmentTemplate(readerView[i], operators, vocabulary));
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
            '{{' + displayExpressionTemplate(message[i].content, operators) + '|variable}}' :
            '{{' + displayExpressionTemplate(message[i].content, operators) + '|element}}');
        } else {
          output += '{{' + displayExpressionTemplate(message[i].content, operators) + '}}';
        }
      } else {
        output = output + message[i].content;
      }
    }
    return output;
  }

  var displayLineTemplate = function(template, operators, vocabulary) {
    var displayedMessages = [];
    for (var i = 0; i < template.error.length; i++) {
      displayedMessages.push(displayMessage(template.error[i], operators));
    }
    return {
      name: template.name,
      reader_view: displayLineTemplateReaderView(template.reader_view, operators, vocabulary),
      antecedents: displayExpressionTemplateArray(template.antecedents, operators),
      results: displayExpressionTemplateArray(template.results, operators),
      variables: shared.displayExpressionArray(template.variables, operators),
      error: displayedMessages
    };
  }

 /**
  * @param stringTable: an array of dictionaries of the form {
  *          name: a string from the teacher giving the name
  *          reader_view: likewise
  *          antecedents: likewise
  *          results: likewise
  *          variables: likewise
  *          error: an array of strings
  *        }
  * @param language: a Language object
  * @param vocabulary: a Vocabulary object
  * @param errorDictionary: used to render errors if they occur
  * @result An array of LineTemplates
  * @raises If any line makes an error in buildLineTemplate() then we throw an
  *         array of the error messages for each line (blank if a line is fine).
  */
  var buildLineTemplateTable = function(stringTable, vocabulary) {
    var table = [];
    var failed = false;
    var failures = [];
    for (var i = 0; i < stringTable.length; i++) {
      try {
        table.push(
          buildLineTemplate(
            stringTable[i].name, stringTable[i].reader_view, stringTable[i].antecedents,
            stringTable[i].results, stringTable[i].variables, stringTable[i].error,
            sharedData.BASE_STUDENT_LANGUAGE, vocabulary))
        failures.push('');
      }
      catch (err) {
        failed = true;
        failures.push(shared.renderError(err, TEACHER_ERROR_MESSAGES, sharedData.BASE_STUDENT_LANGUAGE));
      }
    }
    if (failed) {
      throw failures;
    } else {
      return table;
    }
  }

  var displayLineTemplateTable = function(table, vocabulary) {
    var output = [];
    for (var i = 0; i < table.length; i++) {
      output.push(displayLineTemplate(table[i], sharedData.BASE_STUDENT_LANGUAGE.operators, vocabulary));
    }
    return output;
  }


 ////////////////////////  MISTAKE TABLE  /////////////////////////////////////////////////////

 /** 
  * @param mistakeEntry: a MistakeEntry object (but with Expressions in place
  *        of TypedExpressions) which we are to check and assign types to.
  * @param language: a Language object giving the control language
  * @return a proper MistakeEntry object, with TypedExpressions.
  * @raises if the mistake entry contains incorrect typings.
  */
  var validateAndTypeMistakeEntry = function(mistakeEntry, language) {
    var availableOperators = [];
    for (key in language.operators) {
      availableOperators[key] = language.operators[key];
    }
    // this is available to refer to the line number
    availableOperators['n'] = {
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
    }
    // other than the line number no new operators can be used
    var typeCheck = shared.assignTypesToExpression(mistakeEntry.occurs, ['boolean'], newLanguage, ['constant']);
    if (typeCheck.length > 1) {
      throw new shared.UserError('ambiguous_typing', {});
    }
    mistakeEntry.occurs = typeCheck[0].typedExpression;
    for (var i = 0; i < mistakeEntry.message.length; i++) {
      for (var j = 0; j < mistakeEntry.message[i].length; j++) {
        if (mistakeEntry.message[i][j].format === 'expression') {
          var expression = mistakeEntry.message[i][j].content;
          var typeCheck = shared.assignTypesToExpression(
            expression, ['integer', 'string', 'formula', 'set_of_formulas', 'boolean'], newLanguage, ['constant']);
          if (typeCheck.length > 1) {
            throw new shared.UserError('ambiguous_typing', {});
          }
          mistakeEntry.message[i][j].content = typeCheck[0].typedExpression;
        }
      }
    }
    return mistakeEntry;
  };

 /**
  * @param nameString: A string provided by the teacher giving the name of the 
  *        entry; this is not used for anything but is convenient for the 
  *        teacher when writing the table.
  * @param occursString: A string from the teacher that represents an
  *        expression in the control language determining whether the mistake
  *        has been made by the student.
  * @param messageString: An array of string written by the teacher, each of
  *        which represents a possible message to give the student if they 
  *        make the mistake in question.
  * @param controlLanguage: A Language object giving the control language (that
  *        which is used to write formulas describing when mistakes occur).
  * @result A MistakeEntry object
  * @raises If the inputs are unparseable or badly typed.
  */
  var buildMistakeEntry = function(nameString, occursString, messageStrings, controlLanguage) {
  	try {var occurs = parser.parse(occursString.replace(/ /g, ''), 'expression');}
  	catch (err) {throw new shared.UserError('unparseable', {field: 'description of when this mistake occurs'});}
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

  // The teacher's version; the operators should be those from the control language
  var displayControlMessage = function(message, operators) {
  	var output = '';
  	for (var i = 0; i < message.length; i++) {
  	  if (message[i].format === 'string') {
  	  	output += message[i].content;
  	  } else {
  	  	output += '{{' + shared.displayExpression(message[i].content, operators) + '}}';
  	  }
  	}
  	return output;
  };

  var displayMistakeEntry = function(mistakeEntry, operators) {
  	var displayedMessages = [];
  	for (var i = 0; i < mistakeEntry.message.length; i++) {
  	  displayedMessages.push(displayControlMessage(mistakeEntry.message[i], operators));
  	}
  	return {
      name: mistakeEntry.name,
      occurs: shared.displayExpression(mistakeEntry.occurs, operators),
      message: displayedMessages
    }
  }

 /**
  * @param name: the name of the section (e.g. layout, target)
  * @param entryStrings: an array of dictionaries of the form: {
  *          name: name string,
  *          occurs: occurs string,
  *          message: an array of message strings
  *        }
  * @param errorDictionary: used to render errors if they occur
  * @return a MistakeSection 
  * @raises an array of error messages, one per entry.
  */
  var buildMistakeSection = function(name, entryStrings, controlFunctions) {
    var controlLanguage = angular.copy(sharedData.BASE_CONTROL_LANGUAGE);
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
        entries.push(buildMistakeEntry(entryStrings[i].name, entryStrings[i].occurs, entryStrings[i].message, controlLanguage));
        failures.push('');
      }
      catch (err) {
        failed = true;
        failures.push(shared.renderError(err, TEACHER_ERROR_MESSAGES, controlLanguage))
      }
    }
    if (failed) {
      throw failures;
    } else {
      return {
        name: name,
        entries: entries
      }
    }
  }

  var displayMistakeSection = function(mistakeSection, operators) {
    var displayedEntries = [];
    for (var i = 0; i < mistakeSection.entries.length; i++) {
      displayedEntries.push(displayMistakeEntry(mistakeSection.entries[i], operators));
    }
    return {
      name: mistakeSection.name,
      entries: displayedEntries
    };
  }

  var displayMistakeTable = function(mistakeTable) {
    var displayedSections = [];
    for (var i = 0; i < mistakeTable.length; i++) {
      displayedSections.push(displayMistakeSection(mistakeTable[i], sharedData.BASE_CONTROL_LANGUAGE.operators));
    }
    return displayedSections;
  }

///////////////////////   CONTROL FUNCTIONS   ///////////////////////////////////////////////


 /**
  * @param formulaLHS: an Expression representing the left-hand-side of the
  *        definition of a formula - e.g. f(n,m).
  * @param formulaRHS: an Expression representing the right-hand-side of such a
  *        definition - e.g. n + g(m).
  * @param language: a Language object representing the control language (the 
  *        one used to describe when a student has made a mistake) including
  *        all of the previously-defined control functions.
  * @return a dictionary {
  *            typing: a length-1 array of the TypingRule that the function being defined has been
  *              deduced to have.
  *            typedDefinition: a TypedExpression that is the given formulaRHS
  *              but now with types added.
  *          }
  * @raises If the teacher makes a mistake such as re-using a function name or
  *         assigning invalid types.
  */
  var validateAndTypeControlFunction = function(formulaLHS, formulaRHS, language) {
    if (language.operators.hasOwnProperty(formulaLHS.operator)) {
      throw new shared.UserError('duplicate_function_name', {function: formulaLHS.operator});
    }
    if (formulaLHS.operator === 'n') {
      throw new shared.UserError('function_name_is_n', {});
    }

    var availableOperators = {};
    for (var key in language.operators) {
      availableOperators[key] = language.operators[key];
    }
    for (var i = 0; i < formulaLHS.arguments.length; i++) {
      if (language.operators.hasOwnProperty(formulaLHS.arguments[i].operator)) {
        throw new shared.UserError('argument_is_function_name', {argument: formulaLHS.arguments[i].operator});
      } else if(availableOperators.hasOwnProperty(formulaLHS.arguments[i].operator)) {
        throw new shared.UserError('duplicate_argument', {argument: formulaLHS.arguments[i].operator});
      } else if (shared.getOperatorsFromExpression(formulaRHS).indexOf(formulaLHS.arguments[i].operator) === -1) {
        throw new shared.UserError('unused_argument', {argument: formulaLHS.arguments[i].operator});
      } else {
        availableOperators[formulaLHS.arguments[i].operator] = {
          kind: 'variable',
          // We can't tell the types of the arguments yet, but they should be
          // deducible from the RHS.
          typing: [{
            arguments: [],
            dummies: [],
            output: 'integer'
          },{
            arguments: [],
            dummies: [],
            output: 'string'
          },{
            arguments: [],
            dummies: [],
            output: 'formula'
          },{
            arguments: [],
            dummies: [],
            output: 'set_of_formulas'
          }]
        }
      }
    }
    // The RHS cannot use any operator not found on the LHS or in the given list
    var typeCheck = shared.assignTypesToExpression(
      formulaRHS, ['boolean', 'integer', 'string', 'formula', 'set_of_formulas'], 
      {
      	operators: availableOperators,
      	kinds: language.kinds,
      	types: language.types
      }, ['constant']
    );
    if (typeCheck.length > 1) {
      throw new shared.UserError('ambiguous_typing', {});
    }
    // Now we can work out what the typing of the formula actually is
    var argumentTypes = [];
    for (var i = 0; i < formulaLHS.arguments.length; i++) {
      argumentTypes.push({
        type: shared.seekTypeInExpression(typeCheck[0].typedExpression, formulaLHS.arguments[i].operator),
        arbitrarily_many: false
      })
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
  * @param LHSstring: a string from the teacher representing the left-hand-side
  *        of the function definition.
  * @param RHSstring: likewise for the right-hand-side.
  * @param descriptionString: a description of what the function is supposed to
  *        mean; this is not used by the code but is convenient for the user.
  * @param a Language object representing the language used to write
  *        descriptions of mistakes, and also functions such as these that help
  *        to describe mistakes.
  * @return a dictionary {
  *            name: the name of the function, deduced from the LHSstring
  *            variables: the free variables in the function definition, 
  *              deduced from the LHSstring.
  *            typing: a length-1 array of the TypingRule for the new function
  *            definition: a TypedExpression deduced from the RHSstring, but with types added
  *            description: the descriptionString
  *          }
  * @raises If the input cannot be parsed, or is incorrect as in 
  *         validateAndTypeControlFunction().
  */
  var buildControlFunction = function(LHSstring, RHSstring, descriptionString, controlLanguage) {
    try {var formulaLHS = parser.parse(LHSstring.replace(/ /g, ''), 'formulaLHS');}
    catch(err) {
      throw new shared.UserError('unparseable', {field: 'left-hand side'});
    }
    try {var formulaRHS = parser.parse(RHSstring.replace(/ /g, ''), 'expression');}
    catch(err) {
      throw new shared.UserError('unparseable', {field: 'right-hand side'});
    }
    var validation = validateAndTypeControlFunction(formulaLHS, formulaRHS, controlLanguage);
    return {
      name: formulaLHS.operator,
      variables: formulaLHS.arguments,
      typing: validation.typing,
      definition: validation.typedDefinition,
      description: descriptionString,
    };
  }

 /**
  * @param controlFunction: a dictionary such as buildControlFunction() returns
  * @param operators: the operators key from the control language
  * @return {
  *   LHS: the left-hand side of the formula
  *   RHS: the right-hand side
  *   description: the description
  * }
  */
  var displayControlFunction = function(controlFunction, operators) {
    var LHSExpression = {
      kind: 'prefix_function',
      operator: controlFunction.name,
      arguments: controlFunction.variables,
      dummies: []
    };
    return {
      LHS: shared.displayExpression(LHSExpression, operators),
      RHS: shared.displayExpression(controlFunction.definition, operators),
      description: controlFunction.description
    }
  }

 /**
  * We got through the list of control functions in turn, validating them and
  * adding them to to the list of operators & model; if one fails validation we abort.
  * @paran controlFunctionStrings: an array of dictionaries of the form {
  *          LHS: string representing the function LHS, 
  *          RHS: string representing the function RHS,
  *          description: string describing the function
  *        }
  * @return an array of dictionaries of the kind buildControlFunction returns 
  * @raises the first Error found in the table, with an additonal key 'line'
  *         that gives the number of the line in the table where this error
  *         occurred.
  */
  var buildControlFunctionTable = function(controlFunctionStrings) {
    // copy the old control operators and model
    var operators = {};
    for (var key in sharedData.BASE_CONTROL_LANGUAGE.operators) {
      operators[key] = sharedData.BASE_CONTROL_LANGUAGE.operators[key];
    }
    var controlLanguage = {
      types: sharedData.BASE_CONTROL_LANGUAGE.types,
      kinds: sharedData.BASE_CONTROL_LANGUAGE.kinds,
      operators: operators
    };
    var table = [];

    for (var i = 0; i < controlFunctionStrings.length; i++) {
      try {
        var built = buildControlFunction(
          controlFunctionStrings[i].LHS, controlFunctionStrings[i].RHS, 
          controlFunctionStrings[i].description, controlLanguage);
      }
      catch (err) {
        throw {
          message: shared.renderError(err, TEACHER_ERROR_MESSAGES, sharedData.BASE_CONTROL_LANGUAGE),
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
  }

  var displayControlFunctionTable = function(table) {
  	var displayedEntries = [];
  	for (var i = 0; i < table.length; i++) {
  	  displayedEntries.push(displayControlFunction(table[i], sharedData.BASE_CONTROL_LANGUAGE.operators));
  	}
  	return displayedEntries;
  }



  ///////////////////  UTILITIES  ////////////////////////////////

  var parseMessageStringFragment = function(fragmentString, typeOfMessage) {
    return (typeOfMessage === 'general') ?
      {
        isFixed: true,
        content: fragmentString
      }:
      {
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
          content : (typeOfMessage === 'line') ?
            parser.parse(fragmentString.replace(/ /g, ''),  'expressionTemplate2'):
            parser.parse(fragmentString.slice(2, fragmentString.length - 2).replace(/ /g, ''), 'expression')
        }
      }
      catch (err) {
        throw new shared.UserError('unparseable_fragment', {fragment: fragmentString});
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
          throw new shared.UserError('unmatched_{{', {});
        }
        if (messageString[newIndex] === '}') {
          newIndex++;
        }
        message.push(parseMessageParameterFragment(messageString.slice(index, newIndex), typeOfMessage));
      } else {
        var newIndex = messageString.indexOf('{{', index);
        var newIndex = (newIndex === -1) ? messageString.length: newIndex;
        message.push(parseMessageStringFragment(messageString.slice(index, newIndex), typeOfMessage));
      }
      index = newIndex;
    }
    return message;
  };

  // Checks that a given expression array contains any multi-character words
  // that are used in phrases; if so it throws an error.
  var requireNoWordsUsed = function(expressionArray, knownOperators, vocabulary) {
    var vocabularyWords = [];
    for (var key in vocabulary) {
      for (var i = 0; i < vocabulary[key].length; i++) {
        for (var j = 0; j < vocabulary[key][i].split(' ').length; j++) {
          if (vocabularyWords.indexOf(vocabulary[key][i].split(' ')[j]) === -1) {
            vocabularyWords.push(vocabulary[key][i].split(' ')[j]);
          } 
        }
      }
    }
    var operatorsToCheck = shared.getOperatorsFromExpressionArray(expressionArray);
    for (var i = 0; i < operatorsToCheck.length; i++) {
      if (vocabularyWords.indexOf(operatorsToCheck[i]) !== -1 && operatorsToCheck[i].length > 1 && !knownOperators.hasOwnProperty(operatorsToCheck[i])) {
        throw new shared.UserError('forbidden_word', {word: operatorsToCheck[i]});
      }
    }
  };

  /////////////////////////////  DATA  ////////////////////////////////////

    TEACHER_ERROR_MESSAGES = {
    'unparseable': {
      templates: [[{
        isFixed: true,
        content: 'The '
      }, {
        isFixed: false,
        content: 'field'
      }, {
        isFixed: true,
        content: ' could not be parsed.'
      }]],
      parameters: {
        'field': {format: 'string'}
      }
    },
    'ambiguous_typing': {
      templates: [[{
        isFixed: true,
        content: 'Unfortunately this cannot be accepted as it has multiple possible typings.'
      }]],
      parameters: {}
    },
    'hidden_operator': {
      templates: [[{
        isFixed: true,
        content: 'It will not be possible to uniquely identify '
      }, {
        isFixed: false,
        content: 'operator'
      }, {
        isFixed: true,
        content: ' from a line of this form.'
      }]],
      parameters: {
        'operator': {format: 'string'}
      }
    },
    'duplicate_function_name': {
      templates: [[{
        isFixed: true,
        content: 'The function '
      }, {
        isFixed: false,
        content: 'function'
      }, {
        isFixed: true,
        content: ' has already been defined.'
      }]],
      parameters: {
        'function': {format: 'string'}
      }
    },
    'function_name_is_n': {
      templates: [[{
        isFixed: true,
        content: 'You cannot use n as a function name; it is reserved to refer to line numbers'
      }]]
    },
    'argument_is_function_name': {
      templates: [[{
        isFixed: true,
        content: '\''
      }, {
        isFixed: false,
        content: 'argument'
      }, {
        isFixed: true,
        content: '\' is the name of a function and so cannot be used as an argument.'
      }]],
      parameters: {
        'argument': {format: 'string'}
      }
    },
    'duplicate_argument': {
      templates: [[{
        isFixed: true,
        content: 'The variables used as arguments must all be distinct'
      }]],
      parameters: {
        'argument': {format: 'string'}
      }
    },
    'unused_argument': {
      templates: [[{
        isFixed: true,
        content: 'The argument \''
      }, {
        isFixed: false,
        content: 'argument'
      }, {
        isFixed: true,
        content: '\' does not occur in the definition.'
      }]],
      parameters: {
        'argument': {format: 'string'}
      }
    },
    'unknown_typing_error': {
      templates: [[{
        isFixed: true,
        content: 'A typing error has occurred with '
      }, {
        isFixed: false,
        content: 'expression'
      }, {
        isFixed: true,
        content: '.'
      }]],
      parameters: {
        'expression': {format: 'expression'}
      }
    },
    'unmatched_{{': {
      templates: [[{
        isFixed: true,
        content: 'This has an unmatched {{.'
      }]],
      parameters: {}
    },
    'unparseable_fragment': {
      templates: [[{
        isFixed: true,
        content: 'It was not possible to parse '
      }, {
        isFixed: false,
        content: 'fragment'
      }, {
        isFixed: true,
        content: '.'
      }]],
      parameters: {
        'fragment': {format: 'string'}
      }
    },
    'ambiguous_parsing': {
      templates: [[{
        isFixed: true,
        content: 'The '
      }, {
        isFixed: false,
        content: 'field'
      }, {
        isFixed: true,
        content: ' can be understood in more than one way. Try using fewer single-character words and variables so that it is easier to distinguish between the two.'
      }]],
      parameters: {
        'field': {format: 'string'}
      }
    },
    'illegal_symbol': {
      templates: [[{
        isFixed: true,
        content: 'The symbol '
      }, {
        isFixed: false,
        content: 'symbol'
      }, {
        isFixed: true,
        content: ' was not recognised.'
      }]],
      parameters: {
        'symbol': {format: 'string'}
      }
    },
    'blank_line': {
      templates: [[{
        isFixed: true,
        content: 'This line is blank.'
      }]],
      parameters: {}
    },
    'unidentified_word': {
      templates: [[{
        isFixed: true,
        content: 'We could not identify \''
      }, {
        isFixed: false,
        content: 'word'
      }, {
        isFixed: true,
        content: '\'; please make sure you are using vocabulary from the given list, and don\'t have two consecutive expressions.'
      }]],
      parameters: {
        'word': {format: 'string'}
      }
    },
    'unidentified_words': {
      templates: [[{
        isFixed: true,
        content: 'We could not identify either of \''
      }, {
        isFixed: false,
        content: 'word1'
      }, {
        isFixed: true,
        content: '\' or \''
      }, {
        isFixed: false,
        content: 'word2'
      }, {
        isFixed: true,
        content: '\' as words; please make sure you are using vocabulary from the given list, and don\'t have two consecutive expressions.'
      }]],
      parameters: {
        'word1': {format: 'string'},
        'word2': {format: 'string'}
      }
    },
    'consecutive_expressions': {
      templates: [[{
        isFixed: true,
        content: 'This line has two expressions in a row ('
      }, {
        isFixed: false,
        content: 'word1'
      }, {
        isFixed: true,
        content: ' and '
      }, {
        isFixed: false,
        content: 'word2'
      }, {
        isFixed: true,
        content: ') which is not allowed.'
      }]],
      parameters: {
        'word1': {format: 'string'},
        'word2': {format: 'string'}
      }
    },
    'unidentified_phrase_starting_at': {
      templates: [[{
        isFixed: true,
        content: 'The phrase starting \''
      }, {
        isFixed: false,
        content: 'word'
      }, {
        isFixed: true,
        content: '\' could not be identified; please make sure you are only using phrases from the given list of vocabulary.'
      }]],
      parameters: {
        'word': {format: 'string'}
      }
    },
    'forbidden_word': {
      templates: [[{
        isFixed: true,
        content: 'The name \''
      }, {
        isFixed: false,
        content: 'word'
      }, {
        isFixed: true,
        content: '\' is reserved for vocabulary and so cannot be used here.'
      }]],
      parameters: {
        'word': {format: 'string'}
      }
    },
    'not_enough_inputs': {
      templates: [[{
        isFixed: false,
        content: 'operator'
      }, {
        isFixed: true,
        content: ' must have at least '
      }, {
        isFixed: false,
        content: 'num_needed'
      }, {
        isFixed: true,
        content: ' '
      }, {
        isFixed: false,
        content: 'input_category'
      }, {
        isFixed: true,
        content: '.'
      }]],
      parameters: {
        'num_needed': {format: 'string'},
        'input_category': {format: 'string'},
        'operator': {format: 'string'}
      }
    },
    'wrong_num_inputs': {
      templates: [[{
        isFixed: false,
        content: 'operator'
      }, {
        isFixed: true,
        content: ' must have '
      }, {
        isFixed: false,
        content: 'num_needed'
      }, {
        isFixed: true,
        content: ' '
      }, {
        isFixed: false,
        content: 'input_category'
      }, {
        isFixed: true,
        content: '.'
      }]],
      parameters: {
        'num_needed': {format: 'string'},
        'input_category': {format: 'string'},
        'operator': {format: 'string'}
      }
    },
    'wrong_kind': {
      templates: [[{
        isFixed: false,
        content: 'operator'
      }, {
        isFixed: true,
        content: ' is supposed to be a ',
      }, {
        isFixed: false,
        content: 'expected_kind'
      }, {
        isFixed: true,
        content: '.'
      }]],
      parameters: {
        'operator': {format: 'string'},
        'expected_kind': {format: 'string'},
        'actual_kind': {format: 'string'}
      }
    },
    'wrong_type': {
      templates: [[{
        isFixed: false,
        content: 'operator'
      }, {
        isFixed: true,
        content: ' yields a ',
      }, {
        isFixed: false,
        content: 'actual_type'
      }, {
        isFixed: true,
        content: ' but you are trying to use it to give a '
      }, {
        isFixed: false,
        content: 'expected_type'
      }, {
        isFixed: true,
        content: '.'
      }]],
      parameters: {
        'operator': {format: 'string'},
        'expected_type': {format: 'string'},
        'actual_type': {format: 'string'}
      }
    },
    'duplicate_dummy_name': {
      templates: [[{
        isFixed: true,
        content: 'The name \''
      }, {
        isFixed: false,
        content: 'dummy'
      }, {
        isFixed: true,
        content: '\' is already in use and so cannot be quantified over in '
      }, {
        isFixed: false,
        content: 'expression'
      }, {
        isFixed: true,
        content: '.'
      }]],
      parameters: {
        'dummy': {format: 'expression'},
        'expression': {format: 'expression'}
      }
    },
    'dummy_not_variable': {
      templates: [[{
        isFixed: true,
        content: 'You can only quantify over variables, not  '
      }, {
        isFixed: false,
        content: 'dummy'
      }, {
        isFixed: true,
        content: '.'
      }]],
      parameters: {
        'dummy': {format: 'expression'},
        'expression': {format: 'expression'}
      }
    },
    'unknown_operator': {
      templates: [[{
        isFixed: true,
        content: 'The operator '
      }, {
        isFixed: false,
        content: 'operator'
      }, {
        isFixed: true,
        content: ' could not be identified.'
      }]],
      parameters: {
        'operator': {format: 'string'}
      }
    },
    'too_many_parsings': {
      templates: [[{
        isFixed: true,
        content: 'This can be parsed in too many different ways - try using fewer words, especially single-character words.'
      }]],
      parameters: {}
    },
    'too_many_typings': {
      templates: [[{
        isFixed: true,
        content: 'This has too many possible typings - try using fewer variables.'
      }]],
      parameters: {}
    }
  }

  return {
    buildQuestion: buildQuestion,
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