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
		<Box flexDirection="column" gap={1}>
			<Text>
				Round: {state.round}/{maxRounds}
			</Text>

			<Box flexDirection="column">
				<Text>Cheers: {state.cheers}</Text>
				<Text>Audience: {state.audience}</Text>
				<Text>Momentum: {state.momentum}</Text>
				<Text>Stamina: {state.stamina}</Text>
			</Box>

			{state.effects.length > 0 && (
				<Box flexDirection="column">
					<Text>Effects:</Text>
					{state.effects.map((effect, index) => (
						<Box key={index}>
							<Text dimColor>{"- "}</Text>
							<Text>
								{effect.name} (from {effect.source})
							</Text>
						</Box>
					))}
				</Box>
			)}

			{state.status === "playing" ? (
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
			) : state.status === "complete" ? (
				<>
					<Text color="green">Performance complete!</Text>
					<Menu
						options={[
							{
								label: "Retry",
								action: () => setState(createGameState),
							},
							{
								label: "Quit",
								action: () => {
									process.exit(0)
								},
							},
						]}
					/>
				</>
			) : state.status === "failed" ? (
				<>
					<Text color="red">Performance failed: audience lost.</Text>
					<Menu
						options={[
							{
								label: "Retry",
								action: () => setState(createGameState),
							},
							{
								label: "Quit",
								action: () => {
									process.exit(0)
								},
							},
						]}
					/>
				</>
			) : null}
		</Box>
	)
}
