import FrameEventBus from '../index';

test('Covers basic functionality', async () => {
  const callback = jest.fn();

  const topics = ['topic1', 'topic2'];
  const payload = { message: 'hello' };

  const frameEventBus = new FrameEventBus();
  const unregister = frameEventBus.listen(topics, callback);

  frameEventBus.emit(topics, payload);

  await new Promise((resolve) => setTimeout(resolve));

  expect(callback).toHaveBeenCalledWith(payload);
  expect(callback).toHaveBeenCalledTimes(topics.length);

  unregister();
  frameEventBus.emit(topics, payload);
  expect(callback).toHaveBeenCalledTimes(topics.length);
});
