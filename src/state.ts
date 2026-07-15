import { Transport, transportFromString, type CatalogItem, type StateSummary } from './liveplay.js'

/** An on-air item as cached by the module (includes paused items). */
export interface PlayingItem {
	itemUuid: string
	cueId: string
	name: string
	index?: number[]
	transport: Transport
	elapsedSec: number
	durationSec: number | null
	/** playheadSec - elapsedSec (the inPoint trim), used to derive elapsed from meter playheads. */
	playheadOffsetSec: number
}

/**
 * Cached mirror of the LivePlay server state. The server is the single
 * authority; this is only ever written from the REST summary and WS push
 * stream, never from assumptions about our own actions' outcomes.
 */
export class LivePlayState {
	serverVersion = ''
	projectName = ''
	hasOpenProject = false
	itemCount = 0
	audioLoading = false

	/** On-air items (including paused), keyed by itemUuid. */
	playing = new Map<string, PlayingItem>()
	/** Engine cue id -> project item uuid (cue ids change across loads). */
	cueToItem = new Map<string, string>()

	next: { itemUuid: string; name: string; source: string } | null = null

	masterGainDb = 0
	limiterEnabled = false
	/** True while the limiter is actively reducing gain (from meter data). */
	limiterEngaged = false

	/** Bound cart slots (0-based), slot -> item. */
	cart = new Map<number, { itemUuid: string; name: string }>()

	previewActive = false
	previewItemUuid = ''

	/** K-weighted momentary / short-term loudness of master channel 0, dB. */
	lufsM: number | null = null
	lufsS: number | null = null

	/** All project items (from the full project document), keyed by uuid, document order. */
	catalog = new Map<string, CatalogItem>()

	applySummary(s: StateSummary): void {
		this.serverVersion = s.server?.version ?? this.serverVersion
		this.projectName = s.project?.name ?? ''
		this.hasOpenProject = s.project?.hasOpenProject ?? false
		this.itemCount = s.project?.itemCount ?? 0
		this.audioLoading = s.project?.audioLoading ?? false

		this.playing.clear()
		for (const p of s.playing ?? []) {
			this.cueToItem.set(p.cueId, p.itemUuid)
			this.playing.set(p.itemUuid, {
				itemUuid: p.itemUuid,
				cueId: p.cueId,
				name: p.name,
				index: p.index,
				transport: transportFromString(p.transport),
				elapsedSec: p.elapsedSec,
				durationSec: p.durationSec,
				playheadOffsetSec: (p.playheadSec ?? 0) - (p.elapsedSec ?? 0),
			})
		}

		this.next = s.next ? { itemUuid: s.next.itemUuid, name: s.next.name, source: s.next.source } : null

		this.masterGainDb = s.master?.gainDb ?? this.masterGainDb
		this.limiterEnabled = s.master?.limiterEnabled ?? this.limiterEnabled

		this.cart.clear()
		for (const c of s.cart ?? []) {
			this.cart.set(c.slot, { itemUuid: c.itemUuid, name: c.name })
		}

		this.previewActive = s.preview?.active ?? false
		this.previewItemUuid = s.preview?.itemUuid ?? ''
	}

	/** Replace the item catalog. Returns true when anything actually changed. */
	applyCatalog(items: CatalogItem[]): boolean {
		let changed = items.length !== this.catalog.size
		if (!changed) {
			const old = [...this.catalog.values()]
			changed = items.some(
				(item, i) =>
					old[i].uuid !== item.uuid ||
					old[i].name !== item.name ||
					(old[i].index ?? []).join(',') !== (item.index ?? []).join(','),
			)
		}
		if (changed) {
			this.catalog.clear()
			for (const item of items) this.catalog.set(item.uuid, item)
		}
		return changed
	}

	/** Best-known display name for an item uuid ('' when unknown). */
	itemName(uuid: string): string {
		const fromCatalog = this.catalog.get(uuid)?.name
		if (fromCatalog) return fromCatalog
		const fromPlaying = this.playing.get(uuid)?.name
		if (fromPlaying) return fromPlaying
		if (this.next?.itemUuid === uuid) return this.next.name
		for (const bound of this.cart.values()) {
			if (bound.itemUuid === uuid) return bound.name
		}
		return ''
	}

	clearPlayback(): void {
		this.playing.clear()
		this.lufsM = null
		this.lufsS = null
		this.limiterEngaged = false
	}

	itemTransport(itemUuid: string): Transport | null {
		return this.playing.get(itemUuid)?.transport ?? null
	}

	/** On air = present in playing (paused counts). */
	isOnAir(itemUuid: string): boolean {
		return this.playing.has(itemUuid)
	}

	/** Actively sounding: playing or fading, not paused. */
	isAudible(itemUuid: string): boolean {
		const t = this.itemTransport(itemUuid)
		return t === Transport.Playing || t === Transport.FadingIn || t === Transport.FadingOut
	}

	isPaused(itemUuid: string): boolean {
		return this.itemTransport(itemUuid) === Transport.Paused
	}

	/** First non-paused on-air item, falling back to the first paused one. */
	currentItem(): PlayingItem | null {
		let firstPaused: PlayingItem | null = null
		for (const p of this.playing.values()) {
			if (p.transport !== Transport.Paused) return p
			firstPaused ??= p
		}
		return firstPaused
	}

	anythingAudible(): boolean {
		for (const p of this.playing.values()) {
			if (p.transport !== Transport.Paused) return true
		}
		return false
	}

	/** Is the item bound to the given 0-based cart slot currently audible? */
	isCartSlotActive(slot: number): boolean {
		const bound = this.cart.get(slot)
		return bound ? this.isAudible(bound.itemUuid) : false
	}
}
