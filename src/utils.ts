export function raise(message: string): never {
	throw new Error(message)
}

export function modLooped(number: number, radix: number) {
	return ((number % radix) + radix) % radix
}

export function count<T>(
	iterable: Iterable<T>,
	criteria: (item: T) => unknown,
) {
	let total = 0
	for (const item of iterable) {
		if (criteria(item)) total += 1
	}
	return total
}
