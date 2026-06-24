import type { Resource } from '@ilamy/types'
import { cn } from '@ilamy/ui/lib/utils'
import { useSmartCalendarContext } from '@/features/calendar/hooks/use-smart-calendar-context'

const readNumber = (
	data: Record<string, unknown> | undefined,
	keys: string[]
): number | undefined => {
	for (const key of keys) {
		const value = data?.[key]
		if (typeof value === 'number' && Number.isFinite(value)) {
			return value
		}
	}
	return undefined
}

const ResourceAvailability: React.FC<{ resource: Resource }> = ({ resource }) => {
	const roomsLeft = readNumber(resource.data, [
		'roomsLeft',
		'availableRooms',
		'available',
		'remaining',
	])
	const totalRooms = readNumber(resource.data, [
		'totalRooms',
		'capacity',
		'total',
		'roomCount',
	])

	if (roomsLeft === undefined && totalRooms === undefined) {
		return null
	}

	return (
		<div className="mt-1 flex w-full items-center justify-center gap-1 text-[11px] leading-tight text-muted-foreground">
			<span className="truncate">
				{roomsLeft !== undefined ? `${roomsLeft} left` : `${totalRooms} total`}
			</span>
			{roomsLeft !== undefined && totalRooms !== undefined && (
				<span className="shrink-0 rounded-sm bg-background/80 px-1 font-medium text-foreground">
					{roomsLeft}/{totalRooms}
				</span>
			)}
		</div>
	)
}

interface ResourceCellProps {
	resource: Resource
	className?: string
	children?: React.ReactNode
	'data-testid'?: string
}

export const ResourceCell: React.FC<ResourceCellProps> = ({
	resource,
	className,
	children,
	'data-testid': dataTestId,
}) => {
	const { renderResource } = useSmartCalendarContext()

	return (
		<div
			className={cn(
				'flex items-center justify-center p-2 border-r last:border-r-0',
				className
			)}
			data-testid={dataTestId}
			style={{
				color: resource.color,
				backgroundColor: resource.backgroundColor,
			}}
		>
			{renderResource
				? renderResource(resource)
				: (children ?? (
						<div className="min-w-0 text-center">
							<div className="truncate text-sm font-medium">{resource.title}</div>
							<ResourceAvailability resource={resource} />
						</div>
					))}
		</div>
	)
}
