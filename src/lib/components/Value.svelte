<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip';

	type Props = {
		value: number;
		decimals?: number;
		prefix?: string;
		suffix?: string;
		class?: string;
	};
	let { value, decimals = 0, prefix, suffix, class: classNameProp }: Props = $props();

	let containerWidth: number = $state(0);
	let fullValueWidth: number = $state(0);

	const shortFormatter = $derived(
		new Intl.NumberFormat('en-US', {
			notation: 'compact',
			compactDisplay: 'short',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		})
	);
	const shortValue = $derived.by(() => {
		let formatted = shortFormatter.format(value);
		if (prefix) formatted = `${prefix}${formatted}`;
		if (suffix) formatted = `${formatted}${suffix}`;
		return formatted;
	});

	const fullFormatter = new Intl.NumberFormat('en-US');
	const fullValue = $derived.by(() => {
		let formatted = fullFormatter.format(value);
		if (prefix) formatted = `${prefix}${formatted}`;
		if (suffix) formatted = `${formatted}${suffix}`;
		return formatted;
	});

	let truncated = $derived(fullValueWidth > containerWidth);

	const className = $derived(`tabular-nums font-semibold text-2xl ${classNameProp}`);
</script>

<Tooltip.Root disabled={!truncated}>
	<Tooltip.Trigger>
		{#snippet child({ props })}
			<div
				bind:clientWidth={containerWidth}
				{...props}
				class="min-w-0 cursor-auto overflow-hidden text-nowrap {className}"
			>
				{truncated ? shortValue : fullValue}
				<div
					bind:clientWidth={fullValueWidth}
					class="height-0 invisible absolute w-fit {className}"
					aria-hidden="true"
				>
					{fullValue}
				</div>
			</div>
		{/snippet}
	</Tooltip.Trigger>
	<Tooltip.Content>
		{fullValue}
	</Tooltip.Content>
</Tooltip.Root>
