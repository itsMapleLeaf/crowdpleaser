import type { ActiveEffect, Game } from "./game.ts"

export type Technique = {
	name: string
	cost: number
	description: string
	replay?: number
	excludeFromLastPlayed?: boolean
	onPlay: (game: Game, context: TechniqueContext) => void
}

export type TechniqueContext = {
	addActiveEffect: (effect: Omit<ActiveEffect, "id" | "source">) => string
}

/*
term glossary:
- Round: player can play a number of cards, then manually passes the round
- Cheers: the player's score
- Audience: number of members in the audience, added to cheers after each round
- Momentum: added to audience after each round
- Stamina: required to play cards, subtracted before the card effect applies
- Technique: a card in hand or deck
- Draw: take a technique from the deck and put it in hand
- Discard: take a technique and put it at the bottom of the deck
- Energize: +1 cheer per audience, also happens at the end of every round
- Combo: variant of sustain, describes an effect happens after playing a card
- Replay X: applies this effect X times, each time triggers combo effects
*/

export const techniques: Technique[] = [
	// bocchi (focus: techniques)
	{
		name: "Take a Breather",
		description: `Draw 3 techniques`,
		cost: 2,
		onPlay: (game) => {
			game.draw(3)
		},
	},
	{
		name: "Indecision",
		description: `Discard all techniques, then draw that many techniques`,
		cost: 1,
		onPlay: (game) => {
			const count = game.hand.length
			game.deck.push(...game.hand.splice(0))
			game.draw(count)
		},
	},
	{
		name: "Overthinking",
		description: `Draw 5 techniques, lose 5 momentum`,
		cost: 2,
		onPlay: (game) => {
			game.draw(5)
			game.updateMomentum("add", -5)
		},
	},
	{
		name: "Explosion of Talent",
		description: `Replay 2: Increase audience, momentum, and cheers by 1 for each card in hand`,
		cost: 1,
		replay: 2,
		onPlay: (game) => {
			game.updateAudience("add", game.hand.length)
			game.updateMomentum("add", game.hand.length)
			game.cheers += game.hand.length
		},
	},

	// kita (focus: audience and cheers)
	{
		name: "Appeal",
		cost: 1,
		description: `+7 audience`,
		onPlay: (game) => {
			game.updateAudience("add", 7)
		},
	},
	{
		name: "Dress to Impress",
		cost: 1,
		description: `Combo: +1 audience`,
		onPlay: (game, context) => {
			context.addActiveEffect({
				name: "Combo: +1 Audience",
				afterPlay: (game) => {
					game.updateAudience("add", 1)
				},
			})
		},
	},
	{
		name: "All Eyes on Me",
		cost: 3,
		description: `Replay 5: +2 audience`,
		replay: 5,
		onPlay: (game, context) => {
			game.updateAudience("add", 2)
		},
	},
	{
		name: "Hype",
		cost: 2,
		description: `Replay 2: Energize`,
		replay: 2,
		onPlay: (game, context) => {
			game.cheers += game.audience
		},
	},

	// dorito (momentum)
	{
		name: "Patience",
		cost: 2,
		description: `Combo: +1 momentum`,
		onPlay: (game, context) => {
			context.addActiveEffect({
				name: "Combo: +1 Momentum",
				afterPlay: (game) => {
					game.updateMomentum("add", 1)
				},
			})
		},
	},
	{
		name: "Connection",
		cost: 2,
		description: `+1 momentum for every 5 audience`,
		onPlay: (game) => {
			game.updateMomentum("add", Math.floor(game.audience / 5))
		},
	},
	{
		name: "Ringleader",
		cost: 2,
		description: `Replay 5: +1 momentum`,
		replay: 5,
		onPlay: (game, context) => {
			game.updateMomentum("add", 1)
		},
	},
	{
		name: "Motivate",
		cost: 2,
		description: `Set your stamina to 7`,
		onPlay: (game) => {
			game.stamina = 7
		},
	},

	// ryo (stamina & meta trickery)
	{
		name: "Leap of Faith",
		cost: 1,
		description: `x2 stamina, discard your hand`,
		onPlay: (game) => {
			game.stamina *= 2
			game.deck.push(...game.hand.splice(0))
		},
	},
	{
		name: "Cutting Corners",
		cost: 1,
		description: `Next technique costs 0 stamina`,
		onPlay: (game, context) => {
			context.addActiveEffect({
				name: "Next Technique Costs 0",
				playsDuration: 1,
				modifyTechnique: () => ({ cost: 0 }),
			})
		},
	},
	{
		name: "Do What Works",
		cost: 2,
		description: `Replay your last played technique`,
		excludeFromLastPlayed: true,
		onPlay: (game) => {
			const lastPlayed = game.playedTechniques.at(-1)
			if (lastPlayed) game.playTechnique(lastPlayed)
		},
	},
	{
		name: "They Just Don't Get It",
		cost: 0,
		description: `Decrease audience by stamina, increase momentum by stamina, lose all stamina`,
		onPlay: (game) => {
			game.updateAudience("add", -game.stamina)
			game.updateMomentum("add", game.stamina)
			game.stamina = 0
		},
	},
]
