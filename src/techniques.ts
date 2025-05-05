import {
	addPendingEffect,
	discardHand,
	drawCards,
	energize,
	type GameState,
} from "./GameState.ts"
import type { MaybeFunction } from "./types.ts"

export type Technique = {
	name: string
	description: string
	cost: number
	replay?: number
	play: (state: GameState) => Partial<GameState>
}

export type TechniqueResolvable = MaybeFunction<[state: GameState], Technique>

export type TechniqueEffect =
	| { type: "updateState"; patch: Partial<GameState> }
	| { type: "draw"; count: number }
	| { type: "discardHand" }

export const techniques: TechniqueResolvable[] = [
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
	// {
	// 	name: "Overthinking",
	// 	description: `Draw 5 techniques, lose 5 momentum`,
	// 	cost: 2,
	// 	onPlay: (state) => {
	// 		game.draw(5)
	// 		game.updateMomentum("add", -5)
	// 	},
	// },
	// {
	// 	name: "Explosion of Talent",
	// 	description: `Replay 2: Increase audience, momentum, and cheers by 1 for each card in hand`,
	// 	cost: 1,
	// 	replay: 2,
	// 	onPlay: (state) => {
	// 		game.updateAudience("add", game.hand.length)
	// 		game.updateMomentum("add", game.hand.length)
	// 		game.cheers += game.hand.length
	// 	},
	// },

	// kita (focus: audience and cheers)
	{
		name: "Appeal",
		cost: 1,
		description: "+7 Audience",
		play: (state) => ({ audience: state.audience + 7 }),
	},
	// {
	// 	name: "Dress to Impress",
	// 	cost: 1,
	// 	description: `Combo: +1 audience`,
	// 	onPlay: (state, context) => {
	// 		context.addActiveEffect({
	// 			name: "Combo: +1 Audience",
	// 			afterPlay: (state) => {
	// 				game.updateAudience("add", 1)
	// 			},
	// 		})
	// 	},
	// },
	// {
	// 	name: "All Eyes on Me",
	// 	cost: 3,
	// 	description: `Replay 5: +2 audience`,
	// 	replay: 5,
	// 	onPlay: (state, context) => {
	// 		game.updateAudience("add", 2)
	// 	},
	// },
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
			return addPendingEffect(state, {
				name: "Combo: +1 Momentum",
				source: "Patience",
				combo: (state) => ({ momentum: state.momentum + 1 }),
			})
		},
	},
	// {
	// 	name: "Connection",
	// 	cost: 2,
	// 	description: `+1 momentum for every 5 audience`,
	// 	onPlay: (state) => {
	// 		game.updateMomentum("add", Math.floor(state.audience / 5))
	// 	},
	// },
	// {
	// 	name: "Ringleader",
	// 	cost: 2,
	// 	description: `Replay 5: +1 momentum`,
	// 	replay: 5,
	// 	onPlay: (state, context) => {
	// 		game.updateMomentum("add", 1)
	// 	},
	// },
	// {
	// 	name: "Motivate",
	// 	cost: 2,
	// 	description: `Set your stamina to 7`,
	// 	onPlay: (state) => {
	// 		game.stamina = 7
	// 	},
	// },

	// ryo (stamina & meta trickery)
	// {
	// 	name: "Leap of Faith",
	// 	cost: 1,
	// 	description: `x2 stamina, discard your hand`,
	// 	onPlay: (state) => {
	// 		game.stamina *= 2
	// 		game.deck.push(...game.hand.splice(0))
	// 	},
	// },
	{
		name: "Cutting Corners",
		cost: 1,
		description: `Next technique costs 0 stamina`,
		play: (state) => {
			return addPendingEffect(state, {
				name: "Next technique costs 0 stamina",
				source: "Cutting Corners",
				handDuration: 1,
				modifyTechnique: () => ({ cost: 0 }),
			})
		},
	},
	(state) => {
		const lastPlayed = state.playedTechniques.findLast(
			(it) => it.name !== "Do What Works",
		)
		const lastPlayedDescription = lastPlayed?.description ?? "Nothing"
		return {
			name: "Do What Works",
			cost: 2,
			description: `Replay your last played technique (${lastPlayedDescription})`,
			play: (state) => lastPlayed?.play(state) ?? {},
		}
	},
	// {
	// 	name: "They Just Don't Get It",
	// 	cost: 0,
	// 	description: `Decrease audience by stamina, increase momentum by stamina, lose all stamina`,
	// 	onPlay: (state) => {
	// 		game.updateAudience("add", -game.stamina)
	// 		game.updateMomentum("add", game.stamina)
	// 		game.stamina = 0
	// 	},
	// },
]

export function resolveTechnique(
	resolvable: TechniqueResolvable,
	state: GameState,
): Technique {
	return resolvable instanceof Function ? resolvable(state) : resolvable
}
