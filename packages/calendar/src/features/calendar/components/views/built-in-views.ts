import type { PluginView } from '@ilamy/types'
import { dayView } from './day'
import { monthView } from './month'
import { weekView } from './week'
import { yearView } from './year'
import { resourceYearView } from './resource-year'
import { twoWeekView } from './two-week-resource'

/** The core's own views, resolved exactly like plugin views (prepended first). */
export const builtInViews: PluginView[] = [
	// dayView,
	weekView,
	twoWeekView,
	monthView(1),
	monthView(2),
	monthView(3),
	monthView(6),
	// twoMonthView,
	yearView,
	resourceYearView,
]
