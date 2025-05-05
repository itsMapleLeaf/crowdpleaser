import type { GameState } from "./GameState.ts"

type Setback = {
	name: string
	description: string
	afterRoundStart?: (state: GameState) => GameState
}

const setbacks: Setback[] = []
