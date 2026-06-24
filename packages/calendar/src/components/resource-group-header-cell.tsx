import { Button } from '@ilamy/ui/components/button'
import { cn } from '@ilamy/ui/lib/utils'
import { Minus, Plus } from 'lucide-react'
import type React from 'react'
import { useSmartCalendarContext } from '@/features/calendar/hooks/use-smart-calendar-context'
import { keys } from '@/lib/utils/keys'

interface ResourceGroupHeaderCellProps {
	groupId: string | number
	title: string
	className?: string
}

export const ResourceGroupHeaderCell: React.FC<ResourceGroupHeaderCellProps> = ({
	groupId,
	title,
	className,
}) => {
	const { isResourceGroupCollapsed, toggleResourceGroup, t } =
		useSmartCalendarContext((ctx) => ({
			isResourceGroupCollapsed: ctx.isResourceGroupCollapsed,
			toggleResourceGroup: ctx.toggleResourceGroup,
			t: ctx.t,
		}))

	const collapsed = isResourceGroupCollapsed(groupId)

	return (
		<div
			className={cn(
				'flex items-center gap-2 border-r bg-muted/80 px-2 py-1 text-muted-foreground sticky left-0 z-20 h-full shadow-[inset_0_-1px_0_hsl(var(--border))]',
				className
			)}
			data-testid={keys.resourceGroup.header(groupId)}
		>
			<Button
				aria-expanded={!collapsed}
				aria-label={
					collapsed ? t('expandResourceGroup') : t('collapseResourceGroup')
				}
				className="size-6 shrink-0"
				data-testid={keys.resourceGroup.toggle(groupId)}
				onClick={() => toggleResourceGroup(groupId)}
				size="icon"
				type="button"
				variant="secondary"
			>
				{collapsed ? <Plus className="size-3" /> : <Minus className="size-3" />}
			</Button>
			<div className="min-w-0 truncate text-xs font-semibold uppercase">
				{title}
			</div>
		</div>
	)
}
