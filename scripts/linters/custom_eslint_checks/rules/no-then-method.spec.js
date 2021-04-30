/**
 * @fileoverview Tests for the no-then-method.js file.
 */

'use strict';

let errorMessage = 'Please avoid using .then() method';

var rule = require('./no-then-method');
var RuleTester = require('eslint').RuleTester;

var ruleTester = new RuleTester();
ruleTester.run('no-then-method', rule, {
  valid: [
    'a.then;',
    'a.then.b;',
    'then.c;',
    'then().d;'
  ],
  invalid: [
    {
      code: 'z.then();',
      errors: [
        {
          message: errorMessage
        }
      ]
    },
    {
      code: 'a.b.c.then();',
      errors: [
        {
          message: errorMessage
        }
      ]
    },
    {
      code: 'then.then();',
      errors: [
        {
          message: errorMessage
        }
      ]
    },
    {
      code: 'a.then().b.then();',
      errors: [
        {
          message: errorMessage
        },
        {
          message: errorMessage
        }
      ]
    }
  ]
});
