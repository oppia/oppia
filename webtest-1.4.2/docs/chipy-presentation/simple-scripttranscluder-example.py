from webtest import TestApp
from scripttranscluder.wsgiapp import make_app

app = TestApp(make_app({}, True, ['http://*.org/*']))

def test_denial():
    app.get('/?url=http://google.com', status=403)
    app.get('/?url=http://wikipedia.org', status=200)
    app.get('/?url=http://google.com', extra_environ=dict(HTTP_HOST='google.com'))

def test_js():
    res = app.get('/?url=http://wikipedia.org')
    assert res.body.startswith('document.write')
    assert res.body.strip().endswith(';')
    assert res.content_type == 'text/javascript'
    res2 = app.get('/?url=http://wikipedia.org/#globalWrapper')
    assert res2.body != res.body
    assert len(res2.body) < len(res.body)
    res3 = app.get('/?url=http://wikipedia.org&dest=LOC1')
    res3.mustcontain('LOC1')
    res3.mustcontain('innerHTML')
    assert len(res3.body) > len(res.body)
    
    
    
