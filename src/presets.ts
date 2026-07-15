import type { ModuleSchema } from './main.js'
import type ModuleInstance from './main.js'
import { combineRgb, type CompanionPresetDefinitions, type CompanionPresetSection } from '@companion-module/base'

const WHITE = combineRgb(255, 255, 255)
const BLACK = combineRgb(0, 0, 0)

export function UpdatePresets(self: ModuleInstance): void {
	const presets: CompanionPresetDefinitions<ModuleSchema> = {}

	presets['go'] = {
		type: 'simple',
		name: 'GO',
		style: {
			text: 'GO\\n$(liveplay:next_name)',
			size: 'auto',
			color: WHITE,
			bgcolor: combineRgb(0, 102, 0),
			show_topbar: false,
		},
		steps: [{ down: [{ actionId: 'go', options: {} }], up: [] }],
		feedbacks: [],
	}

	presets['now_playing'] = {
		type: 'simple',
		name: 'Now playing display',
		style: {
			text: '$(liveplay:current_item)\\n-$(liveplay:remaining)',
			size: 'auto',
			color: WHITE,
			bgcolor: BLACK,
			show_topbar: false,
		},
		steps: [],
		feedbacks: [
			{
				feedbackId: 'anything_playing',
				options: {},
				style: { bgcolor: combineRgb(0, 102, 0), color: WHITE },
			},
		],
	}

	presets['stop_all'] = {
		type: 'simple',
		name: 'Stop all (fade)',
		style: {
			text: 'STOP ALL',
			size: 'auto',
			color: WHITE,
			bgcolor: combineRgb(102, 0, 0),
			show_topbar: false,
		},
		steps: [{ down: [{ actionId: 'stop_all', options: { fade: '' } }], up: [] }],
		feedbacks: [],
	}

	presets['panic'] = {
		type: 'simple',
		name: 'Panic (instant stop all)',
		style: {
			text: 'PANIC',
			size: 'auto',
			color: WHITE,
			bgcolor: combineRgb(204, 0, 0),
			show_topbar: false,
		},
		steps: [{ down: [{ actionId: 'panic', options: {} }], up: [] }],
		feedbacks: [],
	}

	const cartPresetIds: string[] = []
	for (let slot = 1; slot <= 8; slot++) {
		const id = `cart_${slot}`
		cartPresetIds.push(id)
		presets[id] = {
			type: 'simple',
			name: `Cart slot ${slot}`,
			style: {
				text: `CART\\n${slot}`,
				size: 'auto',
				color: WHITE,
				bgcolor: combineRgb(0, 51, 102),
				show_topbar: false,
			},
			steps: [{ down: [{ actionId: 'cart_play', options: { slot } }], up: [] }],
			feedbacks: [
				{
					feedbackId: 'cart_active',
					options: { slot },
					style: { bgcolor: combineRgb(0, 204, 0), color: BLACK },
				},
			],
		}
	}

	presets['master_gain_up'] = {
		type: 'simple',
		name: 'Master gain +1 dB',
		style: {
			text: 'MASTER\\n+1 dB',
			size: 'auto',
			color: WHITE,
			bgcolor: BLACK,
			show_topbar: false,
		},
		steps: [{ down: [{ actionId: 'master_gain_step', options: { delta: 1 } }], up: [] }],
		feedbacks: [],
	}

	presets['master_gain_down'] = {
		type: 'simple',
		name: 'Master gain -1 dB',
		style: {
			text: 'MASTER\\n-1 dB',
			size: 'auto',
			color: WHITE,
			bgcolor: BLACK,
			show_topbar: false,
		},
		steps: [{ down: [{ actionId: 'master_gain_step', options: { delta: -1 } }], up: [] }],
		feedbacks: [],
	}

	presets['master_gain_display'] = {
		type: 'simple',
		name: 'Master gain display',
		style: {
			text: 'MASTER\\n$(liveplay:master_gain) dB',
			size: 'auto',
			color: WHITE,
			bgcolor: BLACK,
			show_topbar: false,
		},
		steps: [],
		feedbacks: [],
	}

	presets['limiter'] = {
		type: 'simple',
		name: 'Limiter toggle',
		style: {
			text: 'LIMITER\\n$(liveplay:limiter)',
			size: 'auto',
			color: WHITE,
			bgcolor: BLACK,
			show_topbar: false,
		},
		steps: [{ down: [{ actionId: 'limiter', options: { mode: 'toggle' } }], up: [] }],
		feedbacks: [
			{
				feedbackId: 'limiter_enabled',
				options: {},
				style: { bgcolor: combineRgb(0, 102, 153), color: WHITE },
			},
			{
				feedbackId: 'limiter_engaged',
				options: {},
				style: { bgcolor: combineRgb(204, 0, 0), color: WHITE },
			},
		],
	}

	presets['connection'] = {
		type: 'simple',
		name: 'Connection status',
		style: {
			text: 'LivePlay\\n$(liveplay:project_name)',
			size: 'auto',
			color: WHITE,
			bgcolor: combineRgb(102, 0, 0),
			show_topbar: false,
		},
		steps: [],
		feedbacks: [
			{
				feedbackId: 'connected',
				options: {},
				style: { bgcolor: combineRgb(0, 102, 0), color: WHITE },
			},
		],
	}

	const structure: CompanionPresetSection[] = [
		{
			id: 'transport',
			name: 'Transport',
			definitions: [
				{
					id: 'transport_main',
					name: 'Transport',
					description: 'GO, stop all and now-playing display',
					type: 'simple',
					presets: ['go', 'now_playing', 'stop_all', 'panic'],
				},
			],
		},
		{
			id: 'cart',
			name: 'Cart',
			definitions: [
				{
					id: 'cart_slots',
					name: 'Cart slots',
					description: 'Trigger cart slots 1-8 (add more via the Trigger cart slot action)',
					type: 'simple',
					presets: cartPresetIds,
				},
			],
		},
		{
			id: 'master',
			name: 'Master section',
			definitions: [
				{
					id: 'master_main',
					name: 'Master gain & limiter',
					description: 'Master gain control and limiter toggle',
					type: 'simple',
					presets: ['master_gain_down', 'master_gain_display', 'master_gain_up', 'limiter'],
				},
			],
		},
		{
			id: 'status',
			name: 'Status',
			definitions: [
				{
					id: 'status_main',
					name: 'Status',
					description: 'Connection and project status',
					type: 'simple',
					presets: ['connection'],
				},
			],
		},
	]

	self.setPresetDefinitions(structure, presets)
}
