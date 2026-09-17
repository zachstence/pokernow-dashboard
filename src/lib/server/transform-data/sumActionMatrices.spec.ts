import { describe, it, expect } from 'vitest';
import type { ActionMatrix } from './computeHandActionMatrix';
import { sumActionMatrices } from './sumActionMatrices';

describe('sumActionMatrices', () => {
	it('should return one matrix unmodified', () => {
		const matrix: ActionMatrix = {
			a: { b: 100 },
			c: { b: 200 }
		};
		const actual = sumActionMatrices(matrix);
		expect(actual).toEqual(matrix);
	});
	it('should sum amounts in two matrices with identical keys', () => {
		const matrix1: ActionMatrix = {
			a: { b: 100 },
			c: { b: 200 }
		};
		const matrix2: ActionMatrix = {
			a: { b: 400 },
			c: { b: 1000 }
		};
		const expected: ActionMatrix = {
			a: { b: 500 },
			c: { b: 1200 }
		};
		const actual = sumActionMatrices(matrix1, matrix2);
		expect(actual).toEqual(expected);
	});
	it('should merge two matrices with unshared keys', () => {
		const matrix1: ActionMatrix = {
			a: { b: 100 },
			d: { e: 200 }
		};
		const matrix2: ActionMatrix = {
			f: { g: 400 },
			h: { i: 1000 }
		};
		const expected: ActionMatrix = {
			a: { b: 100 },
			d: { e: 200 },
			f: { g: 400 },
			h: { i: 1000 }
		};
		const actual = sumActionMatrices(matrix1, matrix2);
		expect(actual).toEqual(expected);
	});
	it('should properly sum two matrices with shared and unshared keys', () => {
		const matrix1: ActionMatrix = {
			a: { b: 100 },
			d: { e: 200, f: 200 },
			h: { b: 100, i: 100 }
		};
		const matrix2: ActionMatrix = {
			a: { b: 100, c: 100, d: 100, e: 100 },
			d: { e: 500 },
			f: { g: 400 },
			h: { i: 1000 }
		};
		const expected: ActionMatrix = {
			a: { b: 200, c: 100, d: 100, e: 100 },
			d: { e: 700, f: 200 },
			f: { g: 400 },
			h: { b: 100, i: 1100 }
		};
		const actual = sumActionMatrices(matrix1, matrix2);
		expect(actual).toEqual(expected);
	});
});
