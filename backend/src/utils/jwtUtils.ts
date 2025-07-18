import ms from 'ms';
import { SignOptions } from 'jsonwebtoken';

export function calculateExpiration(expStr?: SignOptions['expiresIn']): Date {
  if (!expStr) {
    throw new Error('Expiration string is required');
  }

  let msValue: number;

  if (typeof expStr === 'string') {
    msValue = ms(expStr);
    if (msValue === undefined) {
      throw new Error(`Invalid expiration format: ${expStr}`);
    }
  } else {
    msValue = expStr * 1000;
  }

  return new Date(Date.now() + msValue);
}
