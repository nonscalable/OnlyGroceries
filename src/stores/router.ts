import { createRouter } from '@nanostores/router'

const routes = {
  start: '/',
  main: '/main/:id',
  settings: '/settings'
} as const

export const router = createRouter(routes)

export type RouteName = keyof typeof routes
