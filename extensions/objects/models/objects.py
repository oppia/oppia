# coding: utf-8
#
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

"""Classes for interpreting typed objects in Oppia."""

__author__ = 'Sean Lip'

import base64
import logging
import numbers
import os
from StringIO import StringIO
import tarfile
import urllib
import urlparse
import copy

from core.domain import html_cleaner
import feconf
import schema_utils
import utils


class BaseObject(object):
    """Base object class.

    This is the superclass for typed object specifications in Oppia, such as
    SanitizedUrl and CoordTwoDim.

    Typed objects are initialized from a raw Python object which is expected to
    be derived from a JSON object. They are validated and normalized to basic
    Python objects (primitive types combined via lists and dicts; no sets or
    tuples).
    """

    # These values should be overridden in subclasses.
    description = ''
    edit_html_filename = None
    edit_js_filename = None

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object.

        Returns:
          a normalized Python object describing the Object specified by this
          class.

        Raises:
          TypeError: if the Python object cannot be normalized.
        """
        raise NotImplementedError('Not implemented.')

    @classmethod
    def has_editor_js_template(cls):
        return cls.edit_js_filename is not None

    @classmethod
    def get_editor_js_template(cls):
        if cls.edit_js_filename is None:
            raise Exception(
                'There is no editor template defined for objects of type %s' %
                cls.__name__)
        return utils.get_file_contents(os.path.join(
            os.getcwd(), feconf.OBJECT_TEMPLATES_DIR,
            '%s.js' % cls.edit_js_filename))

    @classmethod
    def get_editor_html_template(cls):
        if cls.edit_html_filename is None:
            raise Exception(
                'There is no editor template defined for objects of type %s' %
                cls.__name__)
        return utils.get_file_contents(os.path.join(
            os.getcwd(), feconf.OBJECT_TEMPLATES_DIR,
            '%s.html' % cls.edit_html_filename))


class Null(BaseObject):
    """Class for a null object."""

    description = 'A null object.'

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        return None


class Boolean(BaseObject):
    """Class for booleans."""

    description = 'A boolean.'
    edit_html_filename = 'boolean_editor'
    edit_js_filename = 'BooleanEditor'

    _schema = {
        'type': 'bool'
    }

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        if raw is None or raw == '':
            raw = False

        return schema_utils.normalize_against_schema(raw, cls._schema)


class Real(BaseObject):
    """Real number class."""

    description = 'A real number.'
    edit_html_filename = 'real_editor'
    edit_js_filename = 'RealEditor'

    _schema = {
        'type': 'float'
    }

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        return schema_utils.normalize_against_schema(raw, cls._schema)


class Int(BaseObject):
    """Integer class."""

    description = 'An integer.'
    edit_html_filename = 'int_editor'
    edit_js_filename = 'IntEditor'

    _schema = {
        'type': 'int'
    }

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        return schema_utils.normalize_against_schema(raw, cls._schema)


class NonnegativeInt(BaseObject):
    """Nonnegative integer class."""

    description = 'A non-negative integer.'
    edit_html_filename = 'nonnegative_int_editor'
    edit_js_filename = 'NonnegativeIntEditor'

    _schema = {
        'type': 'int'
    }

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        result = schema_utils.normalize_against_schema(raw, cls._schema)
        assert result >= 0
        return result


class CodeEvaluation(BaseObject):
    """Evaluation result of programming code."""

    description = 'Code and its evaluation results.'

    _schema = {
        'type': 'dict',
        'properties': {
            'code': {
                'type': 'unicode'
            },
            'output': {
                'type': 'unicode'
            },
            'evaluation': {
                'type': 'unicode'
            },
            'error': {
                'type': 'unicode'
            }
        }
    }

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        return schema_utils.normalize_against_schema(raw, cls._schema)


class CoordTwoDim(BaseObject):
    """2D coordinate class."""

    description = 'A two-dimensional coordinate (a pair of reals).'
    edit_html_filename = 'coord_two_dim_editor'
    edit_js_filename = 'CoordTwoDimEditor'

    _schema = {
        'type': 'list',
        'length': 2,
        'items': {
            'type': 'float'
        }
    }

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        return schema_utils.normalize_against_schema(raw, cls._schema)


class List(BaseObject):
    """List class."""

    description = 'A list.'
    edit_html_filename = 'list_editor'
    edit_js_filename = 'ListEditor'

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        assert isinstance(raw, list)
        return raw


class SetOfUnicodeString(List):
    """Class for sets of UnicodeStrings."""

    description = 'A set (a list with unique elements) of unicode strings.'
    edit_html_filename = 'list_editor'
    edit_js_filename = 'SetOfUnicodeStringEditor'

    _schema = {
        'type': 'list',
        'items': {
            'type': 'unicode'
        }
    }

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        raw = schema_utils.normalize_against_schema(raw, cls._schema)
        return sorted(list(set([unicode(item) for item in raw])))


class UnicodeString(BaseObject):
    """Unicode string class."""

    description = 'A unicode string.'
    edit_html_filename = 'unicode_string_editor'
    edit_js_filename = 'UnicodeStringEditor'

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        assert raw is not None
        assert isinstance(raw, basestring) or isinstance(raw, numbers.Real)
        return unicode(raw)


class NormalizedString(UnicodeString):
    """Unicode string with spaces collapsed."""

    description = 'A unicode string with adjacent whitespace collapsed.'
    edit_html_filename = 'unicode_string_editor'
    edit_js_filename = 'NormalizedStringEditor'

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        result = super(NormalizedString, cls).normalize(raw)
        return ' '.join(result.split())


class Html(BaseObject):
    """HTML string class."""

    description = 'An HTML string.'
    edit_html_filename = 'html_editor'
    edit_js_filename = 'HtmlEditor'

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        assert isinstance(raw, basestring)
        return html_cleaner.clean(unicode(raw))


class TabContent(BaseObject):
    """Class for editing the content of a single tab.

    The object is described by a dict with two keys: 'title' and 'content'.
    These have types UnicodeString and Html respectively.
    """

    description = 'Content for a single tab.'
    edit_html_filename = 'tab_content_editor'
    edit_js_filename = 'TabContentEditor'

    _schema = {
        'type': 'dict',
        'properties': {
            'title': {
                'type': 'unicode'
            },
            'content': {
                'type': 'unicode'
            }
        }
    }

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        raw = schema_utils.normalize_against_schema(raw, cls._schema)
        raw['title'] = UnicodeString.normalize(raw['title'])
        raw['content'] = Html.normalize(raw['content'])
        assert len(raw['title'])
        return raw


class ListOfTabContent(BaseObject):
    """Class for editing the content of a tabbed view.

    The object is described by a list of dicts, each representing a TabContent
    object.
    """

    description = 'Content for a set of tabs.'
    edit_html_filename = 'list_editor'
    edit_js_filename = 'ListOfTabContentEditor'

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        assert isinstance(raw, list)
        return [TabContent.normalize(item) for item in raw]


class SanitizedUrl(BaseObject):
    """HTTP or HTTPS url string class."""

    description = 'An HTTP or HTTPS url.'
    edit_html_filename = 'unicode_string_editor'
    edit_js_filename = 'SanitizedUrlEditor'

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        assert isinstance(raw, basestring)
        raw = unicode(raw)
        if raw:
            url_components = urlparse.urlsplit(raw)
            quoted_url_components = (
                urllib.quote(component) for component in url_components)
            raw = urlparse.urlunsplit(quoted_url_components)

            acceptable = html_cleaner.filter_a('href', raw)
            if not acceptable:
                logging.error(
                    'Invalid URL: Sanitized URL should start with '
                    '\'http://\' or \'https://\'; received %s' % raw)
                return u''

        return raw


class MusicPhrase(BaseObject):
    """List of Objects that represent a musical phrase."""

    description = ('A musical phrase that contains zero or more notes, rests, '
                   'and time signature.')
    edit_html_filename = 'music_phrase_editor'
    edit_js_filename = 'MusicPhraseEditor'

    @classmethod
    def normalize(cls, raw):
        valid_notes = [
            'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5',
            'E5', 'F5', 'G5', 'A5'
        ]
        valid_properties = [
            'readableNoteName', 'readableRestName', 'noteDuration',
            'restDuration', 'noteStart', 'restStart'
        ]
        assert isinstance(raw, list)
        for item in raw:
            if type(item) == dict:
                for prop in item:
                    prop = str(prop)
                    assert prop in valid_properties
                    if prop in ['readableNoteName', 'readableRestName']:
                        assert str(item.get(prop)) in valid_notes
                    elif prop in ['noteDuration', 'restDuration']:
                        for d in item[prop]:
                            assert int(item[prop][d]) > 0
                    elif prop == 'noteStart' or prop == 'restStart':
                        for s in prop:
                            assert int(item[prop][s]) > 0
        return raw


class TarFileString(BaseObject):
    """A unicode string with the base64-encoded content of a tar file"""

    description = 'A string with base64-encoded content of a tar file'

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        assert raw is not None
        assert isinstance(raw, basestring)
        raw = base64.b64decode(raw)
        tfile = tarfile.open(fileobj=StringIO(raw), mode='r:gz')
        return tfile


class Filepath(UnicodeString):
    """A string representing a filepath."""

    description = 'A string that represents a filepath'
    edit_html_filename = 'filepath_editor'
    edit_js_filename = 'FilepathEditor'

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        assert raw is not None
        assert isinstance(raw, basestring)

        # The path will be prefixed with "[exploration_id]/assets".
        raw = super(Filepath, cls).normalize(raw)


class CheckedProof(BaseObject):
    """A proof attempt and any errors it makes."""

    description = 'A proof attempt and any errors it makes.'

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        try:
            assert isinstance(raw, dict)
            assert isinstance(raw['assumptions_string'], basestring)
            assert isinstance(raw['target_string'], basestring)
            assert isinstance(raw['proof_string'], basestring)
            assert raw['correct'] in [True, False]
            if not raw['correct']:
                assert isinstance(raw['error_category'], basestring)
                assert isinstance(raw['error_code'], basestring)
                assert isinstance(raw['error_message'], basestring)
                assert isinstance(raw['error_line_number'], int)
            return copy.deepcopy(raw)
        except Exception:
            raise TypeError('Cannot convert to checked proof %s' % raw)


class LogicQuestion(BaseObject):
    """A question giving a formula to prove"""

    description = 'A question giving a formula to prove.'
    edit_html_filename = 'logic_question_editor'
    edit_js_filename = 'LogicQuestionEditor'

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""

        def _validateExpression(expression):
            assert isinstance(expression, dict)
            assert isinstance(expression['top_kind_name'], basestring)
            assert isinstance(expression['top_operator_name'], basestring)
            _validateExpressionArray(expression['arguments'])
            _validateExpressionArray(expression['dummies'])

        def _validateExpressionArray(array):
            assert isinstance(array, list)
            for item in array:
                _validateExpression(item)

        try:
            assert isinstance(raw, dict)
            _validateExpressionArray(raw['assumptions'])
            _validateExpressionArray(raw['results'])
            assert isinstance (raw['default_proof_string'], basestring)

            return copy.deepcopy(raw)
        except Exception:
            raise TypeError('Cannot convert to a logic question %s' % raw)


class LogicErrorCategory(BaseObject):
    """A string from a list of possible categories"""

    description = 'One of the possible error categories of a logic proof.'
    edit_html_filename = 'logic_error_category_editor'
    edit_js_filename = 'LogicErrorCategoryEditor'

    @classmethod
    def normalize(cls, raw):
        try:
            assert raw in ['parsing', 'typing', 'line', 'layout', 'variables',
                        'logic', 'target', 'mistake']
        except Exception:
            raise TypeError('Cannot convert to an error category.')
        return raw
