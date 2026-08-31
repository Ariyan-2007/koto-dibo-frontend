import { useOnlineStatus } from '@/lib/useOnlineStatus'
import { useOfflineQueueStore } from '@/lib/offlineQueue'
import { WifiOff } from '@/components/ui/icons'
import { Badge } from '@/components/ui/Badge'

export function OfflineBadge() {
  const isOnline = useOnlineStatus()
  const pendingCount = useOfflineQueueStore((s) => s.pendingCount)

  if (isOnline && pendingCount === 0) return null

  return (
    <Badge tone={isOnline ? 'primary' : 'danger'} className="gap-1">
      <WifiOff width={13} height={13} />
      {!isOnline ? 'Offline' : `Syncing ${pendingCount}…`}
    </Badge>
  )
}
