# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

from core.domain import html_cleaner
import feconf
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
    def get_editor_js_template(cls):
        return utils.get_file_contents(os.path.join(
            os.getcwd(), feconf.OBJECT_TEMPLATES_DIR,
            '%s.js' % cls.edit_js_filename))

    @classmethod
    def get_editor_html_template(cls):
        return utils.get_file_contents(os.path.join(
            os.getcwd(), feconf.OBJECT_TEMPLATES_DIR,
            '%s.html' % cls.edit_html_filename))


class Number(BaseObject):
    """Generic number class."""

    description = 'A number.'
    edit_html_filename = None

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        try:
            result = float(raw)
            assert isinstance(result, numbers.Number)
            return result
        except Exception:
            raise TypeError('Cannot convert to number: %s' % raw)


class Real(Number):
    """Real number class."""

    description = 'A real number.'
    edit_html_filename = 'real_editor'
    edit_js_filename = 'RealEditor'

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        try:
            result = float(raw)
            assert isinstance(result, numbers.Real)
            return result
        except Exception:
            raise TypeError('Cannot convert to real number: %s' % raw)


class Int(Real):
    """Integer class."""

    description = 'An integer.'
    edit_html_filename = 'int_editor'
    edit_js_filename = 'IntEditor'

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        try:
            result = int(super(Int, cls).normalize(raw))
            assert isinstance(result, numbers.Integral)
            return result
        except Exception:
            raise TypeError('Cannot convert to int: %s' % raw)


class NonnegativeInt(Int):
    """Nonnegative integer class."""

    description = 'A non-negative integer.'

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        try:
            result = super(NonnegativeInt, cls).normalize(raw)
            assert result >= 0
            return result
        except Exception:
            raise TypeError('Cannot convert to nonnegative int: %s' % raw)


class CodeEvaluation(BaseObject):
    """Evaluation result of programming code."""

    description = 'Code and its evaluation results.'
    edit_html_filename = None

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        try:
            assert isinstance(raw, dict)
            assert 'code' in raw and isinstance(raw['code'], basestring)
            assert 'output' in raw and isinstance(raw['output'], basestring)
            assert ('evaluation' in raw
                    and isinstance(raw['evaluation'], basestring))
            assert 'error' in raw and isinstance(raw['error'], basestring)
            return raw
        except Exception:
            raise TypeError('Cannot convert to code evaluation: %s' % raw)


class CoordTwoDim(BaseObject):
    """2D coordinate class."""

    description = 'A two-dimensional coordinate (a pair of reals).'
    edit_html_filename = 'coord_two_dim_editor'
    edit_js_filename = 'CoordTwoDimEditor'

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        try:
            if isinstance(raw, list):
                assert len(raw) == 2
                r0, r1 = raw
            else:
                if '(' in raw:
                    reals = raw.lstrip('(').rstrip(')').split(',')
                else:
                    reals = raw.lstrip('[').rstrip(']').split(',')
                r0 = float(reals[0])
                r1 = float(reals[1])

            assert isinstance(r0, numbers.Real)
            assert isinstance(r1, numbers.Real)
            return [r0, r1]
        except Exception:
            raise TypeError('Cannot convert to 2D coordinate: %s' % raw)


class List(BaseObject):
    """List class."""

    description = 'A list.'
    edit_html_filename = 'list_editor'
    edit_js_filename = 'ListEditor'

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        try:
            assert isinstance(raw, list)
            return raw
        except Exception:
            raise TypeError('Cannot convert to list: %s' % raw)


class Set(List):
    """Set class."""

    description = 'A set (a list with unique elements).'
    edit_html_filename = None

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        try:
            assert isinstance(raw, (list, set, tuple))
            return list(set(raw))
        except Exception:
            raise TypeError('Cannot convert to set: %s' % raw)


class UnicodeString(BaseObject):
    """Unicode string class."""

    description = 'A unicode string.'
    edit_html_filename = 'unicode_string_editor'
    edit_js_filename = 'UnicodeStringEditor'

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        try:
            assert raw is not None
            assert isinstance(raw, basestring) or isinstance(raw, numbers.Real)
            return unicode(raw)
        except Exception:
            raise TypeError('Cannot convert to Unicode: %s' % raw)


class NormalizedString(UnicodeString):
    """Unicode string with spaces collapsed."""

    description = 'A unicode string with adjacent whitespace collapsed.'

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        try:
            result = super(NormalizedString, cls).normalize(raw)
            return ' '.join(result.split())
        except Exception:
            raise TypeError('Cannot convert to NormalizedString: %s' % raw)


class Html(UnicodeString):
    """HTML string class."""

    description = 'An HTML string.'
    edit_html_filename = 'html_editor'
    edit_js_filename = 'HtmlEditor'

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        try:
            assert isinstance(raw, basestring)
            return html_cleaner.clean(unicode(raw))
        except Exception as e:
            raise TypeError('Cannot convert to HTML string: %s. Error: %s' %
                            (raw, e))


class SanitizedUrl(UnicodeString):
    """HTTP or HTTPS url string class."""

    description = 'An HTTP or HTTPS url.'
    edit_js_filename = 'SanitizedUrlEditor'

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        try:
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
        except Exception as e:
            raise TypeError('Cannot convert to sanitized URL: %s. Error: %s' %
                            (raw, e))


class MusicNote(UnicodeString):
    """String that represents a music note between C4 and F5."""
    # TODO(sll): Make this more general -- i.e. an Enum.

    description = 'A music note between C4 and F5.'

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        try:
            result = super(MusicNote, cls).normalize(raw)
            assert result in [
                'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5'
            ]
            return result
        except Exception:
            raise TypeError('Cannot convert to MusicNote: %s' % raw)


class TarFileString(UnicodeString):
    """A unicode string with the base64-encoded content of a tar file"""

    description = 'A string with base64-encoded content of a tar file'

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        try:
            assert raw is not None
            assert isinstance(raw, basestring)
            raw = base64.b64decode(raw)
            tfile = tarfile.open(fileobj=StringIO(raw), mode='r:gz')
            return tfile
        except Exception:
            raise TypeError('Not a valid tar file.')


class Filepath(UnicodeString):
    """A string representing a filepath."""

    description = 'A string that represents a filepath'
    edit_html_filename = 'filepath_editor'
    edit_js_filename = 'FilepathEditor'

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        # The path will be prefixed with "[exploration_id]/assets".
        raw = super(Filepath, cls).normalize(raw)
