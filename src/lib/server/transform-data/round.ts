export const round = (num: number, decimals: number): number =>
	Number(Math.round(Number(num + 'e' + decimals)) + 'e-' + decimals);
