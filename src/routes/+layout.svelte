<script>
	import '../app.css';
	import Toast from '$lib/components/layout/Toast.svelte';

	let { children } = $props();
</script>

{@render children()}
<Toast />
