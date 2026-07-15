import type ModuleInstance from './main.js'
import { formatTime } from './liveplay.js'

export type VariablesSchema = {
	project_name: string
	item_count: number
	playing_count: number
	current_item: string
	current_item_uuid: string
	elapsed: string
	remaining: string
	duration: string
	next_name: string
	next_uuid: string
	master_gain: string
	limiter: string
	lufs_m: string
	lufs_s: string
	server_version: string
	// Per-item name variables generated from the project catalog:
	// item_name_<uuid> and item_name_at_<index path joined by _>
} & Record<string, string | number>

/** Variable id for an item's name addressed by uuid. */
export function itemNameByUuidVariable(uuid: string): string {
	return `item_name_${uuid}`
}

/** Variable id for an item's name addressed by index path, or null for cart-only (-1) paths. */
export function itemNameByIndexVariable(index: number[] | undefined): string | null {
	if (!index || index.length === 0 || index.some((i) => i < 0)) return null
	return `item_name_at_${index.join('_')}`
}

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	const definitions: Parameters<typeof self.setVariableDefinitions>[0] = {
		project_name: { name: 'Project name' },
		item_count: { name: 'Top-level item count' },
		playing_count: { name: 'Number of on-air items (includes paused)' },
		current_item: { name: 'Current item name' },
		current_item_uuid: { name: 'Current item UUID' },
		elapsed: { name: 'Current item elapsed (mm:ss)' },
		remaining: { name: 'Current item remaining (mm:ss)' },
		duration: { name: 'Current item duration (mm:ss)' },
		next_name: { name: 'Up Next item name' },
		next_uuid: { name: 'Up Next item UUID' },
		master_gain: { name: 'Master gain (dB)' },
		limiter: { name: 'Limiter enabled (On/Off)' },
		lufs_m: { name: 'Master loudness, momentary (K-weighted dB)' },
		lufs_s: { name: 'Master loudness, short-term (K-weighted dB)' },
		server_version: { name: 'LivePlay server version' },
	}

	for (const item of self.state.catalog.values()) {
		definitions[itemNameByUuidVariable(item.uuid)] = { name: `Item name by UUID: ${item.name}` }
		const byIndex = itemNameByIndexVariable(item.index)
		if (byIndex) definitions[byIndex] = { name: `Item name at index ${item.index?.join(',')}: ${item.name}` }
	}

	self.setVariableDefinitions(definitions)
}

/** Compute the full set of variable values from the cached state. */
export function CollectVariableValues(self: ModuleInstance): Partial<VariablesSchema> {
	const state = self.state
	const current = state.currentItem()
	const fmtDb = (db: number | null): string => (db === null || !Number.isFinite(db) ? '-' : db.toFixed(1))

	const itemNames: Partial<VariablesSchema> = {}
	for (const item of state.catalog.values()) {
		itemNames[itemNameByUuidVariable(item.uuid)] = item.name
		const byIndex = itemNameByIndexVariable(item.index)
		if (byIndex) itemNames[byIndex] = item.name
	}

	return {
		...itemNames,
		project_name: state.projectName,
		item_count: state.itemCount,
		playing_count: state.playing.size,
		current_item: current?.name ?? '',
		current_item_uuid: current?.itemUuid ?? '',
		elapsed: current ? formatTime(current.elapsedSec) : '-',
		remaining: current && current.durationSec !== null ? formatTime(current.durationSec - current.elapsedSec) : '-',
		duration: current ? formatTime(current.durationSec) : '-',
		next_name: state.next?.name ?? '',
		next_uuid: state.next?.itemUuid ?? '',
		master_gain: state.masterGainDb.toFixed(1),
		limiter: state.limiterEnabled ? 'On' : 'Off',
		lufs_m: fmtDb(state.lufsM),
		lufs_s: fmtDb(state.lufsS),
		server_version: state.serverVersion,
	}
}
