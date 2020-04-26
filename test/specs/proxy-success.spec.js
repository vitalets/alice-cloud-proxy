describe('proxy success', () => {

  it('return response from proxy', async () => {
    const scope = nock('http://localhost')
      .post('/')
      .reply(200, { response: { text: 'bar' } });

    const response = await callHandler({ request: { command: 'foo' } });

    scope.done();
    assert.deepEqual(response, { response: { text: 'bar' } });
  });

  it('incorrect request: proxy to target anyway', async () => {
    const scope = nock('http://localhost')
      .post('/')
      .reply(200, { response: { text: 'bar' } });

    const response = await callHandler({ foo: 42 });

    scope.done();
    assert.deepEqual(response, { response: { text: 'bar' } });
  });

  it('proxy to url with placeholders', async () => {
    config.targetUrl = 'http://localhost/?userId={userId}';

    const scope = nock('http://localhost')
      .post('/?userId=123456')
      .reply(200, { response: { text: 'bar' } });

    const response = await callHandler({
      request: {
        command: 'foo'
      },
      session: {
        user_id: '123456_78'
      },
      version: 2,
    });

    scope.done();
    assert.deepEqual(response, { response: { text: 'bar' } });
  });

});
