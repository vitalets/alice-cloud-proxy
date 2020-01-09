describe('proxy success', () => {

  it('return response from proxy', async () => {
    const scope = nock('http://localhost')
      .post('/')
      .reply(200, {
        response: {
          text: 'bar'
        }
      });

    const response = await handler({
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

});
