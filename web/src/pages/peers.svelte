<script lang="ts">
  import { peersStore } from '$stores/peers.svelte'
</script>

<main class="container pt-2">
  <section class="space-y-6">
    <h1 class="text-3xl font-bold">Discovered Peers</h1>

    <section class="rounded-lg border p-4">
      <h2 class="mb-2 text-lg font-semibold">My Node ID</h2>
      {#if peersStore.myNodeId}
        <p class="break-all font-mono text-sm">{peersStore.myNodeId}</p>
      {:else}
        <p class="text-muted-foreground italic">Initializing...</p>
      {/if}
    </section>

    {#if peersStore.uniquePeers.length === 0}
      <p class="text-muted-foreground text-center italic">
        No peers discovered yet
      </p>
    {:else}
      <ul class="space-y-3">
        {#each peersStore.uniquePeers as peer (peer.node_id)}
          <li class="rounded-lg border p-4">
            <div class="break-all font-mono text-sm">
              <span class="font-semibold">Node ID:</span>
              {peer.node_id}
            </div>
            {#if peer.addrs.length > 0}
              <div class="mt-2">
                <span class="text-sm font-semibold">Addresses:</span>
                <ul class="mt-1 space-y-1">
                  {#each peer.addrs as addr}
                    <li
                      class="text-muted-foreground break-all font-mono text-xs"
                    >
                      {addr}
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</main>
