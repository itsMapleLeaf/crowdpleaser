import {
	addEffect,
	discardHand,
	drawCards,
	energize,
	type GameState,
} from "./GameState.ts"

export type Technique = {
	name: string
	description: string
	cost: number
	replay?: number
	play: (state: GameState) => Partial<GameState>
	computed?: (state: GameState) => Technique // how this card actually renders while in hand
}

export type TechniqueEffect =
	| { type: "updateState"; patch: Partial<GameState> }
	| { type: "draw"; count: number }
	| { type: "discardHand" }

export const techniques: Technique[] = [
	// bocchi (focus: techniques)
	{
		name: "Take a Breather",
		description: `Draw 3 techniques`,
		cost: 2,
		play: (state) => drawCards(state, 3),
	},
	{
		name: "Indecision",
		description: `Discard all techniques, then draw 1 per discarded technique`,
		cost: 1,
		play: (state) => {
			const count = state.hand.length
			state = discardHand(state)
			state = drawCards(state, count)
			return state
		},
	},

	// kita (focus: audience and cheers)
	{
		name: "Appeal",
		cost: 1,
		description: "+7 Audience",
		play: (state) => ({ audience: state.audience + 7 }),
	},
	{
		name: "Hype",
		cost: 2,
		description: `Replay 2: Energize`,
		replay: 2,
		play: (state) => energize(state),
	},

	// dorito (momentum)
	{
		name: "Patience",
		cost: 2,
		description: `Combo: +1 Momentum`,
		play: (state) => {
			return addEffect(state, {
				name: "Combo: +1 Momentum",
				source: "Patience",
				combo: (state) => ({ momentum: state.momentum + 1 }),
			})
		},
	},

	// ryo (stamina & meta trickery)
]
