"""
    pygments.lexers.cel
    ~~~~~~~~~~~~~~~~~~~

    Lexer for CEL (Common Expression Language).

    :copyright: Copyright 2006-present by the Pygments team, see AUTHORS.
    :license: BSD, see LICENSE for details.
"""

__all__ = ['CELLexer']

import re

from pygments.lexer import RegexLexer, words
from pygments.token import (
    Comment, Keyword, Name, Number, Operator, Punctuation, String, Whitespace,
)


class CELLexer(RegexLexer):
    """Lexer for CEL (Common Expression Language)."""

    name = 'CEL'
    aliases = ['cel']
    filenames = ['*.cel']
    mimetypes = []
    url = 'https://cel.dev'
    version_added = '2.21'

    flags = re.MULTILINE | re.UNICODE

    # Escape sequence per the CEL spec:
    #   \a \b \f \n \r \t \v \\ \" \' \` \?
    #   \xHH or \XHH  (exactly 2 hex digits)
    #   \uHHHH        (exactly 4 hex digits)
    #   \UHHHHHHHH    (exactly 8 hex digits)
    #   \OOO          (3-digit octal, first digit 0-3)
    #   \.            (fallback for unknown escapes)
    _ESCAPE = r"""\\(?:[abfnrtv\\"'`?]|[xX][0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|[0-3][0-7][0-7]|.)"""

    # Raw prefix: r/R alone, or b/B combined with r/R in either order
    _RAW = r'(?:[bB][rR]|[rR][bB]|[rR])'

    tokens = {
        'root': [
            (r'\s+', Whitespace),
            # CEL only has line comments; no block comments.
            (r'//.*$', Comment.Single),

            # Bytes and string literals.
            # Raw variants (no escape processing) must be tried before
            # non-raw so that br/rb/r prefixes are consumed greedily.
            # Triple-quoted raw (br""", rb""", r""")
            (_RAW + r'"""', String, 'triple-double-raw'),
            (_RAW + r"'''", String, 'triple-single-raw'),
            # Triple-quoted non-raw with optional b prefix (b""" or """)
            (r'[bB]?"""', String, 'triple-double'),
            (r"[bB]?'''", String, 'triple-single'),
            # Single-line raw
            (_RAW + r'"[^"\r\n]*"', String),
            (_RAW + r"'[^'\r\n]*'", String),
            # Single-line non-raw with optional b prefix
            (r'[bB]?"', String, 'double-string'),
            (r"[bB]?'", String, 'single-string'),

            # Numbers.
            # uint_literal: integer (decimal or hex) followed by u/U suffix.
            (r'(?:0[xX][0-9a-fA-F]+|0|[1-9][0-9]*)[uU]', Number.Integer),
            # float_literal: the grammar requires digits on both sides of the
            # decimal point for the dotted form — `1.` is not valid CEL.
            (r'(?:[0-9]+\.[0-9]+(?:[eE][+-]?[0-9]+)?'
             r'|[0-9]+[eE][+-]?[0-9]+'
             r'|\.[0-9]+(?:[eE][+-]?[0-9]+)?)',
             Number.Float),
            # int_literal: hex or decimal.
            (r'0[xX][0-9a-fA-F]+|0|[1-9][0-9]*', Number.Integer),

            # Reserved keywords (may not appear as identifiers).
            (words((
                'as', 'break', 'const', 'continue', 'else', 'for',
                'function', 'if', 'import', 'let', 'loop', 'namespace',
                'package', 'return', 'var', 'void', 'while',
            ), suffix=r'\b'), Keyword.Reserved),
            # `in` is a comparison operator keyword.
            (r'in\b', Keyword),
            # Built-in literal constants.
            (words(('true', 'false', 'null'), suffix=r'\b'), Keyword.Constant),

            # Logical and comparison operators.
            (r'&&|\|\|', Operator),
            (r'==|!=|<=|>=', Operator),
            # Arithmetic, unary, ternary, and remaining comparison operators.
            (r'[+\-*/%<>!?]', Operator),

            # Punctuation: brackets, comma, dot, colon.
            (r'[(){}\[\]]', Punctuation),
            (r'[,.]', Punctuation),
            (r':', Punctuation),

            # Identifiers: start with letter or underscore (Unicode-aware).
            (r'[^\W\d]\w*', Name),
        ],

        # Raw triple-quoted (no escape tokens; content is one big String).
        'triple-double-raw': [
            (r'"""', String, '#pop'),
            (r'"(?!"")', String),
            (r'[^"]+', String),
        ],
        'triple-single-raw': [
            (r"'''", String, '#pop'),
            (r"'(?!'')", String),
            (r"[^']+", String),
        ],

        # Non-raw triple-quoted (escape sequences highlighted separately).
        'triple-double': [
            (r'"""', String, '#pop'),
            (_ESCAPE, String.Escape),
            (r'"(?!"")', String),
            (r'[^"\\]+', String),
        ],
        'triple-single': [
            (r"'''", String, '#pop'),
            (_ESCAPE, String.Escape),
            (r"'(?!'')", String),
            (r"[^'\\]+", String),
        ],

        # Single-line non-raw strings (cannot span lines).
        'double-string': [
            (r'"', String, '#pop'),
            (_ESCAPE, String.Escape),
            (r'[^"\\\r\n]+', String),
        ],
        'single-string': [
            (r"'", String, '#pop'),
            (_ESCAPE, String.Escape),
            (r"[^'\\\r\n]+", String),
        ],
    }
