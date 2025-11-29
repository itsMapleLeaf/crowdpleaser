import { startCase } from "es-toolkit"
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
				{(["cheers", "audience", "momentum", "stamina"] as const).map((key) => (
					<Box key={key} gap={1}>
						<Text>
							{startCase(key)}: {state[key]}
						</Text>
						{(() => {
							const delta = state.changes[key]
							if (delta == null || delta === 0) return
							return (
								<Text color={delta > 0 ? "green" : "red"}>
									({delta > 0 ? "+" : ""}
									{delta})
								</Text>
							)
						})()}
					</Box>
				))}
			</Box>

			{state.status === "playing" ? (
				<>
					<Text>
						Setback: {state.setback?.name ?? "(None)"}{" "}
						{state.setback && `(${state.setback.description})`}
					</Text>
					<Menu
						options={[
							...state.resolvedHand.map((card, index) => ({
								label: `${card.name} (${card.cost}): ${card.description}`,
								disabled: card.cost > state.stamina,
								action: () => state.playTechniqueFromHand(index),
							})),
							{
								label:
									state.round < GameState.maxRounds
										? "Next Round"
										: "Finish Performance",
								action: () => state.nextRound(),
							},
						]}
					/>
				</>
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

			<Box flexDirection="column">
				{(() => {
					// make sure all recent messagse are shown,
					// but if there are less than 10,
					// show old messages up to 10
					const messages = []
					for (const message of state.messages.toReversed()) {
						if (message.recent || messages.length < 10) {
							messages.push(message)
						} else {
							break
						}
					}

					return messages.map((message, index) => (
						<Text
							key={index}
							color={message.recent ? "green" : undefined}
							dimColor={!message.recent}
						>
							{message.text}
						</Text>
					))
				})()}
			</Box>
		</Box>
	)
})
