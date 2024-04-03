import { Interval } from "../config/types.ts";

/**
 * Generates a random integer within a given range using the Web Cryptography API.
 * The generated number is non-deterministic and suitable for cryptographic use.
 *
 * @param min - The lower bound of the range (inclusive)
 * @param max - The upper bound of the range (inclusive)
 * @returns A random integer within the range [min, max]
 */
export const randomIntFromInterval = ([min, max]: Interval): number => {
	const array = new Uint32Array(1);
	window.crypto.getRandomValues(array);
	const randomInt = array[0];
	// Normalize to [0, 1]
	const randomNormalized = randomInt / 4294967295;
	// Scale to [min, max] and round
	return Math.floor(randomNormalized * (max - min + 1) + min);
};
