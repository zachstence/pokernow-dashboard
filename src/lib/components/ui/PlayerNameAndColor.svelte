<script lang="ts">
	type Props = {
		player: {
			displayName: string;
			color: string;
		};
	};
	let { player }: Props = $props();
</script>

<div class="flex items-center gap-2">
	<div class="size-4 rounded-sm" style="background: {player.color}"></div>
	<div>{player.displayName}</div>
</div>
