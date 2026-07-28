import type ModuleInstance from './main.js'
import { formatTime, Transport } from './liveplay.js'
import { strings } from './locale.js'

/** Cart slots surfaced as variables — matches the 16 slots of LivePlay's cart wall. */
export const CART_SLOTS = 16

export type VariablesSchema = {
	project_name: string
	item_count: number
	playing_count: number
	current_item: string
	current_item_uuid: string
	current_color: string
	current_state: string
	elapsed: string
	remaining: string
	duration: string
	warn_level: string
	next_name: string
	next_uuid: string
	next_color: string
	next_index: string
	next_source: string
	selected_name: string
	selected_uuid: string
	selected_color: string
	selected_index: string
	show_mode: string
	locale: string
	master_gain: string
	limiter: string
	lufs_m: string
	lufs_s: string
	server_version: string
	// Per-item name variables generated from the project catalog:
	// item_name_<uuid> and item_name_at_<index path joined by _>
	// Per-cart-slot: cart_<n>_name, cart_<n>_uuid, cart_<n>_color
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

/** Human-readable transport state, in the operator's language where LivePlay has a word for it. */
function transportLabel(t: Transport | undefined, locale: string): string {
	const s = strings(locale)
	switch (t) {
		case Transport.Playing:
			return s.playing
		case Transport.FadingIn:
			return 'Fading in'
		case Transport.FadingOut:
			return 'Fading out'
		case Transport.Paused:
			return s.pause
		default:
			return ''
	}
}

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	const definitions: Parameters<typeof self.setVariableDefinitions>[0] = {
		project_name: { name: 'Project name' },
		item_count: { name: 'Top-level item count' },
		playing_count: { name: 'Number of on-air items (includes paused)' },
		current_item: { name: 'Current item name (most recently triggered)' },
		current_item_uuid: { name: 'Current item UUID' },
		current_color: { name: 'Current item colour (#RRGGBB)' },
		current_state: { name: 'Current item transport state' },
		elapsed: { name: 'Current item elapsed (mm:ss)' },
		remaining: { name: 'Current item remaining (mm:ss)' },
		duration: { name: 'Current item duration (mm:ss)' },
		warn_level: { name: 'End-of-cue warning (yellow/orange/red, blank when clear)' },
		next_name: { name: 'Up Next item name' },
		next_uuid: { name: 'Up Next item UUID' },
		next_color: { name: 'Up Next item colour (#RRGGBB)' },
		next_index: { name: 'Up Next item index path' },
		next_source: { name: 'Up Next source (override / auto)' },
		selected_name: { name: 'Selected item name' },
		selected_uuid: { name: 'Selected item UUID' },
		selected_color: { name: 'Selected item colour (#RRGGBB)' },
		selected_index: { name: 'Selected item index path' },
		show_mode: { name: 'Show Mode (On/Off)' },
		locale: { name: 'LivePlay display locale' },
		master_gain: { name: 'Master gain (dB)' },
		limiter: { name: 'Limiter enabled (On/Off)' },
		lufs_m: { name: 'Master loudness, momentary (K-weighted dB)' },
		lufs_s: { name: 'Master loudness, short-term (K-weighted dB)' },
		server_version: { name: 'LivePlay server version' },
	}

	for (let slot = 1; slot <= CART_SLOTS; slot++) {
		definitions[`cart_${slot}_name`] = { name: `Cart slot ${slot}: item name` }
		definitions[`cart_${slot}_uuid`] = { name: `Cart slot ${slot}: item UUID` }
		definitions[`cart_${slot}_color`] = { name: `Cart slot ${slot}: item colour (#RRGGBB)` }
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
	const remaining = state.remainingSec(current)
	const fmtDb = (db: number | null): string => (db === null || !Number.isFinite(db) ? '-' : db.toFixed(1))
	const fmtIndex = (index: number[] | undefined): string => (index && index.length > 0 ? index.join(',') : '')

	const itemNames: Partial<VariablesSchema> = {}
	for (const item of state.catalog.values()) {
		itemNames[itemNameByUuidVariable(item.uuid)] = item.name
		const byIndex = itemNameByIndexVariable(item.index)
		if (byIndex) itemNames[byIndex] = item.name
	}

	const cartValues: Partial<VariablesSchema> = {}
	for (let slot = 1; slot <= CART_SLOTS; slot++) {
		const bound = state.cart.get(slot - 1)
		cartValues[`cart_${slot}_name`] = bound?.name ?? ''
		cartValues[`cart_${slot}_uuid`] = bound?.itemUuid ?? ''
		cartValues[`cart_${slot}_color`] = bound?.color ?? ''
	}

	return {
		...itemNames,
		...cartValues,
		project_name: state.projectName,
		item_count: state.itemCount,
		playing_count: state.playing.size,
		current_item: current?.name ?? '',
		current_item_uuid: current?.itemUuid ?? '',
		current_color: current?.color ?? '',
		current_state: transportLabel(current?.transport, state.locale),
		elapsed: current ? formatTime(current.elapsedSec) : '-',
		remaining: remaining !== null ? formatTime(remaining) : '-',
		duration: current ? formatTime(current.durationSec) : '-',
		// Blank rather than 'none' so `$(liveplay:warn_level)` can be dropped
		// straight into button text without reading as noise when all is well.
		warn_level: current && !state.isPaused(current.itemUuid) ? (self.warnLevelOf(remaining) ?? '') : '',
		next_name: state.next?.name ?? '',
		next_uuid: state.next?.itemUuid ?? '',
		next_color: state.next?.color ?? '',
		next_index: fmtIndex(state.next?.index),
		next_source: state.next?.source ?? '',
		selected_name: state.selection?.name ?? '',
		selected_uuid: state.selection?.itemUuid ?? '',
		selected_color: state.selection?.color ?? '',
		selected_index: fmtIndex(state.selection?.index),
		show_mode: state.showMode ? 'On' : 'Off',
		locale: state.locale,
		master_gain: state.masterGainDb.toFixed(1),
		limiter: state.limiterEnabled ? 'On' : 'Off',
		lufs_m: fmtDb(state.lufsM),
		lufs_s: fmtDb(state.lufsS),
		server_version: state.serverVersion,
	}
}
