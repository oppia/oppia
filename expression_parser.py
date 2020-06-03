# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""A parser that generates a parse tree for math expressions.

It uses the following grammar in Backus-Naur form:

<expr> ::= <expr2> (('+' | '-') <expr2>)*
<expr2> ::= <expr1> (('*' | '/') <expr1>)*
<expr1> ::= '-' <expr1> | '+' <expr1> | <unit> ('^' <expr1>)?

<unit> ::= <identifier> ('(' <expr> ')')* | <number> | '(' <expr> ')'
<number> ::= r'[0-9]+.[0-9]+|[0-9]+'
<identifier> ::= r'[a-zA-Z]+'
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import re

import python_utils

GREEK_LETTERS = ['alpha', 'beta', 'gamma', 'theta', 'epsilon', 'pi', 'omega']
MATH_FUNCTIONS = ['sqrt', 'abs', 'cos', 'sin', 'tan', 'cot', 'sec', 'cosec']
VALID_OPERATORS = ['[', '{', '(', ')', '}', ']', '+', '-', '/', '*', '^']


def contains_balanced_brackets(expression):
    """Checks if the given expression contains a balanced bracket sequence.

    Args:
        expression: str. A math expression (algebraic/numeric).

    Returns:
        bool. Whether the given expression contains a balanced
            bracket sequence.
    """
    openers, closers = '({[', ')}]'
    stack = []
    for character in expression:
        if character in openers:
            stack.append(character)
        elif character in closers:
            if len(stack) == 0:
                return False
            top_element = stack.pop()
            if openers.index(top_element) != closers.index(character):
                return False
    return len(stack) == 0


def is_algebraic(expresssion):
    """Checks if the given expression is algebraic.

    Args:
        expresssion: str. A math expression.

    Returns:
        bool. Whether the given expression contains at least one single
            latin letter or greek letter.
    """
    tokens = [token.text for token in Parser(expresssion).token_list]
    return any(
        (token.isalpha() and len(token) == 1) or (
            token in GREEK_LETTERS) for token in tokens)


class Token(python_utils.OBJECT):
    """Class for tokens of the math expression."""

    def __init__(self, text):
        """Initializes a Token object.

        Args:
            text: str. String representation of the token.
        """
        self.text = text

        # Categorize the token.
        if self.is_identifier(text):
            self.category = 'identifier'
        elif self.is_number(text):
            self.category = 'number'
        elif self.is_operator(text):
            self.category = 'operator'
        else:
            raise Exception('Invalid syntax')

    def is_identifier(self, text):
        """Checks if given token represents a valid identifier. A valid
        identifier could be a single latin letter (uppercase/lowercase), a greek
        letter represented by the symbol name, or a valid math function.

        Args:
            text: str. String representation of the token.
        Returns:
            bool. Whether the given string represents a valid identifier.
        """
        if text.isalpha() and len(text) == 1:
            return True
        if text in GREEK_LETTERS:
            return True
        if text in MATH_FUNCTIONS:
            return True
        return False

    def is_number(self, text):
        """Checks if given token represents a valid number(integer/float)
        without a '+'/'-' sign.

        Args:
            text: str. String representation of the token.
        Returns:
            bool. Whether the given string represents a valid number.
        """
        return text.replace('.', '', 1).isdigit()

    def is_operator(self, text):
        """Checks if given token represents a valid operator.

        Args:
            text: str. String representation of the token.
        Returns:
            bool. Whether the given string represents a valid operator.
        """
        return text in VALID_OPERATORS


class Node(python_utils.OBJECT):
    """Instances of this class act as nodes of the parse tree."""

    def __init__(self, operator_token, children):
        """Initializes a Node object. For ex. 'a + b' will have root node as
        '+' (operator_token) and children as ['a', 'b'].

        Args:
            operator_token: Token. The token representing the operator.
            children: list(Node). Child nodes of the current node.
        """
        self.operator_token = operator_token
        self.children = children


class AddOperator(Node):
    """Class representing the addition operator node."""

    def __init__(self, operator_token, left, right):
        """Initializes an AddOperator object.

        Args:
            operator_token: Token. The token representing the add operator.
            left: Node. Left child of the operator.
            right: Node. Right child of the operator.
        """
        super(AddOperator, self).__init__(operator_token, [left, right])


class SubtractOperator(Node):
    """Class representing the subtraction operator node."""

    def __init__(self, operator_token, left, right):
        """Initializes an SubtractOperator object.

        Args:
            operator_token: Token. The token representing the subtract operator.
            left: Node. Left child of the operator.
            right: Node. Right child of the operator.
        """
        super(SubtractOperator, self).__init__(operator_token, [left, right])


class MultiplyOperator(Node):
    """Class representing the multiplication operator node."""

    def __init__(self, operator_token, left, right):
        """Initializes an MultiplyOperator object.

        Args:
            operator_token: Token. The token representing the multiply operator.
            left: Node. Left child of the operator.
            right: Node. Right child of the operator.
        """
        super(MultiplyOperator, self).__init__(operator_token, [left, right])


class DivideOperator(Node):
    """Class representing the division operator node."""

    def __init__(self, operator_token, left, right):
        """Initializes an DivideOperator object.

        Args:
            operator_token: Token. The token representing the divide operator.
            left: Node. Left child of the operator.
            right: Node. Right child of the operator.
        """
        super(DivideOperator, self).__init__(operator_token, [left, right])


class PowerOperator(Node):
    """Class representing the power operator node."""

    def __init__(self, operator_token, left, right):
        """Initializes an PowerOperator object.

        Args:
            operator_token: Token. The token representing the power operator.
            left: Node. Left child of the operator.
            right: Node. Right child of the operator.
        """
        super(PowerOperator, self).__init__(operator_token, [left, right])


class Identifier(Node):
    """Class representing the identifier node."""

    def __init__(self, token):
        """Initializes an Identifier object.

        Args:
            token: Token. The token representing the identifier.
        """
        super(Identifier, self).__init__(token, [])


class Number(Node):
    """Class representing the number node."""

    def __init__(self, token):
        """Initializes an Number object.

        Args:
            token: Token. The token representing the number.
        """
        super(Number, self).__init__(token, [])


class Function(Node):
    """Class representing the function node."""

    def __init__(self, token, child):
        """Initializes an Function object.

        Args:
            token: Token. The token representing the math function.
            child: Node. The parameter of the function.
        """
        super(Function, self).__init__(token, [child])


class Parser(python_utils.OBJECT):
    """Class representing the math expression parser.
    Implements a greedy, recursive-descent parser that tries to consume
    as many tokens as possible while obeying the grammar.
    """

    def __init__(self, text):
        """Initializes an Parser object. Tokenizes the given expression string
        and replaces all parens with '(' or ')' for simplicity.

        Args:
            text: str. String representing the math expression.

        Raises:
            Exception: Invalid syntax.
        """

        # Position of the next token in the token list.
        self.next_token_index = 0
        tokens = re.findall(
            r'([a-zA-Z]+|[0-9]+\.[0-9]+|[0-9]+|[\[\{\(\)\}\]\+\*\-\/\^])', text)
        self.token_list = [Token(token) for token in tokens]

        if not contains_balanced_brackets(text):
            raise Exception('Invalid syntax.')

        # Replacing all parens with '(' or ')' for simplicity.
        for i in python_utils.RANGE(len(self.token_list)):
            token = self.token_list[i]
            if token.text in '[{':
                self.token_list[i] = Token('(')
            if token.text in '}]':
                self.token_list[i] = Token(')')

    def parse(self):
        """A wrapper around the parse_expr method. This method checks if all
        tokens have been consumed by the parse_expr method.

        Returns:
            Node. Root node of the generated parse tree.

        Raises:
            Exception: Invalid syntax.
        """

        expr = self.parse_expr()
        if self.next_token_index < len(self.token_list):
            raise Exception('Invalid syntax.')
        return expr

    def parse_expr(self):
        """Function representing the following production rule of the grammar:
        <expr> ::= <expr2> (('+' | '-') <expr2>)*

        Returns:
            Node. Root node of the generated parse tree.
        """
        expr = self.parse_expr2()
        operator_token = self.is_next_token(['+', '-'])
        while operator_token:
            right = self.parse_expr2()
            if operator_token.text == '+':
                expr = AddOperator(operator_token, expr, right)
            else:
                expr = SubtractOperator(operator_token, expr, right)
            operator_token = self.is_next_token(['+', '-'])
        return expr

    def parse_expr2(self):
        """Function representing the following production rule of the grammar:
        <expr2> ::= <expr1> (('*' | '/') <expr1>)*

        Returns:
            Node. Root node of the generated parse tree.
        """

        expr = self.parse_expr1()
        operator_token = self.is_next_token(['*', '/'])
        while operator_token:
            right = self.parse_expr1()
            if operator_token.text == '*':
                expr = MultiplyOperator(operator_token, expr, right)
            else:
                expr = DivideOperator(operator_token, expr, right)
            operator_token = self.is_next_token(['*', '/'])
        return expr

    def parse_expr1(self):
        """Function representing the following production rule of the grammar:
        <expr1> ::= '-' <expr1> | '+' <expr1> | <unit> ('^' <expr1>)?

        Returns:
            Node. Root node of the generated parse tree.
        """

        # Eliminate any leading unary '+' or '-' operators, because they
        # are syntactically irrelevant.
        while self.is_next_token(['+', '-']):
            pass

        expr = self.parse_unit()
        operator_token = self.is_next_token(['^'])
        if operator_token:
            # Using recursion for right-associative ^ operator.
            right = self.parse_expr1()
            return PowerOperator(operator_token, expr, right)
        return expr

    def parse_unit(self):
        """Function representing the following production rule of the grammar:
        <unit> ::= <identifier> ('(' <expr> ')')* | <number> | '(' <expr> ')'

        Returns:
            Node. Root node of the generated parse tree.

        Raises:
            Exception: Invalid syntax.
        """

        token = self.get_next_token()
        if token.category == 'identifier':
            if self.is_next_token(['(']):
                child = self.parse_expr()
                self.expect_token(')')
                return Function(token, child)
            return Identifier(token)

        if token.category == 'number':
            return Number(token)

        if token.text == '(':
            expr = self.parse_expr()
            self.expect_token(')')
            return expr

        raise Exception('Invalid syntax.')

    def check_next_token(self):
        """Function to peek into the next position to see the next token.

        Returns:
            Token|None. Token at the next position. Returns none if there are no
                more tokens left.
        """

        if self.next_token_index < len(self.token_list):
            return self.token_list[self.next_token_index]
        return None

    def get_next_token(self):
        """Function to retrieve the token at the next position and then
        increment the next_token_index.

        Returns:
            Token. Token at the next position.

        Raises:
            Exception: Invalid syntax.
        """

        if self.next_token_index < len(self.token_list):
            token = self.token_list[self.next_token_index]
            self.next_token_index += 1
            return token

        raise Exception('Invalid syntax.')

    def is_next_token(self, valid_options):
        """Function to verify that there is at least one more token remaining
        and that the next token is among the valid_options provided.

        Args:
            valid_options: list(str). List of strings containing the allowed
                tokens at the next position.

        Returns:
            Token|None. Token at the next position. Returns none if there are no
                more tokens left or the next token is not in the valid_options.
        """

        if self.next_token_index < len(self.token_list):
            text = self.token_list[self.next_token_index].text
            if text in valid_options:
                token = self.token_list[self.next_token_index]
                self.next_token_index += 1
                return token
        return None

    def expect_token(self, text):
        """Function to compare the next token with the given text. If
        comparision is true, increments next_token_index.

        Args:
            text: str. String representation of the token to check.

        Returns:
            Token. Token at the next position.

        Raises:
            Exception: Invalid syntax.
        """
        token = self.check_next_token()
        if token is None or token.text != text:
            raise Exception('Invalid syntax')

        token = self.token_list[self.next_token_index]
        self.next_token_index += 1
        return token
