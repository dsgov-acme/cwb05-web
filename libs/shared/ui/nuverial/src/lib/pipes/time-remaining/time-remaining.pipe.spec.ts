import { NuverialTimeRemainingPipe } from './time-remaining.pipe';

describe('NuverialTimeRemainingPipe', () => {
  let pipe: NuverialTimeRemainingPipe;

  beforeEach(() => {
    pipe = new NuverialTimeRemainingPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return "1 day" remaining message', () => {
    const endDate = new Date(); // Example of a future date
    endDate.setDate(endDate.getDate() + 1); // Set the end date to be 1 day in the future
    endDate.setSeconds(endDate.getSeconds() + 2); // 2 seconds to handle a race condition
    const result = pipe.transform(endDate);
    expect(result).toBe('1 day');
  });

  it('should return "2 days" remaining message', () => {
    const endDate = new Date(); // Example of a future date
    endDate.setDate(endDate.getDate() + 2); // Set the end date to be 1 day in the future
    endDate.setSeconds(endDate.getSeconds() + 2); // 2 seconds to handle a race condition
    const result = pipe.transform(endDate);
    expect(result).toBe('2 days');
  });

  it('should return "0 time" when there is no time remaining', () => {
    const endDate = new Date(); // Example of a past date
    const result = pipe.transform(endDate);
    expect(result).toBe('0 time');
  });

  it('should return "1 hour" when there is 1 hour remaining', () => {
    const endDate = new Date();
    endDate.setHours(endDate.getHours() + 1); // Set the end date to be 1 hour in the future
    endDate.setSeconds(endDate.getSeconds() + 2); // 2 seconds to handle a race condition
    const result = pipe.transform(endDate);
    expect(result).toBe('1 hour');
  });

  it('should return "1 day" when there is 1 hour remaining', () => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 1); // Set the end date to be 1 day in the future
    endDate.setHours(endDate.getHours() + 1); // Set the end date to be 1 hour in the future
    endDate.setSeconds(endDate.getSeconds() + 2); // 2 seconds to handle a race condition
    const result = pipe.transform(endDate);
    expect(result).toBe('1 day');
  });

  it('should return "2 hours" when there are 2 hours remaining', () => {
    const endDate = new Date();
    endDate.setHours(endDate.getHours() + 2); // Set the end date to be 2 hours in the future
    endDate.setSeconds(endDate.getSeconds() + 2); // 2 seconds to handle a race condition
    const result = pipe.transform(endDate);
    expect(result).toBe('2 hours');
  });

  it('should return "2 hours" when there are 2 hours remaining', () => {
    const endDate = new Date();
    endDate.setHours(endDate.getHours() + 2); // Set the end date to be 2 hours in the future
    endDate.setMinutes(endDate.getMinutes() + 30); // Set the end date to be 1 minute in the future
    endDate.setSeconds(endDate.getSeconds() + 2); // 2 seconds to handle a race condition
    const result = pipe.transform(endDate);
    expect(result).toBe('2 hours');
  });

  it('should return "1 minute" when there is 1 minute remaining', () => {
    const endDate = new Date();
    endDate.setMinutes(endDate.getMinutes() + 1); // Set the end date to be 1 minute in the future
    endDate.setSeconds(endDate.getSeconds() + 2); // 2 seconds to handle a race condition
    const result = pipe.transform(endDate);
    expect(result).toBe('1 minute');
  });

  it('should return "2 minutes" when there are 2 minutes remaining', () => {
    const endDate = new Date();
    endDate.setMinutes(endDate.getMinutes() + 2); // Set the end date to be 2 minutes in the future
    endDate.setSeconds(endDate.getSeconds() + 2); // 2 seconds to handle a race condition
    const result = pipe.transform(endDate);
    expect(result).toBe('2 minutes');
  });

  it('should return "1 second" when there is 1 second remaining', () => {
    const endDate = new Date();
    endDate.setSeconds(endDate.getSeconds() + 1); // Set the end date to be 1 second in the future
    const result = pipe.transform(endDate);
    expect(result).toBe('1 second');
  });

  it('should return "2 seconds" when there are 2 seconds remaining', () => {
    const endDate = new Date();
    endDate.setSeconds(endDate.getSeconds() + 2); // Set the end date to be 2 seconds in the future
    const result = pipe.transform(endDate);
    expect(result).toBe('2 seconds');
  });
});
