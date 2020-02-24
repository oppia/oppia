# -*- coding: utf-8 -*-
from __future__ import with_statement
import os
import webob
import webtest
from webob import exc
from webtest import ext
from tests.compat import u

#if PY3:
#    raise NotImplementedError

files = os.path.dirname(__file__)


def application(environ, start_response):
    req = webob.Request(environ)
    resp = webob.Response()
    if req.method == 'GET':
        filename = req.path_info.strip('/') or 'index.html'
        if filename in ('302',):
            redirect = req.params['redirect']
            resp = exc.HTTPFound(location=redirect)
            return resp(environ, start_response)
        if filename.isdigit():
            resp.status = filename
            filename = 'index.html'
        filename = os.path.join(files, 'html', filename)
        if os.path.isfile(filename):
            kw = dict(message=req.params.get('message', ''),
                      redirect=req.params.get('redirect', ''))
            with open(filename) as f:
                resp.unicode_body = u(f.read()) % kw
            _, ext = os.path.splitext(filename)
            if ext == '.html':
                resp.content_type = 'text/html'
            elif ext == '.js':
                resp.content_type = 'text/javascript'
            elif ext == '.json':
                resp.content_type = 'application/json'
    else:
        redirect = req.params.get('redirect', '')
        if redirect:
            resp = exc.HTTPFound(location=redirect)
        else:
            resp.body = req.body
    return resp(environ, start_response)


def test_casperjs():
    app = webtest.TestApp(application)
    with webtest.casperjs(app) as run:
        run('test_casperjs.js')
