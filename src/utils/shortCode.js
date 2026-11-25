import { customAlphabet } from 'nanoid';
import { CODE_PATTERN, GENERATED_CODE_LENGTH, RESERVED_CODES } from './constants.js';

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// 62 characters ^ 7 positions gives about 3.5 trillion possible codes.
const defaultGenerator = customAlphabet(ALPHABET, GENERATED_CODE_LENGTH);

export const generateShortCode = (length) =>
  length ? customAlphabet(ALPHABET, length)() : defaultGenerator();

export const isValidCodeFormat = (code) => typeof code === 'string' && CODE_PATTERN.test(code);

export const isReservedCode = (code) =>
  typeof code === 'string' && RESERVED_CODES.includes(code.toLowerCase());
