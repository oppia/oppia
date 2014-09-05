This directory contains files that are necessary to make expressions work.
Expressions can be evaluated at runtime (i.e. when playing an Oppia exploration)
and can reference parameters and system variable to produce textual output
(e.g. used in a message presented to users) as well as boolean results which
may be used to control state transitions.

See comments in parser.pegjs for the description of input expression grammar.
Also see parser.pegjs for the parser output (i.e. parse tree) data format.
See evaluator.js for the operator contracts.

Files:
parser.pegjs
  This is the parser definition and is used to create JavaScript parser
parser.js
  This is the JavaScript parser file produced by PEGJS and the input file
  parser.pegjs.
evaluator.js
  Implementation of the expression evaluator. Includes the evaluation engine
  as well as the system operators.
test.js
  Tests the parser as well as the evaluator.

How to update the parser:
1. Modify parser.pegjs.
2. Add tests in test.js for the new or modified grammar.
3. run tests by executing
    bash scripts/run_expr_tests.sh
  in oppia directory. Note this runs scripts/create_expr_parser.sh as well which
  updates parser.js. If for whatever reason you need to check in the change
  without running the tests, you then need to run
    bash scripts/create_expr_parser.sh
  directly in order to update parser.js.
4. Repeat 1-3 until the desired grammar is written and tested.
5. Check the changes. You need to check in parser.pegjs as well as parser.js
  (and mostlikely tests.js).
