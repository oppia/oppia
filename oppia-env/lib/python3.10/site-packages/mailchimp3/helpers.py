# coding=utf-8
"""
Helper functions to perform simple tasks for multiple areas of the API
"""
import hashlib
import re

HTTP_METHOD_ACTION_MATCHING = {
    'get': 'GET',
    'create': 'POST',
    'update': 'PATCH',
    'create_or_update': 'PUT',
    'delete': 'DELETE'
}


def get_subscriber_hash(member_email):
    """
    The MD5 hash of the lowercase version of the list member's email.
    Used as subscriber_hash

    :param member_email: The member's email address
    :type member_email: :py:class:`str`
    :returns: The MD5 hash in hex
    :rtype: :py:class:`str`
    """
    check_email(member_email)
    member_email = member_email.lower().encode()
    m = hashlib.md5(member_email)
    return m.hexdigest()


def check_subscriber_hash(potential_hash):
    """
    Check the passed value to see if it matches a 32 character hex number that
    MD5 generates as output, or compute that value assuming that the input is
    an email address.

    :param potential_hash: A value to be passed to any of the endpoints that
    expect an MD5 of an email address
    :type potential_hash: :py:class:`str`
    :returns: A valid MD5 hash in hex
    :rtype: :py:class:`str`
    """
    if re.match(r"^[0-9a-f]{32}$", potential_hash):
        return potential_hash
    else:
        return get_subscriber_hash(potential_hash)


def check_email(email):
    """
    Function that verifies that the string passed is a valid email address.

    Regex for email validation based on MailChimp limits:
    http://kb.mailchimp.com/accounts/management/international-characters-in-mailchimp

    :param email: The potential email address
    :type email: :py:class:`str`
    :return: Nothing
    """
    if not re.match(r".+@.+\..+", email):
        raise ValueError('String passed is not a valid email address')
    return


def check_url(url):
    """
    Function that verifies that the string passed is a valid url.

    Original regex author Diego Perini (http://www.iport.it)
    regex ported to Python by adamrofer (https://github.com/adamrofer)
    Used under MIT license.

    :param url:
    :return: Nothing
    """
    URL_REGEX = re.compile(
    u"^"
    u"(?:(?:https?|ftp)://)"
    u"(?:\\S+(?::\\S*)?@)?"
    u"(?:"
    u"(?!(?:10|127)(?:\\.\\d{1,3}){3})"
    u"(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})"
    u"(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})"
    u"(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])"
    u"(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}"
    u"(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))"
    u"|"
    u"(?:(?:[a-z\u00a1-\uffff0-9]-?)*[a-z\u00a1-\uffff0-9]+)"
    u"(?:\\.(?:[a-z\u00a1-\uffff0-9]-?)*[a-z\u00a1-\uffff0-9]+)*"
    u"(?:\\.(?:[a-z\u00a1-\uffff]{2,}))"
    u")"
    u"(?::\\d{2,5})?"
    u"(?:/\\S*)?"
    u"$"
    , re.UNICODE)
    if not re.match(URL_REGEX, url):
        raise ValueError('String passed is not a valid url')
    return


def merge_results(x, y):
    """
    Given two dicts, x and y, merge them into a new dict as a shallow copy.

    The result only differs from `x.update(y)` in the way that it handles list
    values when both x and y have list values for the same key. In which case
    the returned dictionary, z, has a value according to:
      z[key] = x[key] + z[key]

    :param x: The first dictionary
    :type x: :py:class:`dict`
    :param y: The second dictionary
    :type y: :py:class:`dict`
    :returns: The merged dictionary
    :rtype: :py:class:`dict`
    """
    z = x.copy()
    for key, value in y.items():
        if isinstance(value, list) and isinstance(z.get(key), list):
            z[key] += value
        else:
            z[key] = value
    return z
