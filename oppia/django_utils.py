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

"""Utility functions and classes for django models."""

__author__ = 'Tarashish Mishra'

from django.db import models
from django.utils import simplejson
from django.core.serializers.json import DjangoJSONEncoder
from django.utils.translation import ugettext as _
from django.core.exceptions import ValidationError
from django.forms import fields, util

import ast
import re
import datetime
from decimal import Decimal
from dateutil import parser as date_parser


JSON_DECODE_ERROR = ValueError

TIME_RE = re.compile(r'^\d{2}:\d{2}:\d{2}')
DATE_RE = re.compile(r'^\d{4}-\d{2}-\d{2}(?!T)')
DATETIME_RE = re.compile(r'^\d{4}-\d{2}-\d{2}T')


class JSONFormField(fields.Field):

    def __init__(self, *args, **kwargs):
        self.evaluate = kwargs.pop('evaluate', False)
        self.encoder_kwargs = kwargs.pop('encoder_kwargs', {})
        self.decoder_kwargs = kwargs.pop('decoder_kwargs', {})
        super(JSONFormField, self).__init__(*args, **kwargs)

    def clean(self, value):
        # Have to jump through a few hoops to make this reliable
        value = super(JSONFormField, self).clean(value)

        # allow an empty value on an optional field
        if value is None:
            return value

        ## Got to get rid of newlines for validation to work
        # Data newlines are escaped so this is safe
        value = value.replace('\r', '').replace('\n', '')

        if self.evaluate:
            json_globals = {  # "safety" first!
                '__builtins__': None,
                'datetime': datetime,
            }
            json_locals = {  # value compatibility
                'null': None,
                'true': True,
                'false': False,
            }
            try:
                value = simplejson.dumps(eval(value, json_globals, json_locals), **self.encoder_kwargs)
            except Exception, e:  # eval can throw many different errors
                raise util.ValidationError('%s (Caught "%s")' % (self.help_text, e))

        try:
            simplejson.loads(value, **self.decoder_kwargs)
        except ValueError, e:
            raise util.ValidationError('%s (Caught "%s")' % (self.help_text, e))

        return value


class Converter():
    """A class containing different encoder/decoder functions."""

    @classmethod
    def encode(cls, obj):
        """A custom encoder to encode both built-in and custom objects into
        JSON-serializable python objects recursively.

        Custom objects are encoded as dict with one key, '__TypeName__' where
        'TypeName' is the actual name of the class to which the object belongs.
        That single key maps to another dict which is just the encoded __dict__
        of the object being encoded."""

        if isinstance(
            obj, (int, long, float, complex, bool, basestring, type(None), Decimal)
        ):
            return obj
        elif isinstance(obj, list):
            return [cls.encode(item) for item in obj]
        elif isinstance(obj, (set, tuple, complex)):
            raise NotImplementedError
        elif isinstance(obj, dict):
            result = {}
            for key in obj:
                # Every Model instance in django has a ModelState object,
                # which we don't want to be serialized. Hence, we get rid
                # of it.
                if key != '__ModelState__':
                    result[key] = cls.encode(obj[key])
            return result
        else:
            obj_dict = cls.encode(obj.__dict__)
            return {'__%s__' % (obj.__class__.__name__): obj_dict}

    @classmethod
    def decode(cls, obj_class, value):
        object_list = []
        arg_list = obj_class.attr_list()
        for instance in value:
            arg_dict = {}
            for arg in arg_list:
                arg_dict[arg] = instance['__%s__' % (
                    obj_class.__name__)].get(arg)
            obj = obj_class(**arg_dict)
            object_list.append(obj)
        return object_list


class JSONDecoder(simplejson.JSONDecoder):
    """ Recursive JSON to Python deserialization. """

    _recursable_types = [str, unicode, list, dict]

    def _is_recursive(self, obj):
        return type(obj) in JSONDecoder._recursable_types

    def decode(self, obj, *args, **kwargs):
        if not kwargs.get('recurse', False):
            obj = super(JSONDecoder, self).decode(obj, *args, **kwargs)
        if isinstance(obj, list):
            for i in xrange(len(obj)):
                item = obj[i]
                if self._is_recursive(item):
                    obj[i] = self.decode(item, recurse=True)
        elif isinstance(obj, dict):
            for key, value in obj.items():
                if self._is_recursive(value):
                    obj[key] = self.decode(value, recurse=True)
        elif isinstance(obj, basestring):
            if TIME_RE.match(obj):
                try:
                    return date_parser.parse(obj).time()
                except ValueError:
                    pass
            if DATE_RE.match(obj):
                try:
                    return date_parser.parse(obj).date()
                except ValueError:
                    pass
            if DATETIME_RE.match(obj):
                try:
                    return date_parser.parse(obj)
                except ValueError:
                    pass
        return obj


class Creator(object):
    """
    Taken from django.db.models.fields.subclassing.
    """

    _parent_key = '_json_field_cache'

    def __init__(self, field):
        self.field = field

    def __get__(self, obj, type=None):
        if obj is None:
            raise AttributeError('Can only be accessed via an instance.')

        cache = getattr(obj, self._parent_key, None)
        if cache is None:
            cache = {}
            setattr(obj, self._parent_key, cache)

        key = '%s_deserialized' % self.field.name

        if cache.get(key, False):
            return obj.__dict__[self.field.name]

        value = self.field.to_python(obj.__dict__[self.field.name])
        obj.__dict__[self.field.name] = value
        cache[key] = True

        return value

    def __set__(self, obj, value):
        obj.__dict__[self.field.name] = value  # deserialized when accessed


class JSONField(models.TextField):
    """ Stores and loads valid JSON objects. """

    description = 'JSON object'

    def __init__(self, *args, **kwargs):
        self.default_error_messages = {
            'invalid': _(u'Enter a valid JSON object')
        }
        self._db_type = kwargs.pop('db_type', None)
        self.evaluate_formfield = kwargs.pop('evaluate_formfield', False)

        self.schema = kwargs.pop('schema', {})
        self.primitivelist = kwargs.pop('primitivelist', False)
        self.isdict = kwargs.pop('isdict', False)
        encoder = kwargs.pop('encoder', DjangoJSONEncoder)
        decoder = kwargs.pop('decoder', JSONDecoder)
        encoder_kwargs = kwargs.pop('encoder_kwargs', {})
        decoder_kwargs = kwargs.pop('decoder_kwargs', {})
        if not encoder_kwargs and encoder:
            encoder_kwargs.update({'cls': encoder})
        if not decoder_kwargs and decoder:
            decoder_kwargs.update({'cls': decoder, 'parse_float': Decimal})
        self.encoder_kwargs = encoder_kwargs
        self.decoder_kwargs = decoder_kwargs

        kwargs['default'] = kwargs.get('default', 'null')
        kwargs['help_text'] = kwargs.get('help_text', self.default_error_messages['invalid'])

        super(JSONField, self).__init__(*args, **kwargs)

    def db_type(self, *args, **kwargs):
        if self._db_type:
            return self._db_type
        return super(JSONField, self).db_type(*args, **kwargs)

    def to_python(self, value):
        if value is None:  # allow blank objects
            return None
        elif isinstance(value, basestring):
            try:
                value = simplejson.loads(value, **self.decoder_kwargs)
                if not self.primitivelist:
                    schema = self.schema
                    if isinstance(schema, list) and isinstance(schema[0], object):
                        obj_class = schema[0]
                        value = Converter.decode(obj_class, value)
            except JSON_DECODE_ERROR:
                pass
            return value
        elif isinstance(value, list):
            try:
                if not self.primitivelist:
                    schema = self.schema
                    if isinstance(schema, list) and isinstance(schema[0], object):
                        obj_class = schema[0]
                        value = Converter.decode(obj_class, value)
            except TypeError:
                return value
        return value

    def get_db_prep_value(self, value, *args, **kwargs):
        if self.null and value is None and not kwargs.get('force'):
            return None
        elif isinstance(value, dict) and self.isdict:
            return simplejson.dumps(value, **self.encoder_kwargs)
        elif isinstance(value, (list, dict)) and not self.primitivelist:
            schema = self.schema
            assert type(schema) == type(value)
            if isinstance(value, list):
                for val in value:
                    assert isinstance(val, schema[0])
            elif isinstance(value, dict):
                for key, val in value.items():
                    assert key in schema.keys()
                    assert isinstance(val, schema[key])
            return_value = Converter.encode(value)
            return simplejson.dumps(return_value, **self.encoder_kwargs)
        if self.schema:
            try:
                assert type(self.schema) == type(value)
            except AssertionError:
                raise ValidationError(
                    "Value %s doesn't match schema %s"
                    % (repr(value), repr(self.schema))
                )
        return simplejson.dumps(value, **self.encoder_kwargs)

    def value_to_string(self, obj):
        return self.get_db_prep_value(self._get_val_from_obj(obj))

    def value_from_object(self, obj):
        return simplejson.dumps(super(JSONField, self).value_from_object(obj), **self.encoder_kwargs)

    def formfield(self, **kwargs):
        defaults = {
            'form_class': kwargs.get('form_class', JSONFormField),
            'evaluate': self.evaluate_formfield,
            'encoder_kwargs': self.encoder_kwargs,
            'decoder_kwargs': self.decoder_kwargs,
        }
        defaults.update(kwargs)
        return super(JSONField, self).formfield(**defaults)

    def contribute_to_class(self, cls, name):
        super(JSONField, self).contribute_to_class(cls, name)

        def get_json(model_instance):
            return self.get_db_prep_value(getattr(model_instance, self.attname, None), force=True)
        setattr(cls, 'get_%s_json' % self.name, get_json)

        def set_json(model_instance, value):
            return setattr(model_instance, self.attname, self.to_python(value))
        setattr(cls, 'set_%s_json' % self.name, set_json)

        setattr(cls, name, Creator(self))  # deferred deserialization


class ListField(models.CharField):
    __metaclass__ = models.SubfieldBase
    description = "Stores a python list"

    def __init__(self, *args, **kwargs):
        super(ListField, self).__init__(max_length=2000, *args, **kwargs)

    def to_python(self, value):
        if not value:
            value = []

        if isinstance(value, list):
            return value

        return ast.literal_eval(value)

    def get_prep_value(self, value):
        if value is None:
            return value

        return unicode(value)

    def value_to_string(self, obj):
        value = self._get_val_from_obj(obj)
        return self.get_db_prep_value(value)
