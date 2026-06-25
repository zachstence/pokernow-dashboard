import { computeStats } from '$lib/server/transform-data';
import type { LayoutServerLoad } from './$types';

export const prerender = true;

export const load: LayoutServerLoad = async () => {
	return computeStats();
};
