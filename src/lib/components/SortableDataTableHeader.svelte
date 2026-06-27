<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import MoveUpIcon from '@lucide/svelte/icons/move-up';
	import MoveDownIcon from '@lucide/svelte/icons/move-down';
	import * as Tooltip from './ui/tooltip';

	type Props = {
		label: string;
		info?: string;
		onclick?: (...args: unknown[]) => void;
		direction?: 'asc' | 'desc' | undefined;
	};
	let { label, info, onclick, direction }: Props = $props();
</script>

<div class="flex items-center gap-0.5">
	<Tooltip.Root disabled={!info}>
		<Tooltip.Trigger
			class={info ? 'cursor-help underline decoration-muted-foreground decoration-dashed' : ''}
		>
			{label}
		</Tooltip.Trigger>
		<Tooltip.Content>
			{info}
		</Tooltip.Content>
	</Tooltip.Root>
	<Button {onclick} variant="ghost" size="icon-sm" class="size-6">
		<MoveUpIcon
			class="-mr-1 size-3.5 transition-opacity {direction === 'desc' ? 'opacity-20' : ''}"
		/>
		<MoveDownIcon
			class="-ml-1 size-3.5 transition-opacity {direction === 'asc' ? 'opacity-20' : ''}"
		/>
	</Button>
</div>
