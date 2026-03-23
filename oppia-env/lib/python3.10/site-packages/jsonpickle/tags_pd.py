"""
This file exists to automatically generate tags for numpy/pandas extensions. Because numpy/pandas follow a (relatively) rapid release schedule, updating types for new versions as bug reports come in could be infeasible, so we auto-generate them. Unfortunately, this file can't go into the ext folder because then the imports would break.
"""

import re

import numpy as np
import pandas as pd
from pandas.api.extensions import ExtensionDtype


def split_letters_numbers_brackets(s):
    """
    Split the string into letters, numbers, and brackets (with their content).
    This is a helper function for getting the smallest unique substring, for determining tags.
    """
    # extract brackets and their content
    brackets_match = re.search(r"\[.*?\]", s)
    if brackets_match:
        brackets_part = brackets_match.group()
        s_clean = s.replace(brackets_part, "")
    else:
        brackets_part = ""
        s_clean = s

    # find where the trailing digits start
    index = len(s_clean)
    while index > 0 and s_clean[index - 1].isdigit():
        index -= 1
    letters_part = s_clean[:index]
    numbers_part = s_clean[index:]
    return letters_part, numbers_part, brackets_part


def get_smallest_unique_substrings(strings, prefix="np"):
    used_substrings = set()
    used_letters_parts = set()
    result = {}

    for s in strings:
        if not isinstance(s, str):
            s2 = s.__name__
        else:
            s2 = s
        letters_part, numbers_part, brackets_part = split_letters_numbers_brackets(s2)
        letters_part = letters_part.lower()
        unique_substring_found = False

        # handle the weird datetime64[...] and timedelta64[...] cases
        if letters_part == "datetime" and numbers_part == "64" and brackets_part:
            substr = "d64" + brackets_part
            if substr not in used_substrings:
                result[s] = substr
                used_substrings.add(substr)
                unique_substring_found = True
        elif letters_part == "timedelta" and numbers_part == "64" and brackets_part:
            substr = "t64" + brackets_part
            if substr not in used_substrings:
                result[s] = substr
                used_substrings.add(substr)
                unique_substring_found = True
        else:
            if letters_part in used_letters_parts:
                # letters have been seen before, so use letters + numbers_part + brackets_part
                if numbers_part or brackets_part:
                    # try first letter + numbers_part + brackets_part
                    substr = letters_part[0]
                    if numbers_part:
                        substr += numbers_part
                    if brackets_part:
                        substr += brackets_part
                    if substr not in used_substrings:
                        result[s] = substr
                        used_substrings.add(substr)
                        unique_substring_found = True
                    else:
                        # try letters_part + numbers_part + brackets_part
                        substr = letters_part
                        if numbers_part:
                            substr += numbers_part
                        if brackets_part:
                            substr += brackets_part
                        if substr not in used_substrings:
                            result[s] = substr
                            used_substrings.add(substr)
                            unique_substring_found = True
                else:
                    # find a unique substring of just letters_part
                    for length in range(1, len(letters_part) + 1):
                        substr = letters_part[:length]
                        if substr not in used_substrings:
                            result[s] = substr
                            used_substrings.add(substr)
                            unique_substring_found = True
                            break
            else:
                # assign the smallest substring of letters_part
                for length in range(1, len(letters_part) + 1):
                    substr = letters_part[:length]
                    if substr not in used_substrings:
                        result[s] = substr
                        used_substrings.add(substr)
                        unique_substring_found = True
                        break
                used_letters_parts.add(letters_part)

        # last resort: assign the entire string
        if not unique_substring_found:
            result[s] = s
            used_substrings.add(s)

    for key in result:
        result[key] = f"{prefix}/" + result[key]

    return result


def all_subclasses(cls):
    # use a set to avoid adding duplicates
    subclasses = set()
    for subclass in cls.__subclasses__():
        subclasses.add(subclass)
        subclasses.update(all_subclasses(subclass))
    return list(subclasses)


def get_all_numpy_dtype_strings():
    dtypes = []

    # sctypeDict is the dict of all possible numpy dtypes + some invalid dtypes too
    for dtype in np.sctypeDict.values():
        try:
            dtype_obj = np.dtype(dtype)
            dtypes.append(dtype_obj.name.lower())
        except TypeError:
            continue

    try:
        char_codes = np._typing._char_codes
        # datetime64 and timedelta64 are special, they have multiple variants
        # python internally compiles and caches regex like this to speed it up
        dt_variants = list(
            dict.fromkeys(
                [
                    "datetime64[" + re.search(r"\[(.*?)\]", var).group(1) + "]"
                    for var in char_codes._DT64Codes.__args__
                    if re.search(r"\[(.*?)\]", var)
                ]
            )
        )
        td_variants = list(
            dict.fromkeys(
                [
                    "timedelta64[" + re.search(r"\[(.*?)\]", var).group(1) + "]"
                    for var in char_codes._TD64Codes.__args__
                    if re.search(r"\[(.*?)\]", var)
                ]
            )
        )
    except AttributeError:
        # AttributeError happens on numpy <1.25 because _typing isn't exposed to users
        dt_variants = [
            'datetime64[Y]',
            'datetime64[M]',
            'datetime64[W]',
            'datetime64[D]',
            'datetime64[h]',
            'datetime64[m]',
            'datetime64[s]',
            'datetime64[ms]',
            'datetime64[us]',
            'datetime64[ns]',
            'datetime64[ps]',
            'datetime64[fs]',
            'datetime64[as]',
        ]
        td_variants = [
            'timedelta64[Y]',
            'timedelta64[M]',
            'timedelta64[W]',
            'timedelta64[D]',
            'timedelta64[h]',
            'timedelta64[m]',
            'timedelta64[s]',
            'timedelta64[ms]',
            'timedelta64[us]',
            'timedelta64[ns]',
            'timedelta64[ps]',
            'timedelta64[fs]',
            'timedelta64[as]',
        ]

    dtypes += dt_variants + td_variants

    return list(dict.fromkeys(dtypes))


def get_all_pandas_dtype_strings():
    dtypes = []

    # get all pandas dtypes since it doesnt have a built-in api
    extension_dtypes = all_subclasses(ExtensionDtype)

    for dtype_cls in extension_dtypes:
        # some ExtensionDtype subclasses might not have a name attribute
        if hasattr(dtype_cls, "name"):
            try:
                dtype_name = dtype_cls.name
                dtypes.append(dtype_name.lower())
            except Exception:
                continue

    # use the class object for things that np.dtype can't reconstruct
    dtypes.extend([pd.Timestamp, pd.Timedelta, pd.Period, pd.Interval])

    return list(dict.fromkeys(dtypes))


np_dtypes = list(
    dict.fromkeys(
        [dtype for dtype in get_all_numpy_dtype_strings() if isinstance(dtype, str)]
    )
)

pd_dtypes = list(
    dict.fromkeys(
        [dtype for dtype in get_all_pandas_dtype_strings() if isinstance(dtype, str)]
    )
)


TYPE_MAP = get_smallest_unique_substrings(np_dtypes, prefix="np")
TYPE_MAP.update(get_smallest_unique_substrings(pd_dtypes, prefix="pd"))

REVERSE_TYPE_MAP = {v: k for k, v in TYPE_MAP.items()}
