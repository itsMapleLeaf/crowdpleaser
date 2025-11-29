import { Box, Text, useInput } from "ink"
import { useState } from "react"
import { modLooped } from "./utils.ts"

export function Menu({
	options,
}: {
	options: ReadonlyArray<{
		label: string
		action: () => void
		disabled?: boolean
	}>
}) {
	const [currentIndexState, setCurrentIndex] = useState(0)
	const currentIndex = modLooped(currentIndexState, options.length)
	const currentOption = options[currentIndex]

	useInput((input, key) => {
		if (key.upArrow) {
			setCurrentIndex((i) => modLooped(i - 1, options.length))
		}
		if (key.downArrow) {
			setCurrentIndex((i) => modLooped(i + 1, options.length))
		}
		if (key.return) {
			if (!currentOption?.disabled) currentOption?.action()
		}
	})

	return (
		<Box flexDirection="column">
			{options.map((option, index) => {
				const isCurrent = index === currentIndex
				return (
					<Text
						key={index}
						color={isCurrent ? "blue" : undefined}
						dimColor={option.disabled}
					>
						{isCurrent ? "> " : "  "}
						{option.label}
					</Text>
				)
			})}
		</Box>
	)
}
