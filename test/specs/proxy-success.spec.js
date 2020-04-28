describe('proxy success', () => {

  it('return response from proxy', async () => {
    const scope = nock('http://localhost')
      .post('/')
      .reply(200, { response: { text: 'bar' } });

    const response = await callFn({ request: { command: 'foo' } });

    scope.done();
    assert.deepEqual(response, { response: { text: 'bar' } });
  });

  it('incorrect request format: proxy to target anyway', async () => {
    const scope = nock('http://localhost')
      .post('/')
      .reply(200, { response: { text: 'bar' } });

    const response = await callFn({ foo: 42 });

    scope.done();
    assert.deepEqual(response, { response: { text: 'bar' } });
  });

  it('add x-alice-user-id header', async () => {
    const scope = nock('http://localhost', {
      reqheaders: {
        'x-alice-user-id': 'user12345678'
      },
    })
      .post('/')
      .reply(200, {response: {text: 'bar'}});

    const response = await callFn({
      request: {
        command: 'foo'
      },
      session: {
        user_id: 'user12345678'
      },
      version: 2,
    });

    scope.done();
    assert.deepEqual(response, { response: { text: 'bar' } });
  });

});
