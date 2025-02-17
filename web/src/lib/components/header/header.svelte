<script lang="ts">
  import { buttonVariants } from '$lib/components/ui/button/button.svelte'
  import SidebarTrigger from '../ui/sidebar/sidebar-trigger.svelte'

  const date = new Date()
  const formattedDate = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`
</script>

<header class="border-b p-2">
  <div class="grid grid-cols-3">
    <SidebarTrigger
      class="justify-self-start {buttonVariants({
        variant: 'ghost',
        size: 'icon'
      })} [&_svg]:size-5"
    />

    <h1 class="justify-self-center text-4xl font-extrabold tracking-tight">
      {formattedDate}
    </h1>
  </div>
</header>
