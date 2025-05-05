import { range, shuffle } from "es-toolkit"
import { produce } from "immer"
import {
	resolveTechnique,
	type Technique,
	type TechniqueResolvable,
	techniques,
} from "./techniques.ts"

const staminaGain = 3
const drawCount = 4
export const maxRounds = 5

export type GameState = Readonly<{
	status: "playing" | "complete" | "failed"
	deck: readonly TechniqueResolvable[]
	hand: readonly TechniqueResolvable[]
	cheers: number
	audience: number
	momentum: number
	stamina: number
	round: number
	effects: readonly GameEffect[]
	pendingEffects: readonly GameEffect[] // new effects that will be applied on following hand
	playedTechniques: readonly Technique[]
	// lastSetback?: Setback
	messages: readonly GameMessage[]
}>

export type GameEffect = {
	name: string
	source: string
	handDuration?: number
	combo?: (state: GameState) => Partial<GameState>
	interceptUpdate?: (previous: GameState, next: GameState) => Partial<GameState>
	modifyTechnique?: (technique: Technique) => Partial<Technique>
}

export type GameMessage = {
	text: string
	recent?: boolean
}

export function createGameState(): GameState {
	const deck = shuffle(techniques.flatMap((it) => [it, it]))
	const hand = deck.splice(0, drawCount)
	return {
		status: "playing",
		deck,
		hand,
		audience: 5,
		momentum: 1,
		stamina: 5,
		cheers: 0,
		round: 1,
		effects: [],
		pendingEffects: [],
		playedTechniques: [],
		messages: [],
	}
}

export function playTechniqueFromHand(
	currentState: GameState,
	index: number,
): GameState {
	let state = currentState
	const hand = getResolvedHand(state)

	let technique = hand[index]
	technique &&= resolveTechnique(technique, state)
	if (!technique) {
		throw new Error(`card at index ${index} does not exist`, {
			cause: { state, index },
		})
	}

	state = produce(state, (draft) => {
		draft.deck.push(...draft.hand.splice(index, 1))
		draft.stamina -= technique.cost
	})

	const messages: string[] = []

	for (const replayNumber of range(technique.replay ?? 1)) {
		const addMessage = (text: string) => {
			const replaySuffix =
				replayNumber > 0 ? ` (Replay ${replayNumber + 1})` : ""
			messages.push(text + replaySuffix)
		}

		state = { ...state, ...technique.play(state) }
		addMessage(`Played: ${technique.name} (${technique.description})`)

		for (const effect of state.effects) {
			if (effect.combo) {
				state = { ...state, ...effect.combo(state) }
				addMessage(`Effect: ${effect.name} (from ${effect.source})`)
			}
		}
	}

	state = produce(state, (draft) => {
		// decrease hand duration for current effects
		for (const effect of draft.effects) {
			if (effect.handDuration != null) {
				effect.handDuration -= 1
			}
		}

		// remove expired effects
		draft.effects = draft.effects.filter((it) => it.handDuration !== 0)

		// add queued effects for next hand
		draft.effects.push(...draft.pendingEffects.splice(0))

		// unmark recent messages so they show dimmed again
		for (const message of draft.messages) {
			message.recent = false
		}

		// add new messages as recent
		draft.messages.push(...messages.map((text) => ({ text, recent: true })))

		// update played techniques
		draft.playedTechniques.push(technique)
	})

	return state
}

export function passTurn(currentState: GameState): GameState {
	if (currentState.audience < 1) {
		return { ...currentState, status: "failed" }
	}

	let state = produce(currentState, (draft) => {
		draft.audience += draft.momentum
		draft.cheers += draft.audience
	})

	if (state.round === maxRounds) {
		return { ...state, status: "complete" }
	}

	state = produce(state, (draft) => {
		draft.round += 1
		draft.stamina += staminaGain
	})
	state = discardHand(state)
	state = drawCards(state, drawCount)

	return state
}

export function addPendingEffect(
	state: GameState,
	effect: GameEffect,
): GameState {
	return {
		...state,
		pendingEffects: [...state.pendingEffects, effect],
	}
}

export function drawCards(state: GameState, count: number): GameState {
	return {
		...state,
		hand: [...state.hand, ...state.deck.slice(0, count)],
		deck: state.deck.slice(count),
	}
}

export function discardHand(state: GameState): GameState {
	return {
		...state,
		hand: [],
		deck: [...state.deck, ...state.hand],
	}
}

export function energize(state: GameState): GameState {
	return {
		...state,
		cheers: state.cheers + state.audience,
	}
}

export function getResolvedHand(state: GameState): readonly Technique[] {
	let resolved = state.hand.map((it) => resolveTechnique(it, state))
	for (const effect of state.effects) {
		if (effect.modifyTechnique) {
			resolved = resolved.map((it) => ({
				...it,
				...effect.modifyTechnique?.(it),
			}))
		}
	}
	return resolved
}
