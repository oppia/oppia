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
import numbers
from StringIO import StringIO
import tarfile

import feconf
import jinja_utils
from lxml.html.clean import clean_html


class BaseObject(object):
    """Base object class.

    This is the superclass for typed object specifications in Oppia, such as
    Video, Image and Coord2D.

    Typed objects are initialized from a raw Python object which is expected to
    be derived from a JSON object. They are validated and normalized to basic
    Python objects (primitive types combined via lists and dicts; no sets or
    tuples).

    The object can be rendered in view mode and in edit mode. This is done using
    the render_view() and render_edit() methods, respectively. These methods can
    be overridden in subclasses.
    """

    # These values should be overridden in subclasses.
    description = ''
    icon_filename = ''
    view_html_filename = None
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
    def render_view(cls, data):
        """Renders a view-only version of the Object, suitable for editors of it.

        The default implementation uses takes the Jinja template supplied in the
        class and renders against it. This template has autoescape=True turned
        on, so strings that are passed in will be escaped. The default
        implementation can be overwritten by subclasses -- but they are then
        responsible for ensuring that autoescaping takes place.

        Args:
          data: the normalized Python representation of the Object.
        """
        assert cls.view_html_filename, 'No view template specified.'
        return jinja_utils.get_jinja_env(
            feconf.OBJECT_TEMPLATES_DIR).get_template(
                '%s.html' % cls.view_html_filename).render({'data': data})

    @classmethod
    def render_edit(cls, frontend_name, data=None):
        """Renders an editable version of the Object.

        The default implementation assumes that there is an AngularJS variable
        named frontend_name with the same internal format as the normalized
        Python representation. In the implementation, a new variable named
        temp_[frontend_name] will be created.

        WARNING: IT IS THE CLIENT'S RESPONSIBILITY TO ENSURE THAT THERE IS NO
        VARIABLE CALLED temp_[frontend_name] IN THE FRONTEND. Usually, such a
        variable will not exist, by virtue of the standard JavaScript naming
        conventions.

        The default implementation is rendered using a template that enables
        autoescaping. If it is overwritten by a subclass, the subclass is
        responsible for ensuring that autoescaping takes place.

        Args:
          frontend_name: the name used for the data variable in the frontend.
          data: the normalized Python representation of the existing object.
              If it is None, an empty object is used.
        """
        # TODO(sll): Implement this (generically).
        raise NotImplementedError('Not implemented yet.')


class Number(BaseObject):
    """Generic number class."""

    description = 'A number.'
    icon_filename = ''
    view_html_filename = 'number_view'
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
    icon_filename = ''

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
    icon_filename = ''

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
    icon_filename = ''

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
    icon_filename = ''
    view_html_filename = 'code_evaluation_view'
    edit_html_filename = None

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        try:
            assert isinstance(raw, dict)
            assert 'code' in raw
            assert 'output' in raw
            assert 'evaluation' in raw
            assert 'error' in raw
            return raw
        except Exception:
            raise TypeError('Cannot convert to code evaluation: %s' % raw)


class Coord2D(BaseObject):
    """2D coordinate class."""

    description = 'A two-dimensional coordinate (a pair of reals).'
    icon_filename = ''
    view_html_filename = 'coord_2d_view'
    edit_html_filename = None

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
    icon_filename = ''
    view_html_filename = 'list_view'
    edit_html_filename = None

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
    icon_filename = ''
    view_html_filename = 'set_view'
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
    icon_filename = ''
    view_html_filename = 'unicode_view'
    edit_html_filename = None

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
    icon_filename = ''

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
    icon_filename = ''
    view_html_filename = 'html_view'
    edit_html_filename = None

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        # TODO(sll): write tests for this.
        try:
            assert isinstance(raw, basestring)
            return clean_html(unicode(raw))
        except Exception as e:
            raise TypeError('Cannot convert to HTML string: %s. Error: %s' %
                            (raw, e))


class MusicNote(UnicodeString):
    """String that represents a music note between C4 and F5."""
    # TODO(sll): Make this more general -- i.e. an Enum.

    description = 'A music note between C4 and F5.'
    icon_filename = ''

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


class Video(UnicodeString):
    """String that represents a Youtube video id."""

    description = 'A string representing a video id.'
    icon_filename = ''
    view_html_filename = 'video_view'
    edit_html_filename = None


class Image(UnicodeString):
    """String that represents an image key in the datastore."""

    description = 'A string representing an image key.'
    icon_filename = ''
    view_html_filename = 'image_view'
    edit_html_filename = None


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
