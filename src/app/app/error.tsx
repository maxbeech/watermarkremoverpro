'use client'

import { RouteError } from '@/components/route-error'

export default function WorkspaceError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError {...props} scope="workspace_route" />
}
