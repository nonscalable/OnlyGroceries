import './app.css'
import { mount } from 'svelte'

import Layout from './layout.svelte'
import { initializeTheme } from '$stores/theme'

initializeTheme()

let target = document.getElementById('app')
let splash = document.getElementById('app-splash')

if (target) {
	mount(Layout, { target })

	requestAnimationFrame(() => {
		splash?.classList.add('hide')
		window.setTimeout(() => {
			splash?.remove()
			splash = null
		}, 220)
	})
} else {
	splash?.remove()
}
