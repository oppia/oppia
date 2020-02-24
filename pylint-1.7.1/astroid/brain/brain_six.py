# Copyright (c) 2014-2016 Claudiu Popa <pcmanticore@gmail.com>

# Licensed under the LGPL: https://www.gnu.org/licenses/old-licenses/lgpl-2.1.en.html
# For details: https://github.com/PyCQA/astroid/blob/master/COPYING.LESSER


"""Astroid hooks for six module."""

import sys
from textwrap import dedent

from astroid import MANAGER, register_module_extender
from astroid.builder import AstroidBuilder
from astroid.exceptions import AstroidBuildingError, InferenceError, AttributeInferenceError
from astroid import nodes


SIX_ADD_METACLASS = 'six.add_metaclass'


def _indent(text, prefix, predicate=None):
    """Adds 'prefix' to the beginning of selected lines in 'text'.

    If 'predicate' is provided, 'prefix' will only be added to the lines
    where 'predicate(line)' is True. If 'predicate' is not provided,
    it will default to adding 'prefix' to all non-empty lines that do not
    consist solely of whitespace characters.
    """
    if predicate is None:
        predicate = lambda line: line.strip()

    def prefixed_lines():
        for line in text.splitlines(True):
            yield prefix + line if predicate(line) else line
    return ''.join(prefixed_lines())


if sys.version_info[0] == 2:
    _IMPORTS_2 = """
    import BaseHTTPServer
    import CGIHTTPServer
    import SimpleHTTPServer
    import cPickle

    from StringIO import StringIO
    from cStringIO import StringIO as cStringIO
    from UserDict import UserDict
    from UserList import UserList
    from UserString import UserString

    import __builtin__ as builtins
    import thread as _thread
    import dummy_thread as _dummy_thread
    import ConfigParser as configparser
    import copy_reg as copyreg
    from itertools import (imap as map,
                           ifilter as filter,
                           ifilterfalse as filterfalse,
                           izip_longest as zip_longest,
                           izip as zip)
    import htmlentitydefs as html_entities
    import HTMLParser as html_parser
    import httplib as http_client
    import cookielib as http_cookiejar
    import Cookie as http_cookies
    import Queue as queue
    import repr as reprlib
    from pipes import quote as shlex_quote
    import SocketServer as socketserver
    import SimpleXMLRPCServer as xmlrpc_server
    import xmlrpclib as xmlrpc_client
    import _winreg as winreg
    import robotparser as urllib_robotparser
    import Tkinter as tkinter
    import tkFileDialog as tkinter_tkfiledialog

    input = raw_input
    intern = intern
    range = xrange
    xrange = xrange
    reduce = reduce
    reload_module = reload

    class UrllibParse(object):
        def __init__(self):
            import urlparse as _urlparse
            import urllib as _urllib

            self.ParseResult = _urlparse.ParseResult
            self.SplitResult = _urlparse.SplitResult
            self.parse_qs = _urlparse.parse_qs
            self.parse_qsl = _urlparse.parse_qsl
            self.urldefrag = _urlparse.urldefrag
            self.urljoin = _urlparse.urljoin
            self.urlparse = _urlparse.urlparse
            self.urlsplit = _urlparse.urlsplit
            self.urlunparse = _urlparse.urlunparse
            self.urlunsplit = _urlparse.urlunsplit
            self.quote = _urllib.quote
            self.quote_plus = _urllib.quote_plus
            self.unquote = _urllib.unquote
            self.unquote_plus = _urllib.unquote_plus
            self.urlencode = _urllib.urlencode
            self.splitquery = _urllib.splitquery
            self.splittag = _urllib.splittag
            self.splituser = _urllib.splituser
            self.uses_fragment = _urlparse.uses_fragment
            self.uses_netloc = _urlparse.uses_netloc
            self.uses_params = _urlparse.uses_params
            self.uses_query = _urlparse.uses_query
            self.uses_relative = _urlparse.uses_relative

    class UrllibError(object):
        import urllib2 as _urllib2
        import urllib as _urllib
        URLError = _urllib2.URLError
        HTTPError = _urllib2.HTTPError
        ContentTooShortError = _urllib.ContentTooShortError

    class DummyModule(object):
        pass

    class UrllibRequest(object):
        def __init__(self):
            import urlparse as _urlparse
            import urllib2 as _urllib2
            import urllib as _urllib
            self.urlopen = _urllib2.urlopen
            self.install_opener = _urllib2.install_opener
            self.build_opener = _urllib2.build_opener
            self.pathname2url = _urllib.pathname2url
            self.url2pathname = _urllib.url2pathname
            self.getproxies = _urllib.getproxies
            self.Request = _urllib2.Request
            self.OpenerDirector = _urllib2.OpenerDirector
            self.HTTPDefaultErrorHandler = _urllib2.HTTPDefaultErrorHandler
            self.HTTPRedirectHandler = _urllib2.HTTPRedirectHandler
            self.HTTPCookieProcessor = _urllib2.HTTPCookieProcessor
            self.ProxyHandler = _urllib2.ProxyHandler
            self.BaseHandler = _urllib2.BaseHandler
            self.HTTPPasswordMgr = _urllib2.HTTPPasswordMgr
            self.HTTPPasswordMgrWithDefaultRealm = _urllib2.HTTPPasswordMgrWithDefaultRealm
            self.AbstractBasicAuthHandler = _urllib2.AbstractBasicAuthHandler
            self.HTTPBasicAuthHandler = _urllib2.HTTPBasicAuthHandler
            self.ProxyBasicAuthHandler = _urllib2.ProxyBasicAuthHandler
            self.AbstractDigestAuthHandler = _urllib2.AbstractDigestAuthHandler
            self.HTTPDigestAuthHandler = _urllib2.HTTPDigestAuthHandler
            self.ProxyDigestAuthHandler = _urllib2.ProxyDigestAuthHandler
            self.HTTPHandler = _urllib2.HTTPHandler
            self.HTTPSHandler = _urllib2.HTTPSHandler
            self.FileHandler = _urllib2.FileHandler
            self.FTPHandler = _urllib2.FTPHandler
            self.CacheFTPHandler = _urllib2.CacheFTPHandler
            self.UnknownHandler = _urllib2.UnknownHandler
            self.HTTPErrorProcessor = _urllib2.HTTPErrorProcessor
            self.urlretrieve = _urllib.urlretrieve
            self.urlcleanup = _urllib.urlcleanup
            self.proxy_bypass = _urllib.proxy_bypass

    urllib_parse = UrllibParse()
    urllib_error = UrllibError()
    urllib = DummyModule()
    urllib.request = UrllibRequest()
    urllib.parse = UrllibParse()
    urllib.error = UrllibError()
    """
else:
    _IMPORTS_3 = """
    import _io
    cStringIO = _io.StringIO
    filter = filter
    from itertools import filterfalse
    input = input
    from sys import intern
    map = map
    range = range
    from imp import reload as reload_module
    from functools import reduce
    from shlex import quote as shlex_quote
    from io import StringIO
    from collections import UserDict, UserList, UserString
    xrange = range
    zip = zip
    from itertools import zip_longest
    import builtins
    import configparser
    import copyreg
    import _dummy_thread
    import http.cookiejar as http_cookiejar
    import http.cookies as http_cookies
    import html.entities as html_entities
    import html.parser as html_parser
    import http.client as http_client
    import http.server as http_server
    BaseHTTPServer = CGIHTTPServer = SimpleHTTPServer = http.server
    import pickle as cPickle
    import queue
    import reprlib
    import socketserver
    import _thread
    import winreg
    import xmlrpc.server as xmlrpc_server
    import xmlrpc.client as xmlrpc_client
    import urllib.robotparser as urllib_robotparser
    import email.mime.multipart as email_mime_multipart
    import email.mime.nonmultipart as email_mime_nonmultipart
    import email.mime.text as email_mime_text
    import email.mime.base as email_mime_base
    import urllib.parse as urllib_parse
    import urllib.error as urllib_error
    import tkinter
    import tkinter.dialog as tkinter_dialog
    import tkinter.filedialog as tkinter_filedialog
    import tkinter.scrolledtext as tkinter_scrolledtext
    import tkinter.simpledialog as tkinder_simpledialog
    import tkinter.tix as tkinter_tix
    import tkinter.ttk as tkinter_ttk
    import tkinter.constants as tkinter_constants
    import tkinter.dnd as tkinter_dnd
    import tkinter.colorchooser as tkinter_colorchooser
    import tkinter.commondialog as tkinter_commondialog
    import tkinter.filedialog as tkinter_tkfiledialog
    import tkinter.font as tkinter_font
    import tkinter.messagebox as tkinter_messagebox
    import urllib
    import urllib.request as urllib_request
    import urllib.robotparser as urllib_robotparser
    import urllib.parse as urllib_parse
    import urllib.error as urllib_error
    """
if sys.version_info[0] == 2:
    _IMPORTS = dedent(_IMPORTS_2)
else:
    _IMPORTS = dedent(_IMPORTS_3)


def six_moves_transform():
    code = dedent('''
    class Moves(object):
    {}
    moves = Moves()
    ''').format(_indent(_IMPORTS, "    "))
    module = AstroidBuilder(MANAGER).string_build(code)
    module.name = 'six.moves'
    return module


def _six_fail_hook(modname):
    """Fix six.moves imports due to the dynamic nature of this
    class.

    Construct a psuedo-module which contains all the nessecary imports
    for six

    :param modname: Name of failed module
    :type modname: str

    :return: An astroid module
    :rtype: nodes.Module
    """

    attribute_of = (modname != "six.moves" and
                    modname.startswith("six.moves"))
    if modname != 'six.moves' and not attribute_of:
        raise AstroidBuildingError(modname=modname)
    module = AstroidBuilder(MANAGER).string_build(_IMPORTS)
    module.name = 'six.moves'
    if attribute_of:
        # Facilitate import of submodules in Moves
        start_index = len(module.name)
        attribute = modname[start_index:].lstrip(".").replace(".", "_")
        try:
            import_attr = module.getattr(attribute)[0]
        except AttributeInferenceError:
            raise AstroidBuildingError(modname=modname)
        if isinstance(import_attr, nodes.Import):
            submodule = MANAGER.ast_from_module_name(import_attr.names[0][0])
            return submodule
    # Let dummy submodule imports pass through
    # This will cause an Uninferable result, which is okay
    return module

def transform_six_add_metaclass(node):
    """Check if the given class node is decorated with *six.add_metaclass*

    If so, inject its argument as the metaclass of the underlying class.
    """
    if not node.decorators:
        return

    for decorator in node.decorators.nodes:
        if not isinstance(decorator, nodes.Call):
            continue

        try:
            func = next(decorator.func.infer())
        except InferenceError:
            continue
        if func.qname() == SIX_ADD_METACLASS and decorator.args:
            metaclass = decorator.args[0]
            node._metaclass = metaclass
            return node


register_module_extender(MANAGER, 'six', six_moves_transform)
register_module_extender(MANAGER, 'requests.packages.urllib3.packages.six',
                         six_moves_transform)
MANAGER.register_failed_import_hook(_six_fail_hook)
MANAGER.register_transform(nodes.ClassDef, transform_six_add_metaclass)
