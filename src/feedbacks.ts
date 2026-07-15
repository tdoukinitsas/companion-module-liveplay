import { combineRgb } from '@companion-module/base'
import type ModuleInstance from './main.js'

export type FeedbacksSchema = {
	connected: { type: 'boolean'; options: Record<string, never> }
	project_loaded: { type: 'boolean'; options: Record<string, never> }
	item_playing: { type: 'boolean'; options: { uuid: string } }
	item_paused: { type: 'boolean'; options: { uuid: string } }
	anything_playing: { type: 'boolean'; options: Record<string, never> }
	cart_active: { type: 'boolean'; options: { slot: number } }
	limiter_enabled: { type: 'boolean'; options: Record<string, never> }
	limiter_engaged: { type: 'boolean'; options: Record<string, never> }
	preview_active: { type: 'boolean'; options: Record<string, never> }
}

const UUID_TOOLTIP = 'The item UUID from the LivePlay project.'

export function UpdateFeedbacks(self: ModuleInstance): void {
	self.setFeedbackDefinitions({
		connected: {
			name: 'Connected to LivePlay',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(0, 102, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => self.connected,
		},
		project_loaded: {
			name: 'Project loaded',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(0, 51, 102),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => self.state.hasOpenProject,
		},
		item_playing: {
			name: 'Item is playing',
			description: 'True while the item is sounding (playing or fading). Paused items are not "playing".',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(0, 204, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [{ id: 'uuid', type: 'textinput', label: 'Item UUID', tooltip: UUID_TOOLTIP, default: '' }],
			callback: (feedback) => self.state.isAudible(feedback.options.uuid.trim()),
		},
		item_paused: {
			name: 'Item is paused',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(255, 153, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [{ id: 'uuid', type: 'textinput', label: 'Item UUID', tooltip: UUID_TOOLTIP, default: '' }],
			callback: (feedback) => self.state.isPaused(feedback.options.uuid.trim()),
		},
		anything_playing: {
			name: 'Anything is playing',
			description: 'True while at least one item is sounding (paused items do not count).',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(0, 204, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [],
			callback: () => self.state.anythingAudible(),
		},
		cart_active: {
			name: 'Cart slot is playing',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(0, 204, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'slot',
					type: 'number',
					label: 'Slot (1-64)',
					tooltip: 'Cart slot as shown in the LivePlay UI (1-based).',
					default: 1,
					min: 1,
					max: 64,
				},
			],
			callback: (feedback) => self.state.isCartSlotActive(feedback.options.slot - 1),
		},
		limiter_enabled: {
			name: 'Limiter enabled',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(0, 102, 153),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => self.state.limiterEnabled,
		},
		limiter_engaged: {
			name: 'Limiter engaged (reducing gain)',
			description: 'True while the limiter is actively reducing the master output level.',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(204, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => self.state.limiterEngaged,
		},
		preview_active: {
			name: 'Preview (pre-listen) active',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(153, 51, 204),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => self.state.previewActive,
		},
	})
}
