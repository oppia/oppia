# Copyright (c) Microsoft. All rights reserved.
# See https://aka.ms/csspeech/license for the full license information.

import ctypes

from .interop import _Handle, _c_str, _call_hr_fn, _call_string_function_and_free, _spx_handle, _sdk_lib
from .enums import PropertyId


class PropertyCollection:
    """
    Class to retrieve or set a property value from a property collection.
    """

    def __init__(self, handle: _spx_handle):
        self.__handle = _Handle(handle, _sdk_lib.property_bag_is_valid, _sdk_lib.property_bag_release)

    @property
    def _handle(self) -> _spx_handle:
        return self.__handle.get()

    def set_property(self, property_id: PropertyId, value: str):
        """
        Set value of a property.
        :param property_id: The id of the property
        :param value: The value to set
        """
        c_value = _c_str(value)
        _call_hr_fn(fn=_sdk_lib.property_bag_set_string, *[self._handle, ctypes.c_int(property_id.value), None, c_value])

    def set_property_by_name(self, property_name: str, value: str):
        """
        Set value of a property.
        :param property_name: The id name of the property
        :param value: The value to set
        """
        c_name = _c_str(property_name)
        c_value = _c_str(value)
        _call_hr_fn(fn=_sdk_lib.property_bag_set_string, *[self._handle, -1, c_name, c_value])

    def get_property(self, property_id: PropertyId, default_value: str = "") -> str:
        """
        Returns value of a property.
        If the property value is not defined, the specified default value is returned.

        :param property_id: The id of the property.
        :param default_value: The default value which is returned if no value is defined for the property (empty string by default).
        :returns: Value of the property.
        """
        c_value = _c_str(default_value)
        return _call_string_function_and_free(
            fn=_sdk_lib.property_bag_get_string,
            *[self._handle, ctypes.c_int(property_id.value), None, c_value])

    def get_property_by_name(self, property_name: str, default_value: str = "") -> str:
        """
        Returns value of a property.
        If the property value is not defined, the specified default value is returned.

        :param property_name: The name of the property.
        :param default_value: The default value which is returned if no value is defined for the property (empty string by default).
        :returns: Value of the property.
        """
        c_name = _c_str(property_name)
        c_value = _c_str(default_value)
        return _call_string_function_and_free(fn=_sdk_lib.property_bag_get_string, *[self._handle, -1, c_name, c_value])
