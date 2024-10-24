import { createRouter } from '@nanostores/router'

export const router = createRouter({
  start: '/',
  home: '/home/:id',
  occasional: '/occasional'
})
