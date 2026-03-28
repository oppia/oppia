import uuid
from typing import List, Optional, Union, Tuple, Any, Type
from deepdiff.helper import strings, numbers, SetOrdered


DEFAULT_SIGNIFICANT_DIGITS_WHEN_IGNORE_NUMERIC_TYPES = 12
TYPE_STABILIZATION_MSG = 'Unable to stabilize the Numpy array {} due to {}. Please set ignore_order=False.'


class Base:
    numbers = numbers
    strings = strings

    def get_significant_digits(self, significant_digits: Optional[int], ignore_numeric_type_changes: bool) -> Optional[int]:
        if significant_digits is not None and significant_digits < 0:
            raise ValueError(
                "significant_digits must be None or a non-negative integer")
        if significant_digits is None:
            if ignore_numeric_type_changes:
                significant_digits = DEFAULT_SIGNIFICANT_DIGITS_WHEN_IGNORE_NUMERIC_TYPES
        return significant_digits

    def get_ignore_types_in_groups(self, 
                                   ignore_type_in_groups: Optional[Union[List[Any], Tuple[Any, ...]]], 
                                   ignore_string_type_changes: bool,
                                   ignore_numeric_type_changes: bool,
                                   ignore_type_subclasses: bool,
                                   ignore_uuid_types: bool = False) -> List[Union[SetOrdered, Tuple[Type[Any], ...]]]:
        if ignore_type_in_groups:
            if isinstance(ignore_type_in_groups[0], type):
                ignore_type_in_groups = [ignore_type_in_groups]
        else:
            ignore_type_in_groups = []

        result = []
        for item_group in ignore_type_in_groups:
            new_item_group = SetOrdered()
            for item in item_group:
                item = type(item) if item is None or not isinstance(item, type) else item
                new_item_group.add(item)
            result.append(new_item_group)
        ignore_type_in_groups = result

        if ignore_string_type_changes and self.strings not in ignore_type_in_groups:
            ignore_type_in_groups.append(SetOrdered(self.strings))

        if ignore_numeric_type_changes and self.numbers not in ignore_type_in_groups:
            ignore_type_in_groups.append(SetOrdered(self.numbers))

        if ignore_uuid_types:
            # Create a group containing both UUID and str types
            uuid_str_group = SetOrdered([uuid.UUID, str])
            if uuid_str_group not in ignore_type_in_groups:
                ignore_type_in_groups.append(uuid_str_group)

        if not ignore_type_subclasses:
            # is_instance method needs tuples. When we look for subclasses, we need them to be tuples
            ignore_type_in_groups = list(map(tuple, ignore_type_in_groups))

        return ignore_type_in_groups
