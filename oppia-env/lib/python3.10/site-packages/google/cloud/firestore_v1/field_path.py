# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Utilities for managing / converting field paths to / from strings."""
from __future__ import annotations
import re
from collections import abc
from typing import Iterable, cast

_FIELD_PATH_MISSING_TOP = "{!r} is not contained in the data"
_FIELD_PATH_MISSING_KEY = "{!r} is not contained in the data for the key {!r}"
_FIELD_PATH_WRONG_TYPE = (
    "The data at {!r} is not a dictionary, so it cannot contain the key {!r}"
)

_FIELD_PATH_DELIMITER = "."
_BACKSLASH = "\\"
_ESCAPED_BACKSLASH = _BACKSLASH * 2
_BACKTICK = "`"
_ESCAPED_BACKTICK = _BACKSLASH + _BACKTICK

_SIMPLE_FIELD_NAME = re.compile("^[_a-zA-Z][_a-zA-Z0-9]*$")
_LEADING_ALPHA_INVALID = re.compile(r"^[_a-zA-Z][_a-zA-Z0-9]*[~*/\[\]]")
PATH_ELEMENT_TOKENS = [
    ("SIMPLE", r"[_a-zA-Z][_a-zA-Z0-9]*"),  # unquoted elements
    ("QUOTED", r"`(?:\\`|[^`])*?`"),  # quoted elements, unquoted
    ("DOT", r"\."),  # separator
]
TOKENS_PATTERN = "|".join("(?P<{}>{})".format(*pair) for pair in PATH_ELEMENT_TOKENS)
TOKENS_REGEX = re.compile(TOKENS_PATTERN)


def _tokenize_field_path(path: str):
    """Lex a field path into tokens (including dots).

    Args:
        path (str): field path to be lexed.
    Returns:
        List(str): tokens
    """
    pos = 0
    get_token = TOKENS_REGEX.match
    match = get_token(path)
    while match is not None:
        type_ = cast(str, match.lastgroup)
        value = match.group(type_)
        yield value
        pos = match.end()
        match = get_token(path, pos)
    if pos != len(path):
        raise ValueError("Path {} not consumed, residue: {}".format(path, path[pos:]))


def split_field_path(path: str | None):
    """Split a field path into valid elements (without dots).

    Args:
        path (str): field path to be lexed.
    Returns:
        List(str): tokens
    Raises:
        ValueError: if the path does not match the elements-interspersed-
                    with-dots pattern.
    """
    if not path:
        return []

    elements = []
    want_dot = False

    for element in _tokenize_field_path(path):
        if want_dot:
            if element != ".":
                raise ValueError("Invalid path: {}".format(path))
            else:
                want_dot = False
        else:
            if element == ".":
                raise ValueError("Invalid path: {}".format(path))
            elements.append(element)
            want_dot = True

    if not want_dot or not elements:
        raise ValueError("Invalid path: {}".format(path))

    return elements


def parse_field_path(api_repr: str):
    """Parse a **field path** from into a list of nested field names.

    See :func:`field_path` for more on **field paths**.

    Args:
        api_repr (str):
            The unique Firestore api representation which consists of
            either simple or UTF-8 field names. It cannot exceed
            1500 bytes, and cannot be empty. Simple field names match
            ``'^[_a-zA-Z][_a-zA-Z0-9]*$'``. All other field names are
            escaped by surrounding them with backticks.

    Returns:
        List[str, ...]: The list of field names in the field path.
    """
    # code dredged back up from
    # https://github.com/googleapis/google-cloud-python/pull/5109/files
    field_names = []
    for field_name in split_field_path(api_repr):
        # non-simple field name
        if field_name[0] == "`" and field_name[-1] == "`":
            field_name = field_name[1:-1]
            field_name = field_name.replace(_ESCAPED_BACKTICK, _BACKTICK)
            field_name = field_name.replace(_ESCAPED_BACKSLASH, _BACKSLASH)
        field_names.append(field_name)
    return field_names


def render_field_path(field_names: Iterable[str]):
    """Create a **field path** from a list of nested field names.

    A **field path** is a ``.``-delimited concatenation of the field
    names. It is used to represent a nested field. For example,
    in the data

    .. code-block:: python

       data = {
          'aa': {
              'bb': {
                  'cc': 10,
              },
          },
       }

    the field path ``'aa.bb.cc'`` represents that data stored in
    ``data['aa']['bb']['cc']``.

    Args:
        field_names: The list of field names.

    Returns:
        str: The ``.``-delimited field path.
    """
    result = []

    for field_name in field_names:
        match = _SIMPLE_FIELD_NAME.match(field_name)
        if match and match.group(0) == field_name:
            result.append(field_name)
        else:
            replaced = field_name.replace(_BACKSLASH, _ESCAPED_BACKSLASH).replace(
                _BACKTICK, _ESCAPED_BACKTICK
            )
            result.append(_BACKTICK + replaced + _BACKTICK)

    return _FIELD_PATH_DELIMITER.join(result)


get_field_path = render_field_path  # backward-compatibility


def get_nested_value(field_path: str, data: dict):
    """Get a (potentially nested) value from a dictionary.

    If the data is nested, for example:

    .. code-block:: python

       >>> data
       {
           'top1': {
               'middle2': {
                   'bottom3': 20,
                   'bottom4': 22,
               },
               'middle5': True,
           },
           'top6': b'\x00\x01 foo',
       }

    a **field path** can be used to access the nested data. For
    example:

    .. code-block:: python

       >>> get_nested_value('top1', data)
       {
           'middle2': {
               'bottom3': 20,
               'bottom4': 22,
           },
           'middle5': True,
       }
       >>> get_nested_value('top1.middle2', data)
       {
           'bottom3': 20,
           'bottom4': 22,
       }
       >>> get_nested_value('top1.middle2.bottom3', data)
       20

    See :meth:`~google.cloud.firestore_v1.client.Client.field_path` for
    more information on **field paths**.

    Args:
        field_path (str): A field path (``.``-delimited list of
            field names).
        data (Dict[str, Any]): The (possibly nested) data.

    Returns:
        Any: (A copy of) the value stored for the ``field_path``.

    Raises:
        KeyError: If the ``field_path`` does not match nested data.
    """
    field_names = parse_field_path(field_path)

    nested_data = data
    for index, field_name in enumerate(field_names):
        if isinstance(nested_data, abc.Mapping):
            if field_name in nested_data:
                nested_data = nested_data[field_name]
            else:
                if index == 0:
                    msg = _FIELD_PATH_MISSING_TOP.format(field_name)
                    raise KeyError(msg)
                else:
                    partial = render_field_path(field_names[:index])
                    msg = _FIELD_PATH_MISSING_KEY.format(field_name, partial)
                    raise KeyError(msg)
        else:
            partial = render_field_path(field_names[:index])
            msg = _FIELD_PATH_WRONG_TYPE.format(partial, field_name)
            raise KeyError(msg)

    return nested_data


class FieldPath(object):
    """Field Path object for client use.

    A field path is a sequence of element keys, separated by periods.
    Each element key can be either a simple identifier, or a full unicode
    string.

    In the string representation of a field path, non-identifier elements
    must be quoted using backticks, with internal backticks and backslashes
    escaped with a backslash.

    Args:
        parts: (one or more strings)
            Indicating path of the key to be used.
    """

    def __init__(self, *parts):
        for part in parts:
            if not isinstance(part, str) or not part:
                error = "One or more components is not a string or is empty."
                raise ValueError(error)
        self.parts = tuple(parts)

    @classmethod
    def from_api_repr(cls, api_repr: str):
        """Factory: create a FieldPath from the string formatted per the API.

        Args:
            api_repr (str): a string path, with non-identifier elements quoted
            It cannot exceed 1500 characters, and cannot be empty.
        Returns:
            (:class:`FieldPath`) An instance parsed from ``api_repr``.
        Raises:
            ValueError if the parsing fails
        """
        api_repr = api_repr.strip()
        if not api_repr:
            raise ValueError("Field path API representation cannot be empty.")
        return cls(*parse_field_path(api_repr))

    @classmethod
    def from_string(cls, path_string: str):
        """Factory: create a FieldPath from a unicode string representation.

        This method splits on the character `.` and disallows the
        characters `~*/[]`. To create a FieldPath whose components have
        those characters, call the constructor.

        Args:
            path_string (str): A unicode string which cannot contain
            `~*/[]` characters, cannot exceed 1500 bytes, and cannot be empty.

        Returns:
            (:class:`FieldPath`) An instance parsed from ``path_string``.
        """
        try:
            return cls.from_api_repr(path_string)
        except ValueError:
            elements = path_string.split(".")
            for element in elements:
                if not element:
                    raise ValueError("Empty element")
                if _LEADING_ALPHA_INVALID.match(element):
                    raise ValueError(
                        "Invalid char in element with leading alpha: {}".format(element)
                    )
            return FieldPath(*elements)

    def __repr__(self):
        paths = ""
        for part in self.parts:
            paths += "'" + part + "',"
        paths = paths[:-1]
        return "FieldPath({})".format(paths)

    def __hash__(self):
        return hash(self.to_api_repr())

    def __eq__(self, other):
        if isinstance(other, FieldPath):
            return self.parts == other.parts
        return NotImplemented

    def __lt__(self, other):
        if isinstance(other, FieldPath):
            return self.parts < other.parts
        return NotImplemented

    def __add__(self, other):
        """Adds `other` field path to end of this field path.

        Args:
            other (~google.cloud.firestore_v1._helpers.FieldPath, str):
                The field path to add to the end of this `FieldPath`.
        """
        if isinstance(other, FieldPath):
            parts = self.parts + other.parts
            return FieldPath(*parts)
        elif isinstance(other, str):
            parts = self.parts + FieldPath.from_string(other).parts
            return FieldPath(*parts)
        else:
            return NotImplemented

    def to_api_repr(self):
        """Render a quoted string representation of the FieldPath

        Returns:
            (str) Quoted string representation of the path stored
            within this FieldPath.
        """
        return render_field_path(self.parts)

    def eq_or_parent(self, other):
        """Check whether ``other`` is an ancestor.

        Returns:
            (bool) True IFF ``other`` is an ancestor or equal to ``self``,
            else False.
        """
        return self.parts[: len(other.parts)] == other.parts[: len(self.parts)]

    def lineage(self):
        """Return field paths for all parents.

        Returns: Set[:class:`FieldPath`]
        """
        indexes = range(1, len(self.parts))
        return {FieldPath(*self.parts[:index]) for index in indexes}

    @staticmethod
    def document_id():
        """A special FieldPath value to refer to the ID of a document. It can be used
           in queries to sort or filter by the document ID.

        Returns: A special sentinel value to refer to the ID of a document.
        """
        return "__name__"
