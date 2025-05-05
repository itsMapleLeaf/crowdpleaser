import { shuffle } from "es-toolkit"
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
	playedTechniques: readonly Technique[]
	// lastSetback?: Setback
}>

export type GameEffect = {
	name: string
	source: string
	combo?: (state: GameState) => Partial<GameState>
	interceptUpdate?: (previous: GameState, next: GameState) => Partial<GameState>
	computeTechnique?: (technique: Technique) => Partial<Technique>
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
		playedTechniques: [],
	}
}

export function playTechniqueFromHand(
	state: GameState,
	index: number,
): GameState {
	const technique = state.hand[index]
	if (!technique) {
		throw new Error(`card at index ${index} does not exist`, {
			cause: { state, index },
		})
	}

	state = {
		...state,
		hand: state.hand.toSpliced(index, 1),
		deck: [...state.deck, technique],
		stamina: state.stamina - technique.cost,
	}

	state = { ...state, ...technique.play(state) }

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

export function addEffect(state: GameState, effect: GameEffect): GameState {
	return {
		...state,
		effects: [...state.effects, effect],
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
