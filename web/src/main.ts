import './app.css'
import { mount } from 'svelte'

import Layout from './layout.svelte'
import { initializeTheme } from '$stores/theme'

initializeTheme()

let target = document.getElementById('app')
if (target) mount(Layout, { target })
