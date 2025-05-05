import type { GameState } from "./GameState.ts"

export type Setback = {
	name: string
	description: string
	apply?: (game: GameState) => void
}

export const setbacks: Setback[] = [
	// {
	// 	name: "High Expectations",
	// 	description: `-3 momentum`,
	// 	beforeRoundSetup: (game) => {
	// 		game.updateMomentum("add", -3)
	// 	},
	// },
	// {
	// 	name: "Trying Too Hard",
	// 	description: `Combo: Decrease audience by momentum`,
	// 	beforeRoundSetup: (game) => {
	// 		game.addActiveEffect({
	// 			name: "Combo: Decrease audience by momentum",
	// 			source: "Trying Too Hard",
	// 			afterPlay(game) {
	// 				game.updateAudience("add", -game.momentum)
	// 			},
	// 		})
	// 	},
	// },
	// {
	// 	name: "Stress",
	// 	description: `Draw 2 less cards`,
	// 	cardDrawDecrease: 2,
	// },
	// {
	// 	name: "Doubt",
	// 	description: `Combo: -1 momentum`,
	// 	beforeRoundSetup: (game) => {
	// 		game.addActiveEffect({
	// 			name: "Combo: -1 Momentum",
	// 			source: "Doubt",
	// 			afterPlay(game) {
	// 				game.updateMomentum("add", -1)
	// 			},
	// 		})
	// 	},
	// },
	// {
	// 	name: "Exhaustion",
	// 	description: `Combo: -1 stamina`,
	// 	beforeRoundSetup: (game) => {
	// 		game.addActiveEffect({
	// 			name: "Combo: -1 Stamina",
	// 			source: "Exhaustion",
	// 			afterPlay(game) {
	// 				game.stamina = Math.max(0, game.stamina - 1)
	// 			},
	// 		})
	// 	},
	// },
	{
		name: "Small Venue",
		description: `You cannot gain audience this round`,
		apply(game) {
			game.addPendingEffect({
				name: "No Audience Gain",
				source: "Small Venue",
				roundDuration: 1,
				interceptUpdate(current) {
					const { audience } = current
					return (next) => {
						next.audience = Math.min(audience, next.audience)
					}
				},
			})
		},
	},
	// {
	// 	name: "In a Rut",
	// 	description: `You cannot gain momentum this round`,
	// 	beforeRoundSetup: (game) => {
	// 		game.addActiveEffect({
	// 			name: "No Momentum Gain",
	// 			source: "In a Rut",
	// 			disableMomentumGain: true,
	// 			removeAtRoundEnd: true,
	// 		})
	// 	},
	// },
	// {
	// 	name: "Demoralized",
	// 	description: `Remove all active effects`,
	// 	beforeRoundSetup: (game) => {
	// 		game.activeEffects = []
	// 	},
	// },
]
