import { Box, Text } from "ink"
import { useState } from "react"
import {
	createGameState,
	maxRounds,
	passTurn,
	playTechniqueFromHand,
	type GameState,
} from "./GameState.ts"
import { Menu } from "./Menu.tsx"

export function Game() {
	const [state, setState] = useState<GameState>(createGameState)

	return (
		<Box
			flexDirection="column"
			gap={1}
			// borderStyle="single"
			// borderColor="gray"
			// paddingX={1}
			// marginTop={1}
		>
			<Text>
				Round: {state.round}/{maxRounds}
			</Text>
			<Box flexDirection="column">
				<Text>Cheers: {state.cheers}</Text>
				<Text>Audience: {state.audience}</Text>
				<Text>Momentum: {state.momentum}</Text>
				<Text>Stamina: {state.stamina}</Text>
			</Box>
			<Menu
				options={[
					...state.hand.map((card, index) => ({
						label: `${card.name} (${card.cost}): ${card.description}`,
						disabled: card.cost > state.stamina,
						action: () => {
							setState((state) => playTechniqueFromHand(state, index))
						},
					})),
					{
						label: "Pass",
						action: () => {
							setState(passTurn)
						},
					},
				]}
			/>
		</Box>
	)
}
