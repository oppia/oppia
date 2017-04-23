import os
import shutil
from paste.fixture import TestApp
from paste.urlparser import StaticURLParser
from dvhoster.wsgiapp import make_app
import wsgi_intercept
import httplib
for attr in ['get_app', 'connect']:
    setattr(httplib.HTTPConnection, attr,
            getattr(wsgi_intercept.WSGI_HTTPConnection, attr).im_func)
from wsgifilter.proxyapp import DebugHeaders
from simplejson import loads as json_loads

data_filename = os.path.join(os.path.dirname(__file__), 'test-data')
wsgi_app = make_app({}, data_dir=data_filename)
app = TestApp(wsgi_app)

def put(uri, data):
    return app.post(
        uri, data, extra_environ={'REQUEST_METHOD': 'PUT'},
        status=(201, 204))

rule_data = '''\
<?xml version="1.0" encoding="UTF-8"?>
  <rules xmlns="http://www.plone.org/deliverance">
    <append-or-replace theme="//head" content="//head/title" />
    <append theme="//head" content="//head/link" />
    <append theme="//head" content="//head/script" onerror="ignore"/>    
    <append theme="//head" content="//head/style" onerror="ignore"/>    
    <append theme="//head" content="//head/meta" onerror="ignore"/>
    <copy theme="//div[@id='content']" content="//div[@id='portal-content']" />
  </rules>
'''


def test_everything():
    yield (reset_env,)
    yield (create_api,)
    yield (use_api, 'localhost')
    yield (rename_site,)
    yield (use_api, 'localhost2')
    yield (delete_site,)

def reset_env():
    if os.path.exists(data_filename):
        shutil.rmtree(data_filename)
    os.mkdir(data_filename)
            

def create_api():
    # Theme:
    uri = 'http://wsgify.org/theme.html'
    put('/.deliverance/theme_uri', uri)
    res = app.get('/.deliverance/theme_uri')
    assert res.body == uri

    # Rules:
    put('/.deliverance/rules/rule.xml', rule_data)
    assert app.get('/.deliverance/rules/rule.xml').body == rule_data
    assert app.get('/_rules/rule.xml').body == rule_data

    # Domain (no rename test):
    res = app.get('/.deliverance/domain')
    assert res.body == 'localhost'

    # Aliases:
    data = "localhost.localhost\nexample.com\n"
    put('/.deliverance/aliases', data)
    assert app.get('/.deliverance/aliases').body == data

    data = '''
    [{"path": "/bar", "remote_uri": "http://wsgify.org/blah", "comment": "x"},
     {"path": "/", "remote_uri": "http://wsgify.org/"},
     {"path": "/testme", "headers": {"X-Test-Me": "testme"}, "remote_uri": "http://wsgify.org:9999"}
     ]
     '''

    put('/.deliverance/remote_uris', data)
    # It gets normalized, so it doesn't actually stay quite the same:
    #assert app.get('/.deliverance/remote_uris').body == data

    res = app.get('/bar', status=301)
    assert res.header('location') == 'http://localhost/bar/'
    ## @@: Right now there's a problem with StaticURLParser where it
    ## does a bad redirect here...
    #res = res.follow()
    #print res
    #assert res.status == 200
    ## So instead we just get a page we know works:
    res = app.get('/bar/index.html', status=200)

    res = app.get('/testme/', status=200)
    res.mustcontain("HTTP_X_TEST_ME: 'testme'")

    # Now lets try adding and removing via POST
    app.post('/.deliverance/remote_uris?add',
             '[{"path": "/testpost", "remote_uri": "http://blah.com"}]',
             status=204)
    res = app.get('/.deliverance/remote_uris')
    res.mustcontain('testpost')
    app.post('/.deliverance/remote_uris?remove',
             '[{"path": "/testpost"}]',
             status=204)
    res = app.get('/.deliverance/remote_uris')
    data = json_loads(res.body)
    for item in data:
        assert not item['path'].startswith('/testpost')

    data = '''
    [{"path": "/test1.html", "rewrite": "/test1"},
     {"prefix": "/test2", "rewrite": "/test3", "comment": "rename"},
     {"path": "/other.html", "rewrite": "http://otherexample.com/other.html"}]
     '''
    put('/.deliverance/redirects', data)

    app.post('/.deliverance/redirects?add',
             '[{"path": "/something-special", "rewrite": "http://whatever.com"}]',
             status=204)
    res = app.get('/.deliverance/redirects')
    res.mustcontain('whatever.com', 'otherexample.com')
    # Let's try a bad request:
    app.post('/.deliverance/redirects?remove',
             '[{"path": "/blahblah"}]', status=400)
    # Then a good one:
    app.post('/.deliverance/redirects?remove',
             '[{"path": "/something-special"}]',
             status=204)
    res = app.get('/.deliverance/redirects')
    res.mustcontain('otherexample.com')
    data = json_loads(res.body)
    for item in data:
        if not item.get('path'):
            continue
        assert not item.get('path').startswith('/something-special')
    
    data = '<html>some data!</html>'
    put('/.deliverance/static/data.html', data)
    res = app.get('/.deliverance/static/data.html')
    assert res.body == data
    app.get('/.deliverance/static/subdir',
            extra_environ={'REQUEST_METHOD': 'MKCOL'}, status=201)
    res = put('/.deliverance/static/subdir/foo.html', 'blah')
    res = app.get('/.deliverance/static/subdir/foo.html')
    assert res.body == 'blah'
    res = app.get('/subdir/foo.html')
    assert res.body == 'blah'
    # Directories don't shadow like files:
    res = app.get('/subdir/', status=404)
    
def use_api(hostname):
    res = app.get('/index.html')
    res.mustcontain(
        # From the theme:
        'This is a theme',
        # From the content:
        'This is some content')
    # Should be dropped from theme:
    assert 'replace' not in res
    # Should be lost from content:
    assert 'unthemed' not in res
    # Redirect non-canonical domains:
    res = app.get('/index.html', extra_environ=dict(HTTP_HOST='example.com'),
                  status=301)
    assert res.header('location') == 'http://%s/index.html' % hostname
    # Test the path backend redirect:
    res = app.get('/bar/foo.html')
    res.mustcontain('foo')
    res = app.get('/test1.html', status=301)
    assert res.header('location') == 'http://%s/test1/' % hostname
    res = app.get('/test2/other/stuff.html', status=301)
    assert res.header('location') == 'http://%s/test3/other/stuff.html' % hostname
    res = app.get('/test1.html/foo/bar', status=404)
    res = app.get('/data.html')
    res.mustcontain('some data!')
    assert 'Test Theme' not in res
    res = app.get('/subdir/foo.html')
    assert res.body == 'blah'
    
def rename_site():
    put('/.deliverance/domain', 'localhost2')
    app.extra_environ['HTTP_HOST'] = 'localhost2'
    res = app.get('/.deliverance/aliases')
    res.mustcontain('localhost')
    assert app.get('/.deliverance/domain').body == 'localhost2'
    print 'site renamed to localhost2'

def delete_site():
    app.extra_environ['HTTP_HOST'] = 'localhost2'
    res = app.get('/.deliverance/domain')
    res = app.get('/foo.html', status=404)
    put('/.deliverance/static/foo.html', 'text')
    res = app.get('/foo.html')
    assert res.body == 'text'
    res = app.post('/.deliverance/delete', '', status=204)
    res = app.get('/foo.html', status=404)

def setup_module(module):
    from paste.script import testapp
    static_app = StaticURLParser(os.path.join(os.path.dirname(__file__),
                                              'test-static'))

    wsgi_intercept.add_wsgi_intercept('wsgify.org', 80, lambda : static_app)
    wsgi_intercept.add_wsgi_intercept('wsgify.org', 9999, lambda : testapp.TestApplication(text=True))

def teardown_module(module):
    wsgi_intercept.remove_wsgi_intercept('wsgify.org', 80)

