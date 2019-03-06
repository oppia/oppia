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
 * @fileoverview Components used by the LogicProof interaction reader.
 */

var logicProofStudent = (function() {
  // BUILD INSTANCE

  // These evaluation rules must all return an object of their specified output
  // type (boolean, integer, string, formula or set_of_formulas) or throw an
  // error with message 'evaluation failed'. They will be used by evaluate()
  // when computing the value of an expression that contains these operators.

  // Evaluation strictness: if an error occurs at any point in a computation
  // then the entire computation will return an error; so for example
  // true||error evaluates as error rather than true. The exceptions to this
  // are bounded quantification and ranged functions; for these we will
  // evaluate until we reach an answer and then return without computing any
  // later values. So for example min{x<n|A(x)} where ~A(1)=false, A(2)=true
  // and A(3)=error will return true rather than error. The default control
  // functions rely heavily on this functionality and will need to be rewritten
  // if it is changed.
  var BASE_CONTROL_MODEL = {
    evaluation_rules: {
      and: {
        format: 'bottom_up',
        evaluateExpression: function(args) {
          for (var i = 0; i < args.length; i++) {
            if (!args[i]) {
              return false;
            }
          }
          return true;
        }
      },
      or: {
        format: 'bottom_up',
        evaluateExpression: function(args) {
          for (var i = 0; i < args.length; i++) {
            if (args[i]) {
              return true;
            }
          }
          return false;
        }
      },
      not: {
        format: 'bottom_up',
        evaluateExpression: function(args) {
          return !args[0];
        }
      },
      implies: {
        format: 'bottom_up',
        evaluateExpression: function(args) {
          return !args[0] || args[1];
        }
      },
      iff: {
        format: 'bottom_up',
        evaluateExpression: function(args) {
          return (args[0] && args[1]) || (!args[0] && !args[1]);
        }
      },
      equals: {
        format: 'bottom_up',
        evaluateExpression: function(args, types) {
          return (types[0] === 'formula') ?
            logicProofShared.checkExpressionsAreEqual(
              args[0], args[1]) :
            (args[0].type === 'set_of_formulas') ?
              logicProofShared.checkSetsOfExpressionsAreEqual(
                args[0], args[1]) :
              (args[0] === args[1]);
        }
      },
      not_equals: {
        format: 'bottom_up',
        evaluateExpression: function(args, types) {
          return (types[0] === 'formula') ?
            !logicProofShared.checkExpressionsAreEqual(
              args[0], args[1]) :
            (args[0].type === 'set_of_formulas') ?
              !logicProofShared.checkSetsOfExpressionsAreEqual(
                args[0], args[1]) :
              (args[0] !== args[1]);
        }
      },
      less_than: {
        format: 'bottom_up',
        evaluateExpression: function(args) {
          return (args[0] < args[1]);
        }
      },
      less_than_or_equals: {
        format: 'bottom_up',
        evaluateExpression: function(args) {
          return (args[0] <= args[1]);
        }
      },
      greater_than: {
        format: 'bottom_up',
        evaluateExpression: function(args) {
          return (args[0] > args[1]);
        }
      },
      greater_than_or_equals: {
        format: 'bottom_up',
        evaluateExpression: function(args) {
          return (args[0] >= args[1]);
        }
      },
      is_in: {
        format: 'bottom_up',
        evaluateExpression: function(args) {
          return logicProofShared.checkExpressionIsInSet(
            args[0], args[1]);
        }
      },
      addition: {
        format: 'bottom_up',
        evaluateExpression: function(args) {
          return args[0] + args[1];
        }
      },
      subtraction: {
        format: 'bottom_up',
        evaluateExpression: function(args) {
          return args[0] - args[1];
        }
      },
      multiplication: {
        format: 'bottom_up',
        evaluateExpression: function(args) {
          return args[0] * args[1];
        }
      },
      division: {
        format: 'bottom_up',
        evaluateExpression: function(args) {
          return args[0] / args[1];
        }
      },
      exponentiation: {
        format: 'bottom_up',
        evaluateExpression: function(args) {
          return args[0] ^ args[1];
        }
      },
      bounded_for_all: {
        format: 'top_down',
        evaluateExpression: function(
            expression, inputs, model, evaluationParameters, cache) {
          var newInputs = {};
          for (var key in inputs) {
            newInputs[key] = inputs[key];
          }
          var bounder = evaluate(
            expression.arguments[0].arguments[1], inputs, model,
            evaluationParameters, cache);
          if (expression.arguments[0].arguments[0].type === 'integer') {
            var rangeEnd = (
              expression.arguments[0].top_operator_name === 'less_than') ?
              bounder :
              bounder + 1;
            for (var i = 1; i < rangeEnd; i++) {
              newInputs[expression.dummies[0].top_operator_name] = i;
              if (
                !evaluate(
                  expression.arguments[1], newInputs, model,
                  evaluationParameters, cache)) {
                return false;
              }
            }
            return true;
          } else {
            // Here, the bounder is a set_of_formulas (so an array).
            for (var i = 0; i < bounder.length; i++) {
              newInputs[expression.dummies[0].top_operator_name] = bounder[i];
              if (
                !evaluate(
                  expression.arguments[1], newInputs, model,
                  evaluationParameters, cache)) {
                return false;
              }
            }
            return true;
          }
        }
      },
      bounded_exists: {
        format: 'top_down',
        evaluateExpression: function(
            expression, inputs, model, evaluationParameters, cache) {
          var newInputs = {};
          for (var key in inputs) {
            newInputs[key] = inputs[key];
          }
          var bounder = evaluate(
            expression.arguments[0].arguments[1], inputs, model,
            evaluationParameters, cache);
          if (expression.arguments[0].arguments[0].type === 'integer') {
            var rangeEnd = (
              expression.arguments[0].top_operator_name === 'less_than') ?
              bounder :
              bounder + 1;
            for (var i = 1; i < rangeEnd; i++) {
              newInputs[expression.dummies[0].top_operator_name] = i;
              if (
                evaluate(
                  expression.arguments[1], newInputs, model,
                  evaluationParameters, cache)) {
                return true;
              }
            }
            return false;
          } else {
            // Here, the bounder is a set_of_formulas (so an array).
            for (var i = 0; i < bounder.length; i++) {
              newInputs[expression.dummies[0].top_operator_name] = bounder[i];
              if (
                evaluate(
                  expression.arguments[1], newInputs, model,
                  evaluationParameters, cache)) {
                return true;
              }
            }
            return false;
          }
        }
      },
      // Note that min{k<n|A(k)} will range over [1,..,n-1], throwing an error
      // if no match is found.
      // min{p∈antecedents(n)|A(p)} will range over antecedents(n), throwing
      // an error if no match is found.
      min: {
        format: 'top_down',
        evaluateExpression: function(
            expression, inputs, model, evaluationParameters, cache) {
          var newInputs = {};
          for (var key in inputs) {
            newInputs[key] = inputs[key];
          }
          var bounder = evaluate(
            expression.arguments[0].arguments[1], inputs, model,
            evaluationParameters, cache);
          if (expression.arguments[0].arguments[0].type === 'integer') {
            var rangeEnd = (
              expression.arguments[0].top_operator_name === 'less_than') ?
              bounder :
              bounder + 1;
            for (var i = 1; i < rangeEnd; i++) {
              newInputs[expression.dummies[0].top_operator_name] = i;
              if (
                evaluate(
                  expression.arguments[1], newInputs, model,
                  evaluationParameters, cache)) {
                return i;
              }
            }
            throw new Error('evaluation failed');
          } else {
            for (var i = 0; i < bounder.length; i++) {
              newInputs[expression.dummies[0].top_operator_name] = bounder[i];
              if (
                evaluate(
                  expression.arguments[1], newInputs, model,
                  evaluationParameters, cache)) {
                return bounder[i];
              }
            }
            throw new Error('evaluation failed');
          }
        }
      },
      max: {
        format: 'top_down',
        evaluateExpression: function(
            expression, inputs, model, evaluationParameters, cache) {
          var newInputs = {};
          for (var key in inputs) {
            newInputs[key] = inputs[key];
          }
          var bounder = evaluate(
            expression.arguments[0].arguments[1], inputs, model,
            evaluationParameters, cache);
          if (expression.arguments[0].arguments[0].type === 'integer') {
            var rangeEnd = (
              expression.arguments[0].top_operator_name === 'less_than') ?
              bounder :
              bounder + 1;
            for (var i = rangeEnd - 1; i > 0; i--) {
              newInputs[expression.dummies[0].top_operator_name] = i;
              if (
                evaluate(
                  expression.arguments[1], newInputs, model,
                  evaluationParameters, cache)) {
                return i;
              }
            }
            throw new Error('evaluation failed');
          } else {
            for (var i = bounder.length - 1; i >= 0; i--) {
              newInputs[expression.dummies[0].top_operator_name] = bounder[i];
              if (
                evaluate(
                  expression.arguments[1], newInputs, model,
                  evaluationParameters, cache)) {
                return bounder[i];
              }
            }
            throw new Error('evaluation failed');
          }
        }
      },
      // We subtract one for these because for the user proof lines are indexed
      // from 1.
      indentation: {
        format: 'bottom_up',
        evaluateExpression: function(args, types, evaluationParameters) {
          var line = evaluationParameters.proof.lines[args[0] - 1];
          if (line === undefined) {
            throw new Error('evaluation failed');
          }
          return line.indentation;
        }
      },
      template: {
        format: 'bottom_up',
        evaluateExpression: function(args, types, evaluationParameters) {
          var line = evaluationParameters.proof.lines[args[0] - 1];
          if (line === undefined) {
            throw new Error('evaluation failed');
          }
          return '\'' + line.template_name + '\'';
        }
      },
      antecedents: {
        // NOTE: assumes antecedents are given as formulas, not integers
        format: 'bottom_up',
        evaluateExpression: function(args, types, evaluationParameters) {
          var line = evaluationParameters.proof.lines[args[0] - 1];
          if (line === undefined) {
            throw new Error('evaluation failed');
          }
          var result = [];
          for (var i = 0; i < line.antecedents.length; i++) {
            result.push(line.antecedents[i].content);
          }
          return result;
        }
      },
      results: {
        format: 'bottom_up',
        evaluateExpression: function(args, types, evaluationParameters) {
          var line = evaluationParameters.proof.lines[args[0] - 1];
          if (line === undefined) {
            throw new Error('evaluation failed');
          }
          return line.results;
        }
      },
      variables: {
        format: 'bottom_up',
        evaluateExpression: function(args, types, evaluationParameters) {
          var line = evaluationParameters.proof.lines[args[0] - 1];
          if (line === undefined) {
            throw new Error('evaluation failed');
          }
          return line.variables;
        }
      },
      text: {
        format: 'bottom_up',
        evaluateExpression: function(args, types, evaluationParameters) {
          var line = evaluationParameters.proof.lines[args[0] - 1];
          if (line === undefined) {
            throw new Error('evaluation failed');
          }
          return line.text;
        }
      },
      element: {
        format: 'bottom_up',
        evaluateExpression: function(args, types, evaluationParameters) {
          // The name of the element is provided as a string such as \'R\', so
          // we must strip the quotes.
          var element = args[0].substr(1, args[0].length - 2);
          var line = evaluationParameters.proof.lines[args[1] - 1];
          if (line === undefined) {
            throw new Error('evaluation failed');
          }
          var result = line.matchings[element];
          if (result === undefined) {
            throw new Error('evaluation failed');
          }
          return result;
        }
      },
      num_lines: {
        format: 'bottom_up',
        evaluateExpression: function(args, types, evaluationParameters) {
          return evaluationParameters.proof.lines.length;
        }
      },
      assumptions: {
        format: 'bottom_up',
        evaluateExpression: function(args, types, evaluationParameters) {
          return evaluationParameters.assumptions;
        }
      },
      target: {
        format: 'bottom_up',
        evaluateExpression: function(args, types, evaluationParameters) {
          return evaluationParameters.target;
        }
      },
      question_variables: {
        format: 'bottom_up',
        evaluateExpression: function(args, types, evaluationParameters) {
          var names = logicProofShared.getOperatorsFromExpressionArray(
            evaluationParameters.assumptions.concat(
              [evaluationParameters.target]), ['variable']);
          // This gives us the variables as strings, we convert them to
          // expressions.
          var result = [];
          for (var i = 0; i < names.length; i++) {
            result.push({
              top_kind_name: 'variable',
              top_operator_name: names[i],
              args: [],
              dummies: []
            });
          }
          return result;
        }
      },
      entry: {
        format: 'bottom_up',
        evaluateExpression: function(args) {
          var result = args[1][args[0] - 1];
          if (result === undefined) {
            throw new Error('evaluation failed');
          }
          return result;
        }
      },
      // eslint-disable-next-line quote-props
      'if': {
        format: 'bottom_up',
        evaluateExpression: function(args) {
          return args[0] ? args[1] : args[2];
        }
      },
      substitute: {
        format: 'bottom_up',
        evaluateExpression: function(args) {
          var substitutions = {};
          substitutions[args[1].top_operator_name] = args[2];
          return substituteIntoExpression(args[0], substitutions);
        }
      }
    }
  };

  /**
   * This function is run when the state is loaded, it is top-level.
   * @param {Object} questionData - The information from the teacher specifying
   *        the question - this will be one of the keys of the interaction's
   *        customization_args.
   * @return {Object} A QuestionInstance object that will be used to build and
   *        check proofs from the student.
   */
  var buildInstance = function(questionData) {
    var evaluationRules = angular.copy(
      BASE_CONTROL_MODEL.evaluation_rules);
    var controlOperators = angular.copy(
      logicProofData.BASE_CONTROL_LANGUAGE.operators);
    // NOTE: the javascript fails if we try to omit this function and define
    // evaluateExpression() directly inside the for loop. See
    // http://jslinterrors.com/dont-make-functions-within-a-loop
    var makeEvaluateExpression = function(definition, variables) {
      return function(expression, inputs, model, evaluationParameters, cache) {
        var argumentValues = {};
        for (var i = 0; i < variables.length; i++) {
          argumentValues[variables[i].top_operator_name] = evaluate(
            expression.arguments[i], inputs, model, evaluationParameters,
            cache);
        }
        return evaluate(
          definition, argumentValues, model, evaluationParameters, cache);
      };
    };
    for (var i = 0; i < questionData.control_functions.length; i++) {
      evaluationRules[questionData.control_functions[i].name] = {
        format: 'definition',
        evaluateExpression: makeEvaluateExpression(
          questionData.control_functions[i].definition,
          questionData.control_functions[i].variables)
      };
      controlOperators[questionData.control_functions[i].name] = {
        kind: 'prefix_function',
        typing: questionData.control_functions[i].typing
      };
    }

    return {
      assumptions: questionData.assumptions,
      results: questionData.results,
      language: {
        types: logicProofData.BASE_STUDENT_LANGUAGE.types,
        kinds: logicProofData.BASE_STUDENT_LANGUAGE.kinds,
        operators: questionData.language.operators
      },
      line_templates: questionData.line_templates,
      vocabulary: questionData.vocabulary,
      general_messages: questionData.general_messages,
      mistake_table: questionData.mistake_table,
      control_language: {
        types: logicProofData.BASE_CONTROL_LANGUAGE.types,
        kinds: logicProofData.BASE_CONTROL_LANGUAGE.kinds,
        operators: controlOperators
      },
      control_model: {
        evaluation_rules: evaluationRules
      }
    };
  };

  // BUILD PROOF

  /**
   * This function identifies a way in which the expression is an instance of
   * template, or throws an error if it is not. Examples:
   * - A(x)∧t, p∧q, {} will return {p: A(x), q:t}
   * - A(x)∧t, p∧q, {q: s} will throw an error
   * - ∃y.R(y), ∃x.p, {} will return {x:y, p: R(y)} as dummies also matched
   * Only variables in the template can be matched to arbitrary expressions in
   * the expression; e.g. r∨s is not an instance of p∧q because ∧ is not a
   * variable and so needs to be matched exactly.
   * @param {Expression} expression - an Expression, which is to be matched
   * @param {Expression} template - the Expression against which we will match
   * @param {object} oldMatchings - variables potentially in the template whose
   *        corresponding sub-expressions in the expression we have previously
   *        identified.
   * @return {Object} a dictionary extending oldElements, that for new
   *   operators in template gives the corresponding operator in expression.
   * @throws If the expression cannot be viewed as an instance of the template.
   */
  var matchExpression = function(expression, template, oldMatchings) {
    var matchings = {};
    for (var key in oldMatchings) {
      matchings[key] = oldMatchings[key];
    }
    if (template.top_kind_name === 'variable') {
      if (oldMatchings.hasOwnProperty(template.top_operator_name)) {
        if (
          logicProofShared.checkExpressionsAreEqual(
            expression, oldMatchings[template.top_operator_name])) {
          return matchings;
        } else {
          throw new logicProofShared.UserError('unmatched_line', {});
        }
      } else {
        matchings[template.top_operator_name] = expression;
        return matchings;
      }
    } else if (expression.top_operator_name !== template.top_operator_name ||
          expression.top_kind_name !== template.top_kind_name ||
          expression.arguments.length !== template.arguments.length ||
          expression.dummies.length !== template.dummies.length) {
      throw new logicProofShared.UserError('unmatched_line', {});
    } else {
      // For matching purposes arguments and dummies are equivalent
      var subExpressions = expression.arguments.concat(expression.dummies);
      var subTemplates = template.arguments.concat(template.dummies);
      return matchExpressionArray(subExpressions, subTemplates, matchings);
    }
  };

  // Companion of matchExpression.
  var matchExpressionArray = function(array, templateArray, matchings) {
    for (var i = 0; i < array.length; i++) {
      matchings = matchExpression(array[i], templateArray[i], matchings);
    }
    return matchings;
  };

  /**
   * @param {Expression} expression - an Expression into which we are
   *   substituting, e.g. x=y
   * @param {Object} substitutions - a dictionary of {string: Expression}
   *   specifying the substitions to perform (simultaneously), e.g
   *   {x:2, y:a+b}
   * @return {Expression} the substituted Expression, e.g. 2=a+b
   */
  var substituteIntoExpression = function(expression, substitutions) {
    // We ignore substitutions for dummy variables.
    var newSubstitutions = {};
    for (var key in substitutions) {
      var isDummy = false;
      for (var i = 0; i < expression.dummies.length; i++) {
        if (expression.dummies[i].top_operator_name === key) {
          isDummy = true;
        }
      }
      if (!isDummy) {
        newSubstitutions[key] = substitutions[key];
      }
    }
    if (substitutions.hasOwnProperty(expression.top_operator_name)) {
      return substitutions[expression.top_operator_name];
    } else {
      return {
        top_operator_name: expression.top_operator_name,
        top_kind_name: expression.top_kind_name,
        arguments: substituteIntoExpressionArray(
          expression.arguments, newSubstitutions),
        dummies: substituteIntoExpressionArray(
          expression.dummies, newSubstitutions)
      };
    }
  };

  // Companion to substituteIntoExpression.
  var substituteIntoExpressionArray = function(array, substitutions) {
    var output = [];
    for (var i = 0; i < array.length; i++) {
      output.push(substituteIntoExpression(array[i], substitutions));
    }
    return output;
  };

  // Replaces all operators from expression (including dummies) that appear in
  // the dictionary 'matchings' with their values in matchings.
  var instantiateExpression = function(expression, matchings) {
    if (matchings.hasOwnProperty(expression.top_operator_name)) {
      return matchings[expression.top_operator_name];
    } else {
      var output = {
        top_operator_name: expression.top_operator_name,
        top_kind_name: expression.top_kind_name,
        arguments: instantiateExpressionArray(expression.arguments, matchings),
        dummies: instantiateExpressionArray(expression.dummies, matchings)
      };
      return output;
    }
  };

  var instantiateExpressionArray = function(array, matchings) {
    var output = [];
    for (var i = 0; i < array.length; i++) {
      output.push(instantiateExpression(array[i], matchings));
    }
    return output;
  };

  /**
   * @param {ExpressionTemplate} template - an ExpressionTemplate
   * @param {Object} matchings - a dictionary of {string: Expression}
   * @return {Expression}
   */
  var computeExpressionFromTemplate = function(template, matchings) {
    // E.g. template represents p[x -> a] and matchings represents
    // {p: A(y), x: y, a: 2}
    var newExpression = instantiateExpression(template.expression, matchings);
    var newSubstitutions = [];
    for (var i = 0; i < template.substitutions.length; i++) {
      var substitution = {};
      for (var key in template.substitutions[i]) {
        substitution[matchings[key].top_operator_name] = instantiateExpression(
          template.substitutions[i][key], matchings);
      }
      newSubstitutions.push(substitution);
    }
    // E.g. now new_expression is A(y) and new_subsitutions represents [y -> 2]
    for (var i = 0; i < newSubstitutions.length; i++) {
      newExpression = substituteIntoExpression(
        newExpression, newSubstitutions[i]);
    }
    return newExpression;
    // E.g. result is A(2)
  };

  var computeExpressionsFromTemplateArray = function(templateArray, matchings) {
    var output = [];
    for (var i = 0; i < templateArray.length; i++) {
      output.push(computeExpressionFromTemplate(templateArray[i], matchings));
    }
    return output;
  };

  /**
   * @param {Array.<LineMessages>} messages - an array of LineMessages, each of
   *        which describes the mistake the student has made by writing this
   *        sort of line.
   * @param {string} templateName - the name of the LineTemplate from which the
   *        messages come.
   * @param {object} matchings - a {string: Expression} dictionary deduced from
   *        comparing the line the student actually wrote to the LineTemplate
   *        provided by the techer of which it is an instance.
   * @param {object} operators - from the student Language and used for display
   *        purposes.
   * @throws This function throws a logicProofShared.UserError (with the
   *         'pre-rendered' code) that contains an array of strings describing
   *         the error, one of which will be chosen later to show to the
   *         student. If the messages list is empty (signifying that the line
   *         in question is a correct one) we do nothing.
   */
  var throwLineMessages = function(
      messages, templateName, matchings, operators) {
    if (messages.length > 0) {
      var renderedMessages = [];
      for (var i = 0; i < messages.length; i++) {
        renderedMessages.push('');
        for (var j = 0; j < messages[i].length; j++) {
          if (messages[i][j].format === 'string') {
            renderedMessages[i] += messages[i][j].content;
          } else {
            renderedMessages[i] += logicProofShared.displayExpression(
              computeExpressionFromTemplate(
                messages[i][j].content, matchings), operators);
          }
        }
      }
      throw new logicProofShared.PreRenderedUserError(
        renderedMessages, templateName);
    }
  };

  /**
   * Checks whether protoLine is an instance of template, in terms of both
   * expressions and phrases.
   * @param {array} protoLine - a ProtoLine, that is an array of phrases
   *        and expressions
   * @param {array} template - the value corresponding to the reader_view key
   *        of a LineTemplate, so an array of phrases and ExpressionTemplates.
   * @return {object} a dictionary of the form {string: Expression} that
   *        specifies what each variable / atom in the template corresponds to
   *        in the protoLine.
   * @throws If the line is not an instance of the template.
   */
  var matchLineToTemplate = function(protoLine, template) {
    // These witness that the protoLine is an instance of the template. For
    // example if the protoLine is 'we know A∧B' and the template is 'we know
    // p' then matchings would end up as {p: A∧B}.
    var matchings = {};

    // Check unsubstituted expressions agree
    if (protoLine.length !== template.length) {
      throw new logicProofShared.UserError('unmatched_line', {});
    }
    for (var i = 0; i < protoLine.length; i++) {
      if (protoLine[i].format !== template[i].format) {
        throw new logicProofShared.UserError('unmatched_line', {});
      }
      if (protoLine[i].format === 'expression') {
        // Only unsubstituted expression templates are useful in establishing
        // the matchings. e.g. if we are told simple the expression
        // corresponding to p[x->a] it will not be possible to discern p, x or
        // a, because there are many possible subsitutions that could have
        // produced the expression we see.
        if (template[i].content.substitutions.length === 0) {
          matchings = matchExpression(
            protoLine[i].content, template[i].content.expression, matchings);
        }
      }
    }
    // Now, check the substituted expression templates agree.
    for (var i = 0; i < protoLine.length; i++) {
      if (protoLine[i].format === 'expression' &&
          template[i].content.substitutions.length > 0) {
        var expression = computeExpressionFromTemplate(
          template[i].content, matchings);
        if (!logicProofShared.checkExpressionsAreEqual(
          protoLine[i].content, expression)) {
          throw new logicProofShared.UserError('unmatched_line', {});
        }
      }
    }

    // Finally check phrases agree.
    for (var i = 0; i < protoLine.length; i++) {
      if (protoLine[i].format === 'phrase' &&
          protoLine[i].content !== template[i].content) {
        throw new logicProofShared.UserError('unmatched_line', {});
      }
    }

    return matchings;
  };

  /**
   * This is used by buildLine. It checks that the types of the line are
   * correct and at the top agree with those the template requires, and
   * likewise for the kinds of the line (if the template has an opinion).
   * @param {object} matchings - a dictionary of {string: Expression} that
   *        allows the line the student wrote to be deduced from the
   *        reader_view key of the LineTemplate in question.
   * @param {array} templateReaderView - the value of the reader_view key of a
   *        LineTemplate, so an array of phrases and ExpressionTemplates.
   * @param {object} language - a Language object giving the student language
   * @throws A typing error if the types are invalid.
   */
  var requireValidMatching = function(matchings, templateReaderView, language) {
    var expressionsToCheck = [];
    var typesRequired = [];
    for (var i = 0; i < templateReaderView.length; i++) {
      if (templateReaderView[i].format === 'expression') {
        var expression = computeExpressionFromTemplate(
          templateReaderView[i].content, matchings);
        if (
          templateReaderView[i].content.hasOwnProperty('kind') &&
          templateReaderView[i].content.kind !== expression.top_kind_name) {
          throw new logicProofShared.UserError(
            'wrong_kind_in_line', {
              expression: expression,
              expected_kind: templateReaderView[i].content.kind
            });
        }
        expressionsToCheck.push(expression);
        typesRequired.push(templateReaderView[i].content.type);
      }
    }
    logicProofShared.assignTypesToExpressionArray(
      expressionsToCheck, typesRequired, language, ['variable', 'constant']);
  };

  /**
   * This function is run on each line as the student types it, to make sure the
   * line is of a known type. It does not check for more sophisticated errors.
   * @param {string} lineString - one of the lines written by the student
   * @param {Array.<LineTemplate>} lineTemplates - as for buildLine()
   * @param {Language} language - as for buildLine()
   * @param {object} vocabulary - as for buildLine()
   * @param {object} generalMessages - a dictionary of GeneralMessages, used to
   *         render errors into human-readable messages.
   * @throws If the line cannot be identified, {
   *           message: a string describing the problem
   *         }
   */
  var requireIdentifiableLine = function(lineString, lineTemplates, language,
      vocabulary, generalMessages) {
    try {
      var protoLines = logicProofShared.parseLineString(
        lineString.trim(), language.operators, vocabulary, false);
    } catch (err) {
      throw {
        message: logicProofShared.renderError(err, generalMessages, language)
      };
    }

    var lineIdentified = false;
    for (var i = 0; i < protoLines.length; i++) {
      for (var j = 0; j < lineTemplates.length; j++) {
        try {
          matchLineToTemplate(
            protoLines[i], lineTemplates[j].reader_view);
          lineIdentified = true;
        } catch (err) {
          if (errorMessage === undefined) {
            var errorMessage = logicProofShared.renderError(
              err, generalMessages, language);
          }
        }
      }
    }
    if (!lineIdentified) {
      throw {
        message: errorMessage
      };
    }
  };

  /**
   * This is a top-level function that checks all lines of a proof match some
   * line template (or are blank), but nothing else. It is run as the student
   * types.
   * @param {string} proofString - the proof as written by the student
   * @param {object} questionInstance - the object representing the problem,
   *        which was constructed from the QuestionData by buildInstance().
   * @throws (if there is an unmatchable line) a dictionary {
   *           message: a message describing something that went wrong,
   *           line: the line in which the problem occurred (zero-indexed),
   *          }
   */
  var validateProof = function(proofString, questionInstance) {
    if (proofString.slice(-1) === '\n') {
      proofString = proofString.slice(0, proofString.length - 1);
    }
    var lineStrings = proofString.split('\n');
    for (var i = 0; i < lineStrings.length; i++) {
      if (lineStrings[i].split(' ').join('').length !== 0) {
        try {
          requireIdentifiableLine(lineStrings[i],
            questionInstance.line_templates, questionInstance.language,
            questionInstance.vocabulary, questionInstance.general_messages);
        } catch (err) {
          throw {
            message: err.message,
            line: i
          };
        }
      }
    }
  };

  /**
   * @param {string} lineString - a line of text written by the student
   * @param {Array.<LineTemplate>} lineTemplates - an array of LineTemplates
   *        written by the teacher, that describe the sorts of lines a student
   *        might write; we try to find one of which the given line is an
   *        instance.
   * @param {Language} language - the student language (a Language object)
   * @param {object} vocabulary - the phrases available for the student to use.
   *        It is a dictionary with entries like
   *            satisfying: ['satisfying', 'such that']
   *        which indicates that the student can convey the concept of
   *        'satisfying' by writing either 'satisfying' or 'such that'.
   * @return {object} a Line object that is an abstract representation of the
   *          student's lineString, constructed from this string and one of the
   *          lineTemplates.
   * @throws an error representing the closest we got to understanding the line,
   *         generally 'unmatched line', a complaint about typing, or a
   *         LineMessage from the teacher if this is identified as an instance
   *         of an invalid deduction.
   */
  var buildLine = function(lineString, lineTemplates, language, vocabulary) {
    // Get list of possible parsings of line (usually there is only one)
    var n = 0;
    while (lineString[n] === ' ') {
      n++;
    }
    if (n % 2 !== 0) {
      throw new logicProofShared.UserError('odd_number_spaces', {});
    }
    var indentation = n / 2;
    var protoLines = logicProofShared.parseLineString(
      lineString.slice(n, lineString.length), language.operators, vocabulary,
      false);

    // At this stage we wish to return the 'best' matching with the following
    // priority list:
    // 1. A correctly typed matching to a 'correct' line template - i.e. one
    //    for a logically correct derivation. If we find one we return it
    //    immediately
    // 2. A correctly typed matching to an incorrect line template
    // 3. An incorrectly typed matching to a line template

    // Returns true iff error1 is a better attempt than error2
    var _isBetterAttempt = function(error1, error2) {
      return error2 === undefined ||
        (error1.code === 'pre-rendered' && !error2.code === 'pre-rendered') ||
        (error1.code !== 'unmatched_line' && error2.code === 'unmatched_line');
    };

    for (var i = 0; i < protoLines.length; i++) {
      for (var j = 0; j < lineTemplates.length; j++) {
        try {
          var matchings = matchLineToTemplate(
            protoLines[i], lineTemplates[j].reader_view);
          requireValidMatching(
            matchings, lineTemplates[j].reader_view, language);
          throwLineMessages(
            lineTemplates[j].error, lineTemplates[j].name, matchings,
            language.operators);

          var antecedents = [];
          for (var k = 0; k < lineTemplates[j].antecedents.length; k++) {
            antecedents.push({
              format: 'expression',
              content: computeExpressionFromTemplate(
                lineTemplates[j].antecedents[k], matchings)
            });
          }
          return {
            template_name: lineTemplates[j].name,
            matchings: matchings,
            antecedents: antecedents,
            results: computeExpressionsFromTemplateArray(
              lineTemplates[j].results, matchings),
            variables: instantiateExpressionArray(
              lineTemplates[j].variables, matchings),
            indentation: indentation,
            text: lineString
          };
        } catch (err) {
          if (_isBetterAttempt(err, bestAttemptSoFar)) {
            var bestAttemptSoFar = err;
          }
        }
      }
    }
    throw bestAttemptSoFar;
  };

  /**
   * This is one of the two main top-level student functions (with checkProof).
   * @param {string} proofString - the proof as written by the student
   * @param {object} questionInstance - the object representing the problem,
   *        which was constructed from the QuestionData by buildInstance().
   * @return {Proof} a Proof object built from the given proofString
   * @throws a dictionary {
   *           message: a message describing something that went wrong,
   *           line: the line in which the problem occurred (zero-indexed),
   *           code: the code of the error that occurred,
   *           category: either 'line', 'parsing' or 'typing'
   *          }
   */
  var buildProof = function(proofString, questionInstance) {
    var lineStrings = proofString.split('\n');
    // Ignore blank lines at the end
    var lastLineNum = lineStrings.length - 1;
    while (lastLineNum > 0 &&
        lineStrings[lastLineNum].replace(/ /g, '').length === 0) {
      lastLineNum--;
    }

    var builtLines = [];
    for (var i = 0; i <= lastLineNum; i++) {
      try {
        builtLines.push(
          buildLine(
            lineStrings[i], questionInstance.line_templates,
            questionInstance.language, questionInstance.vocabulary));
      } catch (err) {
        throw {
          message: logicProofShared.renderError(
            err, questionInstance.general_messages, questionInstance.language),
          line: i,
          code: err.code,
          category: (err.name === 'PreRenderedUserError') ?
            'line' :
            questionInstance.general_messages[err.code].category
        };
      }
    }
    return {
      lines: builtLines
    };
  };

  // CHECK PROOF

  /**
   * This function is a core component of the program - it takes an expression
   * and returns its value (with respect to given inputs, model and parameters).
   * @param {TypedExpression} expression - the TypedExpression (in the control
   *        language) to be evaluated, e.g. n+2
   * @param {object} inputs - a dictionary with keys the free variables in the
   *        expression, giving for each the value they should be taken to have,
   *        e.g. {n:3}
   * @param {Model} model - a Model object that specifies how to evaluate
   *        functions, e.g., that '+' should be interpreted as the usual
   *        addition.
   * @param {object} evaluationRuleParameters - these are sent to all of the
   *        EvaluationRules occurring in the model, for them to make use of if
   *        they wish. e.g. here they would include the student's proof, and
   *        the function 'num_lines' would evaluate by examining this proof.
   * @param {object} cache - expressions, at particular inputs, that were
   *        already evaluated.
   * @return {*} the result of the expression with these inputs, e.g. 5
   * @throws an error if any part of the evaluation failed, for example by
   *         trying to access an element of an array beyond the array's length.
   */
  var evaluate = function(
      expression, inputs, model, evaluationRuleParameters, cache) {
    var cacheKey = JSON.stringify(expression) + '#' + JSON.stringify(inputs);
    if (cache.hasOwnProperty(cacheKey) && false) {
      return cache[cacheKey];
    }

    if (expression.top_kind_name === 'variable') {
      var answer = inputs[expression.top_operator_name];
    } else if (expression.top_kind_name === 'constant') {
      var answer = expression.top_operator_name;
    } else {
      var evaluationRule = model.evaluation_rules[expression.top_operator_name];

      if (evaluationRule.format === 'top_down') {
        var answer = evaluationRule.evaluateExpression(
          expression, inputs, model, evaluationRuleParameters, cache);
      } else if (evaluationRule.format === 'definition') {
        // Evaluate arguments (spec requires that the expression has no
        // dummies).
        if (expression.dummies.length > 0) {
          throw new Error('evaluate() received ' +
            expression.top_operator_name +
            ' to be evaluated via a definition but it has dummies');
        }
        var answer = evaluationRule.evaluateExpression(
          expression, inputs, model, evaluationRuleParameters, cache);
      } else if (evaluationRule.format === 'bottom_up') {
        // Evaluate arguments (spec requires that there are no dummies).
        if (expression.dummies.length > 0) {
          throw new Error('evaluate() received ' +
            expression.top_operator_name +
            ' to be evaluated bottom-up but it has dummies');
        }
        var argumentsList = [];
        for (var i = 0; i < expression.arguments.length; i++) {
          argumentsList.push(
            evaluate(
              expression.arguments[i], inputs, model, evaluationRuleParameters,
              cache));
        }
        var types = [];
        for (var i = 0; i < expression.arguments.length; i++) {
          types.push(expression.arguments[i].type);
        }
        var answer = evaluationRule.evaluateExpression(
          argumentsList, types, evaluationRuleParameters);
      } else {
        throw Error('Unknown evaluation rule format (' +
          evaluationRule.format + ') sent to evaluate().');
      }
    }
    cache[cacheKey] = answer;
    return answer;
  };

  /**
   * @param {MistakeEntry} mistake - a MistakeEntry that describes when a
   *        mistake occurs, and if so what to say to the student.
   * @param {int} lineNumber - the number of the line in the proof in which the
   *        mistake was made (zero-indexed)
   * @param {Model} model - a Model object providing information on how to
   *        evaluate functions the teacher may have used.
   * @param {object} parameters - should be a dictionary of {
   *          proof: the student's proof in which the mistake was made
   *          assumptions: the assumptions allowed in the question
   *          target: what the student should prove (is
   *            questionInstance.result[0])
   *        }
   * @param {object} operators - from the student language, this is used to
   *        display expressions.
   * @throws This function will take the MistakeMessages given in the
   *         MistakeEntry and evaluate them to get strings describing the
   *         problem that could be shown to the student. It then throws a
   *         logicProofShared.UserError containing these strings.
   */
  var renderMistakeMessages = function(
      mistake, lineNumber, model, parameters, operators) {
    var renderedMessages = [];
    for (var i = 0; i < mistake.message.length; i++) {
      try {
        var message = mistake.message[i];
        var renderedMessage = '';
        for (var j = 0; j < message.length; j++) {
          if (message[j].format === 'string') {
            renderedMessage += message[j].content;
          } else {
            var rawResult = evaluate(message[j].content, {
              n: lineNumber + 1
            }, model, parameters, {});
            renderedMessage += (message[j].content.type === 'set_of_formulas') ?
              logicProofShared.displayExpressionArray(rawResult, operators) :
              (message[j].content.type === 'formula') ?
                logicProofShared.displayExpression(rawResult, operators) :
                rawResult;
          }
        }
        renderedMessages.push(renderedMessage);
      } catch (err) {
        if (err.message !== 'evaluation failed') {
          throw err;
        }
      }
    }
    return renderedMessages;
  };

  /**
   * This is the second top-level function for the student.
   * @param {Proof} proof - a Proof object constructed by buildProof()
   * @param {object} questionInstance - the object describing the problem built
   *        from the QuestionData (an argument of the interaction's
   *        customization_args) by buildInstance().
   * @throws if a mistake from the mistake_table has been
   *          made in the proof, {
   *            message: a human-readable description of the first mistake
   *              identified,
   *            line: the line (zero-indexed) the error occurred in,
   *            code: the name of the mistake that was made
   *            category: the MistakeSection that the mistake came from
   *          }
   */
  var checkProof = function(proof, questionInstance) {
    var evaluationCache = {};
    var parameters = {
      proof: proof,
      assumptions: questionInstance.assumptions,
      // Note that questionInstance.results is an array of expressions, to
      // allow for future questions in which the student has to prove more than
      // one thing, but for now we only permit one target per question.
      target: questionInstance.results[0]
    };
    // We check for all mistakes in the first mistake section (layout) first so
    // that formulas in subsequent sections can assume the layout is correct,
    // and so on with the subsequent sections.
    for (var i = 0; i < questionInstance.mistake_table.length; i++) {
      for (var lineNumber = 0; lineNumber < proof.lines.length; lineNumber++) {
        for (var j = 0;
          j < questionInstance.mistake_table[i].entries.length; j++) {
          var mistake = questionInstance.mistake_table[i].entries[j];
          // If the formula determining whether an error occurs cannot be
          // evaluated then the error is deemed not to have occurred. This is
          // so the teacher can write formulas like 'indentation(n-1)' and have
          // it implicit that n>1.
          var check = false;
          try {
            check = evaluate(mistake.occurs, {
              n: lineNumber + 1
            }, questionInstance.control_model, parameters, evaluationCache);
          } catch (err) {
            if (err.message !== 'evaluation failed') {
              throw err;
            }
          }
          if (check) {
            var mistakeMessages = renderMistakeMessages(
              mistake, lineNumber, questionInstance.control_model,
              parameters, questionInstance.language.operators);
            // If the teacher has made a mistake and none of the messages they
            // have provided can be evaluated then we try to return to the
            // student as helpful a message as possible.
            var error = (mistakeMessages.length > 0) ?
              new logicProofShared.PreRenderedUserError(
                mistakeMessages, mistake.name) :
              new logicProofShared.UserError('unspecified_mistake', {
                section: questionInstance.mistake_table[i].name,
                entry: mistake.name
              });
            throw {
              message: logicProofShared.renderError(
                error, questionInstance.general_messages,
                questionInstance.language),
              line: lineNumber,
              code: mistake.name,
              category: questionInstance.mistake_table[i].name
            };
          }
        }
      }
    }
  };

  return {
    BASE_CONTROL_MODEL: BASE_CONTROL_MODEL,
    buildInstance: buildInstance,
    matchExpression: matchExpression,
    substituteIntoExpression: substituteIntoExpression,
    instantiateExpression: instantiateExpression,
    computeExpressionFromTemplate: computeExpressionFromTemplate,
    throwLineMessages: throwLineMessages,
    matchLineToTemplate: matchLineToTemplate,
    requireIdentifiableLine: requireIdentifiableLine,
    validateProof: validateProof,
    buildLine: buildLine,
    buildProof: buildProof,
    evaluate: evaluate,
    renderMistakeMessages: renderMistakeMessages,
    checkProof: checkProof
  };
})();
