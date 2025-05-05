export function raise(message: string): never {
	throw new Error(message)
}

export function modLooped(number: number, radix: number) {
	return ((number % radix) + radix) % radix
}
