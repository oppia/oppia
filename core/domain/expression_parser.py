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

"""A parser that generates a parse tree for math expressions.

It uses the following grammar in Backus-Naur form:

# Non-terminals
<expr> ::= <mul_expr> (('+' | '-') <mul_expr>)*
<mul_expr> ::= <pow_expr> (('*' | '/') <pow_expr>)*
<pow_expr> ::= '-' <pow_expr> | '+' <pow_expr> | <unit> ('^' <pow_expr>)?
<unit> ::= <identifier> | <number> | '(' <expr> ')' | <function> '(' <expr> ')'

# Terminals
<number> ::= r'[0-9]+.[0-9]+|[0-9]+'
<identifier> ::= r'[a-zA-Z]' | 'alpha' | 'beta' | 'gamma' | 'theta' | 'epsilon'
| 'pi' | 'omega'
<function> ::= 'sqrt' | 'abs' | 'cos' | 'sin' | 'tan' | 'cot' | 'sec' | 'cosec'
"""

from __future__ import annotations

import collections
import re

from core.constants import constants

from typing import Final, List, Optional

_OPENING_PARENS: List[str] = ['[', '{', '(']
_CLOSING_PARENS: List[str] = [')', '}', ']']
_VALID_OPERATORS: List[str] = (
    _OPENING_PARENS + _CLOSING_PARENS + ['+', '-', '/', '*', '^']
)

_TOKEN_CATEGORY_IDENTIFIER: Final = 'identifier'
_TOKEN_CATEGORY_FUNCTION: Final = 'function'
_TOKEN_CATEGORY_NUMBER: Final = 'number'
_TOKEN_CATEGORY_OPERATOR: Final = 'operator'

_OPENING_CATEGORIES: Final = (
    _TOKEN_CATEGORY_IDENTIFIER,
    _TOKEN_CATEGORY_FUNCTION,
    _TOKEN_CATEGORY_NUMBER)

_CLOSING_CATEGORIES: Final = (
    _TOKEN_CATEGORY_IDENTIFIER,
    _TOKEN_CATEGORY_NUMBER)


def contains_balanced_brackets(expression: str) -> bool:
    """Checks if the given expression contains a balanced bracket sequence.

    Args:
        expression: str. A math expression (algebraic/numeric).

    Returns:
        bool. Whether the given expression contains a balanced bracket sequence.
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


def contains_at_least_one_variable(expression: str) -> bool:
    """Checks if the given expression contains at least one valid identifier
    (latin letter or greek symbol name).

    Args:
        expression: str. A math expression.

    Returns:
        bool. Whether the given expression contains at least one single latin
        letter or greek symbol name.

    Raises:
        Exception. Invalid syntax.
    """
    # This raises an exception if the syntax is invalid.
    Parser().parse(expression)
    token_list = tokenize(expression)

    return any(
        token.category == _TOKEN_CATEGORY_IDENTIFIER for token in token_list)


def tokenize(expression: str) -> List[Token]:
    """Splits the given expression into separate tokens based on the grammar
    definitions.

    Args:
        expression: str. A math expression.

    Returns:
        list(Token). A list containing token objects formed from the given math
        expression.

    Raises:
        Exception. Invalid token.
    """
    expression = expression.replace(' ', '')

    # Note: Greek letters and math functions are sorted in reverse by length so
    # that longer ones get matched before shorter ones.
    # For eg. 'x + epsilon' should be tokenized as ['x','+','epsilon'] and not
    # ['x','+','e','*','psi','*','l','*','o','*','n']. a^2.
    re_string = r'(%s|[a-zA-Z]|[0-9]+\.[0-9]+|[0-9]+|[%s])' % (
        '|'.join(sorted(
            list(constants.GREEK_LETTER_NAMES_TO_SYMBOLS.keys()) +
            constants.MATH_FUNCTION_NAMES,
            reverse=True, key=len)),
        '\\'.join(_VALID_OPERATORS))

    token_texts = re.findall(re_string, expression)

    # There is a possibility that the regex string skips past an invalid
    # character. In that case, we must raise an error and display the invalid
    # character. The invalid character is the one who's frequency in the
    # original expression does not match with the frequency in the tokenized
    # expression. The counter is being used to verify that frequencies match.
    original_exp_frequency = collections.Counter(expression)
    tokenized_exp_frequency = collections.Counter(''.join(token_texts))

    for character in original_exp_frequency:
        if original_exp_frequency[
                character] != tokenized_exp_frequency[character]:
            raise Exception('Invalid token: %s.' % character)

    token_list = []
    for token_text in token_texts:
        # Replacing all parens with '(' or ')' for simplicity while parsing.
        if token_text in ['[', '{']:
            token_list.append(Token('('))
        elif token_text in [']', '}']:
            token_list.append(Token(')'))
        else:
            token_list.append(Token(token_text))

    # Adding '*' sign after identifiers, numbers and closing brackets if they
    # are not followed by a valid operator.
    final_token_list = []
    for i, token in enumerate(token_list):
        final_token_list.append(token)
        if i != len(token_list) - 1:
            # If a closing term is directly followed by another closing term,
            # instead of being followed by an operator, we assume that the
            # operation to be performed is multiplication and insert a '*' sign
            # to explicitly denote the operation. For eg. 'ab+x' would be
            # transformed into 'a*b+x'.
            if (
                    (
                        token.category in _CLOSING_CATEGORIES or
                        token.text in _CLOSING_PARENS
                    ) and
                    (
                        token_list[i + 1].category in _OPENING_CATEGORIES or
                        token_list[i + 1].text in _OPENING_PARENS
                    )
            ):
                final_token_list.append(Token('*'))

    return final_token_list


def get_variables(expression: str) -> List[str]:
    """Extracts all variables along with pi and e from a given expression.

    Args:
        expression: str. A math expression.

    Returns:
        list(str). A list containing all the variables present in the given
        expression.
    """
    if '=' in expression:
        lhs, rhs = expression.split('=')
        token_list = tokenize(lhs) + tokenize(rhs)
    else:
        token_list = tokenize(expression)
    variables = set()
    for token in token_list:
        if token.category == _TOKEN_CATEGORY_IDENTIFIER or token.text in [
                'pi', 'e']:
            variables.add(token.text)
    return list(variables)


class Token:
    """Class for tokens of the math expression."""

    def __init__(self, text: str) -> None:
        """Initializes a Token object.

        Args:
            text: str. String representation of the token.

        Raises:
            Exception. Invalid token.
        """
        self.text = text

        # Categorize the token.
        if self.is_number(text):
            self.category = _TOKEN_CATEGORY_NUMBER
        elif self.is_identifier(text):
            self.category = _TOKEN_CATEGORY_IDENTIFIER
        elif self.is_function(text):
            self.category = _TOKEN_CATEGORY_FUNCTION
        elif self.is_operator(text):
            self.category = _TOKEN_CATEGORY_OPERATOR
        else:
            raise Exception('Invalid token: %s.' % text)

    def is_function(self, text: str) -> bool:
        """Checks if the given token represents a valid math function.

        Args:
            text: str. String representation of the token.

        Returns:
            bool. Whether the given string represents a valid math function.
        """
        return text in constants.MATH_FUNCTION_NAMES

    def is_identifier(self, text: str) -> bool:
        """Checks if the given token represents a valid identifier. A valid
        identifier could be a single latin letter (uppercase/lowercase) or a
        greek letter represented by the symbol name.

        Args:
            text: str. String representation of the token.

        Returns:
            bool. Whether the given string represents a valid identifier.
        """
        return text in constants.VALID_ALGEBRAIC_IDENTIFIERS

    def is_number(self, text: str) -> bool:
        """Checks if the given token represents a valid real number without a
        '+'/'-' sign. 'pi' and 'e' are also considered as numeric values.

        Args:
            text: str. String representation of the token.

        Returns:
            bool. Whether the given string represents a valid real number.
        """
        return text.replace('.', '', 1).isdigit() or text in ('pi', 'e')

    def is_operator(self, text: str) -> bool:
        """Checks if the given token represents a valid math operator.

        Args:
            text: str. String representation of the token.

        Returns:
            bool. Whether the given string represents a valid math operator.
        """
        return text in _VALID_OPERATORS


class Node:
    """Instances of the classes that inherit this class act as nodes of the
    parse tree. These could be internal as well as leaf nodes. For leaf nodes,
    the children parameter would be an empty list.

    NOTE: This class is not supposed to be used independently, but should be
    inherited. If the child class represents an identifier or a function, it
    should have an attribute that denotes the text that the node represents. For
    the operator nodes, the class name should represent the type of operator.
    """

    def __init__(self, children: List[Node]) -> None:
        """Initializes a Node object. For ex. 'a + b' will have root node as
        '+' and children as ['a', 'b'].

        Args:
            children: list(Node). Child nodes of the current node.
        """
        self.children = children


class AdditionOperatorNode(Node):
    """Class representing the addition operator node."""

    def __init__(self, left: Node, right: Node) -> None:
        """Initializes an AdditionOperatorNode object.

        Args:
            left: Node. Left child of the operator.
            right: Node. Right child of the operator.
        """
        super().__init__([left, right])


class SubtractionOperatorNode(Node):
    """Class representing the subtraction operator node."""

    def __init__(self, left: Node, right: Node) -> None:
        """Initializes an SubtractionOperatorNode object.

        Args:
            left: Node. Left child of the operator.
            right: Node. Right child of the operator.
        """
        super().__init__([left, right])


class MultiplicationOperatorNode(Node):
    """Class representing the multiplication operator node."""

    def __init__(self, left: Node, right: Node) -> None:
        """Initializes an MultiplicationOperatorNode object.

        Args:
            left: Node. Left child of the operator.
            right: Node. Right child of the operator.
        """
        super().__init__([left, right])


class DivisionOperatorNode(Node):
    """Class representing the division operator node."""

    def __init__(self, left: Node, right: Node) -> None:
        """Initializes an DivisionOperatorNode object.

        Args:
            left: Node. Left child of the operator.
            right: Node. Right child of the operator.
        """
        super().__init__([left, right])


class PowerOperatorNode(Node):
    """Class representing the power operator node."""

    def __init__(self, left: Node, right: Node) -> None:
        """Initializes an PowerOperatorNode object.

        Args:
            left: Node. Left child of the operator.
            right: Node. Right child of the operator.
        """
        super().__init__([left, right])


class IdentifierNode(Node):
    """Class representing the identifier node. An identifier could be a single
    latin letter (uppercase/lowercase) or a greek letter represented by the
    symbol name.
    """

    def __init__(self, token: Token) -> None:
        """Initializes an IdentifierNode object.

        Args:
            token: Token. The token representing the identifier.
        """
        self.token = token
        super().__init__([])


class NumberNode(Node):
    """Class representing the number node."""

    def __init__(self, token: Token) -> None:
        """Initializes a NumberNode object.

        Args:
            token: Token. The token representing a real number.
        """
        self.token = token
        super().__init__([])


class UnaryFunctionNode(Node):
    """Class representing the function node. The functions represented by this
    class must have exactly one parameter.
    """

    def __init__(self, token: Token, child: Node) -> None:
        """Initializes a UnaryFunctionNode object.

        Args:
            token: Token. The token representing the math function.
            child: Node. The parameter of the function.
        """
        self.token = token
        super().__init__([child])


class Parser:
    """Class representing the math expression parser.
    Implements a greedy, recursive-descent parser that tries to consume
    as many tokens as possible while obeying the grammar.
    More info about recursive-descent parsers:
    https://en.wikipedia.org/wiki/Recursive_descent_parser
    """

    def __init__(self) -> None:
        """Initializes the Parser object."""
        # Stores the index of the next token to be parsed. This attribute is
        # global to this class, i.e., all methods operate on the same instance
        # of this attribute. The parsing methods below increment this value
        # upon parsing the current token from the token list.
        self._next_token_index = 0

    def parse(self, expression: str) -> Node:
        """A wrapper around the _parse_expr method. This method creates a list
        of tokens present in the expression and calls the _parse_expr method.

        Args:
            expression: str. String representing the math expression.

        Returns:
            Node. Root node of the generated parse tree.

        Raises:
            Exception. Invalid syntax: Unexpected end of expression.
            Exception. Invalid character.
            Exception. Invalid bracket pairing.
        """
        # Expression should not contain any invalid characters.
        for character in expression:
            if not bool(re.match(r'(\s|\d|\w|\.)', character)) and (
                    character not in _VALID_OPERATORS):
                raise Exception('Invalid character: %s.' % character)

        if not contains_balanced_brackets(expression):
            raise Exception('Invalid bracket pairing.')

        token_list = tokenize(expression)

        # Whenever the 'parse' method is called, this attribute needs to be
        # reset to 0.
        self._next_token_index = 0

        return self._parse_expr(token_list)

    def _parse_expr(self, token_list: List[Token]) -> Node:
        """Function representing the following production rule of the grammar:
        <expr> ::= <mul_expr> (('+' | '-') <mul_expr>)*

        Args:
            token_list: list(Token). A list containing token objects formed from
                the given math expression.

        Returns:
            Node. Root node of the generated parse tree.
        """
        parsed_expr = self._parse_mul_expr(token_list)
        operator_token = self._get_next_token_if_text_in(
            ['+', '-'], token_list)
        while operator_token:
            parsed_right = self._parse_mul_expr(token_list)
            if operator_token.text == '+':
                parsed_expr = AdditionOperatorNode(parsed_expr, parsed_right)
            else:
                parsed_expr = SubtractionOperatorNode(parsed_expr, parsed_right)
            operator_token = self._get_next_token_if_text_in(
                ['+', '-'], token_list)
        return parsed_expr

    def _parse_mul_expr(self, token_list: List[Token]) -> Node:
        """Function representing the following production rule of the grammar:
        <mul_expr> ::= <pow_expr> (('*' | '/') <pow_expr>)*

        Args:
            token_list: list(Token). A list containing token objects formed from
                the given math expression.

        Returns:
            Node. Root node of the generated parse tree.
        """
        parsed_expr = self._parse_pow_expr(token_list)
        operator_token = self._get_next_token_if_text_in(
            ['*', '/'], token_list)
        while operator_token:
            parsed_right = self._parse_pow_expr(token_list)
            if operator_token.text == '*':
                parsed_expr = MultiplicationOperatorNode(
                    parsed_expr, parsed_right)
            else:
                parsed_expr = DivisionOperatorNode(parsed_expr, parsed_right)
            operator_token = self._get_next_token_if_text_in(
                ['*', '/'], token_list)
        return parsed_expr

    def _parse_pow_expr(self, token_list: List[Token]) -> Node:
        """Function representing the following production rule of the grammar:
        <pow_expr> ::= '-' <pow_expr> | '+' <pow_expr> |
        <unit> ('^' <pow_expr>)?

        Args:
            token_list: list(Token). A list containing token objects formed from
                the given math expression.

        Returns:
            Node. Root node of the generated parse tree.
        """
        # Eliminate any leading unary '+' or '-' operators, because they
        # are syntactically irrelevant.
        while self._get_next_token_if_text_in(['+', '-'], token_list):
            pass

        parsed_expr = self._parse_unit(token_list)
        operator_token = self._get_next_token_if_text_in(['^'], token_list)
        if operator_token:
            # Using recursion for right-associative ^ operator.
            parsed_right = self._parse_pow_expr(token_list)
            return PowerOperatorNode(parsed_expr, parsed_right)
        return parsed_expr

    def _parse_unit(self, token_list: List[Token]) -> Node:
        """Function representing the following production rule of the grammar:
        <unit> ::= <identifier> | <number> | '(' <expr> ')' |
        <function> '(' <expr> ')'

        Args:
            token_list: list(Token). A list containing token objects formed from
                the given math expression.

        Returns:
            Node. Root node of the generated parse tree.

        Raises:
            Exception. Invalid token.
        """
        token = self._get_next_token(token_list)
        if token.category == _TOKEN_CATEGORY_IDENTIFIER:
            return IdentifierNode(token)

        if token.category == _TOKEN_CATEGORY_FUNCTION:
            if self._get_next_token_if_text_in(['('], token_list):
                parsed_child = self._parse_expr(token_list)
                next_token = self._get_next_token_if_text_in([')'], token_list)
                # Here, we are asserting that next_token is never going to be
                # None, because before reaching this line of code we are already
                # checking if token exists or not with method `_get_next_token`.
                assert next_token is not None
                return UnaryFunctionNode(next_token, parsed_child)

        if token.category == _TOKEN_CATEGORY_NUMBER:
            return NumberNode(token)

        if token.text == '(':
            parsed_expr = self._parse_expr(token_list)
            next_token = self._get_next_token_if_text_in([')'], token_list)
            return parsed_expr

        raise Exception('Invalid token: %s.' % token.text)

    def _get_next_token(self, token_list: List[Token]) -> Token:
        """Function to retrieve the token at the next position and then
        increment the _next_token_index.

        Args:
            token_list: list(Token). A list containing token objects formed from
                the given math expression.

        Returns:
            Token. Token at the next position.

        Raises:
            Exception. Invalid syntax: Unexpected end of expression.
        """
        if self._next_token_index < len(token_list):
            token = token_list[self._next_token_index]
            self._next_token_index += 1
            return token

        raise Exception('Invalid syntax: Unexpected end of expression.')

    def _get_next_token_if_text_in(
        self, allowed_token_texts: List[str], token_list: List[Token]
    ) -> Optional[Token]:
        """Function to verify that there is at least one more token remaining
        and that the next token text is among the allowed_token_texts provided.
        If true, returns the token; otherwise, returns None.

        Args:
            allowed_token_texts: list(str). List of strings containing the
                allowed token texts at the next position.
            token_list: list(Token). A list containing token objects formed from
                the given math expression.

        Returns:
            Token|None. Token at the next position. Returns None if there are no
            more tokens left or the next token text is not in the
            allowed_token_texts.
        """
        if self._next_token_index < len(token_list):
            text = token_list[self._next_token_index].text
            if text in allowed_token_texts:
                token = token_list[self._next_token_index]
                self._next_token_index += 1
                return token
        return None


def is_valid_expression(expression: str) -> bool:
    """Checks if the given math expression is syntactically valid.

    Args:
        expression: str. String representation of the math expression.

    Returns:
        bool. Whether the given math expression is syntactically valid.
    """
    try:
        Parser().parse(expression)
    except Exception:
        return False
    return True
