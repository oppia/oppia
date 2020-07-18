# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Unit tests for expression_parser.py."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import expression_parser
from core.tests import test_utils
import python_utils


class HelperFunctionsUnitTests(test_utils.GenericTestBase):
    """Test the 'contains_balanced_brackets' and 'is_algebraic' helper
    functions.
    """

    def test_contains_balanced_brackets(self):
        """Tests for contains_balanced_brackets method."""
        self.assertTrue(expression_parser.contains_balanced_brackets(''))
        self.assertTrue(expression_parser.contains_balanced_brackets('a+2'))
        self.assertTrue(expression_parser.contains_balanced_brackets('(a / 2)'))
        self.assertTrue(expression_parser.contains_balanced_brackets('[a/ 2]'))
        self.assertTrue(expression_parser.contains_balanced_brackets(' {a/2} '))
        self.assertTrue(expression_parser.contains_balanced_brackets('([a]/2)'))
        self.assertTrue(expression_parser.contains_balanced_brackets(
            '[(a/{ 2 })]'))
        self.assertTrue(expression_parser.contains_balanced_brackets(
            '(([{}]{})( ){[ ]})'))
        self.assertTrue(expression_parser.contains_balanced_brackets(
            '[[ [((()))[[[[[]{}]]{}]]()]] ]'))
        self.assertTrue(expression_parser.contains_balanced_brackets(
            '{( 2x^2 ) ^ [ 3/2 ]} / 4'))

        self.assertFalse(expression_parser.contains_balanced_brackets('(a/2'))
        self.assertFalse(expression_parser.contains_balanced_brackets('a/2]'))
        self.assertFalse(expression_parser.contains_balanced_brackets('[)(]'))
        self.assertFalse(expression_parser.contains_balanced_brackets('{ [} ]'))
        self.assertFalse(expression_parser.contains_balanced_brackets(']]][[['))
        self.assertFalse(expression_parser.contains_balanced_brackets(')({})'))
        self.assertFalse(expression_parser.contains_balanced_brackets('4/{0/]'))
        self.assertFalse(expression_parser.contains_balanced_brackets('(a/2]'))

    def test_is_algebraic(self):
        """Tests for is_algebraic method."""
        self.assertTrue(expression_parser.is_algebraic('a^2.3'))
        self.assertTrue(expression_parser.is_algebraic('abs(alpha)'))
        self.assertTrue(expression_parser.is_algebraic('alpha/gamma'))
        self.assertTrue(expression_parser.is_algebraic('A + 2/3'))
        # The following tests might seem as invalid but the individual letters
        # will be joined via '*' during tokenization which makes them valid.
        self.assertTrue(expression_parser.is_algebraic('Alpha'))
        self.assertTrue(expression_parser.is_algebraic('invalid + 2'))
        self.assertTrue(expression_parser.is_algebraic('alpha + bet/22'))

        self.assertFalse(expression_parser.is_algebraic('1 + 2'))
        self.assertFalse(expression_parser.is_algebraic('1^2^3/4'))
        self.assertFalse(expression_parser.is_algebraic('1'))
        self.assertFalse(expression_parser.is_algebraic('sqrt(4/4)'))
        self.assertFalse(expression_parser.is_algebraic('tan(30)'))

        with self.assertRaises(Exception):
            expression_parser.is_algebraic('1 +2)')
        with self.assertRaises(Exception):
            expression_parser.is_algebraic('a~2')
        with self.assertRaises(Exception):
            expression_parser.is_algebraic('4! 2')
        with self.assertRaises(Exception):
            expression_parser.is_algebraic('alpha + bet/22.3.4')

    def test_tokenize(self):
        """Tests for tokenize method."""
        expression = 'a+b'
        expected_output = ['a', '+', 'b']
        actual_output = python_utils.MAP(
            lambda x: x.text, expression_parser.tokenize(expression))
        self.assertEqual(list(actual_output), expected_output)

        expression = '53.4 - 6/alpha'
        expected_output = ['53.4', '-', '6', '/', 'alpha']
        actual_output = python_utils.MAP(
            lambda x: x.text, expression_parser.tokenize(expression))
        self.assertEqual(list(actual_output), expected_output)

        expression = 'a^0.5 + (-zeta)'
        expected_output = ['a', '^', '0.5', '+', '(', '-', 'zeta', ')']
        actual_output = python_utils.MAP(
            lambda x: x.text, expression_parser.tokenize(expression))
        self.assertEqual(list(actual_output), expected_output)

        expression = 'sqrt(3/[-A])'
        expected_output = ['sqrt', '(', '3', '/', '(', '-', 'A', ')', ')']
        actual_output = python_utils.MAP(
            lambda x: x.text, expression_parser.tokenize(expression))
        self.assertEqual(list(actual_output), expected_output)

        expression = 'abs(sqrt(3)) * 4/ 2^ 3            '
        expected_output = [
            'abs', '(', 'sqrt', '(', '3', ')', ')', '*', '4', '/', '2',
            '^', '3']
        actual_output = python_utils.MAP(
            lambda x: x.text, expression_parser.tokenize(expression))
        self.assertEqual(list(actual_output), expected_output)

        expression = ''
        expected_output = []
        actual_output = python_utils.MAP(
            lambda x: x.text, expression_parser.tokenize(expression))
        self.assertEqual(list(actual_output), expected_output)

        expression = '3.4^4.3/0.0005 * {9}'
        expected_output = ['3.4', '^', '4.3', '/', '0.0005', '*', '(', '9', ')']
        actual_output = python_utils.MAP(
            lambda x: x.text, expression_parser.tokenize(expression))
        self.assertEqual(list(actual_output), expected_output)

        expression = 'ab'
        expected_output = ['a', '*', 'b']
        actual_output = python_utils.MAP(
            lambda x: x.text, expression_parser.tokenize(expression))
        self.assertEqual(list(actual_output), expected_output)

        expression = 'a**bc'
        expected_output = ['a', '*', '*', 'b', '*', 'c']
        actual_output = python_utils.MAP(
            lambda x: x.text, expression_parser.tokenize(expression))
        self.assertEqual(list(actual_output), expected_output)

        expression = 'Alpha'
        expected_output = ['A', '*', 'l', '*', 'p', '*', 'h', '*', 'a']
        actual_output = python_utils.MAP(
            lambda x: x.text, expression_parser.tokenize(expression))
        self.assertEqual(list(actual_output), expected_output)

        expression = 'alpha'
        expected_output = ['alpha']
        actual_output = python_utils.MAP(
            lambda x: x.text, expression_parser.tokenize(expression))
        self.assertEqual(list(actual_output), expected_output)

        expression = 'alphax'
        expected_output = ['alpha', '*', 'x']
        actual_output = python_utils.MAP(
            lambda x: x.text, expression_parser.tokenize(expression))
        self.assertEqual(list(actual_output), expected_output)

        expression = 'xalpha'
        expected_output = ['x', '*', 'alpha']
        actual_output = python_utils.MAP(
            lambda x: x.text, expression_parser.tokenize(expression))
        self.assertEqual(list(actual_output), expected_output)

        expression = '2.2gamma/23'
        expected_output = ['2.2', '*', 'gamma', '/', '23']
        actual_output = python_utils.MAP(
            lambda x: x.text, expression_parser.tokenize(expression))
        self.assertEqual(list(actual_output), expected_output)

        expression = '2pir^2/2'
        expected_output = ['2', '*', 'pi', '*', 'r', '^', '2', '/', '2']
        actual_output = python_utils.MAP(
            lambda x: x.text, expression_parser.tokenize(expression))
        self.assertEqual(list(actual_output), expected_output)

        expression = 'sigmaepsilon'
        expected_output = ['sigma', '*', 'epsilon']
        actual_output = python_utils.MAP(
            lambda x: x.text, expression_parser.tokenize(expression))
        self.assertEqual(list(actual_output), expected_output)

        expression = 'sqrt(epsilonpsi-2abeta)'
        expected_output = [
            'sqrt', '(', 'epsilon', '*', 'psi', '-', '2', '*', 'a', '*',
            'beta', ')']
        actual_output = python_utils.MAP(
            lambda x: x.text, expression_parser.tokenize(expression))
        self.assertEqual(list(actual_output), expected_output)

        expression = 'alphasqrt(3/4)'
        expected_output = ['alpha', '*', 'sqrt', '(', '3', '/', '4', ')']
        actual_output = python_utils.MAP(
            lambda x: x.text, expression_parser.tokenize(expression))
        self.assertEqual(list(actual_output), expected_output)

        expression = 'tan(theta)cos(theta)'
        expected_output = [
            'tan', '(', 'theta', ')', '*', 'cos', '(',
            'theta', ')']
        actual_output = python_utils.MAP(
            lambda x: x.text, expression_parser.tokenize(expression))
        self.assertEqual(list(actual_output), expected_output)

        expression = '(a+b)(a-b)'
        expected_output = [
            '(', 'a', '+', 'b', ')', '*',
            '(', 'a', '-', 'b', ')']
        actual_output = python_utils.MAP(
            lambda x: x.text, expression_parser.tokenize(expression))
        self.assertEqual(list(actual_output), expected_output)

        expression = 'xsqrt(2)x'
        expected_output = [
            'x', '*', 'sqrt', '(', '2', ')', '*', 'x']
        actual_output = python_utils.MAP(
            lambda x: x.text, expression_parser.tokenize(expression))
        self.assertEqual(list(actual_output), expected_output)

        expression = 'sin(pi)(a - x^2alpha)'
        expected_output = [
            'sin', '(', 'pi', ')', '*', '(', 'a', '-', 'x', '^',
            '2', '*', 'alpha', ')']
        actual_output = python_utils.MAP(
            lambda x: x.text, expression_parser.tokenize(expression))
        self.assertEqual(list(actual_output), expected_output)

        expression = 'cosh(3a45theta) + sin(x(theta))'
        expected_output = [
            'cosh', '(', '3', '*', 'a', '*', '45', '*', 'theta', ')',
            '+', 'sin', '(', 'x', '*', '(', 'theta', ')', ')']
        actual_output = python_utils.MAP(
            lambda x: x.text, expression_parser.tokenize(expression))
        self.assertEqual(list(actual_output), expected_output)

        with self.assertRaises(Exception):
            expression_parser.tokenize('a.3')
        with self.assertRaises(Exception):
            expression_parser.tokenize('.3 -  2.4')
        with self.assertRaises(Exception):
            expression_parser.tokenize('1.2.3 + 4/2')
        with self.assertRaises(Exception):
            expression_parser.tokenize('a . . 3')
        with self.assertRaises(Exception):
            expression_parser.tokenize('3..4')
        with self.assertRaises(Exception):
            expression_parser.tokenize('..5')


class TokenUnitTests(test_utils.GenericTestBase):
    """Test the token module."""

    def test_is_function(self):
        """Tests for is_function method."""
        self.assertEqual(expression_parser.Token('sqrt').category, 'function')
        self.assertEqual(expression_parser.Token('abs').category, 'function')
        self.assertEqual(expression_parser.Token('tan').category, 'function')

        with self.assertRaises(Exception):
            expression_parser.Token('tan()')
        with self.assertRaises(Exception):
            expression_parser.Token('Sqrt')

    def test_is_identifier(self):
        """Tests for is_identifier method."""
        self.assertEqual(expression_parser.Token('a').category, 'identifier')
        self.assertEqual(expression_parser.Token('a').category, 'identifier')
        self.assertEqual(
            expression_parser.Token('alpha').category, 'identifier')
        self.assertEqual(expression_parser.Token('A').category, 'identifier')

        with self.assertRaises(Exception):
            expression_parser.Token('al')
        self.assertNotEqual(
            expression_parser.Token('5').category, 'identifier')

    def test_is_number(self):
        """Tests for is_number method."""
        self.assertEqual(expression_parser.Token('1').category, 'number')
        self.assertEqual(expression_parser.Token('123').category, 'number')
        self.assertEqual(expression_parser.Token('12.34').category, 'number')
        self.assertEqual(expression_parser.Token('0.004').category, 'number')
        self.assertEqual(expression_parser.Token('pi').category, 'number')
        self.assertEqual(expression_parser.Token('e').category, 'number')

        with self.assertRaises(Exception):
            expression_parser.Token('8.4.3')

    def test_is_operator(self):
        """Tests for is_operator method."""
        self.assertEqual(expression_parser.Token('+').category, 'operator')
        self.assertEqual(expression_parser.Token('-').category, 'operator')
        self.assertEqual(expression_parser.Token('*').category, 'operator')
        self.assertEqual(expression_parser.Token('/').category, 'operator')
        self.assertEqual(expression_parser.Token('^').category, 'operator')
        self.assertEqual(expression_parser.Token('(').category, 'operator')
        self.assertEqual(expression_parser.Token(')').category, 'operator')


class ParserUnitTests(test_utils.GenericTestBase):
    """Test the expression parser module."""

    def test_parse(self):
        """Tests to check whether the following production rule is implemented
        correctly:
        <expr> ::= <mul_expr> (('+' | '-') <mul_expr>)*

        The parse tree for 'a + b - 2' should be built as follows:
              {-}
             /  |
           {+} {2}
          /  |
        {a} {b}
        """
        root_node = expression_parser.Parser().parse('a + b - 2')
        # Root node {-}.
        self.assertIsInstance(
            root_node, expression_parser.SubtractionOperatorNode)
        self.assertEqual(len(root_node.children), 2)

        left_child_1, right_child_1 = root_node.children
        # Left child 1 {+}.
        self.assertIsInstance(
            left_child_1, expression_parser.AdditionOperatorNode)
        self.assertEqual(len(left_child_1.children), 2)
        # Right child 1 {2}.
        self.assertIsInstance(right_child_1, expression_parser.NumberNode)
        self.assertEqual(right_child_1.token.text, '2')
        self.assertEqual(len(right_child_1.children), 0)

        left_child_2, right_child_2 = left_child_1.children
        # Left child 2 {a}.
        self.assertIsInstance(left_child_2, expression_parser.IdentifierNode)
        self.assertEqual(left_child_2.token.text, 'a')
        self.assertEqual(len(left_child_2.children), 0)
        # Right child 2 {b}.
        self.assertIsInstance(right_child_2, expression_parser.IdentifierNode)
        self.assertEqual(right_child_2.token.text, 'b')
        self.assertEqual(len(right_child_2.children), 0)

    def test_parse_mul_expr(self):
        """Tests to check whether the following production rule is implemented
        correctly:
        <mul_expr> ::= <pow_expr> (('*' | '/') <pow_expr>)*

        The parse tree for 'a / b * 2' should be built as follows:
              {*}
             /  |
           {/} {2}
          /  |
        {a} {b}
        """
        root_node = expression_parser.Parser().parse('a / b * 2')
        # Root node {*}.
        self.assertIsInstance(
            root_node, expression_parser.MultiplicationOperatorNode)
        self.assertEqual(len(root_node.children), 2)

        left_child_1, right_child_1 = root_node.children
        # Left child 1 {/}.
        self.assertIsInstance(
            left_child_1, expression_parser.DivisionOperatorNode)
        self.assertEqual(len(left_child_1.children), 2)
        # Right child 1 {2}.
        self.assertIsInstance(right_child_1, expression_parser.NumberNode)
        self.assertEqual(right_child_1.token.text, '2')
        self.assertEqual(len(right_child_1.children), 0)

        left_child_2, right_child_2 = left_child_1.children
        # Left child 2 {a}.
        self.assertIsInstance(left_child_2, expression_parser.IdentifierNode)
        self.assertEqual(left_child_2.token.text, 'a')
        self.assertEqual(len(left_child_2.children), 0)
        # Right child 2 {b}.
        self.assertIsInstance(right_child_2, expression_parser.IdentifierNode)
        self.assertEqual(right_child_2.token.text, 'b')
        self.assertEqual(len(right_child_2.children), 0)

    def test_parse_pow_expr(self):
        """Tests to check whether the following production rule is implemented
        correctly:
        <pow_expr> ::= '-' <pow_expr> | '+' <pow_expr> |
        <unit> ('^' <pow_expr>)?

        The parse tree for 'a ^ b ^ 2' should be built as follows:
              {^}
             /  |
           {a} {^}
              /  |
            {b} {2}
        """
        root_node = expression_parser.Parser().parse('a ^ b ^ 2')
        # Root node {^}.
        self.assertIsInstance(root_node, expression_parser.PowerOperatorNode)
        self.assertEqual(len(root_node.children), 2)

        left_child_1, right_child_1 = root_node.children
        # Left child 1 {a}.
        self.assertIsInstance(left_child_1, expression_parser.IdentifierNode)
        self.assertEqual(left_child_1.token.text, 'a')
        self.assertEqual(len(left_child_1.children), 0)
        # Right child 1 {^}.
        self.assertIsInstance(
            right_child_1, expression_parser.PowerOperatorNode)
        self.assertEqual(len(right_child_1.children), 2)

        left_child_2, right_child_2 = right_child_1.children
        # Left child 2 {b}.
        self.assertIsInstance(left_child_2, expression_parser.IdentifierNode)
        self.assertEqual(left_child_2.token.text, 'b')
        self.assertEqual(len(left_child_2.children), 0)
        # Right child 2 {2}.
        self.assertIsInstance(right_child_2, expression_parser.NumberNode)
        self.assertEqual(right_child_2.token.text, '2')
        self.assertEqual(len(right_child_2.children), 0)

    def test_parse_unit(self):
        """Tests to check whether the following production rule is implemented
        correctly:
        <unit> ::= <identifier> | <number> | '(' <expr> ')' |
        <function> '(' <expr> ')'

        The parse tree for 'sqrt(a*2)' should be built as follows:
           {sqrt}
             |
            {*}
           /  |
         {a} {2}
        """
        root_node = expression_parser.Parser().parse('sqrt(a*2)')
        # Root node {sqrt}.
        self.assertIsInstance(root_node, expression_parser.UnaryFunctionNode)
        self.assertEqual(len(root_node.children), 1)

        child_1 = root_node.children[0]
        # Child 1 {*}.
        self.assertIsInstance(
            child_1, expression_parser.MultiplicationOperatorNode)
        self.assertEqual(len(child_1.children), 2)

        left_child_2, right_child_2 = child_1.children
        # Left child 2 {a}.
        self.assertIsInstance(left_child_2, expression_parser.IdentifierNode)
        self.assertEqual(left_child_2.token.text, 'a')
        self.assertEqual(len(left_child_2.children), 0)
        # Right child 2 {2}.
        self.assertIsInstance(right_child_2, expression_parser.NumberNode)
        self.assertEqual(right_child_2.token.text, '2')
        self.assertEqual(len(right_child_2.children), 0)

    def test_validates_math_expression(self):
        """Tests whether the parser can validate math expressions."""
        self.assertTrue(expression_parser.is_valid_expression('a+b'))
        self.assertTrue(expression_parser.is_valid_expression('a+(-b)'))
        self.assertTrue(expression_parser.is_valid_expression('-a+b'))
        self.assertTrue(expression_parser.is_valid_expression('a+b^(-2)'))
        self.assertTrue(expression_parser.is_valid_expression('a+b/2.3'))
        self.assertTrue(expression_parser.is_valid_expression('ab/2'))
        self.assertTrue(expression_parser.is_valid_expression('a(b+c)'))
        self.assertTrue(expression_parser.is_valid_expression('2x + 3/2'))
        self.assertTrue(expression_parser.is_valid_expression('alpha + bet/2'))
        self.assertTrue(expression_parser.is_valid_expression('Alpha/2'))
        self.assertTrue(expression_parser.is_valid_expression(
            '42 - [5/a] (4)'))
        self.assertTrue(expression_parser.is_valid_expression(
            'a + sqrt(beta/gamma)'))
        self.assertTrue(expression_parser.is_valid_expression(
            'cos(theta/2^epsilon)'))
        self.assertTrue(expression_parser.is_valid_expression('a+{-b/22}'))
        self.assertTrue(expression_parser.is_valid_expression('abs(a^2 + b^2)'))
        self.assertTrue(expression_parser.is_valid_expression(
            'sin(theta)^2 + cos(theta)^2'))
        self.assertTrue(expression_parser.is_valid_expression('(2*pi*r^2)/2'))
        self.assertTrue(expression_parser.is_valid_expression('1 + (2*a)'))
        self.assertTrue(expression_parser.is_valid_expression('(a+ b) '))
        self.assertTrue(expression_parser.is_valid_expression(
            '{a+(beta - gamma)}'))
        self.assertTrue(expression_parser.is_valid_expression(
            '(a) / ((b)/(c))'))
        self.assertTrue(expression_parser.is_valid_expression(
            '{a+(b-[c])-(beta^4)}'))
        self.assertTrue(expression_parser.is_valid_expression('alpha + (-3)'))
        self.assertTrue(expression_parser.is_valid_expression(
            'alpha^(3.9/beta*gamma)'))
        self.assertTrue(expression_parser.is_valid_expression(
            '{a-(-3)/(2-(-b)^4)}^2'))
        self.assertTrue(expression_parser.is_valid_expression(
            'a+(-3)/alpha + gamma^2'))
        self.assertTrue(expression_parser.is_valid_expression('(x+y) * (x-y)'))
        self.assertTrue(expression_parser.is_valid_expression(
            '(a+ b)^2 - (c+d) ^ 3'))

        self.assertTrue(expression_parser.is_valid_expression('3+2'))
        self.assertTrue(expression_parser.is_valid_expression('---+34'))
        self.assertTrue(expression_parser.is_valid_expression('---(3/+4)'))
        self.assertTrue(expression_parser.is_valid_expression('3+2^3'))
        self.assertTrue(expression_parser.is_valid_expression('(5-2^[6+3])'))
        self.assertTrue(expression_parser.is_valid_expression('(-5)^(-1)/2'))
        self.assertTrue(expression_parser.is_valid_expression(
            '2*10^3 + 3*10^2'))
        self.assertTrue(expression_parser.is_valid_expression(
            '{55 - 2/(-3)^100 + [5-4]}'))
        self.assertTrue(expression_parser.is_valid_expression('(3^2) - (4^2)'))
        self.assertTrue(expression_parser.is_valid_expression(
            '(1+2+3)/(1-2-3)'))
        self.assertTrue(expression_parser.is_valid_expression(
            '24.6 + 3^(-1/2)'))
        self.assertTrue(expression_parser.is_valid_expression('1^1^1^1^1^1^1'))
        self.assertTrue(expression_parser.is_valid_expression(
            '1000 + 200 + 30 + 4'))
        self.assertTrue(expression_parser.is_valid_expression('(1.01)^39'))
        self.assertTrue(expression_parser.is_valid_expression('506/(2-3)^(-3)'))
        self.assertTrue(expression_parser.is_valid_expression('sqrt(-1)'))
        self.assertTrue(expression_parser.is_valid_expression(
            'sqrt(-abs(-1))^2/abs(5)'))


        self.assertFalse(expression_parser.is_valid_expression('a+b/'))
        self.assertFalse(expression_parser.is_valid_expression('|x|'))
        self.assertFalse(expression_parser.is_valid_expression('||'))
        self.assertFalse(expression_parser.is_valid_expression('|x+y|-z'))
        self.assertFalse(expression_parser.is_valid_expression('a^2.'))
        self.assertFalse(expression_parser.is_valid_expression('(352+)-3*x'))
        self.assertFalse(expression_parser.is_valid_expression('(a-2^34-)'))
        self.assertFalse(expression_parser.is_valid_expression(
            '(25 + 3.4.3*a)'))
        self.assertFalse(expression_parser.is_valid_expression('sqrt(abs)'))
        self.assertFalse(expression_parser.is_valid_expression(
            'alpha + bet/2.3.4'))
        self.assertFalse(expression_parser.is_valid_expression('a_b'))
        self.assertFalse(expression_parser.is_valid_expression('!/'))
        self.assertFalse(expression_parser.is_valid_expression('a~b'))
        self.assertFalse(expression_parser.is_valid_expression('a*b)'))
        self.assertFalse(expression_parser.is_valid_expression('(a}+{b)'))
        self.assertFalse(expression_parser.is_valid_expression('{a+b)(c}'))
        self.assertFalse(expression_parser.is_valid_expression('a**b'))
        self.assertFalse(expression_parser.is_valid_expression('(a)^/(b)'))
        self.assertFalse(expression_parser.is_valid_expression('a+/3'))
        self.assertFalse(expression_parser.is_valid_expression('a=b'))
        self.assertFalse(expression_parser.is_valid_expression('a<b'))
        self.assertFalse(expression_parser.is_valid_expression('a>b'))
        self.assertFalse(expression_parser.is_valid_expression('a<=b'))
        self.assertFalse(expression_parser.is_valid_expression('a>=b'))

        self.assertFalse(expression_parser.is_valid_expression('3+2/*a'))
        self.assertFalse(expression_parser.is_valid_expression('192.168.1 + 3'))
        self.assertFalse(expression_parser.is_valid_expression('{1 - 2 (/3}'))
        self.assertFalse(expression_parser.is_valid_expression('[5^(3-2])'))
        self.assertFalse(expression_parser.is_valid_expression(
            '55.02//3.5-(-a)'))
        self.assertFalse(expression_parser.is_valid_expression(
            'alpha + beta-^1'))
        self.assertFalse(expression_parser.is_valid_expression('(3+2]'))
        self.assertFalse(expression_parser.is_valid_expression('3!2'))
        self.assertFalse(expression_parser.is_valid_expression('3~2'))
        self.assertFalse(expression_parser.is_valid_expression('3-/2'))
        self.assertFalse(expression_parser.is_valid_expression('3-5=(-2)'))
        self.assertFalse(expression_parser.is_valid_expression('3 > 2'))
