import './app.css'
import { mount } from 'svelte'

import Layout from './layout.svelte'

let target = document.getElementById('app')
if (target) mount(Layout, { target })
