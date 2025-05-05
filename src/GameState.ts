import { range, shuffle } from "es-toolkit"
import { makeAutoObservable } from "mobx"
import {
	resolveTechnique,
	type Technique,
	type TechniqueResolvable,
	techniques,
} from "./techniques.ts"

export type GameEffect = {
	name: string
	source: string
	handDuration?: number
	combo?: (state: GameState) => void
	interceptUpdate?: (previous: GameState, next: GameState) => void
	modifyTechnique?: (technique: Technique) => Partial<Technique>
}

export type GameMessage = {
	text: string
	recent?: boolean
}

export class GameState {
	static readonly staminaGain = 3
	static readonly drawCount = 4
	static readonly maxRounds = 5

	status: "playing" | "complete" | "failed" = "playing"
	deck: TechniqueResolvable[] = []
	baseHand: TechniqueResolvable[] = []
	cheers = 0
	audience = 10
	momentum = 0
	stamina = 5
	round = 1
	effects: GameEffect[] = []
	pendingEffects: GameEffect[] = [] // new effects that will be applied on following hand
	playedTechniques: Technique[] = []
	messages: GameMessage[] = []
	// lastSetback?: Setback;

	constructor() {
		makeAutoObservable(this)
		this.deck = shuffle(techniques.flatMap((it) => [it, it]))
		this.draw(GameState.drawCount)
	}

	get resolvedHand(): Technique[] {
		let resolved = this.baseHand.map((it) => resolveTechnique(it, this))
		for (const effect of this.effects) {
			if (effect.modifyTechnique) {
				resolved = resolved.map((technique) => ({
					...technique,
					...effect.modifyTechnique?.(technique),
				}))
			}
		}
		return resolved
	}

	draw(count: number) {
		const drawnCards = this.deck.splice(0, count)
		this.baseHand.push(...drawnCards)
	}

	discardHand() {
		this.deck.push(...this.baseHand.splice(0))
	}

	playTechniqueFromHand(index: number) {
		const technique = this.resolvedHand[index]
		if (!technique) {
			throw new Error(`card at index ${index} does not exist`, {
				cause: { state: this, index },
			})
		}

		this.deck.push(...this.baseHand.splice(index, 1))
		this.stamina -= technique.cost

		const messages: string[] = []

		for (const replayNumber of range(technique.replay ?? 1)) {
			const addMessage = (text: string) => {
				const replaySuffix =
					replayNumber != null ? ` (Replay ${replayNumber + 1})` : ""
				messages.push(text + replaySuffix)
			}

			technique.play(this)
			addMessage(`Played: ${technique.name} (${technique.description})`)

			for (const effect of this.effects) {
				if (effect.combo) {
					effect.combo(this)
					addMessage(`Effect: ${effect.name} (from ${effect.source})`)
				}
			}
		}

		// Decrease hand duration for current effects
		for (const effect of this.effects) {
			if (effect.handDuration != null) {
				effect.handDuration -= 1
			}
		}

		// Remove expired effects
		this.effects = this.effects.filter((effect) => effect.handDuration !== 0)

		// Add queued effects for next hand
		this.effects.push(...this.pendingEffects.splice(0))

		// Unmark recent messages so they show dimmed again
		for (const message of this.messages) {
			message.recent = false
		}

		// Add new messages as recent
		this.messages.push(...messages.map((text) => ({ text, recent: true })))

		// Update played techniques
		this.playedTechniques.push(technique)
	}

	nextRound() {
		if (this.audience < 1) {
			this.status = "failed"
			return
		}

		this.audience += this.momentum
		this.cheers += this.audience

		if (this.round === GameState.maxRounds) {
			this.status = "complete"
			return
		}

		this.round += 1
		this.stamina += GameState.staminaGain

		this.discardHand()
		this.draw(GameState.drawCount)
	}

	addPendingEffect(effect: GameEffect) {
		this.pendingEffects.push(effect)
	}

	energize() {
		this.cheers += this.audience
	}
}
