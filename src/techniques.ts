import { type GameState } from "./GameState.ts"
import type { MaybeFunction } from "./types.ts"

export type Technique = {
	name: string
	description: string
	cost: number
	replay?: number
	play: (state: GameState) => void
}

export type TechniqueResolvable = MaybeFunction<Technique, [state: GameState]>

export const techniques: TechniqueResolvable[] = [
	// bocchi (focus: techniques)
	{
		name: "Take a Breather",
		description: `Draw 3 techniques`,
		cost: 2,
		play: (state) => {
			state.draw(3)
		},
	},
	{
		name: "Indecision",
		description: `Discard all techniques, then draw 1 per discarded technique`,
		cost: 1,
		play: (state) => {
			const count = state.resolvedHand.length
			state.discardHand()
			state.draw(count)
		},
	},
	{
		name: "Overthinking",
		description: `Draw 5 techniques, lose 5 momentum`,
		cost: 2,
		play: (state) => {
			state.draw(5)
			state.momentum -= 5
		},
	},
	{
		name: "Explosion of Talent",
		description: `Replay 2: Increase audience, momentum, and cheers by 1 for each card in hand`,
		cost: 1,
		replay: 2,
		play: (state) => {
			state.audience += state.resolvedHand.length
			state.momentum += state.resolvedHand.length
			state.cheers += state.resolvedHand.length
		},
	},

	// kita (focus: audience and cheers)
	{
		name: "Appeal",
		cost: 1,
		description: "+7 Audience",
		play: (state) => {
			state.audience += 7
		},
	},
	{
		name: "Dress to Impress",
		cost: 1,
		description: `Combo: +1 audience`,
		play: (state) => {
			state.addPendingEffect({
				name: "Combo: +1 Audience",
				source: "Dress to Impress",
				combo: (state) => {
					state.audience += 1
				},
			})
		},
	},
	{
		name: "All Eyes on Me",
		cost: 3,
		description: `Replay 5: +2 audience`,
		replay: 5,
		play: (state) => {
			state.audience += 2
		},
	},
	{
		name: "Hype",
		cost: 3,
		description: `Replay 2: Energize`,
		replay: 2,
		play: (state) => {
			state.energize()
		},
	},

	// doritojika (momentum)
	{
		name: "Patience",
		cost: 2,
		description: `Combo: +1 Momentum`,
		play: (state) => {
			state.addPendingEffect({
				name: "Combo: +1 Momentum",
				source: "Patience",
				combo: (state) => {
					state.momentum += 1
				},
			})
		},
	},
	{
		name: "Connection",
		cost: 2,
		description: `+1 momentum for every 5 audience`,
		play: (state) => {
			state.momentum += Math.floor(state.audience / 5)
		},
	},
	{
		name: "Ringleader",
		cost: 2,
		description: `Replay 5: +1 momentum`,
		replay: 5,
		play: (state) => {
			state.momentum += 1
		},
	},
	{
		name: "Motivate",
		cost: 1,
		description: `Increase momentum by stamina`,
		play: (state) => {
			state.momentum += state.stamina
		},
	},

	// ryo (stamina & meta trickery)
	{
		name: "Leap of Faith",
		cost: 1,
		description: `x2 stamina, discard your hand`,
		play: (state) => {
			state.stamina *= 2
			state.discardHand()
		},
	},
	{
		name: "Cutting Corners",
		cost: 1,
		description: `Next technique costs 0 stamina`,
		play: (state) => {
			state.addPendingEffect({
				name: "Next technique costs 0 stamina",
				source: "Cutting Corners",
				handDuration: 1,
				modifyTechnique: () => ({ cost: 0 }),
			})
		},
	},
	(state) => {
		const lastPlayed = state.techniqueHistory.findLast(
			({ technique }) => technique.name !== "Do What Works",
		)?.technique
		const lastPlayedDescription = lastPlayed?.description ?? "Nothing"
		return {
			name: "Do What Works",
			cost: 2,
			description: `Replay your last played technique (${lastPlayedDescription})`,
			play: () => {
				lastPlayed?.play(state)
			},
		}
	},
	(state) => {
		return {
			name: "Push Yourself",
			cost: 1,
			description: `+1 stamina for each technique played this game (${state.techniqueHistory.length})`,
			play: () => {
				state.stamina += state.techniqueHistory.length
			},
		}
	},
]

export function resolveTechnique(
	resolvable: TechniqueResolvable,
	state: GameState,
): Technique {
	return resolvable instanceof Function ? resolvable(state) : resolvable
}
