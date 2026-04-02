"""Pylint plugin for checking quote type on strings."""

from __future__ import absolute_import

import tokenize

from pylint.checkers import BaseTokenChecker
from pylint.interfaces import IAstroidChecker, ITokenChecker

try:
    from pylint import version as pv
except ImportError:
    # Backwards compatibility (pylint<2.8.0)
    from pylint.__pkginfo__ import version as pv

pylint_version = tuple(pv.split("."))

CONFIG_OPTS = ('single', 'double')
SMART_CONFIG_OPTS = tuple('%s-avoid-escape' % c for c in CONFIG_OPTS)

QUOTES = ('\'', '"')

SINGLE_QUOTE_OPTS = dict(zip(CONFIG_OPTS, QUOTES))
SMART_QUOTE_OPTS = dict(zip(CONFIG_OPTS + SMART_CONFIG_OPTS, QUOTES + QUOTES))
TRIPLE_QUOTE_OPTS = dict(zip(CONFIG_OPTS, [q * 3 for q in QUOTES]))


class StringQuoteChecker(BaseTokenChecker):
    """Pylint checker for the consistent use of characters in strings.

    This checker will check for quote consistency among string literals,
    triple quoted strings, and docstrings. Each of those three can be
    configured individually to use either single quotes (') or double
    quotes (").

    Additionally string literals can enforce avoiding escaping chars, e.g.
    enforcing single quotes (') most of the time, except if the string itself
    contains a single quote, then enforce double quotes (").
    """

    __implements__ = (ITokenChecker, IAstroidChecker, )

    name = 'string_quotes'

    msgs = {
        'C4001': (
            'Invalid string quote %s, should be %s',
            'invalid-string-quote',
            'Used when the string quote character does not match the '
            'value configured in the `string-quote` option.'
        ),
        'C4002': (
            'Invalid triple quote %s, should be %s',
            'invalid-triple-quote',
            'Used when the triple quote characters do not match the '
            'value configured in the `triple-quote` option.'
        ),
        'C4003': (
            'Invalid docstring quote %s, should be %s',
            'invalid-docstring-quote',
            'Used when the docstring quote characters do not match the '
            'value configured in the `docstring-quote` option.'
        )
    }

    options = (
        (
            'string-quote',
            dict(
                type='choice',
                metavar='<{0}, {1}, {2} or {3}>'.format(*CONFIG_OPTS + SMART_CONFIG_OPTS),
                default=CONFIG_OPTS[0],
                choices=CONFIG_OPTS + SMART_CONFIG_OPTS,
                help='The quote character for string literals.'
            )
        ),
        (
            'triple-quote',
            dict(
                type='choice',
                metavar='<{0} or {1}>'.format(*CONFIG_OPTS),
                default=CONFIG_OPTS[0],
                choices=CONFIG_OPTS,
                help='The quote character for triple-quoted strings (non-docstring).'
            )
        ),
        (
            'docstring-quote',
            dict(
                type='choice',
                metavar='<{0} or {1}>'.format(*CONFIG_OPTS),
                default=CONFIG_OPTS[1],
                choices=CONFIG_OPTS,
                help='The quote character for triple-quoted docstrings.'
            )
        )
    )

    # we need to check quote usage via tokenization, as the AST walk will
    # only tell us what the doc is, but not how it is quoted. we need to
    # store any triple quotes found during tokenization and check against
    # these when performing the walk. if a triple-quote string matches to
    # a node's docstring, it is checked and removed from this collection.
    # once we leave the module, any remaining triple quotes in this collection
    # are checked as regular triple quote strings.
    _tokenized_triple_quotes = {}

    def visit_module(self, node):
        """Visit module and check for docstring quote consistency.

        Args:
            node: the module node being visited.
        """
        self._process_for_docstring(node, 'module')

    # pylint: disable=unused-argument
    def leave_module(self, node):
        """Leave module and check remaining triple quotes.

        Args:
            node: the module node we are leaving.
        """
        for triple_quote in self._tokenized_triple_quotes.values():
            self._check_triple_quotes(triple_quote)

        # after we are done checking these, clear out the triple-quote
        # tracking collection so nothing is left over for the next module.
        self._tokenized_triple_quotes = {}

    def visit_classdef(self, node):
        """Visit class and check for docstring quote consistency.

        Args:
            node: the class node being visited.
        """
        self._process_for_docstring(node, 'class')

    def visit_functiondef(self, node):
        """Visit function and check for docstring quote consistency.

        Args:
            node: the function node being visited.
        """
        self._process_for_docstring(node, 'function')

    def visit_asyncfunctiondef(self, node):
        """Visit an asynchronous function and check for docstring quote consistency.

        Args:
            node: the async function node being visited.
        """
        self._process_for_docstring(node, 'function')

    def _process_for_docstring(self, node, node_type):
        """Check for docstring quote consistency.

        Args:
            node: the AST node being visited.
            node_type: the type of node being operated on.
        """
        # if there is no docstring, don't need to do anything.
        if node.doc is not None:

            # the module is everything, so to find the docstring, we
            # iterate line by line from the start until the first element
            # to find the docstring, as it cannot appear after the first
            # element in the body.
            if node_type == 'module':

                # if there are no nodes that make up the body, then all we
                # have is the module docstring
                if not node.body:
                    # in this case, we should only have the module docstring
                    # parsed in the node, so the only record in the
                    # self._tokenized_triple_quotes dict will correspond to
                    # the module comment. this can vary by index depending
                    # on the presence of a shebang, encoding, etc at the top
                    # of the file.
                    for key in list(self._tokenized_triple_quotes.keys()):
                        quote_record = self._tokenized_triple_quotes.get(key)
                        if quote_record:
                            self._check_docstring_quotes(quote_record)
                            del self._tokenized_triple_quotes[key]

                else:
                    for i in range(0, node.body[0].lineno):
                        quote_record = self._tokenized_triple_quotes.get(i)
                        if quote_record:
                            self._check_docstring_quotes(quote_record)
                            del self._tokenized_triple_quotes[i]
                            break

            else:
                # the node has a docstring so we check the tokenized triple
                # quotes to find a matching docstring token that follows the
                # function/class definition.

                if not node.body:
                    # if there is no body to the class, the class def only
                    # contains the docstring, so the only quotes we are
                    # tracking should correspond to the class docstring.
                    lineno = self._find_docstring_line_for_no_body(node.fromlineno)
                    quote_record = self._tokenized_triple_quotes.get(lineno)
                    if quote_record:
                        self._check_docstring_quotes(quote_record)
                        del self._tokenized_triple_quotes[lineno]

                else:
                    doc_row = self._find_docstring_line(node.fromlineno, node.tolineno)
                    quote_record = self._tokenized_triple_quotes.get(doc_row)
                    if quote_record:
                        self._check_docstring_quotes(quote_record)
                        del self._tokenized_triple_quotes[doc_row]

    def _find_docstring_line_for_no_body(self, start):
        """Find the docstring associated with a definition with no body
        in the node.

        In these cases, the provided start and end line number for that
        element are the same, so we must get the docstring based on the
        sequential position of known docstrings.

        Args:
            start: the row where the class / function starts.

        Returns:
            int: the row number where the docstring is found.
        """
        tracked = sorted(list(self._tokenized_triple_quotes.keys()))

        for i in tracked:
            if min(start, i) == start:
                return i
        return None

    def _find_docstring_line(self, start, end):
        """Find the row where a docstring starts in a function or class.

        This will search for the first match of a triple quote token in
        row sequence from the start of the class or function.

        Args:
            start: the row where the class / function starts.
            end: the row where the class / function ends.

        Returns:
            int: the row number where the docstring is found.
        """
        for i in range(start, end + 1):
            if i in self._tokenized_triple_quotes:
                return i
        return None

    def process_tokens(self, tokens):
        """Process the token stream.

        This is required to override the parent class' implementation.

        Args:
            tokens: the tokens from the token stream to process.
        """
        for tok_type, token, (start_row, start_col), _, _ in tokens:
            if tok_type == tokenize.STRING:
                # 'token' is the whole un-parsed token; we can look at the start
                # of it to see whether it's a raw or unicode string etc.
                self._process_string_token(token, start_row, start_col)

    def _process_string_token(self, token, start_row, start_col):
        """Internal method for identifying and checking string tokens
        from the token stream.

        Args:
            token: the token to check.
            start_row: the line on which the token was found.
            start_col: the column on which the token was found.
        """
        for i, char in enumerate(token):
            if char in QUOTES:
                break

        # pylint: disable=undefined-loop-variable
        # ignore prefix markers like u, b, r
        norm_quote = token[i:]

        # triple-quote strings
        if len(norm_quote) >= 3 and norm_quote[:3] in TRIPLE_QUOTE_OPTS.values():
            self._tokenized_triple_quotes[start_row] = (token, norm_quote[:3], start_row, start_col)
            return

        # single quote strings

        preferred_quote = SMART_QUOTE_OPTS.get(self.config.string_quote)

        # Smart case.
        if self.config.string_quote in SMART_CONFIG_OPTS:
            other_quote = next(q for q in QUOTES if q != preferred_quote)
            # If using the other quote avoids escaping, we switch to the other quote.
            if preferred_quote in token[i + 1:-1] and other_quote not in token[i + 1:-1]:
                preferred_quote = other_quote

        if norm_quote[0] != preferred_quote:
            self._invalid_string_quote(
                quote=norm_quote[0],
                row=start_row,
                correct_quote=preferred_quote,
                col=start_col,
            )

    def _check_triple_quotes(self, quote_record):
        """Check if the triple quote from tokenization is valid.

        Args:
            quote_record: a tuple containing the info about the string
                from tokenization, giving the (token, quote, row number, column).
        """
        _, triple, row, col = quote_record
        if triple != TRIPLE_QUOTE_OPTS.get(self.config.triple_quote):
            self._invalid_triple_quote(triple, row, col)

    def _check_docstring_quotes(self, quote_record):
        """Check if the docstring quote from tokenization is valid.

        Args:
            quote_record: a tuple containing the info about the string
                from tokenization, giving the (token, quote, row number).
        """
        _, triple, row, col = quote_record
        if triple != TRIPLE_QUOTE_OPTS.get(self.config.docstring_quote):
            self._invalid_docstring_quote(triple, row, col)

    def _invalid_string_quote(self, quote, row, correct_quote=None, col=None):
        """Add a message for an invalid string literal quote.

        Args:
            quote: The quote characters that were found.
            row: The row number the quote character was found on.
            correct_quote: The quote characters that is required. If None
                (default), will use the one from the config.
            col: The column the quote characters were found on.
        """
        if not correct_quote:
            correct_quote = SMART_QUOTE_OPTS.get(self.config.string_quote)

        self.add_message(
            'invalid-string-quote',
            line=row,
            args=(quote, correct_quote),
            **self.get_offset(col)
        )

    @staticmethod
    def get_offset(col):
        """Return kwargs to pass to add_message.

        col_offset is not present in all versions of pylint, so
        attempt to determine if col_offset is supported, if so
        return a dictionary returning col_offset otherwise return
        {}.

        Args:
            col: The integer column offset to possibly include in
                the kwargs.

        Returns:
            dict: Keyword arguments to pass to add_message
        """
        if ('2', '2', '2') < pylint_version:
            return {'col_offset': col}
        return {}

    def _invalid_triple_quote(self, quote, row, col=None):
        """Add a message for an invalid triple quote.

        Args:
            quote: The quote characters that were found.
            row: The row number the quote characters were found on.
            col: The column the quote characters were found on.
        """
        self.add_message(
            'invalid-triple-quote',
            line=row,
            args=(quote, TRIPLE_QUOTE_OPTS.get(self.config.triple_quote)),
            **self.get_offset(col)
        )

    def _invalid_docstring_quote(self, quote, row, col=None):
        """Add a message for an invalid docstring quote.

        Args:
            quote: The quote characters that were found.
            row: The row number the quote characters were found on.
            col: The column the quote characters were found on.
        """
        self.add_message(
            'invalid-docstring-quote',
            line=row,
            args=(quote, TRIPLE_QUOTE_OPTS.get(self.config.docstring_quote)),
            **self.get_offset(col)
        )
