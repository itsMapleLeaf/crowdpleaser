import { Box, Text } from "ink"
import { observer } from "mobx-react-lite"
import { useState } from "react"
import { GameState } from "./GameState.ts"
import { Menu } from "./Menu.tsx"

export const Game = observer(function Game() {
	const [state, setState] = useState(() => new GameState())

	return (
		<Box flexDirection="column" gap={1}>
			<Text>
				Round: {state.round}/{GameState.maxRounds}
			</Text>

			<Box flexDirection="column">
				<Text>Cheers: {state.cheers}</Text>
				<Text>Audience: {state.audience}</Text>
				<Text>Momentum: {state.momentum}</Text>
				<Text>Stamina: {state.stamina}</Text>
			</Box>

			{state.setback && (
				<Text>
					Setback: {state.setback.name} ({state.setback.description})
				</Text>
			)}

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
						...state.resolvedHand.map((card, index) => ({
							label: `${card.name} (${card.cost}): ${card.description}`,
							disabled: card.cost > state.stamina,
							action: () => state.playTechniqueFromHand(index),
						})),
						{
							label: "Next Round",
							action: () => state.nextRound(),
						},
					]}
				/>
			) : state.status === "complete" ? (
				<>
					<Text color="green">Performance complete!</Text>
					<Menu
						options={[
							{
								label: "Play Again",
								action: () => setState(() => new GameState()),
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
								label: "Play Again",
								action: () => setState(() => new GameState()),
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

			<Box flexDirection="column">
				{state.messages
					.toReversed()
					.slice(0, 10)
					.map((message, index) => (
						<Text
							key={index}
							color={message.recent ? "green" : undefined}
							dimColor={!message.recent}
						>
							{message.text}
						</Text>
					))}
			</Box>
		</Box>
	)
})
