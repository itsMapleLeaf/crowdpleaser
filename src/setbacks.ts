import type { GameState } from "./GameState.ts"

export type Setback = {
	name: string
	description: string
	apply?: (state: GameState) => void
}

export const setbacks: Setback[] = [
	{
		name: "High Expectations",
		description: `-3 momentum`,
		apply: (state) => {
			state.momentum -= 3
		},
	},
	{
		name: "Trying Too Hard",
		description: `Combo: Decrease audience by momentum`,
		apply: (state) => {
			state.addPendingEffect({
				name: "Combo: Decrease audience by momentum",
				source: "Trying Too Hard",
				combo: (state) => {
					state.audience -= state.momentum
				},
			})
		},
	},
	{
		name: "Stress",
		description: `Draw 2 less cards`,
		apply: (state) => {
			// basically, take the last two cards drawn and put them back at the top
			// as if they weren't drawn
			state.deck.unshift(...state.baseHand.splice(state.baseHand.length - 2))
		},
	},
	{
		name: "Doubt",
		description: `Combo: -1 momentum`,
		apply: (state) => {
			state.addPendingEffect({
				name: "Combo: -1 Momentum",
				source: "Doubt",
				combo: (state) => {
					state.momentum -= 1
				},
			})
		},
	},
	{
		name: "Exhaustion",
		description: `Combo: -1 stamina`,
		apply: (state) => {
			state.addPendingEffect({
				name: "Combo: -1 Stamina",
				source: "Exhaustion",
				combo: (state) => {
					state.stamina = Math.max(0, state.stamina - 1)
				},
			})
		},
	},
	{
		name: "Small Venue",
		description: `You cannot gain audience this round`,
		apply(game) {
			game.addPendingEffect({
				name: "No Audience Gain",
				source: "Small Venue",
				roundDuration: 1,
				*interceptUpdate(game) {
					const { audience } = game
					yield
					game.audience = Math.min(audience, game.audience)
				},
			})
		},
	},
	{
		name: "In a Rut",
		description: `You cannot gain momentum this round`,
		apply: (state) => {
			state.addPendingEffect({
				name: "No Momentum Gain",
				source: "In a Rut",
				roundDuration: 1,
				*interceptUpdate(state) {
					const { momentum } = state
					yield
					state.momentum = Math.min(momentum, state.momentum)
				},
			})
		},
	},
	{
		name: "Demoralized",
		description: `Remove all active effects`,
		apply: (state) => {
			state.effects = []
		},
	},
]
