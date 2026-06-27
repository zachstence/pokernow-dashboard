<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import MoveUpIcon from '@lucide/svelte/icons/move-up';
	import MoveDownIcon from '@lucide/svelte/icons/move-down';

	type Props = {
		label: string;
		onclick?: (...args: unknown[]) => void;
		direction?: 'asc' | 'desc' | undefined;
	};
	let { label, onclick, direction }: Props = $props();
</script>

<div class="flex items-center gap-0.5">
	<div>{label}</div>
	<Button {onclick} variant="ghost" size="icon-sm" class="size-6">
		<MoveUpIcon
			class="-mr-1 size-3.5 transition-opacity {direction === 'desc' ? 'opacity-20' : ''}"
		/>
		<MoveDownIcon
			class="-ml-1 size-3.5 transition-opacity {direction === 'asc' ? 'opacity-20' : ''}"
		/>
	</Button>
</div>
