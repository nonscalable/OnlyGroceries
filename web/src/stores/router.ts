import { createRouter } from '@nanostores/router'

const routes = {
  main: '/main',
  special: '/special/:id',
  settings: '/settings'
} as const

export const router = createRouter(routes)

export type RouteName = keyof typeof routes
