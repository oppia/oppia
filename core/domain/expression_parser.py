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

<expr> ::= <mul_expr> (('+' | '-') <mul_expr>)*
<mul_expr> ::= <pow_expr> (('*' | '/') <pow_expr>)*
<pow_expr> ::= '-' <pow_expr> | '+' <pow_expr> | <unit> ('^' <pow_expr>)?

<unit> ::= <identifier> | <number> | '(' <expr> ')' | <function> '(' <expr> ')'
<number> ::= r'[0-9]+.[0-9]+|[0-9]+'
<identifier> ::= r'[a-zA-Z]' | 'alpha' | 'beta' | 'gamma' | 'theta' | 'epsilon'
| 'pi' | 'omega'
<function> ::= 'sqrt' | 'abs' | 'cos' | 'sin' | 'tan' | 'cot' | 'sec' | 'cosec'
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import re

import python_utils

GREEK_LETTERS = [
    'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta',
    'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'pi', 'rho', 'sigma', 'tau',
    'upsilon', 'phi', 'chi', 'psi', 'omega', 'Gamma', 'Delta', 'Theta',
    'Lambda', 'Xi', 'Pi', 'Sigma', 'Phi', 'Psi', 'Omega']
MATH_FUNCTIONS = [
    'log', 'ln', 'sqrt', 'abs', 'sin', 'cos', 'tan', 'sec', 'csc', 'cot',
    'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh']
VALID_OPERATORS = ['[', '{', '(', ')', '}', ']', '+', '-', '/', '*', '^']

_IDENTIFIER, _FUNCTION, _NUMBER, _OPERATOR = (
    'identifier', 'function', 'number', 'operator')


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


def is_algebraic(expression):
    """Checks if the given expression is algebraic. An algebraic expression must
    contain at least one valid identifier (latin letter or greek symbol name).

    Args:
        expression: str. A math expression.

    Returns:
        bool. Whether the given expression contains at least one single
            latin letter or greek symbol name.

    Raises:
        Exception: Invalid syntax.
    """
    token_list = Parser(expression).token_list
    tokens_text = [token.text for token in token_list]

    return any(
        (token_text.isalpha() and len(token_text) == 1) or (
            token_text in GREEK_LETTERS) for token_text in tokens_text)


class Token(python_utils.OBJECT):
    """Class for tokens of the math expression."""

    def __init__(self, text):
        """Initializes a Token object.

        Args:
            text: str. String representation of the token.

        Raises:
            Exception: Invalid token.
        """
        self.text = text

        # Categorize the token.
        if self.is_identifier(text):
            self.category = _IDENTIFIER
        elif self.is_function(text):
            self.category = _FUNCTION
        elif self.is_number(text):
            self.category = _NUMBER
        elif self.is_operator(text):
            self.category = _OPERATOR
        else:
            raise Exception('Invalid token: %s.' % text)

    def is_function(self, text):
        """Checks if given token represents a valid math function.

        Args:
            text: str. String representation of the token.

        Returns:
            bool. Whether the given string represents a valid math function.
        """
        return text in MATH_FUNCTIONS

    def is_identifier(self, text):
        """Checks if given token represents a valid identifier. A valid
        identifier could be a single latin letter (uppercase/lowercase) or a
        greek letter represented by the symbol name.

        Args:
            text: str. String representation of the token.

        Returns:
            bool. Whether the given string represents a valid identifier.
        """
        return (text.isalpha() and len(text) == 1) or text in GREEK_LETTERS

    def is_number(self, text):
        """Checks if given token represents a valid real number without a
        '+'/'-' sign.

        Args:
            text: str. String representation of the token.

        Returns:
            bool. Whether the given string represents a valid real number.
        """
        return text.replace('.', '', 1).isdigit()

    def is_operator(self, text):
        """Checks if given token represents a valid math operator.

        Args:
            text: str. String representation of the token.

        Returns:
            bool. Whether the given string represents a valid math operator.
        """
        return text in VALID_OPERATORS


class Node(python_utils.OBJECT):
    """Instances of the classes that inherit this class act as nodes of the
    parse tree. These could be internal as well as leaf nodes. For leaf nodes,
    the children parameter would be an empty list.
    NOTE: This class is not supposed to be used independently, but should be
    inherited. The child class should have a variable that denotes the token
    that the node represents, i.e., operator, identifier, or function.
    """

    def __init__(self, children):
        """Initializes a Node object. For ex. 'a + b' will have root node as
        '+' and children as ['a', 'b'].

        Args:
            children: list(Node). Child nodes of the current node.
        """
        self.children = children


class AdditionOperatorNode(Node):
    """Class representing the addition operator node."""

    def __init__(self, left, right):
        """Initializes an AdditionOperatorNode object.

        Args:
            left: Node. Left child of the operator.
            right: Node. Right child of the operator.
        """
        self.operator_token = '+'
        super(AdditionOperatorNode, self).__init__([left, right])


class SubtractionOperatorNode(Node):
    """Class representing the subtraction operator node."""

    def __init__(self, left, right):
        """Initializes an SubtractionOperatorNode object.

        Args:
            left: Node. Left child of the operator.
            right: Node. Right child of the operator.
        """
        self.operator_token = '-'
        super(SubtractionOperatorNode, self).__init__([left, right])


class MultiplicationOperatorNode(Node):
    """Class representing the multiplication operator node."""

    def __init__(self, left, right):
        """Initializes an MultiplicationOperatorNode object.

        Args:
            left: Node. Left child of the operator.
            right: Node. Right child of the operator.
        """
        self.operator_token = '*'
        super(MultiplicationOperatorNode, self).__init__([left, right])


class DivisionOperatorNode(Node):
    """Class representing the division operator node."""

    def __init__(self, left, right):
        """Initializes an DivisionOperatorNode object.

        Args:
            left: Node. Left child of the operator.
            right: Node. Right child of the operator.
        """
        self.operator_token = '/'
        super(DivisionOperatorNode, self).__init__([left, right])


class PowerOperatorNode(Node):
    """Class representing the power operator node."""

    def __init__(self, left, right):
        """Initializes an PowerOperatorNode object.

        Args:
            left: Node. Left child of the operator.
            right: Node. Right child of the operator.
        """
        self.operator_token = '^'
        super(PowerOperatorNode, self).__init__([left, right])


class IdentifierNode(Node):
    """Class representing the identifier node. An identifier could be a single
    latin letter (uppercase/lowercase) or a greek letter represented by the
    symbol name.
    """

    def __init__(self, token):
        """Initializes an IdentifierNode object.

        Args:
            token: Token. The token representing the identifier.
        """
        self.token = token
        super(IdentifierNode, self).__init__([])


class NumberNode(Node):
    """Class representing the number node."""

    def __init__(self, token):
        """Initializes a NumberNode object.

        Args:
            token: Token. The token representing a real number.
        """
        self.token = token
        super(NumberNode, self).__init__([])


class UnaryFunctionNode(Node):
    """Class representing the function node. The functions represented by this
    class must have exactly one parameter.
    """

    def __init__(self, token, child):
        """Initializes a UnaryFunctionNode object.

        Args:
            token: Token. The token representing the math function.
            child: Node. The parameter of the function.
        """
        self.token = token
        super(UnaryFunctionNode, self).__init__([child])


class Parser(python_utils.OBJECT):
    """Class representing the math expression parser.
    Implements a greedy, recursive-descent parser that tries to consume
    as many tokens as possible while obeying the grammar.
    More info about recursive-descent parsers:
    https://en.wikipedia.org/wiki/Recursive_descent_parser
    """

    def __init__(self, text):
        """Initializes a Parser object. Tokenizes the given expression string
        and replaces all parens with '(' or ')' for simplicity.

        Args:
            text: str. String representing the math expression.

        Raises:
            Exception: Invalid character or Invalid bracket pairing.
        """
        # Expression should not contain any invalid characters.
        for character in text:
            if not bool(re.match(r'(\s|\d|\w|\.)', character)) and (
                    character not in VALID_OPERATORS):
                raise Exception('Invalid character: %s.' % character)

        if not contains_balanced_brackets(text):
            raise Exception('Invalid bracket pairing.')

        # Position of the next token in the token list.
        self.next_token_index = 0

        re_string = r'([a-zA-Z]+|[0-9]+\.[0-9]+|[0-9]+|[%s])' % '\\'.join(
            VALID_OPERATORS)

        tokens_text = re.findall(re_string, text)
        self.token_list = [Token(token_text) for token_text in tokens_text]

        # Replacing all parens with '(' or ')' for simplicity.
        for i in python_utils.RANGE(len(self.token_list)):
            token = self.token_list[i]
            if token.text in ['[', '{']:
                self.token_list[i] = Token('(')
            if token.text in ['}', ']']:
                self.token_list[i] = Token(')')

    def parse(self):
        """A wrapper around the _parse_expr method. This method checks if all
        tokens have been consumed by the _parse_expr method.

        Returns:
            Node. Root node of the generated parse tree.

        Raises:
            Exception: Invalid syntax.
        """
        parsed_expr = self._parse_expr()
        if self.next_token_index < len(self.token_list):
            raise Exception('Invalid syntax.')
        return parsed_expr

    def _parse_expr(self):
        """Function representing the following production rule of the grammar:
        <expr> ::= <mul_expr> (('+' | '-') <mul_expr>)*

        Returns:
            Node. Root node of the generated parse tree.
        """
        parsed_expr = self.parse_mul_expr()
        operator_token = self.get_next_token_if_token_in(['+', '-'])
        while operator_token:
            parsed_right = self.parse_mul_expr()
            if operator_token.text == '+':
                parsed_expr = AdditionOperatorNode(parsed_expr, parsed_right)
            else:
                parsed_expr = SubtractionOperatorNode(parsed_expr, parsed_right)
            operator_token = self.get_next_token_if_token_in(['+', '-'])
        return parsed_expr

    def parse_mul_expr(self):
        """Function representing the following production rule of the grammar:
        <mul_expr> ::= <pow_expr> (('*' | '/') <pow_expr>)*

        Returns:
            Node. Root node of the generated parse tree.
        """
        parsed_expr = self.parse_pow_expr()
        operator_token = self.get_next_token_if_token_in(['*', '/'])
        while operator_token:
            parsed_right = self.parse_pow_expr()
            if operator_token.text == '*':
                parsed_expr = MultiplicationOperatorNode(
                    parsed_expr, parsed_right)
            else:
                parsed_expr = DivisionOperatorNode(parsed_expr, parsed_right)
            operator_token = self.get_next_token_if_token_in(['*', '/'])
        return parsed_expr

    def parse_pow_expr(self):
        """Function representing the following production rule of the grammar:
        <pow_expr> ::= '-' <pow_expr> | '+' <pow_expr> |
        <unit> ('^' <pow_expr>)?

        Returns:
            Node. Root node of the generated parse tree.
        """
        # Eliminate any leading unary '+' or '-' operators, because they
        # are syntactically irrelevant.
        while self.get_next_token_if_token_in(['+', '-']):
            pass

        parsed_expr = self.parse_unit()
        operator_token = self.get_next_token_if_token_in(['^'])
        if operator_token:
            # Using recursion for right-associative ^ operator.
            parsed_right = self.parse_pow_expr()
            return PowerOperatorNode(parsed_expr, parsed_right)
        return parsed_expr

    def parse_unit(self):
        """Function representing the following production rule of the grammar:
        <unit> ::= <identifier> | <number> | '(' <expr> ')' |
        <function> '(' <expr> ')'

        Returns:
            Node. Root node of the generated parse tree.

        Raises:
            Exception: Invalid token.
        """
        token = self.get_next_token()
        if token.category == _IDENTIFIER:
            return IdentifierNode(token)

        if token.category == _FUNCTION:
            if self.get_next_token_if_token_in(['(']):
                parsed_child = self._parse_expr()
                self.expect_token(')')
                return UnaryFunctionNode(token, parsed_child)

        if token.category == _NUMBER:
            return NumberNode(token)

        if token.text == '(':
            parsed_expr = self._parse_expr()
            self.expect_token(')')
            return parsed_expr

        raise Exception('Invalid token: %s.' % token.text)

    def check_next_token(self):
        """Function to peek into the next position to see the next token. This
        is done without incrementing 'next_token_index'.

        Returns:
            Token|None. Token at the next position. Returns none if there are no
                more tokens left.
        """
        if self.next_token_index < len(self.token_list):
            return self.token_list[self.next_token_index]

    def get_next_token(self):
        """Function to retrieve the token at the next position and then
        increment the next_token_index.

        Returns:
            Token. Token at the next position.

        Raises:
            Exception: Invalid syntax: Unexpected end of expression.
        """
        if self.next_token_index < len(self.token_list):
            token = self.token_list[self.next_token_index]
            self.next_token_index += 1
            return token

        raise Exception('Invalid syntax: Unexpected end of expression.')

    def get_next_token_if_token_in(self, allowed_token_texts):
        """Function to verify that there is at least one more token remaining
        and that the next token is among the allowed_token_texts provided.
        If true, returns the token otherwise, returns None.

        Args:
            allowed_token_texts: list(str). List of strings containing the
                allowed token texts at the next position.

        Returns:
            Token|None. Token at the next position. Returns none if there are no
                more tokens left or the next token is not in the
                allowed_token_texts.
        """
        if self.next_token_index < len(self.token_list):
            text = self.token_list[self.next_token_index].text
            if text in allowed_token_texts:
                token = self.token_list[self.next_token_index]
                self.next_token_index += 1
                return token
        return None

    def expect_token(self, text):
        """Function to compare the next token's text with the given text. If
        comparision is true, increments next_token_index.

        Args:
            text: str. String representation of the token to check.

        Returns:
            Token. Token at the next position.

        Raises:
            Exception: Invalid token.
        """
        token = self.check_next_token()
        if token is None or token.text != text:
            raise Exception('Invalid token: %s.' % (
                'None' if token is None else token.text))

        token = self.token_list[self.next_token_index]
        self.next_token_index += 1
        return token


def is_valid_expression(expression):
    """Checks if given math expression is syntactically valid.

    Args:
        expression: str. String representation of the math expression.

    Returns:
        bool. Whether the given math expression is syntactically valid.
    """
    try:
        parser = Parser(expression)
        parser.parse()
    except Exception:
        return False
    return True
