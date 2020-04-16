describe('proxy success', () => {

  it('return response from proxy', async () => {
    const scope = nock('http://localhost')
      .post('/')
      .reply(200, {
        response: {
          text: 'bar'
        }
      });

    const response = await callHandler({
      request: {
        command: 'foo'
      },
    });

    scope.done();
    assert.deepEqual(response, {
      response: {
        text: 'bar'
      }
    });
  });

  it('incorrect request: proxy to target anyway', async () => {
    const scope = nock('http://localhost')
      .post('/')
      .reply(200, {
        response: {
          text: 'bar'
        }
      });

    const response = await callHandler({
      foo: 42
    });

    scope.done();
    assert.deepEqual(response, {
      response: {
        text: 'bar',
      },
    });
  });

});
