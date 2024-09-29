import './app.css'
import { mount } from 'svelte'
import App from './App.svelte'

let target = document.getElementById('app')
if (target) mount(App, { target })
