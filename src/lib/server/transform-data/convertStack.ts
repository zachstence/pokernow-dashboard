import { round } from './round';

export const convertStack = (stack: number, cents: boolean): number => {
	if (cents) return round(stack / 100, 2);
	return stack;
};
