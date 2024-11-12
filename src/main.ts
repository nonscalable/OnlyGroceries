import './app.css'
import { mount } from 'svelte'
import { openPage } from '@nanostores/router'

import Layout from './Layout.svelte'

let target = document.getElementById('app')
if (target) mount(Layout, { target })
