describe('ping', () => {

  it('respond pong', async () => {
    const scope = nock('http://localhost')
      .post('/')
      .reply(200, { });

    const response = await callHandler({
      request: {
        command: 'ping'
      },
      session: 1,
      version: 2,
    });

    assert.equal(scope.isDone(), false);
    assert.deepEqual(response, {
      response: {
        text: 'pong',
        end_session: false
      },
      session: 1,
      version: 2,
    });
  });

});
