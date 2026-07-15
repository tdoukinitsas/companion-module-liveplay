import type { SomeCompanionConfigField } from '@companion-module/base'

export type ModuleConfig = {
	host: string
	port: number
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'static-text',
			id: 'info',
			label: 'Information',
			width: 12,
			value:
				'Controls a LivePlay server (v2.3.5 or later with external-control support) over its REST + WebSocket API. ' +
				'The LivePlay API has no authentication — only use this module on a trusted network.',
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Server IP / hostname',
			width: 8,
			default: '127.0.0.1',
		},
		{
			type: 'number',
			id: 'port',
			label: 'Port',
			width: 4,
			min: 1,
			max: 65535,
			default: 4480,
		},
	]
}
