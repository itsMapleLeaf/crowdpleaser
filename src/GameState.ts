import { range, shuffle } from "es-toolkit"
import { produce } from "immer"
import { type Technique, techniques } from "./techniques.ts"

const staminaGain = 3
const drawCount = 4
export const maxRounds = 5

export type GameState = Readonly<{
	status: "playing" | "complete" | "failed"
	deck: readonly Technique[]
	hand: readonly Technique[]
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
	combo?: (state: GameState) => Partial<GameState>
	interceptUpdate?: (previous: GameState, next: GameState) => Partial<GameState>
	computeTechnique?: (technique: Technique) => Partial<Technique>
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

	const technique = state.hand[index]
	if (!technique) {
		throw new Error(`card at index ${index} does not exist`, {
			cause: { state, index },
		})
	}

	state = produce(state, (draft) => {
		draft.deck.push(...draft.hand.splice(index, 1))
		draft.stamina -= technique.cost
	})

	for (const _ of range(technique.replay ?? 1)) {
		state = { ...state, ...technique.play(state) }
		for (const effect of state.effects) {
			state = { ...state, ...effect.combo?.(state) }
		}
	}

	state = produce(state, (draft) => {
		draft.effects.push(...draft.pendingEffects.splice(0))
	})

	return state
}

export function passTurn(currentState: GameState): GameState {
	if (currentState.audience < 1) {
		return { ...currentState, status: "failed" }
	}

	let state = { ...currentState }

	// energize (apply momentum to audience, apply audience to cheers)
	state.audience += state.momentum
	state.cheers += state.audience

	// if at max rounds, end
	if (state.round === maxRounds) {
		return { ...state, status: "complete" }
	}

	// otherwise, set up next round, +3 stamina and draw
	state.stamina += staminaGain
	state.round += 1
	state = discardHand(state)
	state = drawCards(state, drawCount)

	// choose new setback (todo)

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
