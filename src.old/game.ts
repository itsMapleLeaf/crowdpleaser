import { range, shuffle } from "es-toolkit"
import crypto from "node:crypto"
import process from "node:process"
import { createInterface } from "node:readline/promises"
import { setbacks, type Setback } from "./setbacks.ts"
import { techniques, type Technique } from "./techniques.ts"
import { raise } from "./utils.ts"

export type ActiveEffect = {
	id: string
	name: string
	source: string
	playsDuration?: number
	afterPlay?: (game: Game, playedTechnique: Technique) => void
	modifyTechnique?: (
		game: Game,
		technique: Technique,
	) => Partial<Technique> | undefined
	disableAudienceGain?: boolean
	disableMomentumGain?: boolean
	removeAtRoundEnd?: boolean
}

export class Game {
	deck: Technique[] = []
	hand: Technique[] = []

	cheers = 0
	stamina = 5

	#audience = 10
	#momentum = 1

	activeEffects: ActiveEffect[] = []

	currentRound = 0
	totalRounds = 5

	running = true
	failed = false

	lastSetback?: Setback

	playedTechniques: Technique[] = []

	constructor() {
		for (const technique of techniques) {
			this.deck.push(technique, technique)
		}
		this.deck = shuffle(this.deck)
		this.draw(4)
	}

	get audience() {
		return this.#audience
	}

	get momentum() {
		return this.#momentum
	}

	updateAudience(operation: "add" | "set", value: number) {
		this.#audience = Math.max(
			0,
			operation === "set"
				? value
				: this.#audience +
						(value > 0 &&
						this.activeEffects.some((effect) => effect.disableAudienceGain)
							? 0
							: value),
		)
	}

	updateMomentum(operation: "add" | "set", value: number) {
		this.#momentum =
			operation === "set"
				? value
				: this.#momentum +
				  (value > 0 &&
				  this.activeEffects.some((effect) => effect.disableMomentumGain)
						? 0
						: value)
	}

	async start() {
		let input
		while (this.running) {
			this.render()

			const rl = createInterface({
				input: process.stdin,
				output: process.stdout,
			})
			input = await rl.question("> ")
			rl.close()
			console.log("")

			this.handleInput(input.trim())
		}
	}

	private render() {
		console.log(`Round ${this.currentRound + 1}/${this.totalRounds}`)
		console.log(``)
		console.log(`Cheers: ${this.cheers}`)
		console.log(`Audience: ${this.#audience}`)
		console.log(`Momentum: ${this.#momentum}`)
		console.log(`Stamina: ${this.stamina}`)
		console.log("")

		if (this.lastSetback) {
			console.log(
				`Setback: ${this.lastSetback.name} - ${this.lastSetback.description}`,
			)
			console.log("")
		}

		if (this.activeEffects.length > 0) {
			console.log("Active Effects:")
			for (const effect of this.activeEffects) {
				console.log(`- ${effect.name} (from ${effect.source})`)
			}
			console.log("")
		}

		console.log("Hand:")
		for (const [index, technique] of this.hand.entries()) {
			const { name, cost, description } = this.getComputedTechnique(technique)
			console.log(`${index + 1}. ${name} (${cost}): ${description}`)
		}
		console.log("")

		if (this.currentRound === this.totalRounds) {
			console.log("Performance complete! Cheers:", this.cheers, "\n")
			return
		}

		if (this.failed) {
			console.log("No more audience: performance failed.\n")
			return
		}

		console.log("Choose a card by number, or leave blank to pass")
	}

	private handleInput(input: string) {
		if (this.currentRound === this.totalRounds) {
			this.running = false
			return
		}

		this.lastSetback = undefined

		if (input === "") {
			this.activeEffects = this.activeEffects.filter(
				(effect) => !effect.removeAtRoundEnd,
			)

			this.lastSetback = shuffle(setbacks)[0] ?? raise("setbacks is empty")
			this.lastSetback.beforeRoundSetup?.(this)

			if (this.#audience <= 0) {
				this.failed = true
				return
			}

			this.#audience += this.#momentum
			this.cheers += this.#audience
			this.stamina += 3
			this.currentRound += 1
			this.deck.push(...this.hand.splice(0))
			this.draw(4 - (this.lastSetback.cardDrawDecrease ?? 0))

			return
		}

		const cardIndex = parseInt(input) - 1

		if (Number.isNaN(cardIndex)) {
			console.log(`Invalid card number "${input}"`)
			return
		}

		const technique = this.hand[cardIndex]
		if (!technique) {
			console.log(`Invalid card number "${input}"`)
			return
		}

		const computedTechnique = this.getComputedTechnique(technique)

		if (computedTechnique.cost > this.stamina) {
			console.log(`Not enough stamina (${computedTechnique.cost})`)
			return
		}

		this.deck.push(...this.hand.splice(cardIndex, 1))
		this.stamina -= computedTechnique.cost

		this.activeEffects = this.activeEffects
			.map((effect) =>
				effect.playsDuration == null
					? effect
					: { ...effect, playsDuration: effect.playsDuration - 1 },
			)
			.filter(
				(effect) => effect.playsDuration == null || effect.playsDuration > 0,
			)

		this.playTechnique(computedTechnique)

		if (!computedTechnique.excludeFromLastPlayed) {
			this.playedTechniques.push(computedTechnique)
		}
	}

	draw(count: number) {
		this.hand.push(...this.deck.splice(0, count))
	}

	playTechnique(computedTechnique: Technique) {
		for (const _ of range(computedTechnique.replay ?? 1)) {
			computedTechnique.onPlay(this, {
				addActiveEffect: (effect) => {
					return this.addActiveEffect({
						...effect,
						source: computedTechnique.name,
					})
				},
			})

			for (const effect of this.activeEffects) {
				effect.afterPlay?.(this, computedTechnique)
			}
		}
	}

	getComputedTechnique(technique: Technique): Technique {
		const computedTechnique = { ...technique }

		for (const effect of this.activeEffects) {
			if (effect.modifyTechnique) {
				const modifications = effect.modifyTechnique(this, technique)
				if (modifications) {
					Object.assign(computedTechnique, modifications)
				}
			}
		}

		return computedTechnique
	}

	removeActiveEffect(id: string): boolean {
		const initialLength = this.activeEffects.length
		this.activeEffects = this.activeEffects.filter((effect) => effect.id !== id)
		return initialLength !== this.activeEffects.length
	}

	addActiveEffect(effect: Omit<ActiveEffect, "id">): string {
		const id = crypto.randomUUID()
		const fullEffect = { ...effect, id }
		this.activeEffects.push(fullEffect)
		return id
	}
}
